import { useState } from 'react'
import {
  ShoppingCart,
  Package,
  Archive,
  FileText,
  Wallet,
  Users,
  BarChart2
} from 'lucide-react'
import Ventas from './pages/Ventas'
import Articulos from './pages/Articulos'
import Stock from './pages/Stock'
import Presupuestos from './pages/Presupuestos'
import Caja from './pages/Caja'
import Clientes from './pages/Clientes'
import Reportes from './pages/Reportes'

type SeccionId = 'ventas' | 'articulos' | 'stock' | 'presupuestos' | 'caja' | 'clientes' | 'reportes'

const NAV: { id: SeccionId; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'ventas', label: 'Ventas', Icon: ShoppingCart },
  { id: 'articulos', label: 'Articulos', Icon: Package },
  { id: 'stock', label: 'Stock', Icon: Archive },
  { id: 'presupuestos', label: 'Presupuestos', Icon: FileText },
  { id: 'caja', label: 'Caja diaria', Icon: Wallet },
  { id: 'clientes', label: 'Clientes', Icon: Users },
  { id: 'reportes', label: 'Reportes', Icon: BarChart2 }
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
  const [seccion, setSeccion] = useState<SeccionId>('ventas')
  const Pagina = PAGINAS[seccion]

  return (
    <div className="flex h-full bg-app font-sans">
      {/* Sidebar */}
      <aside className="flex w-[200px] flex-shrink-0 flex-col bg-sidebar">
        {/* Logo */}
        <div className="flex h-14 items-center px-5">
          <span className="text-[13px] font-bold tracking-[0.12em] text-white/90 uppercase">
            Pixel<span className="text-primary"> Gestión</span>
          </span>
        </div>

        {/* Divisor */}
        <div className="mx-4 mb-3 h-px bg-white/[0.06]" />

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map(({ id, label, Icon }) => {
            const activo = id === seccion
            return (
              <button
                key={id}
                onClick={() => setSeccion(id)}
                className={
                  'flex w-full items-center gap-2.5 rounded px-3 py-2 text-[13px] font-medium transition-colors ' +
                  (activo
                    ? 'bg-primary text-white'
                    : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80')
                }
              >
                <Icon size={15} strokeWidth={activo ? 2.5 : 1.8} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 pb-4 pt-3">
          <div className="text-[10px] font-medium uppercase tracking-widest text-white/20">v0.1.0</div>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex min-w-0 flex-1 flex-col overflow-auto">
        <Pagina />
      </main>
    </div>
  )
}

export default App
