import { useEffect, useState } from 'react'
import { Database, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Page from '../components/Page'
import { Button, Badge } from '../components/ui'
import { money } from '../lib/format'
import type { VentaDia, ProductoTop, StockBajo, ResumenMes, BackupInfo } from '../../../preload'

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
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [backupMsg, setBackupMsg] = useState('')

  function cargar(): void {
    window.api.reporteResumenMes().then(setResumen)
    window.api.reporteVentasPorDia(30).then(setVentasDia)
    window.api.reporteProductosTop(10).then(setProductosTop)
    window.api.reporteStockBajo().then(setStockBajo)
    window.api.listarBackups().then(setBackups)
  }
  useEffect(cargar, [])

  async function backup(): Promise<void> {
    const r = await window.api.hacerBackup()
    if (r.ok) {
      setBackupMsg('Backup realizado correctamente.')
      window.api.listarBackups().then(setBackups)
    } else {
      setBackupMsg('No se pudo realizar el backup.')
    }
    setTimeout(() => setBackupMsg(''), 3000)
  }

  const mesStr = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

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

      {/* Backup */}
      <div className="rounded border border-line bg-panel p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-start gap-2.5">
            <Database size={16} className="mt-0.5 shrink-0 text-muted" />
            <div>
              <div className="text-[13px] font-semibold text-ink">Backup de base de datos</div>
              <div className="mt-0.5 text-[12px] text-muted">
                Copia diaria en carpeta de datos. Se conservan los últimos 7 días.
              </div>
            </div>
          </div>
          <Button variant="secondary" onClick={backup}>Hacer backup ahora</Button>
        </div>
        {backupMsg && (
          <div className="mb-3 flex items-center gap-2 rounded border border-ok/30 bg-ok/8 px-3 py-2 text-[12px] text-ok">
            <CheckCircle2 size={13} />
            {backupMsg}
          </div>
        )}
        {backups.length > 0 ? (
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left">
                <th className="pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Archivo</th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Tamaño</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.archivo} className="border-t border-line">
                  <td className="py-1.5 font-mono text-ink">{b.archivo}</td>
                  <td className="py-1.5 text-right font-mono text-muted">{b.tamanoKb} KB</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-[12px] text-muted">Aún no hay backups.</p>
        )}
      </div>
    </Page>
  )
}
