import { all, get, run, lastId } from '../db'
import { calcularPrecios } from './precios'

export interface ArticuloRow {
  id: number
  codigo_barras: string | null
  nombre: string
  rubro: string | null
  neto: number
  descuento_pct: number
  markup_mayorista_pct: number
  markup_consumidor_pct: number
  en_oferta: number
  precio_oferta: number | null
  stock_fisico: number
  stock_reservado: number
  stock_minimo: number
}

export interface ArticuloInput {
  codigo_barras?: string | null
  nombre: string
  rubro?: string | null
  neto: number
  descuento_pct: number
  markup_mayorista_pct?: number
  markup_consumidor_pct?: number
  en_oferta?: boolean
  precio_oferta?: number | null
  stock_fisico?: number
  stock_minimo?: number
}

function conPrecios(r: ArticuloRow) {
  return {
    ...r,
    stock_disponible: r.stock_fisico - r.stock_reservado,
    precios: calcularPrecios({
      neto: r.neto,
      descuentoPct: r.descuento_pct,
      markupMayoristaPct: r.markup_mayorista_pct,
      markupConsumidorPct: r.markup_consumidor_pct,
      enOferta: r.en_oferta === 1,
      precioOferta: r.precio_oferta
    })
  }
}

export function listarArticulos(filtro = '') {
  const f = `%${filtro.trim()}%`
  const rows = filtro
    ? all<ArticuloRow>(
        'SELECT * FROM articulos WHERE activo = 1 AND (nombre LIKE ? OR codigo_barras LIKE ? OR rubro LIKE ?) ORDER BY nombre',
        [f, f, f]
      )
    : all<ArticuloRow>('SELECT * FROM articulos WHERE activo = 1 ORDER BY nombre')
  return rows.map(conPrecios)
}

export function buscarPorCodigo(codigo: string) {
  const r = get<ArticuloRow>(
    'SELECT * FROM articulos WHERE activo = 1 AND codigo_barras = ?',
    [codigo.trim()]
  )
  return r ? conPrecios(r) : null
}

export function crearArticulo(data: ArticuloInput): number {
  run(
    `INSERT INTO articulos
       (codigo_barras, nombre, rubro, neto, descuento_pct, markup_mayorista_pct, markup_consumidor_pct, en_oferta, precio_oferta, stock_fisico, stock_minimo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.codigo_barras || null,
      data.nombre,
      data.rubro || null,
      data.neto,
      data.descuento_pct,
      data.markup_mayorista_pct ?? 10,
      data.markup_consumidor_pct ?? 60,
      data.en_oferta ? 1 : 0,
      data.precio_oferta ?? null,
      data.stock_fisico ?? 0,
      data.stock_minimo ?? 0
    ]
  )
  return lastId()
}

export function actualizarArticulo(id: number, data: ArticuloInput): void {
  run(
    `UPDATE articulos SET
       codigo_barras = ?, nombre = ?, rubro = ?, neto = ?, descuento_pct = ?,
       markup_mayorista_pct = ?, markup_consumidor_pct = ?, en_oferta = ?, precio_oferta = ?, stock_minimo = ?
     WHERE id = ?`,
    [
      data.codigo_barras || null,
      data.nombre,
      data.rubro || null,
      data.neto,
      data.descuento_pct,
      data.markup_mayorista_pct ?? 10,
      data.markup_consumidor_pct ?? 60,
      data.en_oferta ? 1 : 0,
      data.precio_oferta ?? null,
      data.stock_minimo ?? 0,
      id
    ]
  )
}

export function eliminarArticulo(id: number): void {
  run('UPDATE articulos SET activo = 0 WHERE id = ?', [id])
}
