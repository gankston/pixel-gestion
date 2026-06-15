import { describe, it, expect } from 'vitest'
import {
  redondearHaciaArriba,
  calcularNetoFinal,
  calcularPrecioMayorista,
  calcularPrecioConsumidor,
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

describe('neto final con descuento', () => {
  it('neto 100 con 10% de descuento -> 90', () => {
    expect(calcularNetoFinal(100, 10)).toBeCloseTo(90)
  })
  it('neto 100 sin descuento -> 100', () => {
    expect(calcularNetoFinal(100, 0)).toBe(100)
  })
})

describe('precio mayorista (+10% por default)', () => {
  it('neto 100 sin descuento -> 110', () => {
    expect(calcularPrecioMayorista(100, 0)).toBe(110)
  })
  it('neto 100 con 10% descuento (=90) +10% -> 99', () => {
    expect(calcularPrecioMayorista(100, 10)).toBe(99)
  })
})

describe('precio consumidor final (+60% por default)', () => {
  it('neto 100 sin descuento -> 160', () => {
    expect(calcularPrecioConsumidor(100, 0)).toBe(160)
  })
  it('neto 84,70 sin descuento -> 136 (135,52 redondea arriba)', () => {
    expect(calcularPrecioConsumidor(84.7, 0)).toBe(136)
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
