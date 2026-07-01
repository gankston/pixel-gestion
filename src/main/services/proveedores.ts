import { query, queryOne, run, insert, tx } from '../db'
import { asegurarCajaAbierta, registrarMovimientoCaja } from './caja'

export interface ProveedorInput {
  nombre: string
  cuit?: string | null
  telefono?: string | null
  email?: string | null
}

export interface FacturaInput {
  proveedorId: number
  numero?: string | null
  fecha?: string
  total: number
}

export interface PagoProvInput {
  proveedorId: number
  facturaId?: number | null
  medioPago: 'efectivo' | 'transferencia' | 'credito' | 'debito' | 'cheque'
  chequeId?: number | null
  monto: number
}

export async function listarProveedores(filtro = '') {
  const f = `%${filtro.trim()}%`
  return filtro
    ? query(
        `SELECT * FROM proveedores WHERE activo = 1 AND (nombre ILIKE $1 OR cuit ILIKE $2) ORDER BY nombre`,
        [f, f]
      )
    : query(`SELECT * FROM proveedores WHERE activo = 1 ORDER BY nombre`)
}

export async function crearProveedor(data: ProveedorInput): Promise<number> {
  return insert(
    `INSERT INTO proveedores (nombre, cuit, telefono, email) VALUES ($1,$2,$3,$4)`,
    [data.nombre, data.cuit ?? null, data.telefono ?? null, data.email ?? null]
  )
}

export async function actualizarProveedor(id: number, data: ProveedorInput): Promise<void> {
  await run(
    `UPDATE proveedores SET nombre=$1, cuit=$2, telefono=$3, email=$4 WHERE id=$5`,
    [data.nombre, data.cuit ?? null, data.telefono ?? null, data.email ?? null, id]
  )
}

export async function eliminarProveedor(id: number): Promise<void> {
  await run(`UPDATE proveedores SET activo = 0 WHERE id = $1`, [id])
}

export async function listarFacturas(proveedorId: number) {
  return query(
    `SELECT id, proveedor_id, numero, fecha::TEXT AS fecha, total, saldo, estado FROM facturas_proveedor WHERE proveedor_id = $1 ORDER BY fecha DESC`,
    [proveedorId]
  )
}

export async function crearFactura(data: FacturaInput): Promise<number> {
  return insert(
    `INSERT INTO facturas_proveedor (proveedor_id, numero, fecha, total, saldo) VALUES ($1,$2,$3,$4,$4)`,
    [data.proveedorId, data.numero ?? null, data.fecha ?? new Date().toISOString().slice(0, 10), data.total]
  )
}

export async function registrarPagoProveedor(data: PagoProvInput): Promise<number> {
  return tx(async () => {
    const prov = await queryOne<{ saldo_cta_cte: number }>(
      'SELECT saldo_cta_cte FROM proveedores WHERE id = $1',
      [data.proveedorId]
    )
    if (!prov) throw new Error('Proveedor no encontrado')
    if (data.monto > prov.saldo_cta_cte + 0.01) {
      throw new Error(`El pago ($${data.monto.toFixed(2)}) supera el saldo del proveedor ($${prov.saldo_cta_cte.toFixed(2)})`)
    }

    const pagoId = await insert(
      `INSERT INTO pagos_proveedor (proveedor_id, factura_id, medio_pago, cheque_id, monto)
       VALUES ($1,$2,$3,$4,$5)`,
      [data.proveedorId, data.facturaId ?? null, data.medioPago, data.chequeId ?? null, data.monto]
    )
    await run(
      `UPDATE proveedores SET saldo_cta_cte = saldo_cta_cte - $1 WHERE id = $2`,
      [data.monto, data.proveedorId]
    )
    const caja = await asegurarCajaAbierta()
    await registrarMovimientoCaja(
      caja.id, 'egreso', data.medioPago, data.monto,
      'pago_proveedor', pagoId, `Pago prov. #${data.proveedorId}`
    )
    if (data.facturaId) {
      await run(
        `UPDATE facturas_proveedor SET saldo = GREATEST(0, saldo - $1),
         estado = CASE WHEN GREATEST(0, saldo - $1) = 0 THEN 'pagada'
                       WHEN GREATEST(0, saldo - $1) < total THEN 'parcial'
                       ELSE 'pendiente' END
         WHERE id = $2`,
        [data.monto, data.facturaId]
      )
    }
    if (data.chequeId) {
      const cheque = await queryOne<{ estado: string }>('SELECT estado FROM cheques_cartera WHERE id = $1', [data.chequeId])
      if (!cheque) throw new Error('Cheque no encontrado')
      if (cheque.estado !== 'en_cartera') throw new Error('El cheque no está disponible en cartera')
      await run(
        `UPDATE cheques_cartera SET estado = 'entregado', destino_proveedor_id = $1 WHERE id = $2`,
        [data.proveedorId, data.chequeId]
      )
    }
    return pagoId
  })
}

export async function listarPagos(proveedorId: number) {
  return query(
    `SELECT pp.*, fp.numero AS factura_numero
     FROM pagos_proveedor pp
     LEFT JOIN facturas_proveedor fp ON fp.id = pp.factura_id
     WHERE pp.proveedor_id = $1
     ORDER BY pp.fecha DESC`,
    [proveedorId]
  )
}

export async function cargarFactura(proveedorId: number, total: number, numero?: string | null): Promise<void> {
  await tx(async () => {
    const factId = await insert(
      `INSERT INTO facturas_proveedor (proveedor_id, numero, total, saldo) VALUES ($1,$2,$3,$3)`,
      [proveedorId, numero ?? null, total]
    )
    await run(
      `UPDATE proveedores SET saldo_cta_cte = saldo_cta_cte + $1 WHERE id = $2`,
      [total, proveedorId]
    )
  })
}
