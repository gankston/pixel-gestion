/**
 * Motor de precios de PIXEL GESTION.
 *
 * Regla de negocio (confirmada con el cliente):
 *   neto final   = neto - descuento%
 *   mayorista    = neto final + markup mayorista (default +10%)
 *   consumidor   = neto final + markup consumidor (default +60%)
 *   REDONDEO: siempre hacia arriba al entero (techo). 100,50 -> 101 ; 100,01 -> 101
 *   Si el articulo esta en oferta, el precio de oferta pisa al calculado.
 */

export const MARKUP_MAYORISTA_DEFAULT = 10
export const MARKUP_CONSUMIDOR_DEFAULT = 60

export interface ArticuloPrecio {
  neto: number
  descuentoPct: number
  markupMayoristaPct?: number
  markupConsumidorPct?: number
  enOferta?: boolean
  precioOferta?: number | null
}

export interface PreciosCalculados {
  netoFinal: number
  mayorista: number
  consumidor: number
}

/**
 * Redondeo SIEMPRE hacia arriba al entero.
 * El toFixed(6) elimina el ruido de coma flotante (ej: 110.00000000000001)
 * antes de aplicar el techo, para que 100 * 1.1 de 110 y no 111.
 */
export function redondearHaciaArriba(valor: number): number {
  return Math.ceil(Number(valor.toFixed(6)))
}

export function calcularNetoFinal(neto: number, descuentoPct: number): number {
  return neto * (1 - descuentoPct / 100)
}

export function calcularPrecioMayorista(
  neto: number,
  descuentoPct: number,
  markupPct: number = MARKUP_MAYORISTA_DEFAULT
): number {
  const base = calcularNetoFinal(neto, descuentoPct)
  return redondearHaciaArriba(base * (1 + markupPct / 100))
}

export function calcularPrecioConsumidor(
  neto: number,
  descuentoPct: number,
  markupPct: number = MARKUP_CONSUMIDOR_DEFAULT
): number {
  const base = calcularNetoFinal(neto, descuentoPct)
  return redondearHaciaArriba(base * (1 + markupPct / 100))
}

/** Calcula ambas listas de precio para un articulo. */
export function calcularPrecios(art: ArticuloPrecio): PreciosCalculados {
  const markupMay = art.markupMayoristaPct ?? MARKUP_MAYORISTA_DEFAULT
  const markupCon = art.markupConsumidorPct ?? MARKUP_CONSUMIDOR_DEFAULT
  return {
    netoFinal: calcularNetoFinal(art.neto, art.descuentoPct),
    mayorista: calcularPrecioMayorista(art.neto, art.descuentoPct, markupMay),
    consumidor: calcularPrecioConsumidor(art.neto, art.descuentoPct, markupCon)
  }
}

/** Precio final de venta segun la lista y si esta en oferta. */
export function precioVenta(
  art: ArticuloPrecio,
  lista: 'mayorista' | 'consumidor'
): number {
  if (art.enOferta && art.precioOferta != null) {
    return redondearHaciaArriba(art.precioOferta)
  }
  const p = calcularPrecios(art)
  return lista === 'mayorista' ? p.mayorista : p.consumidor
}
