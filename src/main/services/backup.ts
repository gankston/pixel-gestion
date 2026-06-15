import { app } from 'electron'
import { join } from 'path'
import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'fs'

function backupDir(): string {
  return join(app.getPath('userData'), 'backups')
}

function dbPath(): string {
  return join(app.getPath('userData'), 'pixel-gestion.db')
}

/** Crea un backup diario. No hace nada si ya existe uno del dia de hoy. */
export function hacerBackup(): { ok: boolean; archivo: string | null } {
  const origen = dbPath()
  if (!existsSync(origen)) return { ok: false, archivo: null }

  const dir = backupDir()
  mkdirSync(dir, { recursive: true })

  const fecha = new Date().toISOString().substring(0, 10)
  const destino = join(dir, `pixel-gestion-${fecha}.db`)

  if (existsSync(destino)) return { ok: true, archivo: destino }

  copyFileSync(origen, destino)

  // Conservar solo los ultimos 7 backups.
  const todos = readdirSync(dir)
    .filter((f) => f.startsWith('pixel-gestion-') && f.endsWith('.db'))
    .sort()
  for (const viejo of todos.slice(0, Math.max(0, todos.length - 7))) {
    unlinkSync(join(dir, viejo))
  }

  return { ok: true, archivo: destino }
}

export interface BackupInfo {
  archivo: string
  fecha: string
  tamanoKb: number
}

export function listarBackups(): BackupInfo[] {
  const dir = backupDir()
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.startsWith('pixel-gestion-') && f.endsWith('.db'))
    .sort()
    .reverse()
    .map((f) => {
      const ruta = join(dir, f)
      const stat = statSync(ruta)
      return {
        archivo: f,
        fecha: f.replace('pixel-gestion-', '').replace('.db', ''),
        tamanoKb: Math.round(stat.size / 1024)
      }
    })
}
