import { ipcMain, BrowserWindow } from 'electron'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import * as articulos from '../services/articulos'
import * as ventas from '../services/ventas'
import * as presupuestos from '../services/presupuestos'
import * as caja from '../services/caja'
import * as clientes from '../services/clientes'
import * as reportes from '../services/reportes'
import * as backup from '../services/backup'
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
  ipcMain.handle('ventas:detalle', (_e, id: number) => ventas.detalleVenta(id))

  // Presupuestos
  ipcMain.handle('presupuestos:crear', (_e, input: presupuestos.PresupuestoInput) =>
    presupuestos.crearPresupuesto(input)
  )
  ipcMain.handle('presupuestos:list', () => presupuestos.listarPresupuestos())
  ipcMain.handle('presupuestos:items', (_e, id: number) => presupuestos.itemsPresupuesto(id))
  ipcMain.handle('presupuestos:detalle', (_e, id: number) => presupuestos.detallePresupuesto(id))
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

  // Reportes
  ipcMain.handle('reportes:ventasPorDia', (_e, dias?: number) => reportes.ventasPorDia(dias ?? 30))
  ipcMain.handle('reportes:productosTop', (_e, limite?: number) => reportes.productosTopVentas(limite ?? 10))
  ipcMain.handle('reportes:stockBajo', () => reportes.stockBajoMinimo())
  ipcMain.handle('reportes:resumenMes', () => reportes.resumenMes())

  // Backup
  ipcMain.handle('backup:hacer', () => backup.hacerBackup())
  ipcMain.handle('backup:listar', () => backup.listarBackups())

  // Impresion A4: escribe HTML a archivo temporal y lo carga con loadFile()
  // (data: URLs estan bloqueadas por CSP en Electron 20+)
  ipcMain.handle('print:html', (_e, html: string) => {
    return new Promise<void>((resolve, reject) => {
      const tmpFile = join(tmpdir(), `pixel-print-${Date.now()}.html`)
      try {
        writeFileSync(tmpFile, html, 'utf-8')
      } catch (e) {
        return reject(new Error(`No se pudo crear el archivo temporal: ${e}`))
      }

      const cleanup = (): void => { try { unlinkSync(tmpFile) } catch { /* ya borrado */ } }

      const win = new BrowserWindow({
        show: false,
        webPreferences: { javascript: false, sandbox: true }
      })

      const timeout = setTimeout(() => {
        if (!win.isDestroyed()) win.destroy()
        cleanup()
        reject(new Error('Timeout al preparar la impresion'))
      }, 15000)

      win.webContents.once('did-finish-load', () => {
        clearTimeout(timeout)
        win.webContents.print(
          { silent: false, printBackground: true, pageSize: 'A4' },
          (success, errorType) => {
            if (!win.isDestroyed()) win.destroy()
            cleanup()
            if (success || errorType === 'cancelled') resolve()
            else reject(new Error(`Error de impresion: ${errorType}`))
          }
        )
      })

      win.loadFile(tmpFile)
    })
  })
}
