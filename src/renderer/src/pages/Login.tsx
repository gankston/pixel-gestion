import { useState, useEffect, FormEvent } from 'react'
import { Loader2, AlertCircle, ChevronLeft, ShieldCheck, User } from 'lucide-react'
import type { Usuario } from '../../../preload'
import logoHorizontal from '../assets/logo-horizontal.png'

const SESSION_KEY = 'pg_session'

export function getSavedSession(): Usuario | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Usuario) : null
  } catch {
    return null
  }
}

export function clearSavedSession(): void {
  localStorage.removeItem(SESSION_KEY)
}

function saveSession(u: Usuario): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(u))
}

interface Props {
  onLogin: (usuario: Usuario) => void
}

export default function Login({ onLogin }: Props): JSX.Element {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null)
  const [password, setPassword] = useState('')
  const [recordar, setRecordar] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(true)

  useEffect(() => {
    window.api.listarUsuarios()
      .then((u) => {
        setUsuarios(u)
        setLoadingUsers(false)
      })
      .catch(() => {
        setError('No se pudo conectar con la base de datos. Verificá la conexión e intentá de nuevo.')
        setLoadingUsers(false)
      })
  }, [])

  function seleccionarPerfil(u: Usuario): void {
    setSeleccionado(u)
    setPassword('')
    setError(null)
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    if (!seleccionado || !password) return
    setCargando(true)
    setError(null)
    try {
      const usuario = await window.api.login(seleccionado.nombre, password)
      if (recordar) saveSession(usuario)
      onLogin(usuario)
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : 'Contraseña incorrecta'
      setError(raw.replace(/^Error invoking remote method '[^']+': Error: /, ''))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-sidebar font-sans">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <img src={logoHorizontal} alt="Pixel Gestión" className="h-12 w-auto" />
          <p className="mt-2 text-[13px] text-white/40">Sistema de ventas y stock</p>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-7">
          {!seleccionado ? (
            <>
              <h2 className="mb-5 text-[14px] font-semibold text-white/70">
                Seleccioná tu perfil
              </h2>
              {loadingUsers ? (
                <div className="flex justify-center py-4">
                  <Loader2 size={20} className="animate-spin text-white/30" />
                </div>
              ) : error ? (
                <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-3">
                  <AlertCircle size={14} className="shrink-0 text-danger" />
                  <p className="text-[12px] text-danger">{error}</p>
                </div>
              ) : usuarios.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-white/40">
                  No hay usuarios configurados en el sistema.
                </p>
              ) : (
                <div className="space-y-2">
                  {usuarios.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => seleccionarPerfil(u)}
                      className="flex w-full items-center gap-4 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-left transition-all hover:border-primary/50 hover:bg-primary/10"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                        {u.perfil === 'admin'
                          ? <ShieldCheck size={18} />
                          : <User size={18} />
                        }
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-white">{u.nombre}</p>
                        <p className="text-[11px] capitalize text-white/40">{u.perfil}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => { setSeleccionado(null); setError(null) }}
                className="mb-4 flex items-center gap-1.5 text-[12px] text-white/40 transition-colors hover:text-white/70"
              >
                <ChevronLeft size={14} />
                Cambiar perfil
              </button>

              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-primary">
                  {seleccionado.perfil === 'admin'
                    ? <ShieldCheck size={18} />
                    : <User size={18} />
                  }
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white">{seleccionado.nombre}</p>
                  <p className="text-[11px] capitalize text-white/40">{seleccionado.perfil}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoFocus
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

                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={recordar}
                    onChange={(e) => setRecordar(e.target.checked)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  <span className="text-[12px] text-white/40">Recordar mi sesión</span>
                </label>

                <button
                  type="submit"
                  disabled={cargando || !password}
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
