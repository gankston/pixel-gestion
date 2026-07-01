/**
 * Motor de precios de PIXEL GESTION.
 *
 * Flujo:
 *   precio_lista
 *     × (1-d1/100) × (1-d2/100) × (1-d3/100) × (1-d4/100) × (1-d5/100)
 *     = costo
 *   costo × (1 + ganancia/100)  = base
 *   base × (1 + descuentoMayor/100)   = mayorista
 *   base × (1 + descuentoMostrador/100) = mostrador (consumidor)
 *   REDONDEO: siempre hacia arriba al entero.
 *   Si el articulo esta en oferta, el precio de oferta pisa al calculado.
 */

export const DESCUENTO_MAYOR_DEFAULT = 10
export const DESCUENTO_MOSTRADOR_DEFAULT = 60

export interface ArticuloPrecio {
  neto: number             // precio de lista
  descuentoPct: number     // d1
  desc2Pct?: number
  desc3Pct?: number
  desc4Pct?: number
  desc5Pct?: number
  gananciaPct?: number
  markupMayoristaPct?: number   // descuento por mayor
  markupConsumidorPct?: number  // descuento mostrador
  enOferta?: boolean
  precioOferta?: number | null
}

export interface PreciosCalculados {
  netoFinal: number   // costo tras cascada de descuentos
  base: number        // costo + ganancia
  mayorista: number
  consumidor: number
}

export function redondearHaciaArriba(valor: number): number {
  return Math.ceil(Number(valor.toFixed(6)))
}

export function calcularCosto(
  precioLista: number,
  d1: number, d2 = 0, d3 = 0, d4 = 0, d5 = 0
): number {
  return precioLista
    * (1 - d1 / 100)
    * (1 - d2 / 100)
    * (1 - d3 / 100)
    * (1 - d4 / 100)
    * (1 - d5 / 100)
}

export function calcularPrecios(art: ArticuloPrecio): PreciosCalculados {
  const costo = calcularCosto(
    art.neto,
    art.descuentoPct,
    art.desc2Pct ?? 0,
    art.desc3Pct ?? 0,
    art.desc4Pct ?? 0,
    art.desc5Pct ?? 0
  )
  const ganancia = art.gananciaPct ?? 0
  const base = costo * (1 + ganancia / 100)
  const descMayor = art.markupMayoristaPct ?? DESCUENTO_MAYOR_DEFAULT
  const descMostrador = art.markupConsumidorPct ?? DESCUENTO_MOSTRADOR_DEFAULT
  return {
    netoFinal: costo,
    base,
    mayorista: redondearHaciaArriba(base * (1 + descMayor / 100)),
    consumidor: redondearHaciaArriba(base * (1 + descMostrador / 100))
  }
}

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

// Aliases para compatibilidad
export const calcularNetoFinal = (neto: number, d1: number) => calcularCosto(neto, d1)
