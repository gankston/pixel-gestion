import { query, queryOne, run, insert } from '../db'

export interface ChequeInput {
  numero?: string | null
  banco?: string | null
  monto: number
  fechaEmision?: string | null
  fechaCobro: string
  librador?: string | null
  tipo?: 'personal' | 'empresa'
  origenTipo?: 'venta' | 'pago_cliente'
  origenId?: number | null
}

const CHEQUE_COLS = `id, numero, banco, monto, fecha_emision::TEXT AS fecha_emision, fecha_cobro::TEXT AS fecha_cobro, estado, origen_tipo, origen_id, destino_proveedor_id, librador, tipo`

export async function listarCheques(estado?: string) {
  return estado
    ? query(`SELECT ${CHEQUE_COLS} FROM cheques_cartera WHERE estado = $1 ORDER BY fecha_cobro ASC`, [estado])
    : query(`SELECT ${CHEQUE_COLS} FROM cheques_cartera ORDER BY fecha_cobro ASC`)
}

export async function registrarCheque(data: ChequeInput): Promise<number> {
  return insert(
    `INSERT INTO cheques_cartera (numero, banco, monto, fecha_emision, fecha_cobro, librador, tipo, origen_tipo, origen_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      data.numero ?? null,
      data.banco ?? null,
      data.monto,
      data.fechaEmision ?? null,
      data.fechaCobro,
      data.librador ?? null,
      data.tipo ?? 'personal',
      data.origenTipo ?? null,
      data.origenId ?? null
    ]
  )
}

export async function marcarCobrado(id: number): Promise<void> {
  const ch = await queryOne<{ estado: string }>('SELECT estado FROM cheques_cartera WHERE id = $1', [id])
  if (!ch) throw new Error('Cheque no encontrado')
  if (ch.estado !== 'en_cartera') throw new Error('Solo se pueden cobrar cheques que están en cartera')
  await run(`UPDATE cheques_cartera SET estado = 'cobrado' WHERE id = $1`, [id])
}

export async function chequesEnCartera() {
  return query(`SELECT ${CHEQUE_COLS} FROM cheques_cartera WHERE estado = 'en_cartera' ORDER BY fecha_cobro ASC`)
}
