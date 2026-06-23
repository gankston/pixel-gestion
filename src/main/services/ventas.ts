import { run, insert, query, queryOne, tx } from '../db'
import { registrarMovimiento } from './stock'
import { asegurarCajaAbierta, registrarMovimientoCaja, type MedioPago } from './caja'

interface StockRow { nombre: string; stock_disponible: number }

export interface VentaItemInput {
  articuloId: number
  cantidad: number
  precioUnit: number
}
export interface PagoInput {
  medio: MedioPago
  monto: number
}
export interface VentaInput {
  clienteId?: number | null
  lista: 'mayorista' | 'consumidor'
  items: VentaItemInput[]
  pagos: PagoInput[]
  presupuestoId?: number | null
}

export async function crearVenta(input: VentaInput): Promise<{ ventaId: number; total: number }> {
  return tx(async () => {
    const caja = await asegurarCajaAbierta()
    const ventaId = await insert(
      'INSERT INTO ventas (cliente_id, presupuesto_id, lista, total) VALUES ($1,$2,$3,0)',
      [input.clienteId ?? null, input.presupuestoId ?? null, input.lista]
    )

    // Validar stock antes de procesar cualquier item
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
        'INSERT INTO venta_items (venta_id, articulo_id, cantidad, precio_unit) VALUES ($1,$2,$3,$4)',
        [ventaId, it.articuloId, it.cantidad, it.precioUnit]
      )
      await registrarMovimiento(it.articuloId, 'venta', it.cantidad, 'venta', ventaId)
      total += it.cantidad * it.precioUnit
    }
    await run('UPDATE ventas SET total = $1 WHERE id = $2', [total, ventaId])

    let pagado = 0
    for (const p of input.pagos) {
      if (p.monto <= 0) continue
      await registrarMovimientoCaja(caja.id, 'ingreso', p.medio, p.monto, 'venta', ventaId, `Venta #${ventaId}`)
      pagado += p.monto
    }

    const saldo = total - pagado
    if (input.clienteId && saldo > 0.01) {
      await run('UPDATE clientes SET saldo_cta_cte = saldo_cta_cte + $1 WHERE id = $2', [saldo, input.clienteId])
    }

    return { ventaId, total }
  })
}

export async function listarVentas(limit = 50) {
  return query(
    `SELECT v.id, v.fecha::TEXT AS fecha, v.lista, v.total, c.nombre AS cliente_nombre
     FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id
     ORDER BY v.id DESC LIMIT $1`,
    [limit]
  )
}

export async function detalleVenta(id: number) {
  const venta = await queryOne<{
    id: number; fecha: string; lista: string; total: number; cliente_nombre: string | null
  }>(
    `SELECT v.id, v.fecha::TEXT AS fecha, v.lista, v.total, c.nombre AS cliente_nombre
     FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id
     WHERE v.id = $1`,
    [id]
  )
  if (!venta) return null
  const items = await query<{ nombre: string; cantidad: number; precio_unit: number }>(
    `SELECT vi.cantidad, vi.precio_unit, a.nombre
     FROM venta_items vi JOIN articulos a ON a.id = vi.articulo_id
     WHERE vi.venta_id = $1`,
    [id]
  )
  return { ...venta, items }
}
