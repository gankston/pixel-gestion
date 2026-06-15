# PIXEL GESTION

Sistema de ventas y stock de escritorio (Windows). App Electron + React + TypeScript,
base de datos SQLite local (sql.js / WebAssembly).

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # desarrollo con recarga en caliente
npm run build    # compilar main + preload + renderer
npm run preview  # ejecutar la app ya compilada
npm test         # tests (motor de precios)
npm run dist     # generar instalador .exe (Windows, NSIS)
```

## Estructura

```
src/
  main/        proceso Electron (Node): base de datos, logica de negocio, IPC
    db/        conexion sql.js + esquema
    services/  motor de precios (con tests)
    ipc/       canales expuestos al renderer
  preload/     puente seguro renderer <-> main
  renderer/    interfaz React (6 secciones)
```

## Estado

Esqueleto inicial. Funciona: navegacion, base de datos con esquema completo,
motor de precios (neto - descuento, +10% mayorista / +60% consumidor, redondeo
hacia arriba), y la seccion Articulos leyendo datos reales desde SQLite.

Pendiente: implementar las features de cada seccion (ventas, presupuestos con
reserva de stock, caja diaria, cuenta corriente). Ver `DESIGN.md` para el sistema
visual y el documento de diseno en `~/.gstack/projects/StockCeci/`.

## Base de datos

Se usa **sql.js** (SQLite compilado a WebAssembly) en vez de un modulo nativo como
better-sqlite3, porque la maquina de desarrollo no tiene compilador de C++ y eso
evita problemas tanto al instalar como al empaquetar. La base se guarda en el
directorio de datos del usuario (`%APPDATA%/pixel-gestion/pixel-gestion.db`).
