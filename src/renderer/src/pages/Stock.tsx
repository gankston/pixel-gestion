import { useEffect, useState } from 'react'
import { ArrowDownToLine, SlidersHorizontal } from 'lucide-react'
import Page from '../components/Page'
import { TextInput, Badge } from '../components/ui'
import type { ArticuloConPrecios } from '../../../preload'

export default function Stock(): JSX.Element {
  const [articulos, setArticulos] = useState<ArticuloConPrecios[]>([])
  const [filtro, setFiltro] = useState('')

  function recargar(): void {
    window.api.listArticulos(filtro).then(setArticulos)
  }
  useEffect(recargar, [filtro])

  async function ingreso(a: ArticuloConPrecios): Promise<void> {
    const txt = prompt(`Ingreso de mercadería para "${a.nombre}". Cantidad a sumar:`, '1')
    if (txt == null) return
    const cant = Number(txt)
    if (!cant || cant <= 0) { alert('La cantidad debe ser mayor a cero.'); return }
    await window.api.ingresoStock(a.id, cant)
    recargar()
  }
  async function ajuste(a: ArticuloConPrecios): Promise<void> {
    const txt = prompt(`Ajuste de stock para "${a.nombre}" (negativo para restar):`, '0')
    if (txt == null) return
    const cant = Number(txt)
    if (!cant) return
    await window.api.ajusteStock(a.id, cant)
    recargar()
  }

  return (
    <Page titulo="Stock">
      <div className="mb-4 max-w-sm">
        <TextInput placeholder="Buscar artículo..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      </div>

      <div className="overflow-hidden rounded border border-line bg-panel">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-app text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Artículo</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Físico</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Reservado</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Disponible</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => {
              const bajo = a.stock_disponible < a.stock_minimo
              return (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-app">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-ink">{a.nombre}</div>
                    {a.codigo_barras && (
                      <div className="font-mono text-[11px] text-muted">{a.codigo_barras}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono">{a.stock_fisico}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-warn">
                    {a.stock_reservado > 0 ? a.stock_reservado : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-ink">{a.stock_disponible}</td>
                  <td className="px-4 py-2.5">
                    {bajo
                      ? <Badge tone="danger">Bajo (mín. {a.stock_minimo})</Badge>
                      : <Badge tone="ok">OK</Badge>}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => ingreso(a)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-ok/40 hover:text-ok"
                        title="Ingreso de mercadería"
                      >
                        <ArrowDownToLine size={13} />
                      </button>
                      <button
                        onClick={() => ajuste(a)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-line hover:text-ink"
                        title="Ajuste manual"
                      >
                        <SlidersHorizontal size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {articulos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Sin artículos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Page>
  )
}
