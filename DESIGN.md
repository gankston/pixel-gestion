# PIXEL GESTIÓN — Sistema Visual

> Documento de diseño de producto. Define el lenguaje visual completo de la aplicación de escritorio **PIXEL GESTIÓN** (Electron + React, Windows, mostrador de comercio).
> Un desarrollador debe poder implementar la UI leyendo únicamente este archivo.

---

## 1. Tesis estética

**PIXEL GESTIÓN es software de gestión serio: una herramienta de trabajo densa, rápida y silenciosa, no una app de marketing.** El carácter visual es el de una "máquina de operar" — superficies neutras y planas, un único azul de acción sólido, datos numéricos perfectamente alineados en fuente tabular, y cero adorno que no comunique estado. Limpio, profesional y sobrio, pensado para que un operador lo use 8 horas con teclado y lector de código de barras sin fatiga visual.

**Lo que NO es** (prohibido): gradientes violeta/morado, neón, glassmorphism, "purple-to-pink", emojis decorativos, sombras difusas grandes, bordes redondeados exagerados, ilustraciones de startup. Si parece una landing generada por IA, está mal.

---

## 2. Referencias investigadas

**Loyverse POS** — Su pantalla de venta es el patrón a copiar en velocidad: layout claro, ítems agregados al ticket de forma inmediata, doble vista lista/grilla y foco permanente en una sola columna de cobro. Tomamos: la **columna de ticket fija a la derecha** siempre visible y el flujo "escaneo → línea aparece → total se actualiza" sin recargas.

**Square POS** — Referencia de simplicidad y baja curva de aprendizaje: jerarquía mínima, acciones primarias muy evidentes y formularios cortos. Tomamos: la **economía de elementos** (pocas acciones grandes en venta) y el tono visual plano y neutro, evitando saturar la pantalla con funciones.

**Lightspeed Retail** — Referencia de gestión profunda de inventario: órdenes de compra automáticas para ítems bajo punto de reposición, reportes ricos y tablas potentes. Su contra es una interfaz "ocupada"; tomamos su **potencia de tablas y filtros** pero la disciplinamos para que no se vea recargada.

**Tango Gestión (Axoft, Argentina)** — Referencia local y de operadores expertos: favoritos de procesos, listado de procesos usados recientemente, buscador de procesos en el menú y ayuda contextual por pantalla. Tomamos: la **paleta de comandos / buscador global**, los **accesos favoritos** y la cultura de operación por teclado que esperan los usuarios argentinos.

**Zoho Inventory** — Referencia de dashboard: resumen claro de ventas, niveles de stock e ítems que requieren atención, con etiquetado de datos muy legible dentro de la propia UI. Tomamos: el **dashboard de "qué necesita atención hoy"** (stock bajo, cuentas por cobrar) y el etiquetado explícito de cada dato.

**Odoo Inventory** — Referencia de tablas y vistas de datos: list views robustas, agrupaciones, charts sobrios y fuerte sentido de "pipeline". Tomamos: la idea de **vistas conmutables (lista densa / agrupada)** y filtros guardados sobre la misma tabla.

**Bind ERP / Colppy** — Referencia de POS en LATAM con foco PyME: búsqueda rápida de productos con lector de código de barras y preview del ticket antes de imprimir, interfaz "sencilla con pocos detalles". Tomamos: el **preview del comprobante antes de confirmar** y la simplicidad estructural orientada a comercios chicos.

**Síntesis perfeccionada:** velocidad y columna de cobro de Loyverse + simplicidad de Square + potencia de tablas de Lightspeed/Odoo + operación por teclado/favoritos de Tango + dashboard de atención de Zoho + preview de comprobante de Bind, todo unificado bajo una sola estética plana y sobria.

---

## 3. Paleta de colores

Paleta sólida, plana, de alto contraste. Un solo color primario de acción (azul). Los colores de estado se usan **solo para comunicar estado**, nunca decorativos.

### 3.1 Modo claro (por defecto)

