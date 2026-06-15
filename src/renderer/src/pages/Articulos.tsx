import { useEffect, useState } from 'react'
import Page from '../components/Page'
import type { ArticuloConPrecios } from '../../../preload'

const money = (n: number): string => '$' + Math.round(n).toLocaleString('es-AR')

export default function Articulos(): JSX.Element {
  const [articulos, setArticulos] = useState<ArticuloConPrecios[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    window.api
      .listArticulos()
      .then(setArticulos)
      .finally(() => setCargando(false))
  }, [])

  return (
    <Page titulo="Articulos y precios">
      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-app text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-medium">Codigo</th>
              <th className="px-4 py-2 font-medium">Articulo</th>
              <th className="px-4 py-2 font-medium">Rubro</th>
              <th className="px-4 py-2 text-right font-medium">Disponible</th>
              <th className="px-4 py-2 text-right font-medium">Mayorista</th>
              <th className="px-4 py-2 text-right font-medium">Consumidor</th>
              <th className="px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  Cargando...
                </td>
              </tr>
            )}
            {!cargando &&
              articulos.map((a) => {
                const stockBajo = a.stock_disponible < a.stock_minimo
                return (
                  <tr key={a.id} className="border-b border-line last:border-0 hover:bg-app">
                    <td className="num px-4 py-2 text-xs text-muted">{a.codigo_barras}</td>
                    <td className="px-4 py-2 text-ink">{a.nombre}</td>
                    <td className="px-4 py-2 text-muted">{a.rubro}</td>
                    <td className="num px-4 py-2 text-right">
                      {a.stock_disponible}
                      {a.stock_reservado > 0 && (
                        <span className="text-muted"> ({a.stock_reservado} res.)</span>
                      )}
                    </td>
                    <td className="num px-4 py-2 text-right">{money(a.precios.mayorista)}</td>
                    <td className="num px-4 py-2 text-right">
                      {a.en_oferta && a.precio_oferta != null
                        ? money(a.precio_oferta)
                        : money(a.precios.consumidor)}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        {a.en_oferta === 1 && (
                          <span className="rounded-full bg-ok/10 px-2 py-0.5 text-xs font-medium text-ok">
                            Oferta
                          </span>
                        )}
                        {stockBajo && (
                          <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                            Stock bajo
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">
        Datos de prueba cargados por el esqueleto. Precios calculados en vivo: neto - descuento, +10%
        mayorista / +60% consumidor, redondeo hacia arriba.
      </p>
    </Page>
  )
}
