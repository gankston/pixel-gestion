import { run } from '../db'

export type TipoMovimiento = 'compra' | 'venta' | 'ajuste' | 'reserva' | 'liberacion'

/**
 * Registra un movimiento de stock y ajusta las columnas del articulo.
 * - compra:     stock_fisico += cantidad
 * - venta:      stock_fisico -= cantidad
 * - ajuste:     stock_fisico += cantidad (la cantidad puede ser negativa)
 * - reserva:    stock_reservado += cantidad
 * - liberacion: stock_reservado -= cantidad
 */
export function registrarMovimiento(
  articuloId: number,
  tipo: TipoMovimiento,
  cantidad: number,
  referenciaTipo?: string,
  referenciaId?: number
): void {
  run(
    `INSERT INTO stock_movimientos (articulo_id, tipo, cantidad, referencia_tipo, referencia_id)
     VALUES (?, ?, ?, ?, ?)`,
    [articuloId, tipo, cantidad, referenciaTipo ?? null, referenciaId ?? null]
  )

  switch (tipo) {
    case 'compra':
      run('UPDATE articulos SET stock_fisico = stock_fisico + ? WHERE id = ?', [cantidad, articuloId])
      break
    case 'venta':
      run('UPDATE articulos SET stock_fisico = stock_fisico - ? WHERE id = ?', [cantidad, articuloId])
      break
    case 'ajuste':
      run('UPDATE articulos SET stock_fisico = stock_fisico + ? WHERE id = ?', [cantidad, articuloId])
      break
    case 'reserva':
      run('UPDATE articulos SET stock_reservado = stock_reservado + ? WHERE id = ?', [cantidad, articuloId])
      break
    case 'liberacion':
      run('UPDATE articulos SET stock_reservado = stock_reservado - ? WHERE id = ?', [cantidad, articuloId])
      break
  }
}
