export const SCHEMA_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS articulos (
  id SERIAL PRIMARY KEY,
  codigo_barras TEXT UNIQUE,
  nombre TEXT NOT NULL,
  rubro TEXT,
  neto NUMERIC(14,4) NOT NULL DEFAULT 0,
  descuento_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  markup_mayorista_pct NUMERIC(6,2) NOT NULL DEFAULT 10,
  markup_consumidor_pct NUMERIC(6,2) NOT NULL DEFAULT 60,
  en_oferta INTEGER NOT NULL DEFAULT 0,
  precio_oferta NUMERIC(14,4),
  stock_fisico NUMERIC(14,4) NOT NULL DEFAULT 0,
  stock_reservado NUMERIC(14,4) NOT NULL DEFAULT 0,
  stock_minimo NUMERIC(14,4) NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movimientos (
  id SERIAL PRIMARY KEY,
  articulo_id INTEGER NOT NULL REFERENCES articulos(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('compra','venta','ajuste','reserva','liberacion')),
  cantidad NUMERIC(14,4) NOT NULL,
  referencia_tipo TEXT,
  referencia_id INTEGER,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'consumidor' CHECK (tipo IN ('mayorista','consumidor')),
  documento TEXT,
  telefono TEXT,
  email TEXT,
  saldo_cta_cte NUMERIC(14,4) NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS presupuestos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vencimiento TIMESTAMPTZ,
  estado TEXT NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente','aprobado','vencido','anulado')),
  lista TEXT NOT NULL DEFAULT 'consumidor' CHECK (lista IN ('mayorista','consumidor')),
  total NUMERIC(14,4) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS presupuesto_items (
  id SERIAL PRIMARY KEY,
  presupuesto_id INTEGER NOT NULL REFERENCES presupuestos(id),
  articulo_id INTEGER NOT NULL REFERENCES articulos(id),
  cantidad NUMERIC(14,4) NOT NULL,
  precio_unit NUMERIC(14,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER REFERENCES clientes(id),
  presupuesto_id INTEGER REFERENCES presupuestos(id),
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lista TEXT NOT NULL DEFAULT 'consumidor' CHECK (lista IN ('mayorista','consumidor')),
  total NUMERIC(14,4) NOT NULL DEFAULT 0,
  punto_venta INTEGER,
  tipo_comprobante TEXT,
  cae TEXT,
  cae_vto TEXT
);

CREATE TABLE IF NOT EXISTS venta_items (
  id SERIAL PRIMARY KEY,
  venta_id INTEGER NOT NULL REFERENCES ventas(id),
  articulo_id INTEGER NOT NULL REFERENCES articulos(id),
  cantidad NUMERIC(14,4) NOT NULL,
  precio_unit NUMERIC(14,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS caja_diaria (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada')),
  saldo_inicial NUMERIC(14,4) NOT NULL DEFAULT 0,
  saldo_final NUMERIC(14,4),
  abierta_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cerrada_en TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS caja_movimientos (
  id SERIAL PRIMARY KEY,
  caja_id INTEGER NOT NULL REFERENCES caja_diaria(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  medio_pago TEXT NOT NULL CHECK (medio_pago IN ('efectivo','transferencia','credito','debito','cheque')),
  monto NUMERIC(14,4) NOT NULL,
  referencia_tipo TEXT,
  referencia_id INTEGER,
  descripcion TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id),
  medio_pago TEXT NOT NULL CHECK (medio_pago IN ('efectivo','transferencia','credito','debito','cheque')),
  monto NUMERIC(14,4) NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS imputaciones (
  id SERIAL PRIMARY KEY,
  pago_id INTEGER NOT NULL REFERENCES pagos(id),
  venta_id INTEGER NOT NULL REFERENCES ventas(id),
  monto NUMERIC(14,4) NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  perfil TEXT NOT NULL DEFAULT 'vendedor' CHECK (perfil IN ('vendedor','admin')),
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_articulos_codigo ON articulos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_stockmov_articulo ON stock_movimientos(articulo_id);
CREATE INDEX IF NOT EXISTS idx_ventaitems_venta ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_cajamov_caja ON caja_movimientos(caja_id);

ALTER TABLE articulos ADD COLUMN IF NOT EXISTS iva_alicuota NUMERIC(5,2) NOT NULL DEFAULT 21;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS precio_usd NUMERIC(14,4);

CREATE TABLE IF NOT EXISTS proveedores (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  cuit TEXT,
  telefono TEXT,
  email TEXT,
  saldo_cta_cte NUMERIC(14,4) NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facturas_proveedor (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
  numero TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  total NUMERIC(14,4) NOT NULL,
  saldo NUMERIC(14,4) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','parcial','pagada')),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cheques_cartera (
  id SERIAL PRIMARY KEY,
  numero TEXT,
  banco TEXT,
  monto NUMERIC(14,4) NOT NULL,
  fecha_emision DATE,
  fecha_cobro DATE NOT NULL,
  estado TEXT NOT NULL DEFAULT 'en_cartera' CHECK (estado IN ('en_cartera','cobrado','entregado')),
  origen_tipo TEXT CHECK (origen_tipo IN ('venta','pago_cliente')),
  origen_id INTEGER,
  destino_proveedor_id INTEGER REFERENCES proveedores(id),
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pagos_proveedor (
  id SERIAL PRIMARY KEY,
  proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
  factura_id INTEGER REFERENCES facturas_proveedor(id),
  medio_pago TEXT NOT NULL CHECK (medio_pago IN ('efectivo','transferencia','credito','debito','cheque')),
  cheque_id INTEGER REFERENCES cheques_cartera(id),
  monto NUMERIC(14,4) NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facturas_prov ON facturas_proveedor(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_pagosprov ON pagos_proveedor(proveedor_id);
`
