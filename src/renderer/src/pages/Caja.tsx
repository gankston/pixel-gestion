import { useEffect, useState } from 'react'
import { LockOpen, Lock } from 'lucide-react'
import Page from '../components/Page'
import { Button, Badge, Field, TextInput, Modal } from '../components/ui'
import { money, fmtFecha } from '../lib/format'
import type { CajaEstado } from '../../../preload'

function KpiCard({
  label,
  valor,
  destacado
}: {
  label: string
  valor: number
  destacado?: boolean
}): JSX.Element {
  return (
    <div
      className={
        'rounded border p-4 ' +
        (destacado ? 'border-primary/30 bg-primary/8' : 'border-line bg-panel')
      }
    >
      <div className={'mb-1 text-[11px] font-semibold uppercase tracking-wider ' + (destacado ? 'text-primary' : 'text-muted')}>
        {label}
      </div>
      <div className={'font-mono text-2xl font-bold ' + (destacado ? 'text-primary' : 'text-ink')}>
        {money(valor)}
      </div>
    </div>
  )
}

export default function Caja(): JSX.Element {
  const [estado, setEstado] = useState<CajaEstado | null>(null)
  const [modalAbrir, setModalAbrir] = useState(false)
  const [saldoInicial, setSaldoInicial] = useState('0')
  const [abriendo, setAbriendo] = useState(false)
  const [errorCierre, setErrorCierre] = useState<string | null>(null)

  function recargar(): void {
    window.api.estadoCaja().then(setEstado)
  }
  useEffect(recargar, [])

  async function confirmarAbrir(): Promise<void> {
    setAbriendo(true)
    try {
      await window.api.abrirCaja(Number(saldoInicial) || 0)
      setModalAbrir(false)
      setSaldoInicial('0')
      recargar()
    } finally {
      setAbriendo(false)
    }
  }

  async function cerrar(): Promise<void> {
    if (!estado?.caja || !estado.resumen) return
    if (!confirm('Cerrar la caja del día?')) return
    try {
      await window.api.cerrarCaja(estado.caja.id, estado.resumen.total + estado.caja.saldo_inicial)
      recargar()
    } catch (e) {
      setErrorCierre(e instanceof Error ? e.message : 'No se pudo cerrar la caja')
    }
  }

  if (!estado) return <Page titulo="Caja diaria">Cargando...</Page>

  if (!estado.caja || !estado.resumen) {
    return (
      <Page
        titulo="Caja diaria"
        acciones={
          <Button onClick={() => { setSaldoInicial('0'); setModalAbrir(true) }}>
            <LockOpen size={14} />
            Abrir caja
          </Button>
        }
      >
        <div className="rounded border border-line bg-panel p-10 text-center">
          <Lock size={32} className="mx-auto mb-3 text-muted/40" />
          <p className="text-[13px] font-medium text-ink">No hay caja abierta</p>
          <p className="mt-1 text-[12px] text-muted">Abrí la caja para registrar ventas y cobros del día.</p>
        </div>

        <Modal
          open={modalAbrir}
          title="Abrir caja del día"
          onClose={() => setModalAbrir(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalAbrir(false)}>Cancelar</Button>
              <Button onClick={confirmarAbrir} disabled={abriendo}>
                {abriendo ? 'Abriendo...' : 'Abrir caja'}
              </Button>
            </>
          }
        >
          <Field label="Saldo inicial en efectivo ($)">
            <TextInput
              type="number"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              autoFocus
              placeholder="0"
            />
          </Field>
        </Modal>
      </Page>
    )
  }

  const { caja, resumen, movimientos } = estado

  return (
    <Page
      titulo="Caja diaria"
      acciones={
        <>
          <Badge tone="ok">Abierta {fmtFecha(caja.abierta_en as unknown as string)}</Badge>
          <Button variant="danger" onClick={cerrar}>
            <Lock size={14} />
            Cerrar caja
          </Button>
        </>
      }
    >
      {errorCierre && (
        <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-4 py-2.5 text-[13px] text-danger">
          <span>{errorCierre}</span>
          <button onClick={() => setErrorCierre(null)} className="ml-3 text-danger/60 hover:text-danger">✕</button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-5 gap-3">
        <KpiCard label="Efectivo" valor={resumen.efectivo} />
        <KpiCard label="Transferencia" valor={resumen.transferencia} />
        <KpiCard label="Débito" valor={resumen.debito} />
        <KpiCard label="Crédito" valor={resumen.credito} />
        <KpiCard label="Total" valor={resumen.total} destacado />
      </div>

      <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-muted">
        Movimientos del día
      </h2>
      <div className="overflow-hidden rounded border border-line bg-panel">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-app text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Hora</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Detalle</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Medio</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Monto</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 font-mono text-[12px] text-muted">{fmtFecha(m.fecha)}</td>
                <td className="px-4 py-2.5 text-ink">{m.descripcion}</td>
                <td className="px-4 py-2.5 capitalize text-muted">{m.medio_pago}</td>
                <td className={
                  'px-4 py-2.5 text-right font-mono font-semibold ' +
                  (m.tipo === 'egreso' ? 'text-danger' : 'text-ink')
                }>
                  {m.tipo === 'egreso' ? '−' : ''}{money(m.monto)}
                </td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  Sin movimientos todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Page>
  )
}
