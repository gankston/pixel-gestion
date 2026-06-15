import { useState } from 'react'
import Ventas from './pages/Ventas'
import Articulos from './pages/Articulos'
import Stock from './pages/Stock'
import Presupuestos from './pages/Presupuestos'
import Caja from './pages/Caja'
import Clientes from './pages/Clientes'
import Reportes from './pages/Reportes'

type SeccionId = 'ventas' | 'articulos' | 'stock' | 'presupuestos' | 'caja' | 'clientes' | 'reportes'

const NAV: { id: SeccionId; label: string }[] = [
  { id: 'ventas', label: 'Ventas' },
  { id: 'articulos', label: 'Articulos' },
  { id: 'stock', label: 'Stock' },
  { id: 'presupuestos', label: 'Presupuestos' },
  { id: 'caja', label: 'Caja diaria' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'reportes', label: 'Reportes' }
]

const PAGINAS: Record<SeccionId, () => JSX.Element> = {
  ventas: Ventas,
  articulos: Articulos,
  stock: Stock,
  presupuestos: Presupuestos,
  caja: Caja,
  clientes: Clientes,
  reportes: Reportes
}

function App(): JSX.Element {
  const [seccion, setSeccion] = useState<SeccionId>('articulos')
  const Pagina = PAGINAS[seccion]

  return (
    <div className="flex h-full">
      {/* Barra lateral */}
      <aside className="flex w-56 flex-col bg-sidebar text-white">
        <div className="px-5 py-5 text-lg font-semibold tracking-tight">
          PIXEL <span className="text-primary">GESTION</span>
        </div>
        <nav className="flex-1 px-2">
          {NAV.map((item) => {
            const activo = item.id === seccion
            return (
              <button
                key={item.id}
                onClick={() => setSeccion(item.id)}
                className={
                  'mb-1 w-full rounded px-3 py-2 text-left text-sm transition-colors ' +
                  (activo
                    ? 'bg-primary text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white')
                }
              >
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="px-5 py-4 text-xs text-white/40">v0.1.0</div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        <Pagina />
      </main>
    </div>
  )
}

export default App
