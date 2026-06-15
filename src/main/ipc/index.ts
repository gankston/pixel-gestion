import { ipcMain } from 'electron'
import * as articulos from '../services/articulos'
import * as ventas from '../services/ventas'
import * as presupuestos from '../services/presupuestos'
import * as caja from '../services/caja'
import * as clientes from '../services/clientes'
import { registrarMovimiento } from '../services/stock'
import { calcularPrecios, type ArticuloPrecio } from '../services/precios'

/** Registra todos los canales IPC que el renderer puede invocar. */
export function registerIpc(): void {
  ipcMain.handle('app:ping', () => 'pong')

  // Articulos
  ipcMain.handle('articulos:list', (_e, filtro?: string) => articulos.listarArticulos(filtro ?? ''))
  ipcMain.handle('articulos:buscarCodigo', (_e, codigo: string) => articulos.buscarPorCodigo(codigo))
  ipcMain.handle('articulos:crear', (_e, data: articulos.ArticuloInput) => articulos.crearArticulo(data))
  ipcMain.handle('articulos:actualizar', (_e, id: number, data: articulos.ArticuloInput) =>
    articulos.actualizarArticulo(id, data)
  )
  ipcMain.handle('articulos:eliminar', (_e, id: number) => articulos.eliminarArticulo(id))
  ipcMain.handle('precios:calcular', (_e, input: ArticuloPrecio) => calcularPrecios(input))

  // Stock
  ipcMain.handle('stock:ingreso', (_e, articuloId: number, cantidad: number) =>
    registrarMovimiento(articuloId, 'compra', cantidad, 'compra')
  )
  ipcMain.handle('stock:ajuste', (_e, articuloId: number, cantidad: number) =>
    registrarMovimiento(articuloId, 'ajuste', cantidad, 'ajuste')
  )

  // Ventas
  ipcMain.handle('ventas:crear', (_e, input: ventas.VentaInput) => ventas.crearVenta(input))
  ipcMain.handle('ventas:list', () => ventas.listarVentas())

  // Presupuestos
  ipcMain.handle('presupuestos:crear', (_e, input: presupuestos.PresupuestoInput) =>
    presupuestos.crearPresupuesto(input)
  )
  ipcMain.handle('presupuestos:list', () => presupuestos.listarPresupuestos())
  ipcMain.handle('presupuestos:items', (_e, id: number) => presupuestos.itemsPresupuesto(id))
  ipcMain.handle('presupuestos:aprobar', (_e, id: number) => presupuestos.aprobarPresupuesto(id))
  ipcMain.handle('presupuestos:anular', (_e, id: number) => presupuestos.anularPresupuesto(id))

  // Caja
  ipcMain.handle('caja:estado', () => caja.estadoCaja())
  ipcMain.handle('caja:abrir', (_e, saldoInicial: number) => caja.abrirCaja(saldoInicial))
  ipcMain.handle('caja:cerrar', (_e, cajaId: number, saldoFinal: number) =>
    caja.cerrarCaja(cajaId, saldoFinal)
  )

  // Clientes
  ipcMain.handle('clientes:list', () => clientes.listarClientes())
  ipcMain.handle('clientes:crear', (_e, data: clientes.ClienteInput) => clientes.crearCliente(data))
  ipcMain.handle('clientes:actualizar', (_e, id: number, data: clientes.ClienteInput) =>
    clientes.actualizarCliente(id, data)
  )
  ipcMain.handle('clientes:ventas', (_e, clienteId: number) => clientes.ventasCliente(clienteId))
  ipcMain.handle('clientes:pago', (_e, input: clientes.PagoInput) => clientes.registrarPago(input))
}
