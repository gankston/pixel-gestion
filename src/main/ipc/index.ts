import { ipcMain } from 'electron'
import { all } from '../db'
import { calcularPrecios, type ArticuloPrecio } from '../services/precios'

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

/** Registra todos los canales IPC que el renderer puede invocar. */
export function registerIpc(): void {
  ipcMain.handle('app:ping', () => 'pong')

  ipcMain.handle('articulos:list', () => {
    const rows = all<ArticuloRow>('SELECT * FROM articulos WHERE activo = 1 ORDER BY nombre')
    // Adjunta precios calculados y stock disponible a cada fila.
    return rows.map((r) => ({
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
    }))
  })

  ipcMain.handle('precios:calcular', (_e, input: ArticuloPrecio) => calcularPrecios(input))
}
