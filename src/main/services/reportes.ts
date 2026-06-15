import { all, get } from '../db'

export function ventasPorDia(dias = 30) {
  return all<{ dia: string; cantidad: number; monto: number }>(`
    SELECT substr(fecha, 1, 10) AS dia,
           COUNT(*) AS cantidad,
           CAST(SUM(total) AS INTEGER) AS monto
    FROM ventas
    WHERE fecha >= datetime('now', '-${dias} days', 'localtime')
    GROUP BY substr(fecha, 1, 10)
    ORDER BY dia DESC
  `)
}

export function productosTopVentas(limite = 10) {
  return all<{ nombre: string; unidades: number; monto: number }>(`
    SELECT a.nombre,
           CAST(SUM(vi.cantidad) AS INTEGER) AS unidades,
           CAST(SUM(vi.cantidad * vi.precio_unit) AS INTEGER) AS monto
    FROM venta_items vi
    JOIN articulos a ON a.id = vi.articulo_id
    GROUP BY vi.articulo_id
    ORDER BY unidades DESC
    LIMIT ?
  `, [limite])
}

export function stockBajoMinimo() {
  return all<{
    nombre: string
    codigo_barras: string | null
    stock_fisico: number
    stock_reservado: number
    stock_disponible: number
    stock_minimo: number
  }>(`
    SELECT nombre, codigo_barras, stock_fisico, stock_reservado,
           (stock_fisico - stock_reservado) AS stock_disponible,
           stock_minimo
    FROM articulos
    WHERE (stock_fisico - stock_reservado) < stock_minimo AND activo = 1
    ORDER BY (stock_fisico - stock_reservado) - stock_minimo ASC
  `)
}

export function resumenMes() {
  const ahora = new Date()
  const inicioMes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01 00:00:00`
  const hoyStr = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`

  const mes = get<{ cantidad: number; monto: number }>(`
    SELECT COUNT(*) AS cantidad, COALESCE(CAST(SUM(total) AS INTEGER), 0) AS monto
    FROM ventas WHERE substr(fecha, 1, 10) >= ?
  `, [inicioMes]) ?? { cantidad: 0, monto: 0 }

  const hoy = get<{ cantidad: number; monto: number }>(`
    SELECT COUNT(*) AS cantidad, COALESCE(CAST(SUM(total) AS INTEGER), 0) AS monto
    FROM ventas WHERE substr(fecha, 1, 10) = ?
  `, [hoyStr]) ?? { cantidad: 0, monto: 0 }

  return { mes, hoy }
}
