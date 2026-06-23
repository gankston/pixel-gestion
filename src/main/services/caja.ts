import { query, queryOne, run, insert } from '../db'

export type MedioPago = 'efectivo' | 'transferencia' | 'credito' | 'debito' | 'cheque'

export interface CajaRow {
  id: number
  fecha: string
  estado: 'abierta' | 'cerrada'
  saldo_inicial: number
  saldo_final: number | null
  abierta_en: string
  cerrada_en: string | null
}

const hoy = (): string => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD

export async function cajaAbierta(): Promise<CajaRow | null> {
  return queryOne<CajaRow>("SELECT * FROM caja_diaria WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1")
}

export async function abrirCaja(saldoInicial = 0): Promise<CajaRow> {
  const existente = await cajaAbierta()
  if (existente) return existente
  const id = await insert(
    'INSERT INTO caja_diaria (fecha, estado, saldo_inicial) VALUES ($1,$2,$3)',
    [hoy(), 'abierta', saldoInicial]
  )
  return (await queryOne<CajaRow>('SELECT * FROM caja_diaria WHERE id = $1', [id]))!
}

export async function asegurarCajaAbierta(): Promise<CajaRow> {
  return (await cajaAbierta()) ?? abrirCaja(0)
}

export async function registrarMovimientoCaja(
  cajaId: number,
  tipo: 'ingreso' | 'egreso',
  medio: MedioPago,
  monto: number,
  referenciaTipo?: string,
  referenciaId?: number,
  descripcion?: string
): Promise<void> {
  await run(
    `INSERT INTO caja_movimientos (caja_id, tipo, medio_pago, monto, referencia_tipo, referencia_id, descripcion)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [cajaId, tipo, medio, monto, referenciaTipo ?? null, referenciaId ?? null, descripcion ?? null]
  )
}

export interface ResumenCaja {
  efectivo: number
  transferencia: number
  credito: number
  debito: number
  cheque: number
  total: number
}

export async function resumenCaja(cajaId: number): Promise<ResumenCaja> {
  const fila = async (medio: MedioPago): Promise<number> => {
    const r = await queryOne<{ t: number }>(
      `SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE -monto END), 0) AS t
       FROM caja_movimientos WHERE caja_id = $1 AND medio_pago = $2`,
      [cajaId, medio]
    )
    return r?.t ?? 0
  }
  const efectivo = await fila('efectivo')
  const transferencia = await fila('transferencia')
  const credito = await fila('credito')
  const debito = await fila('debito')
  const cheque = await fila('cheque')
  return { efectivo, transferencia, credito, debito, cheque, total: efectivo + transferencia + credito + debito + cheque }
}

export async function movimientosCaja(cajaId: number) {
  return query('SELECT * FROM caja_movimientos WHERE caja_id = $1 ORDER BY id DESC', [cajaId])
}

export async function cerrarCaja(cajaId: number, saldoFinal: number): Promise<void> {
  await run(
    "UPDATE caja_diaria SET estado = 'cerrada', saldo_final = $1, cerrada_en = NOW() WHERE id = $2",
    [saldoFinal, cajaId]
  )
}

export async function estadoCaja() {
  const caja = await cajaAbierta()
  if (!caja) return { caja: null, resumen: null, movimientos: [] }
  const [resumen, movimientos] = await Promise.all([
    resumenCaja(caja.id),
    movimientosCaja(caja.id)
  ])
  return { caja, resumen, movimientos }
}
