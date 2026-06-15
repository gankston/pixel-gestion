import { useEffect, useState } from 'react'
import { Plus, Pencil, CreditCard } from 'lucide-react'
import Page from '../components/Page'
import { Button, TextInput, Field, Modal, Badge } from '../components/ui'
import { money } from '../lib/format'
import type { Cliente } from '../../../preload'

type Medio = 'efectivo' | 'transferencia' | 'debito' | 'credito'

interface Form {
  id?: number
  nombre: string
  tipo: 'mayorista' | 'consumidor'
  documento: string
  telefono: string
  email: string
}
const vacio: Form = { nombre: '', tipo: 'consumidor', documento: '', telefono: '', email: '' }

export default function Clientes(): JSX.Element {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [form, setForm] = useState<Form | null>(null)
  const [pago, setPago] = useState<{ cliente: Cliente; medio: Medio; monto: number } | null>(null)

  function recargar(): void {
    window.api.listClientes().then(setClientes)
  }
  useEffect(recargar, [])

  const set = (c: keyof Form, v: unknown): void => setForm((f) => (f ? { ...f, [c]: v } : f))

  async function guardar(): Promise<void> {
    if (!form || !form.nombre.trim()) return
    if (form.id) await window.api.actualizarCliente(form.id, form)
    else await window.api.crearCliente(form)
    setForm(null)
    recargar()
  }

  async function registrarPago(): Promise<void> {
    if (!pago || pago.monto <= 0) return
    await window.api.registrarPago({ clienteId: pago.cliente.id, medio: pago.medio, monto: pago.monto })
    setPago(null)
    recargar()
  }

  return (
    <Page
      titulo="Clientes"
      acciones={
        <Button onClick={() => setForm({ ...vacio })}>
          <Plus size={14} />
          Nuevo cliente
        </Button>
      }
    >
      <div className="overflow-hidden rounded border border-line bg-panel">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-app text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Cliente</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Tipo</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Documento</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Saldo cta. cte.</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-app">
                <td className="px-4 py-2.5 font-medium text-ink">{c.nombre}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={c.tipo === 'mayorista' ? 'primary' : 'muted'}>{c.tipo}</Badge>
                </td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-muted">{c.documento}</td>
                <td className={
                  'px-4 py-2.5 text-right font-mono font-semibold ' +
                  (c.saldo_cta_cte > 0 ? 'text-danger' : 'text-muted')
                }>
                  {money(c.saldo_cta_cte)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    {c.saldo_cta_cte > 0 && (
                      <button
                        onClick={() => setPago({ cliente: c, medio: 'efectivo', monto: c.saldo_cta_cte })}
                        className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-ok/40 hover:text-ok"
                        title="Cobrar cuenta corriente"
                      >
                        <CreditCard size={13} />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setForm({
                          id: c.id,
                          nombre: c.nombre,
                          tipo: c.tipo,
                          documento: c.documento ?? '',
                          telefono: c.telefono ?? '',
                          email: c.email ?? ''
                        })
                      }
                      className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-line hover:text-ink"
                      title="Editar"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Sin clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!form}
        title={form?.id ? 'Editar cliente' : 'Nuevo cliente'}
        onClose={() => setForm(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={guardar}>Guardar</Button>
          </>
        }
      >
        {form && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre">
              <TextInput value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
            </Field>
            <Field label="Tipo">
              <select
                value={form.tipo}
                onChange={(e) => set('tipo', e.target.value)}
                className="w-full rounded border border-line bg-panel px-3 py-[7px] text-[13px] outline-none focus:border-primary"
              >
                <option value="consumidor">Consumidor</option>
                <option value="mayorista">Mayorista</option>
              </select>
            </Field>
            <Field label="Documento (CUIT/DNI)">
              <TextInput value={form.documento} onChange={(e) => set('documento', e.target.value)} />
            </Field>
            <Field label="Teléfono">
              <TextInput value={form.telefono} onChange={(e) => set('telefono', e.target.value)} />
            </Field>
            <div className="col-span-2">
              <Field label="Email">
                <TextInput value={form.email} onChange={(e) => set('email', e.target.value)} />
              </Field>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!pago}
        title={`Cobrar a ${pago?.cliente.nombre ?? ''}`}
        onClose={() => setPago(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPago(null)}>Cancelar</Button>
            <Button onClick={registrarPago}>Registrar pago</Button>
          </>
        }
      >
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
              </select>
            </Field>
            <Field label="Monto">
              <TextInput
                type="number"
                value={pago.monto}
                onChange={(e) => setPago({ ...pago, monto: Number(e.target.value) })}
              />
            </Field>
            <p className="col-span-2 text-[12px] text-muted">
              Saldo actual: {money(pago.cliente.saldo_cta_cte)}. El pago reduce el saldo e ingresa a caja.
            </p>
          </div>
        )}
      </Modal>
    </Page>
  )
}
