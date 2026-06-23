import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Setup / DB
  dbStatus: () => ipcRenderer.invoke('app:dbStatus'),
  initDb: (url: string) => ipcRenderer.invoke('app:initDb', url),

  // Auth
  listarUsuarios: () => ipcRenderer.invoke('auth:usuarios'),
  login: (nombre: string, password: string) => ipcRenderer.invoke('auth:login', nombre, password),

  // Articulos
  listArticulos: (filtro?: string) => ipcRenderer.invoke('articulos:list', filtro),
  buscarCodigo: (codigo: string) => ipcRenderer.invoke('articulos:buscarCodigo', codigo),
  crearArticulo: (data: unknown) => ipcRenderer.invoke('articulos:crear', data),
  actualizarArticulo: (id: number, data: unknown) =>
    ipcRenderer.invoke('articulos:actualizar', id, data),
  eliminarArticulo: (id: number) => ipcRenderer.invoke('articulos:eliminar', id),
  ingresoStock: (articuloId: number, cantidad: number) =>
    ipcRenderer.invoke('stock:ingreso', articuloId, cantidad),
  ajusteStock: (articuloId: number, cantidad: number) =>
    ipcRenderer.invoke('stock:ajuste', articuloId, cantidad),

  // Ventas
  crearVenta: (input: unknown) => ipcRenderer.invoke('ventas:crear', input),
  listVentas: () => ipcRenderer.invoke('ventas:list'),
  detalleVenta: (id: number) => ipcRenderer.invoke('ventas:detalle', id),

  // Presupuestos
  crearPresupuesto: (input: unknown) => ipcRenderer.invoke('presupuestos:crear', input),
  listPresupuestos: () => ipcRenderer.invoke('presupuestos:list'),
  itemsPresupuesto: (id: number) => ipcRenderer.invoke('presupuestos:items', id),
  detallePresupuesto: (id: number) => ipcRenderer.invoke('presupuestos:detalle', id),
  aprobarPresupuesto: (id: number) => ipcRenderer.invoke('presupuestos:aprobar', id),
  anularPresupuesto: (id: number) => ipcRenderer.invoke('presupuestos:anular', id),

  // Caja
  estadoCaja: () => ipcRenderer.invoke('caja:estado'),
  abrirCaja: (saldoInicial: number) => ipcRenderer.invoke('caja:abrir', saldoInicial),
  cerrarCaja: (cajaId: number, saldoFinal: number) =>
    ipcRenderer.invoke('caja:cerrar', cajaId, saldoFinal),

  // Clientes
  listClientes: () => ipcRenderer.invoke('clientes:list'),
  listClientesConDeuda: () => ipcRenderer.invoke('clientes:conDeuda'),
  crearCliente: (data: unknown) => ipcRenderer.invoke('clientes:crear', data),
  actualizarCliente: (id: number, data: unknown) =>
    ipcRenderer.invoke('clientes:actualizar', id, data),
  ventasCliente: (clienteId: number) => ipcRenderer.invoke('clientes:ventas', clienteId),
  pagosCliente: (clienteId: number) => ipcRenderer.invoke('clientes:pagos', clienteId),
  registrarPago: (input: unknown) => ipcRenderer.invoke('clientes:pago', input),

  // Reportes
  reporteVentasPorDia: (dias?: number) => ipcRenderer.invoke('reportes:ventasPorDia', dias),
  reporteProductosTop: (limite?: number) => ipcRenderer.invoke('reportes:productosTop', limite),
  reporteStockBajo: () => ipcRenderer.invoke('reportes:stockBajo'),
  reporteResumenMes: () => ipcRenderer.invoke('reportes:resumenMes'),
  reporteVentasPorLista: () => ipcRenderer.invoke('reportes:ventasPorLista'),

  // Proveedores
  listProveedores: (filtro?: string) => ipcRenderer.invoke('proveedores:list', filtro),
  crearProveedor: (data: unknown) => ipcRenderer.invoke('proveedores:crear', data),
  actualizarProveedor: (id: number, data: unknown) =>
    ipcRenderer.invoke('proveedores:actualizar', id, data),
  eliminarProveedor: (id: number) => ipcRenderer.invoke('proveedores:eliminar', id),
  facturasProveedor: (provId: number) => ipcRenderer.invoke('proveedores:facturas', provId),
  cargarFacturaProveedor: (provId: number, total: number, numero?: string) =>
    ipcRenderer.invoke('proveedores:cargarFactura', provId, total, numero),
  pagarProveedor: (data: unknown) => ipcRenderer.invoke('proveedores:pago', data),
  pagosProveedor: (provId: number) => ipcRenderer.invoke('proveedores:pagos', provId),

  // Cheques cartera
  listCheques: (estado?: string) => ipcRenderer.invoke('cheques:list', estado),
  registrarCheque: (data: unknown) => ipcRenderer.invoke('cheques:registrar', data),
  marcarChequeCobrado: (id: number) => ipcRenderer.invoke('cheques:cobrado', id),
  chequesEnCartera: () => ipcRenderer.invoke('cheques:enCartera'),

  // Backup (no-op con Railway)
  hacerBackup: () => ipcRenderer.invoke('backup:hacer'),
  listarBackups: () => ipcRenderer.invoke('backup:listar'),

  // Impresion A4 y PDF
  imprimirHtml: (html: string) => ipcRenderer.invoke('print:html', html),
  verPdf: (html: string) => ipcRenderer.invoke('print:pdf', html)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}

export type Api = typeof api
