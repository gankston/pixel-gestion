import { all, get, run, lastId } from '../db'

export type MedioPago = 'efectivo' | 'transferencia' | 'credito' | 'debito'

export interface CajaRow {
  id: number
  fecha: string
  estado: 'abierta' | 'cerrada'
  saldo_inicial: number
  saldo_final: number | null
  abierta_en: string
  cerrada_en: string | null
}

const hoy = (): string => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local

export function cajaAbierta(): CajaRow | undefined {
  return get<CajaRow>("SELECT * FROM caja_diaria WHERE estado = 'abierta' ORDER BY id DESC LIMIT 1")
}

export function abrirCaja(saldoInicial = 0): CajaRow {
  if (cajaAbierta()) return cajaAbierta()!
  run('INSERT INTO caja_diaria (fecha, estado, saldo_inicial) VALUES (?, ?, ?)', [
    hoy(),
    'abierta',
    saldoInicial
  ])
  return get<CajaRow>('SELECT * FROM caja_diaria WHERE id = ?', [lastId()])!
}

/** Garantiza que haya una caja abierta (la abre con saldo 0 si no existe). */
export function asegurarCajaAbierta(): CajaRow {
  return cajaAbierta() ?? abrirCaja(0)
}

export function registrarMovimientoCaja(
  cajaId: number,
  tipo: 'ingreso' | 'egreso',
  medio: MedioPago,
  monto: number,
  referenciaTipo?: string,
  referenciaId?: number,
  descripcion?: string
): void {
  run(
    `INSERT INTO caja_movimientos (caja_id, tipo, medio_pago, monto, referencia_tipo, referencia_id, descripcion)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cajaId, tipo, medio, monto, referenciaTipo ?? null, referenciaId ?? null, descripcion ?? null]
  )
}

export interface ResumenCaja {
  efectivo: number
  transferencia: number
  credito: number
  debito: number
  total: number
}

/** Totales netos (ingresos - egresos) por medio de pago para una caja. */
export function resumenCaja(cajaId: number): ResumenCaja {
  const fila = (medio: MedioPago): number => {
    const r = get<{ t: number }>(
      `SELECT COALESCE(SUM(CASE WHEN tipo='ingreso' THEN monto ELSE -monto END), 0) AS t
       FROM caja_movimientos WHERE caja_id = ? AND medio_pago = ?`,
      [cajaId, medio]
    )
    return r?.t ?? 0
  }
  const efectivo = fila('efectivo')
  const transferencia = fila('transferencia')
  const credito = fila('credito')
  const debito = fila('debito')
  return { efectivo, transferencia, credito, debito, total: efectivo + transferencia + credito + debito }
}

export function movimientosCaja(cajaId: number) {
  return all(
    'SELECT * FROM caja_movimientos WHERE caja_id = ? ORDER BY id DESC',
    [cajaId]
  )
}

export function cerrarCaja(cajaId: number, saldoFinal: number): void {
  run(
    "UPDATE caja_diaria SET estado = 'cerrada', saldo_final = ?, cerrada_en = datetime('now','localtime') WHERE id = ?",
    [saldoFinal, cajaId]
  )
}

/** Estado de caja para la pantalla: caja abierta + su resumen, o null. */
export function estadoCaja() {
  const caja = cajaAbierta()
  if (!caja) return { caja: null, resumen: null, movimientos: [] }
  return { caja, resumen: resumenCaja(caja.id), movimientos: movimientosCaja(caja.id) }
}
