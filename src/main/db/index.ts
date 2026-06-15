import { app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import initSqlJs, { type Database } from 'sql.js'
import { SCHEMA_SQL } from './schema'

// SQLite via WebAssembly (sql.js): nada nativo que compilar.
// La base vive en memoria y se persiste a disco tras cada escritura (o transaccion).
let db: Database | null = null
let dbPath = ''
let inTx = false

export async function initDb(): Promise<void> {
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm')
  const SQL = await initSqlJs({ locateFile: () => wasmPath })

  dbPath = join(app.getPath('userData'), 'pixel-gestion.db')
  db = existsSync(dbPath) ? new SQL.Database(readFileSync(dbPath)) : new SQL.Database()

  db.run('PRAGMA foreign_keys = ON;')
  db.run(SCHEMA_SQL)
  seedDemo()
  persist()
}

function persist(): void {
  if (db) writeFileSync(dbPath, Buffer.from(db.export()))
}

/** Ejecuta una sentencia sin persistir (uso interno / dentro de transacciones). */
function exec(sql: string, params: unknown[] = []): void {
  if (!db) throw new Error('DB no inicializada')
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params as never)
  stmt.step()
  stmt.free()
}

/** INSERT/UPDATE/DELETE. Persiste salvo que este dentro de una transaccion. */
export function run(sql: string, params: unknown[] = []): void {
  exec(sql, params)
  if (!inTx) persist()
}

/** SELECT: todas las filas como objetos. */
export function all<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  if (!db) throw new Error('DB no inicializada')
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params as never)
  const rows: T[] = []
  while (stmt.step()) rows.push(stmt.getAsObject() as T)
  stmt.free()
  return rows
}

/** SELECT: primera fila (o undefined). */
export function get<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
  return all<T>(sql, params)[0]
}

/** id de la ultima fila insertada. */
export function lastId(): number {
  return get<{ id: number }>('SELECT last_insert_rowid() AS id')?.id ?? 0
}

/** Ejecuta fn dentro de una transaccion atomica. Persiste una sola vez al final. */
export function tx<T>(fn: () => T): T {
  if (!db) throw new Error('DB no inicializada')
  if (inTx) return fn() // transaccion anidada: reusa la actual
  inTx = true
  try {
    db.run('BEGIN')
    const result = fn()
    db.run('COMMIT')
    inTx = false
    persist()
    return result
  } catch (e) {
    db.run('ROLLBACK')
    inTx = false
    throw e
  }
}

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
    ['7790004000048', 'Guantes de trabajo (par)', 'Seguridad', 640, 0, 0, null, 3, 0, 15],
    ['7790005000055', 'Disco corte 115mm', 'Ferreteria', 480, 0, 0, null, 90, 0, 25],
    ['7790006000062', 'Cable unipolar 2.5mm (rollo)', 'Electricidad', 14500, 5, 0, null, 12, 0, 5]
  ]
  const clientes =
    `INSERT INTO clientes (nombre, tipo, documento, saldo_cta_cte) VALUES (?, ?, ?, ?)`
  const demoClientes: unknown[][] = [
    ['Consumidor Final', 'consumidor', null, 0],
    ['Corralon San Jose', 'mayorista', '30712345678', 0],
    ['Electricidad Norte SRL', 'mayorista', '30765432109', 0]
  ]
  tx(() => {
    for (const r of demo) run(insert, r)
    for (const c of demoClientes) run(clientes, c)
  })
}
