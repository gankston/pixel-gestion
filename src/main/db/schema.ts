/**
 * Esquema inicial de PIXEL GESTION.
 * Se define como string para que viaje embebido en el bundle (sin copiar .sql).
 * Todo es CREATE TABLE IF NOT EXISTS: ejecutar el esquema es idempotente.
 *
 * Diseñado para enchufar ARCA/AFIP en una etapa 2 (campos cae/cae_vto/punto_venta
 * ya previstos en ventas, nulos por ahora).
 */
export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS articulos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_barras TEXT UNIQUE,
  nombre TEXT NOT NULL,
  rubro TEXT,
  neto REAL NOT NULL DEFAULT 0,
  descuento_pct REAL NOT NULL DEFAULT 0,
  markup_mayorista_pct REAL NOT NULL DEFAULT 10,
  markup_consumidor_pct REAL NOT NULL DEFAULT 60,
  en_oferta INTEGER NOT NULL DEFAULT 0,
  precio_oferta REAL,
  stock_fisico REAL NOT NULL DEFAULT 0,
  stock_reservado REAL NOT NULL DEFAULT 0,
  stock_minimo REAL NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Auditoria de todo movimiento de stock.
CREATE TABLE IF NOT EXISTS stock_movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  articulo_id INTEGER NOT NULL REFERENCES articulos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('compra','venta','ajuste','reserva','liberacion')),
  cantidad REAL NOT NULL,
  referencia_tipo TEXT,        -- 'venta' | 'presupuesto' | 'ajuste'
  referencia_id INTEGER,
  fecha TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'consumidor' CHECK (tipo IN ('mayorista','consumidor')),
  documento TEXT,              -- CUIT/DNI
  telefono TEXT,
  email TEXT,
  saldo_cta_cte REAL NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS presupuestos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id),
  fecha TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  vencimiento TEXT,
  estado TEXT NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente','aprobado','vencido','anulado')),
  lista TEXT NOT NULL DEFAULT 'consumidor' CHECK (lista IN ('mayorista','consumidor')),
  total REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS presupuesto_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  presupuesto_id INTEGER NOT NULL REFERENCES presupuestos(id),
  articulo_id INTEGER NOT NULL REFERENCES articulos(id),
  cantidad REAL NOT NULL,
  precio_unit REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS ventas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER REFERENCES clientes(id),   -- null = consumidor final de mostrador
  presupuesto_id INTEGER REFERENCES presupuestos(id),
  fecha TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  lista TEXT NOT NULL DEFAULT 'consumidor' CHECK (lista IN ('mayorista','consumidor')),
  total REAL NOT NULL DEFAULT 0,
  -- Campos para ARCA/AFIP (etapa 2): nulos por ahora.
  punto_venta INTEGER,
  tipo_comprobante TEXT,
  cae TEXT,
  cae_vto TEXT
);

CREATE TABLE IF NOT EXISTS venta_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venta_id INTEGER NOT NULL REFERENCES ventas(id),
  articulo_id INTEGER NOT NULL REFERENCES articulos(id),
  cantidad REAL NOT NULL,
  precio_unit REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS caja_diaria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada')),
  saldo_inicial REAL NOT NULL DEFAULT 0,
  saldo_final REAL,
  abierta_en TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  cerrada_en TEXT
);

CREATE TABLE IF NOT EXISTS caja_movimientos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caja_id INTEGER NOT NULL REFERENCES caja_diaria(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  medio_pago TEXT NOT NULL CHECK (medio_pago IN ('efectivo','transferencia','credito','debito')),
  monto REAL NOT NULL,
  referencia_tipo TEXT,        -- 'venta' | 'pago'
  referencia_id INTEGER,
  descripcion TEXT,
  fecha TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS pagos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  medio_pago TEXT NOT NULL CHECK (medio_pago IN ('efectivo','transferencia','credito','debito')),
  monto REAL NOT NULL,
  fecha TEXT NOT NULL DEFAULT (datetime('now','localtime'))
);

-- Imputacion: distribuye un pago contra uno o varios comprobantes (ventas) del cliente.
CREATE TABLE IF NOT EXISTS imputaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pago_id INTEGER NOT NULL REFERENCES pagos(id),
  venta_id INTEGER NOT NULL REFERENCES ventas(id),
  monto REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_articulos_codigo ON articulos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_stockmov_articulo ON stock_movimientos(articulo_id);
CREATE INDEX IF NOT EXISTS idx_ventaitems_venta ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_cajamov_caja ON caja_movimientos(caja_id);
`
