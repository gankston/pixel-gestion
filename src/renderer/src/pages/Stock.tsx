import { useEffect, useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import Page from '../components/Page'
import { Button, TextInput, Field, Modal, Badge } from '../components/ui'
import type { ArticuloConPrecios } from '../../../preload'

interface Accion {
  art: ArticuloConPrecios
  tipo: 'ingreso' | 'ajuste'
}

export default function Stock(): JSX.Element {
  const [articulos, setArticulos] = useState<ArticuloConPrecios[]>([])
  const [filtro, setFiltro] = useState('')
  const [accion, setAccion] = useState<Accion | null>(null)
  const [cantidad, setCantidad] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorStock, setErrorStock] = useState<string | null>(null)

  function recargar(): void {
    window.api.listArticulos(filtro).then(setArticulos)
  }
  useEffect(recargar, [filtro])

  function abrirStock(a: ArticuloConPrecios): void {
    setAccion({ art: a, tipo: 'ajuste' })
    setCantidad('')
    setErrorStock(null)
  }

  async function confirmar(): Promise<void> {
    if (!accion) return
    const cant = Math.round(Number(cantidad))
    if (!cant) return
    setErrorStock(null)
    setGuardando(true)
    try {
      await window.api.ajusteStock(accion.art.id, cant)
      setAccion(null)
      recargar()
    } catch (e) {
      setErrorStock((e instanceof Error ? e.message : 'No se pudo actualizar el stock').replace(/^Error invoking remote method '[^']+': Error: /, ''))
    } finally {
      setGuardando(false)
    }
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
                    <button
                      onClick={() => abrirStock(a)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-line hover:text-ink"
                      title="Agregar o quitar stock"
                    >
                      <SlidersHorizontal size={13} />
                    </button>
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

      <Modal
        open={!!accion}
        title="Actualizar stock"
        onClose={() => setAccion(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button
              onClick={confirmar}
              disabled={guardando || !cantidad || Math.round(Number(cantidad)) === 0 || (!!accion && accion.art.stock_fisico + Math.round(Number(cantidad)) < 0)}
            >
              {guardando ? 'Guardando...' : 'Confirmar'}
            </Button>
          </>
        }
      >
        {errorStock && (
          <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-3 py-2 text-[12px] text-danger">
            <span>{errorStock}</span>
            <button onClick={() => setErrorStock(null)} className="ml-3 text-danger/60 hover:text-danger">✕</button>
          </div>
        )}
        {accion && (
          <div className="space-y-3">
            <p className="text-[13px] text-ink">
              <span className="font-semibold">{accion.art.nombre}</span>
              <span className="ml-2 text-muted">— stock físico: {accion.art.stock_fisico}</span>
            </p>
            <Field label="Cantidad (negativo para quitar, positivo para agregar)">
              <TextInput
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                autoFocus
                placeholder="ej: 10 o -3"
              />
            </Field>
            {cantidad !== '' && Number(cantidad) !== 0 && (
              <p className="text-[12px] text-muted">
                Stock resultante:{' '}
                <span className={`font-semibold ${accion.art.stock_fisico + Number(cantidad) < 0 ? 'text-danger' : 'text-ink'}`}>
                  {accion.art.stock_fisico + Number(cantidad)}
                </span>
                {accion.art.stock_fisico + Number(cantidad) < 0 && (
                  <span className="ml-2 text-[11px] text-danger">— no puede quedar negativo</span>
                )}
              </p>
            )}
          </div>
        )}
      </Modal>
    </Page>
  )
}
