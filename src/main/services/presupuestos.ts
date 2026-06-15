import { run, lastId, tx, get, all } from '../db'
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

/** Crea un presupuesto y RESERVA el stock de cada item. */
export function crearPresupuesto(input: PresupuestoInput): number {
  return tx(() => {
    run(
      "INSERT INTO presupuestos (cliente_id, lista, vencimiento, estado, total) VALUES (?, ?, ?, 'vigente', 0)",
      [input.clienteId ?? null, input.lista, input.vencimiento ?? null]
    )
    const presupId = lastId()
    let total = 0
    for (const it of input.items) {
      run(
        'INSERT INTO presupuesto_items (presupuesto_id, articulo_id, cantidad, precio_unit) VALUES (?, ?, ?, ?)',
        [presupId, it.articuloId, it.cantidad, it.precioUnit]
      )
      registrarMovimiento(it.articuloId, 'reserva', it.cantidad, 'presupuesto', presupId)
      total += it.cantidad * it.precioUnit
    }
    run('UPDATE presupuestos SET total = ? WHERE id = ?', [total, presupId])
    return presupId
  })
}

export function listarPresupuestos() {
  return all(
    `SELECT p.*, c.nombre AS cliente_nombre
     FROM presupuestos p LEFT JOIN clientes c ON c.id = p.cliente_id
     ORDER BY p.id DESC`
  )
}

export function itemsPresupuesto(presupuestoId: number) {
  return all('SELECT * FROM presupuesto_items WHERE presupuesto_id = ?', [presupuestoId])
}

export function detallePresupuesto(id: number) {
  const pres = get<{
    id: number; fecha: string; lista: string; total: number; estado: string; cliente_nombre: string | null; vencimiento: string | null
  }>(
    `SELECT p.*, c.nombre AS cliente_nombre
     FROM presupuestos p LEFT JOIN clientes c ON c.id = p.cliente_id
     WHERE p.id = ?`,
    [id]
  )
  if (!pres) return null
  const items = all<{ nombre: string; cantidad: number; precio_unit: number }>(
    `SELECT pi.cantidad, pi.precio_unit, a.nombre
     FROM presupuesto_items pi JOIN articulos a ON a.id = pi.articulo_id
     WHERE pi.presupuesto_id = ?`,
    [id]
  )
  return { ...pres, items }
}

/** Aprueba un presupuesto: libera la reserva y lo convierte en venta (descuenta stock fisico real). */
export function aprobarPresupuesto(presupuestoId: number): void {
  tx(() => {
    const p = get<PresupuestoRow>('SELECT * FROM presupuestos WHERE id = ?', [presupuestoId])
    if (!p) throw new Error('Presupuesto inexistente')
    if (p.estado !== 'vigente') throw new Error('Solo se aprueban presupuestos vigentes')

    const items = all<ItemRow>('SELECT * FROM presupuesto_items WHERE presupuesto_id = ?', [presupuestoId])

    // Libera la reserva (el descuento fisico real lo hace la venta).
    for (const it of items) {
      registrarMovimiento(it.articulo_id, 'liberacion', it.cantidad, 'presupuesto', presupuestoId)
    }

    crearVenta({
      clienteId: p.cliente_id,
      lista: p.lista,
      items: items.map((it) => ({
        articuloId: it.articulo_id,
        cantidad: it.cantidad,
        precioUnit: it.precio_unit
      })),
      pagos: [], // queda a cobrar (cuenta corriente si hay cliente)
      presupuestoId
    })

    run("UPDATE presupuestos SET estado = 'aprobado' WHERE id = ?", [presupuestoId])
  })
}

/** Anula un presupuesto vigente: libera el stock reservado. */
export function anularPresupuesto(presupuestoId: number): void {
  tx(() => {
    const p = get<PresupuestoRow>('SELECT * FROM presupuestos WHERE id = ?', [presupuestoId])
    if (!p || p.estado !== 'vigente') return
    const items = all<ItemRow>('SELECT * FROM presupuesto_items WHERE presupuesto_id = ?', [presupuestoId])
    for (const it of items) {
      registrarMovimiento(it.articulo_id, 'liberacion', it.cantidad, 'presupuesto', presupuestoId)
    }
    run("UPDATE presupuestos SET estado = 'anulado' WHERE id = ?", [presupuestoId])
  })
}
