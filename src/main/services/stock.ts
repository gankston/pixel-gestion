import { run, insert, queryOne } from '../db'

export type TipoMovimiento = 'compra' | 'venta' | 'ajuste' | 'reserva' | 'liberacion'

export async function registrarMovimiento(
  articuloId: number,
  tipo: TipoMovimiento,
  cantidad: number,
  referenciaTipo?: string,
  referenciaId?: number
): Promise<void> {
  await insert(
    `INSERT INTO stock_movimientos (articulo_id, tipo, cantidad, referencia_tipo, referencia_id)
     VALUES ($1,$2,$3,$4,$5)`,
    [articuloId, tipo, cantidad, referenciaTipo ?? null, referenciaId ?? null]
  )

  switch (tipo) {
    case 'compra':
      await run('UPDATE articulos SET stock_fisico = stock_fisico + $1 WHERE id = $2', [cantidad, articuloId])
      break
    case 'ajuste': {
      const art = await queryOne<{ stock_fisico: number }>('SELECT stock_fisico FROM articulos WHERE id = $1', [articuloId])
      if (art && art.stock_fisico + cantidad < 0) {
        throw new Error(`Stock insuficiente para ajuste: quedaría en ${art.stock_fisico + cantidad}`)
      }
      await run('UPDATE articulos SET stock_fisico = stock_fisico + $1 WHERE id = $2', [cantidad, articuloId])
      break
    }
    case 'venta':
      await run('UPDATE articulos SET stock_fisico = stock_fisico - $1 WHERE id = $2', [cantidad, articuloId])
      break
    case 'reserva':
      await run('UPDATE articulos SET stock_reservado = stock_reservado + $1 WHERE id = $2', [cantidad, articuloId])
      break
    case 'liberacion':
      await run('UPDATE articulos SET stock_reservado = stock_reservado - $1 WHERE id = $2', [cantidad, articuloId])
      break
  }
}
