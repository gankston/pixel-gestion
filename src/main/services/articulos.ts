import { query, queryOne, run, insert } from '../db'
import { calcularPrecios } from './precios'

export interface ArticuloRow {
  id: number
  codigo_barras: string | null
  nombre: string
  rubro: string | null
  neto: number
  descuento_pct: number
  desc2_pct: number
  desc3_pct: number
  desc4_pct: number
  desc5_pct: number
  ganancia_pct: number
  markup_mayorista_pct: number
  markup_consumidor_pct: number
  en_oferta: number
  precio_oferta: number | null
  stock_fisico: number
  stock_reservado: number
  stock_minimo: number
  iva_alicuota: number
  precio_usd: number | null
}

export interface ArticuloInput {
  codigo_barras?: string | null
  nombre: string
  rubro?: string | null
  neto: number
  descuento_pct: number
  desc2_pct?: number
  desc3_pct?: number
  desc4_pct?: number
  desc5_pct?: number
  ganancia_pct?: number
  markup_mayorista_pct?: number
  markup_consumidor_pct?: number
  en_oferta?: boolean
  precio_oferta?: number | null
  stock_fisico?: number
  stock_minimo?: number
  iva_alicuota?: number
  precio_usd?: number | null
}

function conPrecios(r: ArticuloRow) {
  return {
    ...r,
    stock_disponible: r.stock_fisico - r.stock_reservado,
    precios: calcularPrecios({
      neto: r.neto,
      descuentoPct: r.descuento_pct,
      desc2Pct: r.desc2_pct,
      desc3Pct: r.desc3_pct,
      desc4Pct: r.desc4_pct,
      desc5Pct: r.desc5_pct,
      gananciaPct: r.ganancia_pct,
      markupMayoristaPct: r.markup_mayorista_pct,
      markupConsumidorPct: r.markup_consumidor_pct,
      enOferta: r.en_oferta === 1,
      precioOferta: r.precio_oferta
    })
  }
}

export async function listarArticulos(filtro = '') {
  const f = `%${filtro.trim()}%`
  const rows = filtro
    ? await query<ArticuloRow>(
        'SELECT * FROM articulos WHERE activo = 1 AND (nombre ILIKE $1 OR codigo_barras ILIKE $2 OR rubro ILIKE $3) ORDER BY nombre',
        [f, f, f]
      )
    : await query<ArticuloRow>('SELECT * FROM articulos WHERE activo = 1 ORDER BY nombre')
  return rows.map(conPrecios)
}

export async function buscarPorCodigo(codigo: string) {
  const r = await queryOne<ArticuloRow>(
    'SELECT * FROM articulos WHERE activo = 1 AND codigo_barras = $1',
    [codigo.trim()]
  )
  return r ? conPrecios(r) : null
}

export async function crearArticulo(data: ArticuloInput): Promise<number> {
  return insert(
    `INSERT INTO articulos
       (codigo_barras, nombre, rubro, neto, descuento_pct, desc2_pct, desc3_pct, desc4_pct, desc5_pct,
        ganancia_pct, markup_mayorista_pct, markup_consumidor_pct,
        en_oferta, precio_oferta, stock_fisico, stock_minimo, iva_alicuota, precio_usd)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      data.codigo_barras || null,
      data.nombre,
      data.rubro || null,
      data.neto,
      data.descuento_pct,
      data.desc2_pct ?? 0,
      data.desc3_pct ?? 0,
      data.desc4_pct ?? 0,
      data.desc5_pct ?? 0,
      data.ganancia_pct ?? 0,
      data.markup_mayorista_pct ?? 10,
      data.markup_consumidor_pct ?? 60,
      data.en_oferta ? 1 : 0,
      data.precio_oferta ?? null,
      data.stock_fisico ?? 0,
      data.stock_minimo ?? 0,
      data.iva_alicuota ?? 21,
      data.precio_usd ?? null
    ]
  )
}

export async function actualizarArticulo(id: number, data: ArticuloInput): Promise<void> {
  await run(
    `UPDATE articulos SET
       codigo_barras=$1, nombre=$2, rubro=$3, neto=$4, descuento_pct=$5,
       desc2_pct=$6, desc3_pct=$7, desc4_pct=$8, desc5_pct=$9, ganancia_pct=$10,
       markup_mayorista_pct=$11, markup_consumidor_pct=$12, en_oferta=$13, precio_oferta=$14,
       stock_minimo=$15, iva_alicuota=$16, precio_usd=$17
     WHERE id=$18`,
    [
      data.codigo_barras || null,
      data.nombre,
      data.rubro || null,
      data.neto,
      data.descuento_pct,
      data.desc2_pct ?? 0,
      data.desc3_pct ?? 0,
      data.desc4_pct ?? 0,
      data.desc5_pct ?? 0,
      data.ganancia_pct ?? 0,
      data.markup_mayorista_pct ?? 10,
      data.markup_consumidor_pct ?? 60,
      data.en_oferta ? 1 : 0,
      data.precio_oferta ?? null,
      data.stock_minimo ?? 0,
      data.iva_alicuota ?? 21,
      data.precio_usd ?? null,
      id
    ]
  )
}

export async function eliminarArticulo(id: number): Promise<void> {
  const art = await queryOne<{ stock_reservado: number }>('SELECT stock_reservado FROM articulos WHERE id = $1', [id])
  if (art && art.stock_reservado > 0) {
    throw new Error('No se puede eliminar: el artículo tiene stock reservado en presupuestos vigentes')
  }
  await run('UPDATE articulos SET activo = 0 WHERE id = $1', [id])
}
