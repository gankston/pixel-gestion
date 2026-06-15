import { useEffect, useState } from 'react'
import Page from '../components/Page'
import { Button, TextInput, Badge } from '../components/ui'
import type { ArticuloConPrecios } from '../../../preload'

export default function Stock(): JSX.Element {
  const [articulos, setArticulos] = useState<ArticuloConPrecios[]>([])
  const [filtro, setFiltro] = useState('')

  function recargar(): void {
    window.api.listArticulos(filtro).then(setArticulos)
  }
  useEffect(recargar, [filtro])

  async function ingreso(a: ArticuloConPrecios): Promise<void> {
    const txt = prompt(`Ingreso de mercaderia para "${a.nombre}". Cantidad a sumar (debe ser positivo):`, '1')
    if (txt == null) return
    const cant = Number(txt)
    if (!cant || cant <= 0) { alert('La cantidad debe ser mayor a cero.'); return }
    await window.api.ingresoStock(a.id, cant)
    recargar()
  }
  async function ajuste(a: ArticuloConPrecios): Promise<void> {
    const txt = prompt(`Ajuste de stock para "${a.nombre}" (usa negativo para restar):`, '0')
    if (txt == null) return
    const cant = Number(txt)
    if (!cant) return
    await window.api.ajusteStock(a.id, cant)
    recargar()
  }

  return (
    <Page titulo="Stock">
      <div className="mb-3 max-w-sm">
        <TextInput placeholder="Buscar..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
      </div>
      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-app text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-medium">Articulo</th>
              <th className="px-4 py-2 text-right font-medium">Fisico</th>
              <th className="px-4 py-2 text-right font-medium">Reservado</th>
              <th className="px-4 py-2 text-right font-medium">Disponible</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => {
              const bajo = a.stock_disponible < a.stock_minimo
              return (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-app">
                  <td className="px-4 py-2 text-ink">
                    {a.nombre}
                    <span className="num block text-xs text-muted">{a.codigo_barras}</span>
                  </td>
                  <td className="num px-4 py-2 text-right">{a.stock_fisico}</td>
                  <td className="num px-4 py-2 text-right text-warn">{a.stock_reservado || ''}</td>
                  <td className="num px-4 py-2 text-right font-medium">{a.stock_disponible}</td>
                  <td className="px-4 py-2">
                    {bajo ? <Badge tone="danger">Bajo (min {a.stock_minimo})</Badge> : <Badge tone="ok">OK</Badge>}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => ingreso(a)} className="mr-3 text-ok hover:underline">
                      Ingreso
                    </button>
                    <button onClick={() => ajuste(a)} className="text-primary hover:underline">
                      Ajuste
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Page>
  )
}
