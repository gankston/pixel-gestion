import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import initSqlJs, { type Database } from 'sql.js'
import { SCHEMA_SQL } from './schema'

// SQLite via WebAssembly (sql.js): nada nativo que compilar.
// La base vive en memoria y se persiste a disco tras cada escritura.
let db: Database | null = null
let dbPath = ''

export async function initDb(): Promise<void> {
  // El .wasm viaja en node_modules; lo resolvemos en runtime (main process = CommonJS).
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')
  const SQL = await initSqlJs({ locateFile: () => wasmPath })

  dbPath = join(app.getPath('userData'), 'pixel-gestion.db')
  db = existsSync(dbPath) ? new SQL.Database(readFileSync(dbPath)) : new SQL.Database()

  db.run('PRAGMA foreign_keys = ON;')
  db.run(SCHEMA_SQL)
  seedDemo()
  persist()
}

/** Guarda la base a disco. Llamar despues de cada escritura. */
export function persist(): void {
  if (!db) return
  writeFileSync(dbPath, Buffer.from(db.export()))
}

/** SELECT que devuelve todas las filas como objetos. */
export function all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  if (!db) throw new Error('DB no inicializada')
  const stmt = db.prepare(sql)
  stmt.bind(params as never)
  const rows: T[] = []
  while (stmt.step()) rows.push(stmt.getAsObject() as T)
  stmt.free()
  return rows
}

/** SELECT que devuelve la primera fila (o undefined). */
export function get<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): T | undefined {
  return all<T>(sql, params)[0]
}

/** INSERT/UPDATE/DELETE. Persiste a disco automaticamente. */
export function run(sql: string, params: unknown[] = []): void {
  if (!db) throw new Error('DB no inicializada')
  const stmt = db.prepare(sql)
  stmt.bind(params as never)
  stmt.step()
  stmt.free()
  persist()
}

/** Carga articulos de prueba la primera vez para que el esqueleto muestre datos. */
function seedDemo(): void {
  const row = get<{ n: number }>('SELECT COUNT(*) AS n FROM articulos')
  if (row && row.n > 0) return

  const insert =
    `INSERT INTO articulos (codigo_barras, nombre, rubro, neto, descuento_pct, en_oferta, precio_oferta, stock_fisico, stock_reservado, stock_minimo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  const demo: unknown[][] = [
    ['7790001000017', 'Tornillo 6x40 (caja x100)', 'Ferreteria', 1200, 0, 0, null, 48, 6, 10],
    ['7790002000024', 'Cinta aisladora 20m', 'Electricidad', 850, 10, 0, null, 120, 0, 20],
    ['7790003000031', 'Pintura latex 4L blanco', 'Pinturas', 9800, 0, 1, 11900, 7, 0, 8],
    ['7790004000048', 'Guantes de trabajo (par)', 'Seguridad', 640, 0, 0, null, 3, 0, 15]
  ]
  for (const r of demo) run(insert, r)
}