| Rol | HEX | Uso |
|-----|-----|-----|
| Fondo app (chrome) | `#F4F5F7` | Fondo general de la ventana, detrás de paneles |
| Fondo panel / card | `#FFFFFF` | Cards, tablas, formularios, columna de ticket |
| Fondo sutil / zebra | `#F7F8FA` | Filas alternas de tabla, secciones secundarias |
| Borde | `#E2E5E9` | Bordes de cards, divisores, líneas de tabla |
| Borde fuerte / input | `#CBD1D9` | Borde de inputs en reposo |
| Texto principal | `#1B2733` | Títulos, valores, texto de tabla |
| Texto secundario | `#5B6878` | Labels, descripciones, headers de tabla, metadatos |
| Texto deshabilitado | `#9AA5B1` | Placeholders, estados inactivos |
| **Primario / acción** | `#1F5FCC` | Botón primario, foco, links, selección, total activo |
| Primario hover | `#1A52B0` | Hover del botón primario |
| Primario tenue (fondo) | `#E8F0FC` | Fondo de fila seleccionada, badge info, chips activos |
| Sidebar fondo | `#16202E` | Fondo del menú lateral (azul-gris muy oscuro, NO negro puro) |
| Sidebar texto | `#AEB9C7` | Texto de ítems del menú |
| Sidebar ítem activo | `#1F5FCC` | Marca de ítem activo (barra + texto blanco) |

### 3.2 Colores de estado (compartidos)

| Estado | Texto/Icono | Fondo (badge) | Uso |
|--------|-------------|---------------|-----|
| Éxito | `#1E7E45` | `#E4F4EA` | Venta confirmada, stock OK, pago acreditado |
| Advertencia | `#B25E00` | `#FCF0DD` | Stock bajo, presupuesto por vencer, caja sin cerrar |
| Error / peligro | `#C0392B` | `#FBE7E4` | Sin stock, eliminar, error de cobro, saldo deudor vencido |
| Info | `#1F5FCC` | `#E8F0FC` | Stock reservado, nota informativa, "nuevo" |
| Neutro | `#5B6878` | `#EDEFF2` | Estado por defecto, "borrador", "anulado" |

### 3.3 Modo oscuro (opcional, recomendado para turnos largos)

| Rol | HEX |
|-----|-----|
| Fondo app | `#0E141B` |
| Fondo panel / card | `#172029` |
| Fondo sutil / zebra | `#1C2733` |
| Borde | `#2A3742` |
| Texto principal | `#E6EBF0` |
| Texto secundario | `#9DAAB8` |
| Primario / acción | `#3B82F6` |
| Primario tenue (fondo) | `#16335C` |
| Éxito | texto `#4ADE80` / fondo `#13351F` |
| Advertencia | texto `#F0A93B` / fondo `#3A2A10` |
| Error | texto `#F87171` / fondo `#3A1714` |

> Regla de contraste: todo texto sobre su fondo debe cumplir WCAG AA (≥4.5:1 para cuerpo, ≥3:1 para texto grande/números). Los HEX anteriores ya están elegidos para cumplirlo.

---

## 4. Tipografía

### 4.1 Fuentes

- **Interfaz (sans):** **Inter**. Excelente legibilidad a tamaños chicos, soporta español (acentos, ñ, símbolo $), neutra y profesional. Fallback: `"Segoe UI", system-ui, sans-serif`.
- **Números, precios, códigos y tablas:** **IBM Plex Mono** o **Inter con `font-feature-settings: "tnum" 1`** (cifras tabulares). Los precios, cantidades, totales, códigos de barras y SKU SIEMPRE usan cifras tabulares para que las columnas alineen verticalmente. Recomendado: usar Inter con `tnum` en tablas y **JetBrains Mono / IBM Plex Mono** solo para códigos (SKU, barras, comprobante).

### 4.2 Escala tipográfica

| Token | Tamaño / línea | Peso | Uso |
|-------|----------------|------|-----|
| Display / Total | 32px / 40px | 600 | Total a cobrar en pantalla de venta y caja |
| H1 título de pantalla | 22px / 28px | 600 | "Ventas", "Stock", etc. en el header |
| H2 sección | 16px / 24px | 600 | Títulos de card / panel |
| Cuerpo | 14px / 20px | 400 | Texto general, formularios |
| Cuerpo fuerte | 14px / 20px | 600 | Énfasis, labels de total de línea |
| Tabla (celda) | 13px / 18px | 400 | Filas de datos (cifras tabulares) |
| Tabla (header) | 12px / 16px | 600, `letter-spacing: 0.02em`, mayúsculas | Encabezados de columna, color texto secundario |
| Caption / metadato | 12px / 16px | 400 | Fechas, ayuda, badges |
| Número grande de dato | 20px / 28px | 600, tabular | KPIs del dashboard |

