import { useEffect, useState, Fragment } from 'react'
import { CreditCard, ChevronDown, ChevronUp } from 'lucide-react'
import Page from '../components/Page'
import { Button, TextInput, Field, Modal, Badge } from '../components/ui'
import { money } from '../lib/format'
import type { Cliente, Venta } from '../../../preload'

type Medio = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'cheque'

interface PagoForm {
  cliente: Cliente
  medio: Medio
  monto: number
}

export default function CuentaCorriente(): JSX.Element {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [expandido, setExpandido] = useState<number | null>(null)
  const [ventasMap, setVentasMap] = useState<Record<number, Venta[]>>({})
  const [pago, setPago] = useState<PagoForm | null>(null)
  const [cargando, setCargando] = useState(false)
  const [errorPago, setErrorPago] = useState<string | null>(null)

  function recargar(): void {
    window.api.listClientesConDeuda().then(setClientes)
  }
  useEffect(recargar, [])

  async function toggleExpandido(id: number): Promise<void> {
    if (expandido === id) {
      setExpandido(null)
      return
    }
    setExpandido(id)
    if (!ventasMap[id]) {
      try {
        const ventas = await window.api.ventasCliente(id)
        setVentasMap((m) => ({ ...m, [id]: ventas }))
      } catch {
        setVentasMap((m) => ({ ...m, [id]: [] }))
      }
    }
  }

  async function registrarPago(): Promise<void> {
    if (!pago || pago.monto <= 0) return
    if (pago.monto > pago.cliente.saldo_cta_cte + 0.01) return
    setErrorPago(null)
    setCargando(true)
    try {
      await window.api.registrarPago({
        clienteId: pago.cliente.id,
        medio: pago.medio,
        monto: pago.monto
      })
      setPago(null)
      setVentasMap({})
      recargar()
    } catch (e) {
      setErrorPago((e instanceof Error ? e.message : 'No se pudo registrar el pago').replace(/^Error invoking remote method '[^']+': Error: /, ''))
    } finally {
      setCargando(false)
    }
  }

  const totalDeuda = clientes.reduce((s, c) => s + c.saldo_cta_cte, 0)

  return (
    <Page titulo="Cuenta Corriente">
      {/* Resumen */}
      <div className="mb-4 flex items-center justify-between rounded border border-line bg-panel px-4 py-3">
        <span className="text-[13px] text-muted">
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} con saldo pendiente
        </span>
        <span className="font-mono text-[15px] font-semibold text-danger">
          Total: {money(totalDeuda)}
        </span>
      </div>

      <div className="overflow-hidden rounded border border-line bg-panel">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-app text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Cliente</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Tipo</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Documento</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Saldo</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <Fragment key={c.id}>
                <tr
                  className="border-b border-line last:border-0 hover:bg-app cursor-pointer"
                  onClick={() => toggleExpandido(c.id)}
                >
                  <td className="px-4 py-2.5 font-medium text-ink">{c.nombre}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone={c.tipo === 'mayorista' ? 'primary' : 'muted'}>{c.tipo}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-muted">{c.documento ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-danger">
                    {money(c.saldo_cta_cte)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setErrorPago(null); setPago({ cliente: c, medio: 'efectivo', monto: c.saldo_cta_cte })
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-ok/40 hover:text-ok"
                        title="Registrar pago"
                      >
                        <CreditCard size={13} />
                      </button>
                      <button
                        className="flex h-7 w-7 items-center justify-center text-muted hover:text-ink"
                        title="Ver ventas"
                      >
                        {expandido === c.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>

                {expandido === c.id && (
                  <tr key={`${c.id}-ventas`} className="border-b border-line bg-app/50">
                    <td colSpan={5} className="px-6 pb-3 pt-2">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Ventas pendientes de cobro
                      </p>
                      {(ventasMap[c.id] ?? []).length === 0 ? (
                        <p className="text-[12px] text-muted">Sin ventas registradas.</p>
                      ) : (
                        <div className="space-y-1">
                          {(ventasMap[c.id] ?? []).map((v) => (
                            <div
                              key={v.id}
                              className="flex items-center justify-between text-[12px]"
                            >
                              <span className="text-muted">
                                Venta #{v.id} — {v.fecha?.slice(0, 10) ?? ''}
                              </span>
                              <span className="font-mono font-medium text-ink">
                                {money(v.total)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Sin cuentas corrientes pendientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!pago}
        title={`Cobrar a ${pago?.cliente.nombre ?? ''}`}
        onClose={() => { setPago(null); setErrorPago(null) }}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setPago(null); setErrorPago(null) }}>Cancelar</Button>
            <Button onClick={registrarPago} disabled={cargando || !pago || pago.monto <= 0 || pago.monto > pago.cliente.saldo_cta_cte + 0.01}>
              {cargando ? 'Registrando...' : 'Registrar pago'}
            </Button>
          </>
        }
      >
        {errorPago && (
          <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-3 py-2 text-[12px] text-danger">
            <span>{errorPago}</span>
            <button onClick={() => setErrorPago(null)} className="ml-3 text-danger/60 hover:text-danger">✕</button>
          </div>
        )}
        {pago && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Medio de pago">
              <select
                value={pago.medio}
                onChange={(e) => setPago({ ...pago, medio: e.target.value as Medio })}
                className="w-full rounded border border-line bg-panel px-3 py-[7px] text-[13px] outline-none focus:border-primary"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="cheque">Cheque</option>
              </select>
            </Field>
            <Field label="Monto">
              <TextInput
                type="number"
                value={pago.monto}
                max={pago.cliente.saldo_cta_cte}
                onChange={(e) => setPago({ ...pago, monto: Number(e.target.value) })}
              />
            </Field>
            <div className="col-span-2 space-y-1">
              <p className="text-[12px] text-muted">
                Saldo actual: <span className="font-semibold text-danger">{money(pago.cliente.saldo_cta_cte)}</span>
              </p>
              {pago.monto > pago.cliente.saldo_cta_cte + 0.01 && (
                <p className="text-[12px] text-danger">
                  El monto supera el saldo del cliente.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Page>
  )
}
