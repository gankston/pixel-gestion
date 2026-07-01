import type { DetalleVenta, DetallePresupuesto } from '../../../preload'
import { LOGO_ELECTRO_B64 } from './logo-b64'

function fmt(n: number): string {
  return '$ ' + Math.round(n).toLocaleString('es-AR')
}

function fmtFechaCorta(iso: string): string {
  const d = iso.substring(0, 10).split('-')
  return `${d[2]}/${d[1]}/${d[0]}`
}

const ESTILOS = `
  @page { size: A4 portrait; margin: 18mm 20mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1B2733; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .brand-clip { width: 400px; height: 90px; overflow: hidden; position: relative; }
  .brand-logo { position: absolute; width: 400px; height: auto; top: -233px; left: 0; }
  .brand-addr { font-size: 8.5pt; color: #3A6000; margin-top: 2px; font-weight: 600; }
  .doc-meta { text-align: right; }
  .doc-tipo { font-size: 14pt; font-weight: 700; color: #2C5500; text-transform: uppercase; letter-spacing: 1px; }
  .doc-nro { font-size: 10pt; color: #5B6878; margin-top: 4px; }
  .doc-fecha { font-size: 9pt; color: #5B6878; margin-top: 2px; }
  .divider { border: none; border-top: 3px solid #6AB800; margin: 14px 0; }
  .cliente-box { background: #F2F7EC; border-left: 4px solid #6AB800; border-radius: 0 4px 4px 0; padding: 10px 14px; margin-bottom: 18px; font-size: 9pt; color: #5B6878; }
  .cliente-box strong { color: #1B2733; font-size: 10pt; display: block; margin-bottom: 2px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 9.5pt; }
  thead tr { background: #2C5500; color: white; }
  thead th { padding: 8px 10px; text-align: left; font-weight: 600; }
  thead th.r { text-align: right; }
  tbody tr:nth-child(even) { background: #F5F9F0; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #DDE8CC; }
  tbody td.r { text-align: right; font-variant-numeric: tabular-nums; }
  tfoot tr { background: #6AB800; color: white; font-weight: 700; font-size: 11pt; }
  tfoot td { padding: 10px; }
  tfoot td.r { text-align: right; font-variant-numeric: tabular-nums; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-vigente { background: #EBF5D6; color: #3A7000; }
  .badge-aprobado { background: #E6F4ED; color: #1E7E45; }
  .badge-anulado { background: #FDECEA; color: #C0392B; }
  .footer { margin-top: 30px; padding-top: 12px; border-top: 2px solid #6AB800; font-size: 8pt; color: #5B6878; display: flex; justify-content: space-between; }
  .nota { margin-bottom: 6px; font-size: 8.5pt; color: #5B6878; }
`

function buildHtml(
  titulo: string,
  nro: string,
  fecha: string,
  cliente: string | null,
  lista: string,
  items: Array<{ nombre: string; cantidad: number; precio_unit: number }>,
  total: number,
  extraBadge?: string,
  extraBody = ''
): string {
  const filas = items
    .map(
      (it) =>
        `<tr>
          <td>${it.nombre}</td>
          <td class="r">${it.cantidad}</td>
          <td class="r">${fmt(it.precio_unit)}</td>
          <td class="r">${fmt(it.cantidad * it.precio_unit)}</td>
        </tr>`
    )
    .join('')

  const listaNombre = lista === 'mayorista' ? 'Mayorista' : 'Consumidor final'

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${titulo} ${nro}</title><style>${ESTILOS}</style></head><body>
  <div class="header">
    <div>
      <div class="brand-clip">
        <img src="data:image/png;base64,${LOGO_ELECTRO_B64}" class="brand-logo" alt="Electro Soluciones" />
      </div>
      <div class="brand-addr">Av G&#252;emes 290 Pichanal - Salta</div>
    </div>
    <div class="doc-meta">
      <div class="doc-tipo">${titulo}</div>
      <div class="doc-nro">N&#176; ${nro}</div>
      <div class="doc-fecha">${fecha}</div>
      ${extraBadge ? `<div style="margin-top:6px">${extraBadge}</div>` : ''}
    </div>
  </div>
  <hr class="divider">
  <div class="cliente-box">
    <strong>${cliente ?? 'Consumidor Final — Mostrador'}</strong>
    Lista de precios: ${listaNombre}
  </div>
  <table>
    <thead><tr>
      <th>Descripcion</th>
      <th class="r">Cant.</th>
      <th class="r">Precio unit.</th>
      <th class="r">Subtotal</th>
    </tr></thead>
    <tbody>${filas}</tbody>
    <tfoot><tr>
      <td colspan="3">TOTAL</td>
      <td class="r">${fmt(total)}</td>
    </tr></tfoot>
  </table>
  <div class="footer">
    <div>ELECTRO SOLUCIONES — Av Güemes 290 Pichanal - Salta</div>
    <div>Generado: ${new Date().toLocaleDateString('es-AR')}</div>
  </div>
  ${extraBody}
</body></html>`
}

// -- Helpers internos --

function htmlVenta(det: DetalleVenta): string {
  return buildHtml(
    'COMPROBANTE DE VENTA',
    String(det.id).padStart(6, '0'),
    fmtFechaCorta(det.fecha),
    det.cliente_nombre,
    det.lista,
    det.items,
    det.total
  )
}

function htmlPresupuesto(det: DetallePresupuesto): string {
  const estadoBadge = `<span class="badge badge-${det.estado}">${det.estado}</span>`
  const nota = det.vencimiento
    ? `<p class="nota" style="margin-top:10px">Valido hasta: ${fmtFechaCorta(det.vencimiento)}</p>`
    : ''
  return buildHtml(
    'PRESUPUESTO',
    String(det.id).padStart(6, '0'),
    fmtFechaCorta(det.fecha),
    det.cliente_nombre,
    det.lista,
    det.items,
    det.total,
    estadoBadge,
    nota
  )
}

// -- API publica --

export const imprimirVenta = (det: DetalleVenta): Promise<void> =>
  window.api.imprimirHtml(htmlVenta(det))

export const imprimirPresupuesto = (det: DetallePresupuesto): Promise<void> =>
  window.api.imprimirHtml(htmlPresupuesto(det))

export const verPdfVenta = (det: DetalleVenta): Promise<void> =>
  window.api.verPdf(htmlVenta(det))

export const verPdfPresupuesto = (det: DetallePresupuesto): Promise<void> =>
  window.api.verPdf(htmlPresupuesto(det))