> Antialiasing activado. No usar pesos por debajo de 400. Itálicas solo para estados "anulado"/"borrador" si se desea.

---

## 5. Espaciado y radios

### 5.1 Escala de espaciado (base 4px)

`4 · 8 · 12 · 16 · 24 · 32 · 48`

| Token | px | Uso típico |
|-------|----|------------|
| `space-1` | 4 | Gap entre icono y texto, padding interno mínimo |
| `space-2` | 8 | Padding de celdas compactas, gap entre badges |
| `space-3` | 12 | Padding vertical de filas de tabla, gap de form |
| `space-4` | 16 | Padding estándar de cards y panels |
| `space-5` | 24 | Separación entre cards / secciones |
| `space-6` | 32 | Márgenes de pantalla, separación de bloques grandes |
| `space-7` | 48 | Espacios vacíos / empty states |

### 5.2 Radios (sobrios, nada redondeado en exceso)

| Token | px | Uso |
|-------|----|-----|
| `radius-sm` | 4 | Inputs, botones, badges, celdas activas |
| `radius-md` | 6 | Cards, panels, modales |
| `radius-pill` | 999 | Solo para chips/badges de estado tipo "pill" |

### 5.3 Sombras (mínimas)

- `shadow-card`: `0 1px 2px rgba(16,24,40,0.06)` — cards y tablas.
- `shadow-overlay`: `0 8px 24px rgba(16,24,40,0.18)` — solo modales y dropdowns.
- Nada de sombras de color, glow ni blur de fondo.

### 5.4 Densidad

- Alto de fila de tabla: **36px** (modo cómodo) / **30px** (modo compacto, conmutable). Default compacto en Stock y Caja por volumen de datos.
- Alto de input y botón: **36px** estándar; **44px** en la pantalla de venta (touch-friendly + visibilidad).

---

## 6. Patrones de componentes

### 6.1 Botones (alto 36px, radius 4px, peso 600, sin gradiente)

| Variante | Fondo | Texto | Borde | Hover |
|----------|-------|-------|-------|-------|
| **Primario** | `#1F5FCC` | `#FFFFFF` | — | fondo `#1A52B0` |
| **Secundario** | `#FFFFFF` | `#1B2733` | `1px #CBD1D9` | fondo `#F4F5F7` |
| **Peligro** | `#FFFFFF` | `#C0392B` | `1px #E7B6B0` | fondo `#FBE7E4` |
| **Peligro sólido** (confirmar borrado) | `#C0392B` | `#FFFFFF` | — | `#A93226` |
| **Texto / terciario** | transparente | `#1F5FCC` | — | fondo `#E8F0FC` |

- Foco visible: `box-shadow: 0 0 0 3px rgba(31,95,204,0.30)` (anillo azul) en TODOS los elementos interactivos — crítico para operación por teclado.
- Iconos: línea (Lucide / Feather), 16–18px, mismo color que el texto. Nunca emoji.
- El botón primario de cada pantalla muestra su atajo: `Cobrar (F12)`.

### 6.2 Inputs y formularios

- Input: fondo `#FFFFFF`, borde `1px #CBD1D9`, radius 4px, padding `8px 12px`, texto 14px.
- Foco: borde `#1F5FCC` + anillo azul (igual que botones).
- Error: borde `#C0392B` + mensaje 12px en `#C0392B` debajo.
- Label arriba del campo, 12px peso 600 color secundario. Campos requeridos con `*` en `#C0392B`.
- Formularios en **2 columnas máximo** en modales; campos relacionados agrupados con `space-4`.
- Campos numéricos (precio, cantidad, costo): alineados a la derecha, cifras tabulares, prefijo `$` fijo.

### 6.3 Tablas de datos (el componente más importante)

