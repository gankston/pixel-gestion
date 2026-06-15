import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// API segura expuesta al renderer. Todo pasa por IPC; el renderer nunca toca la DB directo.
const api = {
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

  // Presupuestos
  crearPresupuesto: (input: unknown) => ipcRenderer.invoke('presupuestos:crear', input),
  listPresupuestos: () => ipcRenderer.invoke('presupuestos:list'),
  itemsPresupuesto: (id: number) => ipcRenderer.invoke('presupuestos:items', id),
  aprobarPresupuesto: (id: number) => ipcRenderer.invoke('presupuestos:aprobar', id),
  anularPresupuesto: (id: number) => ipcRenderer.invoke('presupuestos:anular', id),

  // Caja
  estadoCaja: () => ipcRenderer.invoke('caja:estado'),
  abrirCaja: (saldoInicial: number) => ipcRenderer.invoke('caja:abrir', saldoInicial),
  cerrarCaja: (cajaId: number, saldoFinal: number) =>
    ipcRenderer.invoke('caja:cerrar', cajaId, saldoFinal),

  // Clientes
  listClientes: () => ipcRenderer.invoke('clientes:list'),
  crearCliente: (data: unknown) => ipcRenderer.invoke('clientes:crear', data),
  actualizarCliente: (id: number, data: unknown) =>
    ipcRenderer.invoke('clientes:actualizar', id, data),
  ventasCliente: (clienteId: number) => ipcRenderer.invoke('clientes:ventas', clienteId),
  registrarPago: (input: unknown) => ipcRenderer.invoke('clientes:pago', input)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (definido en index.d.ts)
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}

export type Api = typeof api
