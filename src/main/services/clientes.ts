import { all, run, lastId, tx } from '../db'
import { asegurarCajaAbierta, registrarMovimientoCaja, type MedioPago } from './caja'

export interface ClienteInput {
  nombre: string
  tipo: 'mayorista' | 'consumidor'
  documento?: string | null
  telefono?: string | null
  email?: string | null
}

export function listarClientes() {
  return all('SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre')
}

export function crearCliente(data: ClienteInput): number {
  run(
    'INSERT INTO clientes (nombre, tipo, documento, telefono, email) VALUES (?, ?, ?, ?, ?)',
    [data.nombre, data.tipo, data.documento || null, data.telefono || null, data.email || null]
  )
  return lastId()
}

export function actualizarCliente(id: number, data: ClienteInput): void {
  run('UPDATE clientes SET nombre = ?, tipo = ?, documento = ?, telefono = ?, email = ? WHERE id = ?', [
    data.nombre,
    data.tipo,
    data.documento || null,
    data.telefono || null,
    data.email || null,
    id
  ])
}

/** Ventas del cliente (para mostrar e imputar pagos). */
export function ventasCliente(clienteId: number) {
  return all('SELECT id, fecha, total FROM ventas WHERE cliente_id = ? ORDER BY id DESC', [clienteId])
}

export interface ImputacionInput {
  ventaId: number
  monto: number
}
export interface PagoInput {
  clienteId: number
  medio: MedioPago
  monto: number
  imputaciones?: ImputacionInput[]
}

/** Registra un pago del cliente: baja su saldo, lo imputa a comprobantes e ingresa a caja. */
export function registrarPago(input: PagoInput): number {
  return tx(() => {
    const caja = asegurarCajaAbierta()
    run('INSERT INTO pagos (cliente_id, medio_pago, monto) VALUES (?, ?, ?)', [
      input.clienteId,
      input.medio,
      input.monto
    ])
    const pagoId = lastId()

    for (const im of input.imputaciones ?? []) {
      if (im.monto <= 0) continue
      run('INSERT INTO imputaciones (pago_id, venta_id, monto) VALUES (?, ?, ?)', [
        pagoId,
        im.ventaId,
        im.monto
      ])
    }

    run('UPDATE clientes SET saldo_cta_cte = saldo_cta_cte - ? WHERE id = ?', [
      input.monto,
      input.clienteId
    ])
    registrarMovimientoCaja(caja.id, 'ingreso', input.medio, input.monto, 'pago', pagoId, 'Pago cta cte')
    return pagoId
  })
}