- Header: fondo `#FFFFFF`, texto secundario 12px mayúsculas peso 600, **sticky** al hacer scroll, borde inferior `1px #E2E5E9`.
- Filas: alto 30/36px, borde inferior `1px #E2E5E9`. **Zebra** opcional con `#F7F8FA` en filas pares (recomendado en tablas largas).
- Hover de fila: fondo `#F4F5F7`.
- Fila seleccionada: fondo `#E8F0FC` + barra izquierda `3px #1F5FCC`.
- Columnas numéricas: alineadas a la derecha, tabular. Columnas de texto: izquierda. Estados: centradas.
- Densidad conmutable (cómodo/compacto) y selector de columnas visibles.
- Header de tabla con barra de herramientas arriba: buscador, filtros (chips), botón de exportar, toggle de densidad.
- Paginación o scroll virtual para listas largas; mostrar "1–50 de 1.240" abajo a la derecha.
- Navegación por teclado: flechas para moverse entre filas, `Enter` para abrir/editar.

### 6.4 Menú / navegación lateral (sidebar)

- Ancho **240px** expandido / **64px** colapsado (solo iconos). Fondo `#16202E`.
- Logo "PIXEL GESTIÓN" arriba (texto, sin imagen pesada), 48px de alto.
- 6 ítems con icono lineal + label: **Ventas, Stock / Artículos, Presupuestos, Caja diaria, Clientes, Precios**.
- Ítem activo: texto blanco + barra vertical izquierda `3px #1F5FCC` + fondo `rgba(255,255,255,0.06)`.
- Ítem hover: fondo `rgba(255,255,255,0.04)`.
- Abajo del sidebar: usuario logueado, estado de caja (abierta/cerrada) y acceso a configuración.
- **Buscador / paleta de comandos global** (`Ctrl+K`): busca productos, clientes, comprobantes y procesos (patrón Tango). Disponible desde cualquier pantalla.

### 6.5 Badges / estados (radius-pill, 12px, peso 600)

| Estado | Estilo |
|--------|--------|
| Stock OK / Disponible | texto `#1E7E45` sobre `#E4F4EA` |
| Stock bajo | texto `#B25E00` sobre `#FCF0DD` |
| Sin stock | texto `#C0392B` sobre `#FBE7E4` |
| Stock reservado | texto `#1F5FCC` sobre `#E8F0FC` |
| Venta confirmada / Pagado | texto `#1E7E45` sobre `#E4F4EA` |
| Presupuesto vigente | texto `#1F5FCC` sobre `#E8F0FC` |
| Presupuesto vencido | texto `#B25E00` sobre `#FCF0DD` |
| Anulado / Borrador | texto `#5B6878` sobre `#EDEFF2` |
| Saldo deudor vencido | texto `#C0392B` sobre `#FBE7E4` |

- Punto de color de 6px opcional a la izquierda del texto. Sin iconos dentro del badge salvo necesidad.

### 6.6 Modales

- Ancho 480px (formulario corto) / 720px (formulario rico). Centrado, `radius-md`, `shadow-overlay`.
- Overlay de fondo: `rgba(16,24,40,0.45)` (sin blur).
- Estructura: header con título H2 + botón cerrar (X); cuerpo con scroll si excede; footer con acciones alineadas a la derecha (secundario + primario).
- `Esc` cierra, `Enter` confirma la acción primaria. Foco inicial en el primer campo.
- Confirmaciones destructivas: texto claro de consecuencia + botón "Peligro sólido".

### 6.7 Notificaciones (toasts)

- Esquina inferior derecha, `radius-sm`, borde izquierdo de color de estado de 3px, auto-cierre 4s. Ej.: "Venta #00231 registrada — $ 14.350" en verde.

---

## 7. Layout general

```
┌────────────┬─────────────────────────────────────────────┐
│            │  HEADER: Título pantalla · buscador · usuario │
│  SIDEBAR   ├─────────────────────────────────────────────┤
│  240px     │                                             │
│            │   ÁREA DE CONTENIDO                          │
│  6 ítems   │   (tabla principal + panel lateral)          │
│            │                                             │
│  caja:     │                                             │
│  ABIERTA   │                                             │
└────────────┴─────────────────────────────────────────────┘
```

- Header de contenido: 56px de alto, fondo blanco, borde inferior. Contiene título H1, buscador contextual al centro/izquierda, y a la derecha acciones globales (notificaciones, fecha, usuario). Padding `space-6` lateral.
- Toda pantalla con tabla incluye su **toolbar** (buscar + filtros + acción primaria) sobre la tabla.

---

## 8. Layout pantalla por pantalla

### 8.1 VENTAS (pantalla crítica — ultra rápida con lector de código de barras)

**Objetivo: cero fricción. El cursor vive en el campo de escaneo. El operador no toca el mouse en la venta típica.**

