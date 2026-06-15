import { run, lastId, tx, all } from '../db'
import { registrarMovimiento } from './stock'
import { asegurarCajaAbierta, registrarMovimientoCaja, type MedioPago } from './caja'

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

/** Registra una venta de forma atomica: items, baja de stock fisico, caja y cuenta corriente. */
export function crearVenta(input: VentaInput): { ventaId: number; total: number } {
  return tx(() => {
    const caja = asegurarCajaAbierta()
    run('INSERT INTO ventas (cliente_id, presupuesto_id, lista, total) VALUES (?, ?, ?, 0)', [
      input.clienteId ?? null,
      input.presupuestoId ?? null,
      input.lista
    ])
    const ventaId = lastId()

    let total = 0
    for (const it of input.items) {
      run(
        'INSERT INTO venta_items (venta_id, articulo_id, cantidad, precio_unit) VALUES (?, ?, ?, ?)',
        [ventaId, it.articuloId, it.cantidad, it.precioUnit]
      )
      registrarMovimiento(it.articuloId, 'venta', it.cantidad, 'venta', ventaId)
      total += it.cantidad * it.precioUnit
    }
    run('UPDATE ventas SET total = ? WHERE id = ?', [total, ventaId])

    let pagado = 0
    for (const p of input.pagos) {
      if (p.monto <= 0) continue
      registrarMovimientoCaja(caja.id, 'ingreso', p.medio, p.monto, 'venta', ventaId, `Venta #${ventaId}`)
      pagado += p.monto
    }

    // El saldo impago (fiado) va a la cuenta corriente del cliente.
    const saldo = total - pagado
    if (input.clienteId && saldo > 0.0001) {
      run('UPDATE clientes SET saldo_cta_cte = saldo_cta_cte + ? WHERE id = ?', [saldo, input.clienteId])
    }

    return { ventaId, total }
  })
}

export function listarVentas(limit = 50) {
  return all(
    `SELECT v.*, c.nombre AS cliente_nombre
     FROM ventas v LEFT JOIN clientes c ON c.id = v.cliente_id
     ORDER BY v.id DESC LIMIT ?`,
    [limit]
  )
}
