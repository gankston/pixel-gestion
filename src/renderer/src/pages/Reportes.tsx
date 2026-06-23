import { useEffect, useState } from 'react'
import { Database, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Page from '../components/Page'
import { Badge } from '../components/ui'
import { money } from '../lib/format'
import type { VentaDia, ProductoTop, StockBajo, ResumenMes, VentaLista } from '../../../preload'

function fmtDia(yyyymmdd: string): string {
  const [y, m, d] = yyyymmdd.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

function KpiCard({
  titulo,
  valor,
  sub,
  accent
}: {
  titulo: string
  valor: string
  sub?: string
  accent?: boolean
}): JSX.Element {
  return (
    <div className={
      'rounded border p-5 ' +
      (accent ? 'border-primary/30 bg-primary/8' : 'border-line bg-panel')
    }>
      <div className={
        'mb-2 text-[11px] font-semibold uppercase tracking-wider ' +
        (accent ? 'text-primary' : 'text-muted')
      }>
        {titulo}
      </div>
      <div className={
        'font-mono text-2xl font-bold ' +
        (accent ? 'text-primary' : 'text-ink')
      }>
        {valor}
      </div>
      {sub && <div className="mt-1 text-[11px] text-muted">{sub}</div>}
    </div>
  )
}

export default function Reportes(): JSX.Element {
  const [resumen, setResumen] = useState<ResumenMes | null>(null)
  const [ventasDia, setVentasDia] = useState<VentaDia[]>([])
  const [productosTop, setProductosTop] = useState<ProductoTop[]>([])
  const [stockBajo, setStockBajo] = useState<StockBajo[]>([])
  const [ventasLista, setVentasLista] = useState<VentaLista[]>([])

  function cargar(): void {
    window.api.reporteResumenMes().then(setResumen)
    window.api.reporteVentasPorDia(30).then(setVentasDia)
    window.api.reporteProductosTop(10).then(setProductosTop)
    window.api.reporteStockBajo().then(setStockBajo)
    window.api.reporteVentasPorLista().then(setVentasLista)
  }
  useEffect(cargar, [])

  const mesStr = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  const totalVentas = ventasLista.reduce((s, v) => s + v.monto, 0)

  return (
    <Page titulo="Reportes">
      {/* KPIs */}
      <div className="mb-6 grid grid-cols-4 gap-3">
        <KpiCard
          titulo="Ventas hoy"
          valor={String(resumen?.hoy.cantidad ?? 0)}
          sub="transacciones"
        />
        <KpiCard
          titulo="Monto hoy"
          valor={money(resumen?.hoy.monto ?? 0)}
          accent
        />
        <KpiCard
          titulo={`Ventas ${mesStr}`}
          valor={String(resumen?.mes.cantidad ?? 0)}
          sub="transacciones"
        />
        <KpiCard
          titulo={`Monto ${mesStr}`}
          valor={money(resumen?.mes.monto ?? 0)}
        />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-5">
        {/* Ventas por día */}
        <div className="overflow-hidden rounded border border-line bg-panel">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <TrendingUp size={14} className="text-muted" />
            <span className="text-[13px] font-semibold text-ink">Ventas por día — últimos 30 días</span>
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-app text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Fecha</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Cant.</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Monto</th>
                </tr>
              </thead>
              <tbody>
                {ventasDia.map((v) => (
                  <tr key={v.dia} className="border-b border-line last:border-0 hover:bg-app">
                    <td className="px-4 py-2 font-mono text-[12px]">{fmtDia(v.dia)}</td>
                    <td className="px-4 py-2 text-right font-mono">{v.cantidad}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold">{money(v.monto)}</td>
                  </tr>
                ))}
                {ventasDia.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">Sin ventas en este período.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top productos */}
        <div className="overflow-hidden rounded border border-line bg-panel">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <TrendingUp size={14} className="text-muted" />
            <span className="text-[13px] font-semibold text-ink">Top 10 — más vendidos</span>
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-app text-left">
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Artículo</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Uds.</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Monto</th>
                </tr>
              </thead>
              <tbody>
                {productosTop.map((p, i) => (
                  <tr key={p.nombre} className="border-b border-line last:border-0 hover:bg-app">
                    <td className="px-4 py-2">
                      <span className="font-mono mr-2 text-[11px] text-muted">{i + 1}.</span>
                      {p.nombre}
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{p.unidades}</td>
                    <td className="px-4 py-2 text-right font-mono font-semibold">{money(p.monto)}</td>
                  </tr>
                ))}
                {productosTop.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted">Sin ventas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock bajo mínimo */}
      <div className="mb-5 overflow-hidden rounded border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className={stockBajo.length > 0 ? 'text-warn' : 'text-muted'} />
            <span className="text-[13px] font-semibold text-ink">Stock bajo mínimo</span>
          </div>
          {stockBajo.length > 0 && (
            <Badge tone="danger">{stockBajo.length} artículo{stockBajo.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>
        {stockBajo.length === 0 ? (
          <div className="flex items-center justify-center gap-2 px-4 py-8 text-[13px] text-ok">
            <CheckCircle2 size={16} />
            Todo el stock está en orden.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-app text-left">
                <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Artículo</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Disponible</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Mínimo</th>
                <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {stockBajo.map((s) => (
                <tr key={s.nombre} className="border-b border-line last:border-0 hover:bg-app">
                  <td className="px-4 py-2.5 text-ink">
                    {s.nombre}
                    {s.codigo_barras && (
                      <span className="font-mono ml-2 text-[11px] text-muted">{s.codigo_barras}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-danger">{s.stock_disponible}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{s.stock_minimo}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-danger">{s.stock_disponible - s.stock_minimo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Ventas por lista — mayorista vs consumidor */}
      <div className="mb-5 overflow-hidden rounded border border-line bg-panel">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Database size={14} className="text-muted" />
          <span className="text-[13px] font-semibold text-ink">Mix de ventas — {mesStr}</span>
        </div>
        {ventasLista.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-muted">Sin ventas este mes.</p>
        ) : (
          <div className="grid grid-cols-2 gap-0 divide-x divide-line">
            {ventasLista.map((v) => {
              const pct = totalVentas > 0 ? Math.round((v.monto / totalVentas) * 100) : 0
              return (
                <div key={v.lista} className="px-6 py-5">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted capitalize">
                    {v.lista}
                  </p>
                  <p className="font-mono text-2xl font-bold text-ink">{pct}%</p>
                  <p className="mt-0.5 text-[12px] text-muted">
                    {v.cantidad} ventas · {money(v.monto)}
                  </p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-line">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Page>
  )
}
