import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface AppConfig {
  databaseUrl: string
}

function configPath(): string {
  return join(app.getPath('userData'), 'config.json')
}

export function getConfig(): AppConfig | null {
  const p = configPath()
  if (!existsSync(p)) return null
  try {
    const raw = readFileSync(p, 'utf-8')
    return JSON.parse(raw) as AppConfig
  } catch {
    return null
  }
}

export function saveConfig(config: AppConfig): void {
  writeFileSync(configPath(), JSON.stringify(config, null, 2), 'utf-8')
}
