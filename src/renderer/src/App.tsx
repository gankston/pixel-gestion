import { useState, useEffect } from 'react'
import {
  ShoppingCart,
  Package,
  Archive,
  FileText,
  Wallet,
  Users,
  BarChart2,
  CreditCard,
  LogOut,
  Loader2
} from 'lucide-react'
import Ventas from './pages/Ventas'
import Articulos from './pages/Articulos'
import Stock from './pages/Stock'
import Presupuestos from './pages/Presupuestos'
import Caja from './pages/Caja'
import Clientes from './pages/Clientes'
import Reportes from './pages/Reportes'
import CuentaCorriente from './pages/CuentaCorriente'
import Login from './pages/Login'
import Setup from './pages/Setup'
import type { Usuario, DbStatus } from '../../preload'

type SeccionId =
  | 'ventas'
  | 'articulos'
  | 'stock'
  | 'presupuestos'
  | 'cuentacorriente'
  | 'clientes'
  | 'caja'
  | 'reportes'

const NAV_VENDEDOR: { id: SeccionId; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'ventas', label: 'Ventas', Icon: ShoppingCart },
  { id: 'articulos', label: 'Articulos', Icon: Package },
  { id: 'stock', label: 'Stock', Icon: Archive },
  { id: 'presupuestos', label: 'Presupuestos', Icon: FileText },
  { id: 'clientes', label: 'Clientes', Icon: Users },
  { id: 'cuentacorriente', label: 'Cta. Corriente', Icon: CreditCard }
]

const NAV_ADMIN = [
  ...NAV_VENDEDOR,
  { id: 'caja' as SeccionId, label: 'Caja diaria', Icon: Wallet },
  { id: 'reportes' as SeccionId, label: 'Reportes', Icon: BarChart2 }
]

const PAGINAS: Record<SeccionId, () => JSX.Element> = {
  ventas: Ventas,
  articulos: Articulos,
  stock: Stock,
  presupuestos: Presupuestos,
  clientes: Clientes,
  cuentacorriente: CuentaCorriente,
  caja: Caja,
  reportes: Reportes
}

type AppEstado = 'loading' | 'setup' | 'login' | 'app'

function App(): JSX.Element {
  const [estado, setEstado] = useState<AppEstado>('loading')
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null)
  const [seccion, setSeccion] = useState<SeccionId>('ventas')

  useEffect(() => {
    window.api.dbStatus().then((s) => {
      setDbStatus(s)
      if (s.needsSetup) {
        setEstado('setup')
      } else if (s.connected) {
        setEstado('login')
      } else {
        // Config existe pero no se pudo conectar (error en auto-connect)
        setEstado('setup')
      }
    })
  }, [])

  function handleLogin(u: Usuario): void {
    setUsuario(u)
    setSeccion('ventas')
    setEstado('app')
  }

  function handleLogout(): void {
    setUsuario(null)
    setEstado('login')
  }

  if (estado === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-sidebar font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" />
          <p className="text-[13px] text-white/40">Iniciando Pixel Gestión...</p>
        </div>
      </div>
    )
  }

  if (estado === 'setup') {
    return (
      <Setup
        errorInicial={dbStatus?.error ?? null}
        onDone={() => setEstado('login')}
      />
    )
  }

  if (estado === 'login') {
    return <Login onLogin={handleLogin} />
  }

  const nav = usuario?.perfil === 'admin' ? NAV_ADMIN : NAV_VENDEDOR
  const Pagina = PAGINAS[seccion] ?? PAGINAS['ventas']

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

        <div className="mx-4 mb-3 h-px bg-white/[0.06]" />

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2">
          {nav.map(({ id, label, Icon }) => {
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

        {/* Usuario / Logout */}
        <div className="border-t border-white/[0.06] px-3 py-3">
          <div className="mb-1 flex items-center justify-between px-1">
            <div>
              <p className="text-[12px] font-semibold text-white/70">{usuario?.nombre}</p>
              <p className="text-[10px] text-white/30 capitalize">{usuario?.perfil}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-7 w-7 items-center justify-center rounded text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
              title="Cerrar sesion"
            >
              <LogOut size={13} />
            </button>
          </div>
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
