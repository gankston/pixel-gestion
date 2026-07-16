import { ElectronAPI } from '@electron-toolkit/preload'

export interface Usuario {
  id: number
  nombre: string
  perfil: 'vendedor' | 'admin'
}

export interface DbStatus {
  connected: boolean
  needsSetup: boolean
  error: string | null
}

export interface PreciosCalculados {
  costo: number
  mayorSinIva: number
  mostradorSinIva: number
  mayorFinal: number
  mostradorFinal: number
  mayorOferta: number | null
  mostradorOferta: number | null
  netoFinal: number
  base: number
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
  desc2_pct: number
  desc3_pct: number
  desc4_pct: number
  desc5_pct: number
  markup_mayorista_pct: number
  markup_consumidor_pct: number
  en_oferta_mayor: number
  en_oferta_mostrador: number
  desc_oferta_mayor_pct: number
  desc_oferta_mostrador_pct: number
  stock_fisico: number
  stock_reservado: number
  stock_disponible: number
  stock_minimo: number
  iva_alicuota: number
  precio_usd: number | null
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

export interface Proveedor {
  id: number
  nombre: string
  cuit: string | null
  telefono: string | null
  email: string | null
  saldo_cta_cte: number
}

export interface FacturaProveedor {
  id: number
  proveedor_id: number
  numero: string | null
  fecha: string
  total: number
  saldo: number
  estado: 'pendiente' | 'parcial' | 'pagada'
}

export interface ChequeCartera {
  id: number
  numero: string | null
  banco: string | null
  monto: number
  fecha_emision: string | null
  fecha_cobro: string
  estado: 'en_cartera' | 'cobrado' | 'entregado'
  origen_tipo: string | null
  origen_id: number | null
  librador: string | null
  tipo: 'personal' | 'empresa'
}

export interface ResumenCaja {
  efectivo: number
  transferencia: number
  credito: number
  debito: number
  cheque: number
  total: number
}

export interface CajaEstado {
  caja: {
    id: number
    fecha: string
    estado: 'abierta' | 'cerrada'
    saldo_inicial: number
    saldo_final: number | null
    abierta_en: string
    cerrada_en: string | null
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
  vencimiento: string | null
}

export interface DetalleVenta {
  id: number
  fecha: string
  lista: string
  total: number
  cliente_nombre: string | null
  items: Array<{ nombre: string; cantidad: number; precio_unit: number }>
}

export interface DetallePresupuesto {
  id: number
  fecha: string
  lista: string
  total: number
  estado: string
  cliente_nombre: string | null
  vencimiento: string | null
  items: Array<{ nombre: string; cantidad: number; precio_unit: number }>
}

export interface VentaDia {
  dia: string
  cantidad: number
  monto: number
}

export interface ProductoTop {
  nombre: string
  unidades: number
  monto: number
}

export interface StockBajo {
  nombre: string
  codigo_barras: string | null
  stock_fisico: number
  stock_reservado: number
  stock_disponible: number
  stock_minimo: number
}

export interface ResumenMes {
  mes: { cantidad: number; monto: number }
  hoy: { cantidad: number; monto: number }
}

export interface VentaLista {
  lista: string
  cantidad: number
  monto: number
}

export interface Api {
  dbStatus: () => Promise<DbStatus>
  initDb: (url: string) => Promise<{ ok: boolean; error?: string }>

  listarUsuarios: () => Promise<Usuario[]>
  login: (nombre: string, password: string) => Promise<Usuario>

  listArticulos: (filtro?: string) => Promise<ArticuloConPrecios[]>
  buscarCodigo: (codigo: string) => Promise<ArticuloConPrecios | null>
  crearArticulo: (data: unknown) => Promise<number>
  actualizarArticulo: (id: number, data: unknown) => Promise<void>
  eliminarArticulo: (id: number) => Promise<void>
  ingresoStock: (articuloId: number, cantidad: number) => Promise<void>
  ajusteStock: (articuloId: number, cantidad: number) => Promise<void>

  crearVenta: (input: unknown) => Promise<{ ventaId: number; total: number }>
  listVentas: () => Promise<Venta[]>
  detalleVenta: (id: number) => Promise<DetalleVenta | null>

  crearPresupuesto: (input: unknown) => Promise<number>
  listPresupuestos: () => Promise<Presupuesto[]>
  itemsPresupuesto: (id: number) => Promise<unknown[]>
  detallePresupuesto: (id: number) => Promise<DetallePresupuesto | null>
  aprobarPresupuesto: (id: number) => Promise<void>
  anularPresupuesto: (id: number) => Promise<void>

  estadoCaja: () => Promise<CajaEstado>
  abrirCaja: (saldoInicial: number) => Promise<unknown>
  cerrarCaja: (cajaId: number, saldoFinal: number) => Promise<void>

  listClientes: () => Promise<Cliente[]>
  listClientesConDeuda: () => Promise<Cliente[]>
  crearCliente: (data: unknown) => Promise<number>
  actualizarCliente: (id: number, data: unknown) => Promise<void>
  ventasCliente: (clienteId: number) => Promise<Venta[]>
  pagosCliente: (clienteId: number) => Promise<unknown[]>
  registrarPago: (input: unknown) => Promise<number>

  reporteVentasPorDia: (dias?: number) => Promise<VentaDia[]>
  reporteProductosTop: (limite?: number) => Promise<ProductoTop[]>
  reporteStockBajo: () => Promise<StockBajo[]>
  reporteResumenMes: () => Promise<ResumenMes>
  reporteVentasPorLista: () => Promise<VentaLista[]>

  listProveedores: (filtro?: string) => Promise<Proveedor[]>
  crearProveedor: (data: unknown) => Promise<number>
  actualizarProveedor: (id: number, data: unknown) => Promise<void>
  eliminarProveedor: (id: number) => Promise<void>
  facturasProveedor: (provId: number) => Promise<FacturaProveedor[]>
  cargarFacturaProveedor: (provId: number, total: number, numero?: string) => Promise<void>
  pagarProveedor: (data: unknown) => Promise<number>
  pagosProveedor: (provId: number) => Promise<unknown[]>

  listCheques: (estado?: string) => Promise<ChequeCartera[]>
  registrarCheque: (data: unknown) => Promise<number>
  marcarChequeCobrado: (id: number) => Promise<void>
  chequesEnCartera: () => Promise<ChequeCartera[]>

  hacerBackup: () => Promise<{ ok: boolean; archivo: string | null }>
  listarBackups: () => Promise<unknown[]>

  imprimirHtml: (html: string) => Promise<void>
  verPdf: (html: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
