import { useEffect, useState } from 'react'
import Page from '../components/Page'
import { Button, Badge } from '../components/ui'
import { money, fmtFecha } from '../lib/format'
import type { VentaDia, ProductoTop, StockBajo, ResumenMes, BackupInfo } from '../../../preload'

function KpiCard({ titulo, valor, sub }: { titulo: string; valor: string; sub?: string }): JSX.Element {
  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">{titulo}</div>
      <div className="num text-2xl font-bold text-ink">{valor}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
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
      <div className="mb-6 grid grid-cols-4 gap-4">
        <KpiCard
          titulo="Ventas hoy"
          valor={String(resumen?.hoy.cantidad ?? 0)}
          sub="transacciones"
        />
        <KpiCard
          titulo="Monto hoy"
          valor={money(resumen?.hoy.monto ?? 0)}
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

      <div className="mb-6 grid grid-cols-2 gap-6">
        {/* Ventas por dia */}
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
            Ventas por dia — ultimos 30 dias
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-app text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 text-right font-medium">Cant.</th>
                  <th className="px-4 py-2 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {ventasDia.map((v) => (
                  <tr key={v.dia} className="border-b border-line last:border-0 hover:bg-app">
                    <td className="num px-4 py-2 text-xs">{fmtFecha(v.dia)}</td>
                    <td className="num px-4 py-2 text-right">{v.cantidad}</td>
                    <td className="num px-4 py-2 text-right font-medium">{money(v.monto)}</td>
                  </tr>
                ))}
                {ventasDia.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted">Sin ventas en este periodo.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Productos top */}
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">
            Top 10 — productos mas vendidos
          </div>
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-app text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2 font-medium">Articulo</th>
                  <th className="px-4 py-2 text-right font-medium">Uds.</th>
                  <th className="px-4 py-2 text-right font-medium">Monto</th>
                </tr>
              </thead>
              <tbody>
                {productosTop.map((p, i) => (
                  <tr key={p.nombre} className="border-b border-line last:border-0 hover:bg-app">
                    <td className="px-4 py-2">
                      <span className="num mr-2 text-xs text-muted">{i + 1}.</span>
                      {p.nombre}
                    </td>
                    <td className="num px-4 py-2 text-right">{p.unidades}</td>
                    <td className="num px-4 py-2 text-right font-medium">{money(p.monto)}</td>
                  </tr>
                ))}
                {productosTop.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-muted">Sin ventas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock bajo minimo */}
      <div className="mb-6 overflow-hidden rounded-lg border border-line bg-panel">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold text-ink">Stock bajo minimo</span>
          {stockBajo.length > 0 && (
            <Badge tone="danger">{stockBajo.length} articulo{stockBajo.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>
        {stockBajo.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">
            <Badge tone="ok">Todo el stock esta en orden.</Badge>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-app text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-2 font-medium">Articulo</th>
                <th className="px-4 py-2 text-right font-medium">Disponible</th>
                <th className="px-4 py-2 text-right font-medium">Minimo</th>
                <th className="px-4 py-2 text-right font-medium">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {stockBajo.map((s) => (
                <tr key={s.nombre} className="border-b border-line last:border-0 hover:bg-app">
                  <td className="px-4 py-2 text-ink">
                    {s.nombre}
                    {s.codigo_barras && (
                      <span className="num ml-2 text-xs text-muted">{s.codigo_barras}</span>
                    )}
                  </td>
                  <td className="num px-4 py-2 text-right text-danger font-medium">{s.stock_disponible}</td>
                  <td className="num px-4 py-2 text-right">{s.stock_minimo}</td>
                  <td className="num px-4 py-2 text-right text-danger">
                    {s.stock_disponible - s.stock_minimo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Backup */}
      <div className="rounded-lg border border-line bg-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">Backup de base de datos</div>
            <div className="mt-1 text-xs text-muted">
              Se guarda una copia diaria en la carpeta de datos de la aplicacion. Se conservan los ultimos 7 dias.
            </div>
          </div>
          <Button variant="secondary" onClick={backup}>
            Hacer backup ahora
          </Button>
        </div>
        {backupMsg && (
          <div className="mb-3 rounded border border-ok/30 bg-ok/10 px-3 py-2 text-sm text-ok">
            {backupMsg}
          </div>
        )}
        {backups.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-medium">Archivo</th>
                <th className="pb-2 text-right font-medium">Tamano</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b) => (
                <tr key={b.archivo} className="border-t border-line">
                  <td className="num py-2 text-xs text-ink">{b.archivo}</td>
                  <td className="num py-2 text-right text-xs text-muted">{b.tamanoKb} KB</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-muted">Aun no hay backups.</p>
        )}
      </div>
    </Page>
  )
}
