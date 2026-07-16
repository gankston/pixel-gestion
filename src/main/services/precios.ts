/**
 * Motor de precios de PIXEL GESTION.
 * Flujo:
 *   costo = precio_lista * (1-d1) * ... * (1-d5)
 *   precio_mayor_sin_iva   = costo * (1 + ganancia_mayor/100)
 *   precio_mostrador_sin_iva = costo * (1 + ganancia_mostrador/100)
 *   precio_*_final = precio_*_sin_iva * (1 + iva/100)   <- precio real de venta
 *   precio_*_oferta = precio_*_final * (1 - desc_oferta/100)  si en_oferta_*
 *   REDONDEO: siempre hacia arriba al entero.
 */

export const GANANCIA_MAYOR_DEFAULT = 30
export const GANANCIA_MOSTRADOR_DEFAULT = 50

export interface ArticuloPrecio {
  neto: number
  descuentoPct: number
  desc2Pct?: number
  desc3Pct?: number
  desc4Pct?: number
  desc5Pct?: number
  gananciaMayorPct?: number       // column: markup_mayorista_pct
  gananciaMonstradorPct?: number  // column: markup_consumidor_pct
  ivaAlicuota?: number
  enOfertaMayor?: boolean
  enOfertaMostrador?: boolean
  descOfertaMayorPct?: number
  descOfertaMonstradorPct?: number
}

export interface PreciosCalculados {
  costo: number
  mayorSinIva: number
  mostradorSinIva: number
  mayorFinal: number        // con IVA — precio real de venta para mayoristas
  mostradorFinal: number    // con IVA — precio real de venta para mostrador
  mayorOferta: number | null
  mostradorOferta: number | null
  // Aliases backward-compat (usados en ventas/presupuestos)
  netoFinal: number         // = costo
  base: number              // = mostradorFinal
  mayorista: number         // precio efectivo mayor (con oferta si aplica)
  consumidor: number        // precio efectivo mostrador (con oferta si aplica)
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

  const ganMayor = art.gananciaMayorPct ?? GANANCIA_MAYOR_DEFAULT
  const ganMostrador = art.gananciaMonstradorPct ?? GANANCIA_MOSTRADOR_DEFAULT
  const iva = art.ivaAlicuota ?? 21

  const mayorSinIva = costo * (1 + ganMayor / 100)
  const mostradorSinIva = costo * (1 + ganMostrador / 100)

  const mayorFinal = redondearHaciaArriba(mayorSinIva * (1 + iva / 100))
  const mostradorFinal = redondearHaciaArriba(mostradorSinIva * (1 + iva / 100))

  const mayorOferta =
    art.enOfertaMayor && (art.descOfertaMayorPct ?? 0) > 0
      ? redondearHaciaArriba(mayorFinal * (1 - (art.descOfertaMayorPct ?? 0) / 100))
      : null

  const mostradorOferta =
    art.enOfertaMostrador && (art.descOfertaMonstradorPct ?? 0) > 0
      ? redondearHaciaArriba(mostradorFinal * (1 - (art.descOfertaMonstradorPct ?? 0) / 100))
      : null

  return {
    costo,
    mayorSinIva: redondearHaciaArriba(mayorSinIva),
    mostradorSinIva: redondearHaciaArriba(mostradorSinIva),
    mayorFinal,
    mostradorFinal,
    mayorOferta,
    mostradorOferta,
    netoFinal: costo,
    base: mostradorFinal,
    mayorista: mayorOferta ?? mayorFinal,
    consumidor: mostradorOferta ?? mostradorFinal
  }
}

export function precioVenta(
  art: ArticuloPrecio,
  lista: 'mayorista' | 'consumidor'
): number {
  const p = calcularPrecios(art)
  return lista === 'mayorista' ? p.mayorista : p.consumidor
}

export const calcularNetoFinal = (neto: number, d1: number) => calcularCosto(neto, d1)
