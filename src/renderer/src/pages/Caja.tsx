import { useEffect, useState } from 'react'
import Page from '../components/Page'
import { Button, Badge } from '../components/ui'
import { money, fmtFecha } from '../lib/format'
import type { CajaEstado } from '../../../preload'

function Kpi({ label, valor, destacado }: { label: string; valor: number; destacado?: boolean }): JSX.Element {
  return (
    <div className={'rounded-lg border border-line p-4 ' + (destacado ? 'bg-sidebar text-white' : 'bg-panel')}>
      <div className={'text-xs uppercase tracking-wide ' + (destacado ? 'text-white/60' : 'text-muted')}>
        {label}
      </div>
      <div className="num mt-1 text-2xl font-bold">{money(valor)}</div>
    </div>
  )
}

export default function Caja(): JSX.Element {
  const [estado, setEstado] = useState<CajaEstado | null>(null)

  function recargar(): void {
    window.api.estadoCaja().then(setEstado)
  }
  useEffect(recargar, [])

  async function abrir(): Promise<void> {
    const txt = prompt('Saldo inicial en efectivo:', '0')
    if (txt == null) return
    await window.api.abrirCaja(Number(txt) || 0)
    recargar()
  }

  async function cerrar(): Promise<void> {
    if (!estado?.caja || !estado.resumen) return
    if (!confirm('Cerrar la caja del dia?')) return
    await window.api.cerrarCaja(estado.caja.id, estado.resumen.total + estado.caja.saldo_inicial)
    recargar()
  }

  if (!estado) return <Page titulo="Caja diaria">Cargando...</Page>

  if (!estado.caja || !estado.resumen) {
    return (
      <Page titulo="Caja diaria" acciones={<Button onClick={abrir}>Abrir caja</Button>}>
        <div className="rounded-md border border-line bg-panel p-8 text-sm text-muted">
          No hay una caja abierta. Abri la caja para empezar a registrar ventas y cobros del dia.
        </div>
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
            Cerrar caja
          </Button>
        </>
      }
    >
      <div className="mb-6 grid grid-cols-5 gap-3">
        <Kpi label="Efectivo" valor={resumen.efectivo} />
        <Kpi label="Transferencia" valor={resumen.transferencia} />
        <Kpi label="Debito" valor={resumen.debito} />
        <Kpi label="Credito" valor={resumen.credito} />
        <Kpi label="Total" valor={resumen.total} destacado />
      </div>

      <h2 className="mb-2 text-sm font-semibold text-ink">Movimientos del dia</h2>
      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-app text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-medium">Hora</th>
              <th className="px-4 py-2 font-medium">Detalle</th>
              <th className="px-4 py-2 font-medium">Medio</th>
              <th className="px-4 py-2 text-right font-medium">Monto</th>
            </tr>
          </thead>
          <tbody>
            {movimientos.map((m) => (
              <tr key={m.id} className="border-b border-line last:border-0">
                <td className="num px-4 py-2 text-xs text-muted">{fmtFecha(m.fecha)}</td>
                <td className="px-4 py-2 text-ink">{m.descripcion}</td>
                <td className="px-4 py-2 capitalize text-muted">{m.medio_pago}</td>
                <td className={'num px-4 py-2 text-right ' + (m.tipo === 'egreso' ? 'text-danger' : 'text-ink')}>
                  {m.tipo === 'egreso' ? '-' : ''}
                  {money(m.monto)}
                </td>
              </tr>
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  Sin movimientos todavia.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Page>
  )
}
