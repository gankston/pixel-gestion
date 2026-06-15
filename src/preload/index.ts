import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// API segura expuesta al renderer. Todo pasa por IPC; el renderer nunca toca la DB directo.
const api = {
  ping: (): Promise<string> => ipcRenderer.invoke('app:ping'),
  listArticulos: (): Promise<unknown[]> => ipcRenderer.invoke('articulos:list'),
  calcularPrecios: (input: unknown): Promise<unknown> =>
    ipcRenderer.invoke('precios:calcular', input)
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
