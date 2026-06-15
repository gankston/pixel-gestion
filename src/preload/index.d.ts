import { ElectronAPI } from '@electron-toolkit/preload'

export interface PreciosCalculados {
  netoFinal: number
  mayorista: number
  consumidor: number
}

export interface ArticuloConPrecios {
  id: number
  codigo_barras: string | null
  nombre: string
  rubro: string | null
  neto: number
  descuento_pct: number
  en_oferta: number
  precio_oferta: number | null
  stock_fisico: number
  stock_reservado: number
  stock_disponible: number
  stock_minimo: number
  precios: PreciosCalculados
}

export interface Api {
  ping: () => Promise<string>
  listArticulos: () => Promise<ArticuloConPrecios[]>
  calcularPrecios: (input: unknown) => Promise<PreciosCalculados>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
