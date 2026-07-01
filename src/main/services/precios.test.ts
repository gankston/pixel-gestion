import { describe, it, expect } from 'vitest'
import {
  redondearHaciaArriba,
  calcularNetoFinal,
  calcularCosto,
  calcularPrecios,
  precioVenta
} from './precios'

describe('redondeo hacia arriba (techo)', () => {
  it('100,50 -> 101', () => {
    expect(redondearHaciaArriba(100.5)).toBe(101)
  })
  it('100,01 -> 101', () => {
    expect(redondearHaciaArriba(100.01)).toBe(101)
  })
  it('100 exacto -> 100 (no sube de mas)', () => {
    expect(redondearHaciaArriba(100)).toBe(100)
  })
  it('ignora el ruido de coma flotante: 110.00000000000001 -> 110', () => {
    expect(redondearHaciaArriba(100 * 1.1)).toBe(110)
  })
})

describe('calcularCosto — cascada de descuentos', () => {
  it('100 con 10% de desc1 -> 90', () => {
    expect(calcularNetoFinal(100, 10)).toBeCloseTo(90)
  })
  it('100 sin descuentos -> 100', () => {
    expect(calcularCosto(100, 0)).toBe(100)
  })
  it('100 con 10%+10% en cascada -> 81', () => {
    expect(calcularCosto(100, 10, 10)).toBeCloseTo(81)
  })
  it('100 con 5 descuentos del 0% -> 100', () => {
    expect(calcularCosto(100, 0, 0, 0, 0, 0)).toBe(100)
  })
})

describe('calcularPrecios — precio mayorista (+10% default)', () => {
  it('lista 100 sin descuentos, sin ganancia -> mayorista 110', () => {
    expect(calcularPrecios({ neto: 100, descuentoPct: 0 }).mayorista).toBe(110)
  })
  it('lista 100 con desc1=10% -> costo 90 -> mayorista 99', () => {
    expect(calcularPrecios({ neto: 100, descuentoPct: 10 }).mayorista).toBe(99)
  })
  it('lista 100 con ganancia=20% -> base 120 -> mayorista 132', () => {
    expect(calcularPrecios({ neto: 100, descuentoPct: 0, gananciaPct: 20 }).mayorista).toBe(132)
  })
})

describe('calcularPrecios — precio consumidor (+60% default)', () => {
  it('lista 100 sin descuentos -> consumidor 160', () => {
    expect(calcularPrecios({ neto: 100, descuentoPct: 0 }).consumidor).toBe(160)
  })
  it('lista 84,70 sin descuentos -> consumidor 136', () => {
    expect(calcularPrecios({ neto: 84.7, descuentoPct: 0 }).consumidor).toBe(136)
  })
})

describe('precio de venta segun lista y oferta', () => {
  const art = { neto: 100, descuentoPct: 0 }
  it('lista mayorista usa precio mayorista', () => {
    expect(precioVenta(art, 'mayorista')).toBe(110)
  })
  it('lista consumidor usa precio consumidor', () => {
    expect(precioVenta(art, 'consumidor')).toBe(160)
  })
  it('si esta en oferta, el precio de oferta pisa al calculado', () => {
    expect(precioVenta({ ...art, enOferta: true, precioOferta: 80 }, 'consumidor')).toBe(80)
  })
})
