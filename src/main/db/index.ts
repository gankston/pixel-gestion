import { Pool, types } from 'pg'
import type { PoolClient } from 'pg'
import { AsyncLocalStorage } from 'async_hooks'
import bcrypt from 'bcryptjs'
import { SCHEMA_SQL } from './schema'

// pg returns NUMERIC as strings by default; parse them as floats
types.setTypeParser(1700, parseFloat)
// INT8/BIGINT → number
types.setTypeParser(20, parseInt)

let pool: Pool | null = null
const txStorage = new AsyncLocalStorage<PoolClient>()

export let dbConnected = false
export let dbError: string | null = null

export async function initDb(databaseUrl: string): Promise<void> {
  if (pool) {
    try { await pool.end() } catch { /* ignore */ }
  }
  pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  })
  const client = await pool.connect()
  try {
    await client.query(SCHEMA_SQL)
    await seedInicial(client)
    dbConnected = true
    dbError = null
  } finally {
    client.release()
  }
}

function getDb(): Pool | PoolClient {
  return txStorage.getStore() ?? pool!
}

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await getDb().query(sql, params as never)
  return res.rows as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function run(sql: string, params?: unknown[]): Promise<void> {
  await getDb().query(sql, params as never)
}

export async function insert(sql: string, params?: unknown[]): Promise<number> {
  const res = await getDb().query(sql + ' RETURNING id', params as never)
  return res.rows[0].id as number
}

export async function tx<T>(fn: () => Promise<T>): Promise<T> {
  if (txStorage.getStore()) return fn()
  const client = await pool!.connect()
  return txStorage.run(client, async () => {
    try {
      await client.query('BEGIN')
      const result = await fn()
      await client.query('COMMIT')
      return result
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }
  })
}

async function seedInicial(client: PoolClient): Promise<void> {
  const { rows: artRows } = await client.query('SELECT COUNT(*)::int AS n FROM articulos')
  if (artRows[0].n === 0) {
    const demoArts = [
      ['7790001000017', 'Tornillo 6x40 (caja x100)', 'Ferreteria', 1200, 0, 0, null, 48, 0, 10],
      ['7790002000024', 'Cinta aisladora 20m', 'Electricidad', 850, 10, 0, null, 120, 0, 20],
      ['7790003000031', 'Pintura latex 4L blanco', 'Pinturas', 9800, 0, 1, 11900, 7, 0, 8],
      ['7790004000048', 'Guantes de trabajo (par)', 'Seguridad', 640, 0, 0, null, 3, 0, 15],
      ['7790005000055', 'Disco corte 115mm', 'Ferreteria', 480, 0, 0, null, 90, 0, 25],
      ['7790006000062', 'Cable unipolar 2.5mm (rollo)', 'Electricidad', 14500, 5, 0, null, 12, 0, 5]
    ]
    for (const r of demoArts) {
      await client.query(
        `INSERT INTO articulos (codigo_barras, nombre, rubro, neto, descuento_pct, en_oferta, precio_oferta, stock_fisico, stock_reservado, stock_minimo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        r
      )
    }
    const demoClientes = [
      ['Consumidor Final', 'consumidor', null],
      ['Corralon San Jose', 'mayorista', '30712345678'],
      ['Electricidad Norte SRL', 'mayorista', '30765432109']
    ]
    for (const c of demoClientes) {
      await client.query(
        'INSERT INTO clientes (nombre, tipo, documento) VALUES ($1,$2,$3)',
        c
      )
    }
  }

  const { rows: userRows } = await client.query('SELECT COUNT(*)::int AS n FROM usuarios')
  if (userRows[0].n === 0) {
    const hashVentas = await bcrypt.hash('Ventas2026', 10)
    const hashAdmin = await bcrypt.hash('Admin2026', 10)
    await client.query(
      "INSERT INTO usuarios (nombre, password_hash, perfil) VALUES ($1,$2,'vendedor')",
      ['Ventas', hashVentas]
    )
    await client.query(
      "INSERT INTO usuarios (nombre, password_hash, perfil) VALUES ($1,$2,'admin')",
      ['Admin', hashAdmin]
    )
  }
}
