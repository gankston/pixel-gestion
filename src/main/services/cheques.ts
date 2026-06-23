import { query, run, insert } from '../db'

export interface ChequeInput {
  numero?: string | null
  banco?: string | null
  monto: number
  fechaEmision?: string | null
  fechaCobro: string
  origenTipo?: 'venta' | 'pago_cliente'
  origenId?: number | null
}

const CHEQUE_COLS = `id, numero, banco, monto, fecha_emision::TEXT AS fecha_emision, fecha_cobro::TEXT AS fecha_cobro, estado, origen_tipo, origen_id, destino_proveedor_id`

export async function listarCheques(estado?: string) {
  return estado
    ? query(`SELECT ${CHEQUE_COLS} FROM cheques_cartera WHERE estado = $1 ORDER BY fecha_cobro ASC`, [estado])
    : query(`SELECT ${CHEQUE_COLS} FROM cheques_cartera ORDER BY fecha_cobro ASC`)
}

export async function registrarCheque(data: ChequeInput): Promise<number> {
  return insert(
    `INSERT INTO cheques_cartera (numero, banco, monto, fecha_emision, fecha_cobro, origen_tipo, origen_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      data.numero ?? null,
      data.banco ?? null,
      data.monto,
      data.fechaEmision ?? null,
      data.fechaCobro,
      data.origenTipo ?? null,
      data.origenId ?? null
    ]
  )
}

export async function marcarCobrado(id: number): Promise<void> {
  await run(`UPDATE cheques_cartera SET estado = 'cobrado' WHERE id = $1`, [id])
}

export async function chequesEnCartera() {
  return query(`SELECT ${CHEQUE_COLS} FROM cheques_cartera WHERE estado = 'en_cartera' ORDER BY fecha_cobro ASC`)
}
