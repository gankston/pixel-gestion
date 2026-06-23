import { useState } from 'react'
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface Props {
  onDone: () => void
  errorInicial?: string | null
}

export default function Setup({ onDone, errorInicial }: Props): JSX.Element {
  const [url, setUrl] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(errorInicial ?? null)

  async function conectar(): Promise<void> {
    const trimmed = url.trim()
    if (!trimmed.startsWith('postgres')) {
      setError('La URL debe comenzar con postgresql:// o postgres://')
      return
    }
    setCargando(true)
    setError(null)
    try {
      const result = await window.api.initDb(trimmed)
      if (result.ok) {
        onDone()
      } else {
        setError(result.error ?? 'No se pudo conectar')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex h-full items-center justify-center bg-app font-sans">
      <div className="w-full max-w-md rounded-xl border border-line bg-panel p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Database size={24} />
          </div>
          <div className="text-center">
            <h1 className="text-[17px] font-bold text-ink">Configuracion de base de datos</h1>
            <p className="mt-1 text-[13px] text-muted">
              Ingresa la URL de conexion de tu PostgreSQL en Railway.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wider text-muted">
              URL de conexion
            </label>
            <input
              type="password"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && conectar()}
              placeholder="postgresql://user:password@host:5432/dbname"
              className="w-full rounded border border-line bg-app px-3 py-2.5 font-mono text-[12px] text-ink outline-none focus:border-primary"
              autoFocus
            />
            <p className="mt-1.5 text-[11px] text-muted">
              Encontrala en Railway → tu proyecto → PostgreSQL → Connect → Database URL
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded border border-danger/30 bg-danger/5 px-3 py-2.5">
              <AlertCircle size={14} className="mt-0.5 shrink-0 text-danger" />
              <p className="text-[12px] text-danger">{error}</p>
            </div>
          )}

          <button
            onClick={conectar}
            disabled={cargando || !url.trim()}
            className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Conectar y continuar
              </>
            )}
          </button>
        </div>

        <div className="mt-6 rounded border border-line bg-app px-3 py-2.5">
          <p className="text-[11px] text-muted">
            <span className="font-semibold text-ink">Dato de seguridad:</span> la URL se guarda solo en
            esta PC y nunca se sube a internet. La podes cambiar borrando el archivo config.json en
            %APPDATA%/pixel-gestion/.
          </p>
        </div>
      </div>
    </div>
  )
}
