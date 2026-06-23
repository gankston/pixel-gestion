import { useEffect, useState } from 'react'
import { Plus, CheckCircle } from 'lucide-react'
import Page from '../components/Page'
import { Button, TextInput, Field, Modal, Badge } from '../components/ui'
import { money } from '../lib/format'
import type { ChequeCartera } from '../../../preload'

type FiltroEstado = 'todos' | 'en_cartera' | 'cobrado' | 'entregado'

interface FormCheque {
  numero: string
  banco: string
  monto: string
  fechaEmision: string
  fechaCobro: string
}

const FORM_VACIO: FormCheque = {
  numero: '',
  banco: '',
  monto: '',
  fechaEmision: '',
  fechaCobro: ''
}

export default function ChequesCartera(): JSX.Element {
  const [cheques, setCheques] = useState<ChequeCartera[]>([])
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [form, setForm] = useState<FormCheque>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [errorCobro, setErrorCobro] = useState<string | null>(null)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  function recargar(): void {
    window.api.listCheques(filtro === 'todos' ? undefined : filtro).then(setCheques)
  }
  useEffect(recargar, [filtro])

  async function guardarCheque(): Promise<void> {
    if (!form.monto || Number(form.monto) <= 0 || !form.fechaCobro) return
    setErrorGuardar(null)
    setGuardando(true)
    try {
      await window.api.registrarCheque({
        numero: form.numero.trim() || null,
        banco: form.banco.trim() || null,
        monto: Number(form.monto),
        fechaEmision: form.fechaEmision || null,
        fechaCobro: form.fechaCobro
      })
      setModalNuevo(false)
      setForm(FORM_VACIO)
      recargar()
    } catch (e) {
      setErrorGuardar(e instanceof Error ? e.message : 'No se pudo registrar el cheque')
    } finally {
      setGuardando(false)
    }
  }

  async function cobrar(id: number): Promise<void> {
    setErrorCobro(null)
    try {
      await window.api.marcarChequeCobrado(id)
      recargar()
    } catch (e) {
      setErrorCobro(e instanceof Error ? e.message : 'No se pudo marcar el cheque como cobrado')
    }
  }

  const enCartera = cheques.filter((c) => c.estado === 'en_cartera')
  const totalCartera = enCartera.reduce((s, c) => s + c.monto, 0)

  const tonoBadge = (estado: string): 'ok' | 'warn' | 'danger' | 'primary' | 'muted' => {
    if (estado === 'en_cartera') return 'primary'
    if (estado === 'cobrado') return 'ok'
    return 'muted'
  }

  return (
    <Page titulo="Cheques en cartera">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex gap-1 rounded border border-line bg-panel p-0.5">
          {(['todos', 'en_cartera', 'cobrado', 'entregado'] as FiltroEstado[]).map((e) => (
            <button
              key={e}
              onClick={() => setFiltro(e)}
              className={
                'rounded px-3 py-1.5 text-[12px] font-medium transition-colors ' +
                (filtro === e ? 'bg-primary text-white' : 'text-muted hover:text-ink')
              }
            >
              {e === 'todos' ? 'Todos' : e === 'en_cartera' ? 'En cartera' : e === 'cobrado' ? 'Cobrados' : 'Entregados'}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button onClick={() => { setForm(FORM_VACIO); setModalNuevo(true) }}>
          <Plus size={14} />
          Registrar cheque
        </Button>
      </div>

      {errorCobro && (
        <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-4 py-2.5 text-[13px] text-danger">
          <span>{errorCobro}</span>
          <button onClick={() => setErrorCobro(null)} className="ml-3 text-danger/60 hover:text-danger">✕</button>
        </div>
      )}

      {enCartera.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded border border-line bg-panel px-4 py-3">
          <span className="text-[13px] text-muted">
            {enCartera.length} cheque{enCartera.length !== 1 ? 's' : ''} en cartera
          </span>
          <span className="font-mono text-[15px] font-semibold text-primary">
            Total: {money(totalCartera)}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded border border-line bg-panel">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-app text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">N° Cheque</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Banco</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Fecha cobro</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Monto</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {cheques.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-app">
                <td className="px-4 py-2.5 font-mono text-[12px] text-ink">
                  {c.numero ?? `#${c.id}`}
                </td>
                <td className="px-4 py-2.5 text-muted">{c.banco ?? '—'}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-ink">
                  {c.fecha_cobro?.slice(0, 10) ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold text-ink">
                  {money(c.monto)}
                </td>
                <td className="px-4 py-2.5">
                  <Badge tone={tonoBadge(c.estado)}>
                    {c.estado === 'en_cartera' ? 'En cartera' : c.estado === 'cobrado' ? 'Cobrado' : 'Entregado'}
                  </Badge>
                </td>
                <td className="px-4 py-2.5">
                  {c.estado === 'en_cartera' && (
                    <button
                      onClick={() => cobrar(c.id)}
                      className="flex items-center gap-1 text-[12px] text-ok transition-colors hover:opacity-70"
                      title="Marcar como cobrado"
                    >
                      <CheckCircle size={13} />
                      Cobrar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {cheques.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Sin cheques en esta categoría.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalNuevo}
        title="Registrar cheque recibido"
        onClose={() => { setModalNuevo(false); setErrorGuardar(null) }}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalNuevo(false); setErrorGuardar(null) }}>Cancelar</Button>
            <Button onClick={guardarCheque} disabled={guardando || !form.monto || Number(form.monto) <= 0 || !form.fechaCobro}>
              {guardando ? 'Guardando...' : 'Registrar'}
            </Button>
          </>
        }
      >
        {errorGuardar && (
          <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-3 py-2 text-[12px] text-danger">
            <span>{errorGuardar}</span>
            <button onClick={() => setErrorGuardar(null)} className="ml-3 text-danger/60 hover:text-danger">✕</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="N° Cheque">
            <TextInput
              value={form.numero}
              onChange={(e) => setForm({ ...form, numero: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="Banco">
            <TextInput
              value={form.banco}
              onChange={(e) => setForm({ ...form, banco: e.target.value })}
            />
          </Field>
          <Field label="Monto">
            <TextInput
              type="number"
              value={form.monto}
              onChange={(e) => setForm({ ...form, monto: e.target.value })}
            />
          </Field>
          <Field label="Fecha de cobro">
            <TextInput
              type="date"
              value={form.fechaCobro}
              onChange={(e) => setForm({ ...form, fechaCobro: e.target.value })}
            />
          </Field>
          <Field label="Fecha emisión">
            <TextInput
              type="date"
              value={form.fechaEmision}
              onChange={(e) => setForm({ ...form, fechaEmision: e.target.value })}
            />
          </Field>
        </div>
      </Modal>
    </Page>
  )
}
