import { run, insert, tx, query, queryOne } from '../db'
import { registrarMovimiento } from './stock'
import { crearVenta } from './ventas'

export interface PresupuestoItemInput {
  articuloId: number
  cantidad: number
  precioUnit: number
}
export interface PresupuestoInput {
  clienteId?: number | null
  lista: 'mayorista' | 'consumidor'
  vencimiento?: string | null
  items: PresupuestoItemInput[]
}

interface PresupuestoRow {
  id: number
  cliente_id: number | null
  estado: string
  lista: 'mayorista' | 'consumidor'
}

interface ItemRow {
  articulo_id: number
  cantidad: number
  precio_unit: number
}

interface StockRow { nombre: string; stock_disponible: number }

export async function crearPresupuesto(input: PresupuestoInput): Promise<number> {
  return tx(async () => {
    const venc = input.vencimiento
      ? input.vencimiento
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const presupId = await insert(
      "INSERT INTO presupuestos (cliente_id, lista, vencimiento, estado, total) VALUES ($1,$2,$3,'vigente',0)",
      [input.clienteId ?? null, input.lista, venc]
    )

    // Validar stock antes de reservar
    for (const it of input.items) {
      const art = await queryOne<StockRow>(
        `SELECT nombre, (stock_fisico - stock_reservado) AS stock_disponible FROM articulos WHERE id = $1`,
        [it.articuloId]
      )
      if (!art || art.stock_disponible < it.cantidad) {
        const nombre = art?.nombre ?? `#${it.articuloId}`
        throw new Error(`Stock insuficiente: "${nombre}" (disponible: ${art?.stock_disponible ?? 0}, pedido: ${it.cantidad})`)
      }
    }

    let total = 0
    for (const it of input.items) {
      await insert(
        'INSERT INTO presupuesto_items (presupuesto_id, articulo_id, cantidad, precio_unit) VALUES ($1,$2,$3,$4)',
        [presupId, it.articuloId, it.cantidad, it.precioUnit]
      )
      await registrarMovimiento(it.articuloId, 'reserva', it.cantidad, 'presupuesto', presupId)
      total += it.cantidad * it.precioUnit
    }
    await run('UPDATE presupuestos SET total = $1 WHERE id = $2', [total, presupId])
    return presupId
  })
}

async function expirarPresupuestosVencidos(): Promise<void> {
  const vencidos = await query<{ id: number }>(
    `SELECT id FROM presupuestos WHERE estado = 'vigente' AND vencimiento < CURRENT_DATE`
  )
  for (const p of vencidos) {
    await anularPresupuesto(p.id)
  }
}

export async function listarPresupuestos() {
  await expirarPresupuestosVencidos()
  return query(
    `SELECT p.id, p.fecha::TEXT AS fecha, p.vencimiento::TEXT AS vencimiento, p.estado, p.lista, p.total,
            p.cliente_id, c.nombre AS cliente_nombre
     FROM presupuestos p LEFT JOIN clientes c ON c.id = p.cliente_id
     ORDER BY p.id DESC`
  )
}

export async function itemsPresupuesto(presupuestoId: number) {
  return query('SELECT * FROM presupuesto_items WHERE presupuesto_id = $1', [presupuestoId])
}

export async function detallePresupuesto(id: number) {
  const pres = await queryOne<{
    id: number; fecha: string; lista: string; total: number; estado: string
    cliente_nombre: string | null; vencimiento: string | null
  }>(
    `SELECT p.id, p.fecha::TEXT AS fecha, p.vencimiento::TEXT AS vencimiento, p.lista, p.total, p.estado,
            c.nombre AS cliente_nombre
     FROM presupuestos p LEFT JOIN clientes c ON c.id = p.cliente_id
     WHERE p.id = $1`,
    [id]
  )
  if (!pres) return null
  const items = await query<{ nombre: string; cantidad: number; precio_unit: number }>(
    `SELECT pi.cantidad, pi.precio_unit, a.nombre
     FROM presupuesto_items pi JOIN articulos a ON a.id = pi.articulo_id
     WHERE pi.presupuesto_id = $1`,
    [id]
  )
  return { ...pres, items }
}

export async function aprobarPresupuesto(presupuestoId: number): Promise<void> {
  await tx(async () => {
    const p = await queryOne<PresupuestoRow>('SELECT * FROM presupuestos WHERE id = $1', [presupuestoId])
    if (!p) throw new Error('Presupuesto inexistente')
    if (p.estado !== 'vigente') throw new Error('Solo se aprueban presupuestos vigentes')

    const items = await query<ItemRow>(
      'SELECT * FROM presupuesto_items WHERE presupuesto_id = $1',
      [presupuestoId]
    )

    for (const it of items) {
      await registrarMovimiento(it.articulo_id, 'liberacion', it.cantidad, 'presupuesto', presupuestoId)
    }

    await crearVenta({
      clienteId: p.cliente_id,
      lista: p.lista,
      items: items.map((it) => ({
        articuloId: it.articulo_id,
        cantidad: it.cantidad,
        precioUnit: it.precio_unit
      })),
      pagos: [],
      presupuestoId
    })

    await run("UPDATE presupuestos SET estado = 'aprobado' WHERE id = $1", [presupuestoId])
  })
}

export async function anularPresupuesto(presupuestoId: number): Promise<void> {
  await tx(async () => {
    const p = await queryOne<PresupuestoRow>('SELECT * FROM presupuestos WHERE id = $1', [presupuestoId])
    if (!p || p.estado !== 'vigente') return
    const items = await query<ItemRow>(
      'SELECT * FROM presupuesto_items WHERE presupuesto_id = $1',
      [presupuestoId]
    )
    for (const it of items) {
      await registrarMovimiento(it.articulo_id, 'liberacion', it.cantidad, 'presupuesto', presupuestoId)
    }
    await run("UPDATE presupuestos SET estado = 'anulado' WHERE id = $1", [presupuestoId])
  })
}
