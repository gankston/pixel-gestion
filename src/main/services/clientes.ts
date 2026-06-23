import { query, queryOne, run, insert, tx } from '../db'
import { asegurarCajaAbierta, registrarMovimientoCaja, type MedioPago } from './caja'

export interface ClienteInput {
  nombre: string
  tipo: 'mayorista' | 'consumidor'
  documento?: string | null
  telefono?: string | null
  email?: string | null
}

export async function listarClientes() {
  return query('SELECT * FROM clientes WHERE activo = 1 ORDER BY nombre')
}

export async function listarClientesConDeuda() {
  return query(
    'SELECT * FROM clientes WHERE activo = 1 AND saldo_cta_cte > 0 ORDER BY saldo_cta_cte DESC'
  )
}

export async function crearCliente(data: ClienteInput): Promise<number> {
  return insert(
    'INSERT INTO clientes (nombre, tipo, documento, telefono, email) VALUES ($1,$2,$3,$4,$5)',
    [data.nombre, data.tipo, data.documento || null, data.telefono || null, data.email || null]
  )
}

export async function actualizarCliente(id: number, data: ClienteInput): Promise<void> {
  await run(
    'UPDATE clientes SET nombre=$1, tipo=$2, documento=$3, telefono=$4, email=$5 WHERE id=$6',
    [data.nombre, data.tipo, data.documento || null, data.telefono || null, data.email || null, id]
  )
}

export async function ventasCliente(clienteId: number) {
  return query(
    'SELECT id, fecha::TEXT AS fecha, total FROM ventas WHERE cliente_id = $1 ORDER BY id DESC',
    [clienteId]
  )
}

export async function historialPagos(clienteId: number) {
  return query(
    'SELECT id, fecha::TEXT AS fecha, medio_pago, monto FROM pagos WHERE cliente_id = $1 ORDER BY id DESC LIMIT 20',
    [clienteId]
  )
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

export async function registrarPago(input: PagoInput): Promise<number> {
  return tx(async () => {
    const caja = await asegurarCajaAbierta()
    const pagoId = await insert(
      'INSERT INTO pagos (cliente_id, medio_pago, monto) VALUES ($1,$2,$3)',
      [input.clienteId, input.medio, input.monto]
    )

    for (const im of input.imputaciones ?? []) {
      if (im.monto <= 0) continue
      await insert(
        'INSERT INTO imputaciones (pago_id, venta_id, monto) VALUES ($1,$2,$3)',
        [pagoId, im.ventaId, im.monto]
      )
    }

    await run('UPDATE clientes SET saldo_cta_cte = saldo_cta_cte - $1 WHERE id = $2', [
      input.monto,
      input.clienteId
    ])
    await registrarMovimientoCaja(
      caja.id,
      'ingreso',
      input.medio,
      input.monto,
      'pago',
      pagoId,
      'Pago cta cte'
    )
    return pagoId
  })
}

export async function saldoCliente(clienteId: number): Promise<number> {
  const r = await queryOne<{ saldo: number }>(
    'SELECT saldo_cta_cte AS saldo FROM clientes WHERE id = $1',
    [clienteId]
  )
  return r?.saldo ?? 0
}
