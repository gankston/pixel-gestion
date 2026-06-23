import { query, queryOne } from '../db'

export async function ventasPorDia(dias = 30) {
  return query<{ dia: string; cantidad: number; monto: number }>(`
    SELECT fecha::DATE::TEXT AS dia,
           COUNT(*)::int AS cantidad,
           COALESCE(SUM(total), 0)::int AS monto
    FROM ventas
    WHERE fecha >= NOW() - ($1::TEXT || ' days')::INTERVAL
    GROUP BY fecha::DATE
    ORDER BY dia DESC
  `, [dias])
}

export async function productosTopVentas(limite = 10) {
  return query<{ nombre: string; unidades: number; monto: number }>(`
    SELECT a.nombre,
           SUM(vi.cantidad)::int AS unidades,
           SUM(vi.cantidad * vi.precio_unit)::int AS monto
    FROM venta_items vi
    JOIN articulos a ON a.id = vi.articulo_id
    JOIN ventas v ON v.id = vi.venta_id
    WHERE v.fecha >= DATE_TRUNC('month', NOW())
    GROUP BY vi.articulo_id, a.nombre
    ORDER BY unidades DESC
    LIMIT $1
  `, [limite])
}

export async function stockBajoMinimo() {
  return query<{
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

export async function resumenMes() {
  const mes = await queryOne<{ cantidad: number; monto: number }>(`
    SELECT COUNT(*)::int AS cantidad, COALESCE(SUM(total), 0)::int AS monto
    FROM ventas WHERE fecha >= DATE_TRUNC('month', NOW())
  `) ?? { cantidad: 0, monto: 0 }

  const hoy = await queryOne<{ cantidad: number; monto: number }>(`
    SELECT COUNT(*)::int AS cantidad, COALESCE(SUM(total), 0)::int AS monto
    FROM ventas WHERE fecha >= DATE_TRUNC('day', NOW()) AND fecha < DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
  `) ?? { cantidad: 0, monto: 0 }

  return { mes, hoy }
}

export async function ventasPorLista() {
  return query<{ lista: string; cantidad: number; monto: number }>(`
    SELECT lista,
           COUNT(*)::int AS cantidad,
           COALESCE(SUM(total), 0)::int AS monto
    FROM ventas
    WHERE fecha >= DATE_TRUNC('month', NOW())
    GROUP BY lista
  `)
}
