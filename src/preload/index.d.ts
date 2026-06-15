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
  markup_mayorista_pct: number
  markup_consumidor_pct: number
  en_oferta: number
  precio_oferta: number | null
  stock_fisico: number
  stock_reservado: number
  stock_disponible: number
  stock_minimo: number
  precios: PreciosCalculados
}

export interface Cliente {
  id: number
  nombre: string
  tipo: 'mayorista' | 'consumidor'
  documento: string | null
  telefono: string | null
  email: string | null
  saldo_cta_cte: number
}

export interface ResumenCaja {
  efectivo: number
  transferencia: number
  credito: number
  debito: number
  total: number
}

export interface CajaEstado {
  caja: {
    id: number
    fecha: string
    estado: 'abierta' | 'cerrada'
    saldo_inicial: number
    saldo_final: number | null
  } | null
  resumen: ResumenCaja | null
  movimientos: Array<{
    id: number
    tipo: string
    medio_pago: string
    monto: number
    descripcion: string | null
    fecha: string
  }>
}

export interface Venta {
  id: number
  fecha: string
  total: number
  lista: string
  cliente_nombre: string | null
}

export interface Presupuesto {
  id: number
  fecha: string
  estado: 'vigente' | 'aprobado' | 'vencido' | 'anulado'
  lista: 'mayorista' | 'consumidor'
  total: number
  cliente_id: number | null
  cliente_nombre: string | null
}

export interface Api {
  listArticulos: (filtro?: string) => Promise<ArticuloConPrecios[]>
  buscarCodigo: (codigo: string) => Promise<ArticuloConPrecios | null>
  crearArticulo: (data: unknown) => Promise<number>
  actualizarArticulo: (id: number, data: unknown) => Promise<void>
  eliminarArticulo: (id: number) => Promise<void>
  ingresoStock: (articuloId: number, cantidad: number) => Promise<void>
  ajusteStock: (articuloId: number, cantidad: number) => Promise<void>

  crearVenta: (input: unknown) => Promise<{ ventaId: number; total: number }>
  listVentas: () => Promise<Venta[]>

  crearPresupuesto: (input: unknown) => Promise<number>
  listPresupuestos: () => Promise<Presupuesto[]>
  itemsPresupuesto: (id: number) => Promise<unknown[]>
  aprobarPresupuesto: (id: number) => Promise<void>
  anularPresupuesto: (id: number) => Promise<void>

  estadoCaja: () => Promise<CajaEstado>
  abrirCaja: (saldoInicial: number) => Promise<unknown>
  cerrarCaja: (cajaId: number, saldoFinal: number) => Promise<void>

  listClientes: () => Promise<Cliente[]>
  crearCliente: (data: unknown) => Promise<number>
  actualizarCliente: (id: number, data: unknown) => Promise<void>
  ventasCliente: (clienteId: number) => Promise<Venta[]>
  registrarPago: (input: unknown) => Promise<number>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
