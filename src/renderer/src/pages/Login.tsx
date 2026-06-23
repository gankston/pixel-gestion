import { useState, FormEvent } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import type { Usuario } from '../../../preload'

interface Props {
  onLogin: (usuario: Usuario) => void
}

export default function Login({ onLogin }: Props): JSX.Element {
  const [nombre, setNombre] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    if (!nombre.trim() || !password) return
    setCargando(true)
    setError(null)
    try {
      const usuario = await window.api.login(nombre.trim(), password)
      onLogin(usuario)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesion')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-sidebar font-sans">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-[22px] font-bold tracking-tight text-white">
            Pixel<span className="text-primary"> Gestión</span>
          </h1>
          <p className="mt-1 text-[13px] text-white/40">Sistema de ventas y stock</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-7">
          <h2 className="mb-5 text-[15px] font-semibold text-white/80">Iniciar sesion</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Usuario
              </label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoFocus
                autoComplete="username"
                className="w-full rounded border border-white/[0.1] bg-white/[0.06] px-3 py-2.5 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-primary"
                placeholder="Ventas o Admin"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full rounded border border-white/[0.1] bg-white/[0.06] px-3 py-2.5 text-[13px] text-white outline-none transition-colors placeholder:text-white/20 focus:border-primary"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-2">
                <AlertCircle size={13} className="shrink-0 text-danger" />
                <p className="text-[12px] text-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={cargando || !nombre.trim() || !password}
              className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargando ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