Layout de **dos columnas**:

```
┌─────────────────────────────────────────┬──────────────────────────┐
│ [ Escaneá o buscá producto…  ⌕ ]  (F2)   │   TICKET ACTUAL          │
│ ─────────────────────────────────────────│   Cliente: Consumidor    │
│  CÓD     DESCRIPCIÓN      CANT  P.UNIT  $ │   final ▾  (F4)          │
│  7791…   Coca 1.5L         2    1.200  2.400 │ ───────────────────── │
│  7790…   Pan lactal        1      980    980 │  Subtotal     12.380  │
│  …                                          │  Desc. (F6)    -300   │
│  (líneas se agregan al escanear, foco      │  ───────────────────── │
│   vuelve al campo de escaneo)              │  TOTAL                  │
│                                            │   $ 12.080              │  ← Display 32px
│                                            │ ───────────────────── │
│                                            │  Medio de pago (F7)     │
│                                            │  ● Efectivo  ○ Débito   │
│                                            │  ○ Crédito  ○ Transfer. │
│                                            │ ───────────────────── │
│                                            │  [  COBRAR  (F12)  ]    │  ← primario grande
└─────────────────────────────────────────┴──────────────────────────┘
```

- **Columna izquierda (≈62%):** campo de escaneo/búsqueda SIEMPRE con foco (input alto 44px, autofocus, vuelve el foco tras cada agregado). Debajo, la tabla del ticket: Código (mono), Descripción, Cantidad (editable inline con `+/−`), Precio unitario, Subtotal de línea (tabular). Última línea agregada se resalta 1s en `#E8F0FC`.
- **Columna derecha fija (≈38%):** cliente (default "Consumidor final"), subtotal, descuento, **TOTAL en Display 32px peso 600**, selector de medio de pago, y botón **COBRAR** primario grande (alto 44–56px).
- Si el código no existe: toast de error rojo + sonido, sin perder foco.
- Atajos: `F2` foco a escaneo · `F4` cambiar cliente · `F6` descuento · `F7` medio de pago · `F12` cobrar · `Supr` quitar línea seleccionada · `Esc` cancelar venta.
- Al cobrar: modal de cobro con **preview del comprobante** (patrón Bind) → calcula vuelto si es efectivo → imprime/registra. Toast verde con número de venta.
- Sin sidebar de adorno: máxima superficie a ticket y total.

### 8.2 STOCK / ARTÍCULOS

```
HEADER: "Stock / Artículos"          [ + Nuevo artículo (Ins) ]
TOOLBAR: [⌕ buscar] [Categoría ▾] [Estado ▾] [Solo stock bajo ◻] [densidad] [exportar]
TABLA densa:
  SKU | Descripción | Categoría | Stock | Reservado | P. Costo | P. Venta | Margen | Estado
PANEL LATERAL (al seleccionar fila, deslizable derecha 360px):
  detalle del artículo, historial de movimientos, ajustar stock, editar precios.
FOOTER: "1–50 de 1.240"     KPIs: artículos · valor de inventario · N° con stock bajo
```

- Columna **Stock** con badge de estado (OK / bajo / sin stock / reservado). Columnas numéricas tabulares a la derecha.
- Acción rápida por fila (hover): editar, ajustar stock, ver movimientos.
- Filtro destacado "Solo stock bajo" + acción "Generar orden de reposición" (patrón Lightspeed).

### 8.3 PRESUPUESTOS

```
HEADER: "Presupuestos"               [ + Nuevo presupuesto ]
TOOLBAR: [⌕] [Estado: Vigente/Vencido/Convertido ▾] [rango de fechas]
TABLA: N° | Fecha | Cliente | Items | Total | Válido hasta | Estado
PANEL LATERAL / detalle: ítems del presupuesto, vencimiento,
  acciones: [Convertir en venta] (primario) · [Imprimir] · [Duplicar] · [Anular]
```

- El editor de presupuesto reutiliza la grilla de líneas de Ventas (mismo componente), pero sin cobro — agrega "Válido hasta" y notas.
- Badge de estado: Vigente (info) / Por vencer (advertencia) / Vencido (advertencia) / Convertido (éxito) / Anulado (neutro).

### 8.4 CAJA DIARIA (desglose por medio de pago)

