import { useEffect, useState } from 'react'
import { ArrowDownToLine, SlidersHorizontal } from 'lucide-react'
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

  function recargar(): void {
    window.api.listArticulos(filtro).then(setArticulos)
  }
  useEffect(recargar, [filtro])

  function abrirIngreso(a: ArticuloConPrecios): void {
    setAccion({ art: a, tipo: 'ingreso' })
    setCantidad('1')
  }
  function abrirAjuste(a: ArticuloConPrecios): void {
    setAccion({ art: a, tipo: 'ajuste' })
    setCantidad('0')
  }

  async function confirmar(): Promise<void> {
    if (!accion) return
    const cant = Number(cantidad)
    if (accion.tipo === 'ingreso' && cant <= 0) return
    if (accion.tipo === 'ajuste' && cant === 0) return
    setGuardando(true)
    try {
      if (accion.tipo === 'ingreso') await window.api.ingresoStock(accion.art.id, cant)
      else await window.api.ajusteStock(accion.art.id, cant)
      setAccion(null)
      recargar()
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
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => abrirIngreso(a)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-ok/40 hover:text-ok"
                        title="Ingreso de mercadería"
                      >
                        <ArrowDownToLine size={13} />
                      </button>
                      <button
                        onClick={() => abrirAjuste(a)}
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

      <Modal
        open={!!accion}
        title={accion?.tipo === 'ingreso' ? 'Ingreso de mercadería' : 'Ajuste de stock'}
        onClose={() => setAccion(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAccion(null)}>Cancelar</Button>
            <Button
              onClick={confirmar}
              disabled={guardando || !cantidad || Number(cantidad) === 0 || (accion?.tipo === 'ingreso' && Number(cantidad) <= 0)}
            >
              {guardando ? 'Guardando...' : 'Confirmar'}
            </Button>
          </>
        }
      >
        {accion && (
          <div className="space-y-3">
            <p className="text-[13px] text-ink">
              <span className="font-semibold">{accion.art.nombre}</span>
              <span className="ml-2 text-muted">— stock actual: {accion.art.stock_disponible}</span>
            </p>
            <Field label={accion.tipo === 'ingreso' ? 'Cantidad a sumar' : 'Cantidad (negativo para restar)'}>
              <TextInput
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                autoFocus
              />
            </Field>
            {accion.tipo === 'ajuste' && Number(cantidad) !== 0 && (
              <p className="text-[12px] text-muted">
                Stock resultante: <span className="font-semibold text-ink">{accion.art.stock_disponible + Number(cantidad)}</span>
              </p>
            )}
          </div>
        )}
      </Modal>
    </Page>
  )
}