```
HEADER: "Caja diaria — Martes 15/06/2026"   Estado: ABIERTA  [ Cerrar caja (F12) ]
┌────────────── RESUMEN (cards superiores, KPIs) ───────────────────────┐
│  EFECTIVO     TRANSFERENCIA    DÉBITO        CRÉDITO        TOTAL DÍA   │
│  $ 84.300     $ 41.200         $ 22.900      $ 18.500       $ 166.900  │  ← números 20px tabular
│  (apertura $5.000 · ventas · ingresos · egresos por medio)             │
└────────────────────────────────────────────────────────────────────────┘
TOOLBAR: [⌕] [Tipo: Venta/Ingreso/Egreso ▾] [Medio de pago ▾]   [+ Movimiento]
TABLA de movimientos del día:
  Hora | Tipo | Detalle | Comprobante | Medio | Ingreso | Egreso | Saldo
PANEL LATERAL al cerrar: arqueo —
  "Efectivo esperado vs. contado", diferencia resaltada (verde si 0, rojo si hay faltante).
```

- **Cinco cards de KPI arriba**, una por medio de pago + total, cada una con su número grande tabular y su detalle (apertura, ventas, ingresos manuales, egresos).
- Tabla cronológica con columnas Ingreso/Egreso separadas y Saldo acumulado.
- Cierre de caja: modal de **arqueo** que pide el efectivo contado y muestra la diferencia con código de color (éxito/error).
- Acción "+ Movimiento" para ingresos/egresos manuales (retiro, pago a proveedor) con su medio de pago.

### 8.5 CLIENTES (con cuenta corriente)

```
HEADER: "Clientes"                   [ + Nuevo cliente ]
TOOLBAR: [⌕] [Con saldo deudor ◻] [Con saldo vencido ◻]
TABLA: Cliente | Documento/CUIT | Teléfono | Límite cta. cte. | Saldo | Estado
PANEL LATERAL / ficha (al seleccionar):
  ┌ Datos del cliente · contacto ┐
  ┌ CUENTA CORRIENTE: saldo actual (grande), límite, disponible ┐
  ┌ Movimientos: Fecha | Comprobante | Debe | Haber | Saldo ┐
  Acciones: [Registrar pago] (primario) · [Nueva venta a cuenta] · [Estado de cuenta PDF]
```

- Columna **Saldo** tabular: positivo deudor en `#C0392B`, al día en texto principal, a favor en `#1E7E45`.
- Badge "Saldo vencido" (error) cuando hay deuda fuera de plazo.
- "Registrar pago" abre modal con medio de pago (impacta en Caja diaria).

### 8.6 ARTÍCULOS / PRECIOS

```
HEADER: "Precios"                    [ Actualización masiva ]  [ Lista de precios ▾ ]
TOOLBAR: [⌕] [Categoría ▾] [editar en línea ◻]
TABLA editable: SKU | Descripción | P. Costo | % Margen | P. Venta | IVA | Vigencia
ACCIÓN MASIVA (modal): aumentar X% por categoría / proveedor / toda la lista,
  con preview de los precios resultantes antes de aplicar.
```

- Edición **inline** en las celdas de costo/margen/precio: al cambiar costo o margen, el precio de venta se recalcula en vivo (tabular, en azul mientras está sin guardar).
- Soporte de **múltiples listas de precios** (mostrador, mayorista) conmutables arriba.
- "Actualización masiva" con preview obligatorio antes de confirmar (patrón Bind: ver antes de aplicar).

---

## 9. Reglas transversales (resumen para implementar)

1. **Un solo azul de acción** (`#1F5FCC`). Estados solo en verde/ámbar/rojo/azul-info, nunca decorativos.
2. **Cifras tabulares siempre** en montos, cantidades, stock, saldos: columnas que alinean al pixel.
3. **Todo operable por teclado**, con foco visible (anillo azul) y atajos `Fn` visibles en los botones.
4. **Lector de código de barras = teclado HID:** el campo de escaneo de Ventas mantiene foco y procesa el `Enter` final del lector como "agregar línea".
5. **Densidad por defecto compacta** en Stock, Caja, Clientes; cómoda en Ventas.
6. **Cero adorno:** sin gradientes, sin glow, sin emojis, sombras mínimas, radios ≤6px (pills solo en badges).
7. **Modo oscuro** disponible con la paleta de §3.3 para turnos largos.
