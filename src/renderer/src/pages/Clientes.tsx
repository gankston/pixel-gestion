import { useEffect, useState } from 'react'
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
    <Page titulo="Clientes" acciones={<Button onClick={() => setForm({ ...vacio })}>+ Nuevo cliente</Button>}>
      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-app text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Documento</th>
              <th className="px-4 py-2 text-right font-medium">Saldo cta cte</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0 hover:bg-app">
                <td className="px-4 py-2 text-ink">{c.nombre}</td>
                <td className="px-4 py-2">
                  <Badge tone={c.tipo === 'mayorista' ? 'primary' : 'muted'}>{c.tipo}</Badge>
                </td>
                <td className="num px-4 py-2 text-muted">{c.documento}</td>
                <td className={'num px-4 py-2 text-right ' + (c.saldo_cta_cte > 0 ? 'font-medium text-danger' : 'text-muted')}>
                  {money(c.saldo_cta_cte)}
                </td>
                <td className="px-4 py-2 text-right">
                  {c.saldo_cta_cte > 0 && (
                    <button
                      onClick={() => setPago({ cliente: c, medio: 'efectivo', monto: c.saldo_cta_cte })}
                      className="mr-3 text-ok hover:underline"
                    >
                      Cobrar
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
                    className="text-primary hover:underline"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Sin clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Alta / edicion */}
      <Modal
        open={!!form}
        title={form?.id ? 'Editar cliente' : 'Nuevo cliente'}
        onClose={() => setForm(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>
              Cancelar
            </Button>
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
                className="w-full rounded border border-line bg-panel px-3 py-2 text-sm"
              >
                <option value="consumidor">Consumidor</option>
                <option value="mayorista">Mayorista</option>
              </select>
            </Field>
            <Field label="Documento (CUIT/DNI)">
              <TextInput value={form.documento} onChange={(e) => set('documento', e.target.value)} />
            </Field>
            <Field label="Telefono">
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

      {/* Cobro de cuenta corriente */}
      <Modal
        open={!!pago}
        title={`Cobrar a ${pago?.cliente.nombre ?? ''}`}
        onClose={() => setPago(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPago(null)}>
              Cancelar
            </Button>
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
                className="w-full rounded border border-line bg-panel px-3 py-2 text-sm"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="debito">Debito</option>
                <option value="credito">Credito</option>
              </select>
            </Field>
            <Field label="Monto">
              <TextInput
                type="number"
                value={pago.monto}
                onChange={(e) => setPago({ ...pago, monto: Number(e.target.value) })}
              />
            </Field>
            <p className="col-span-2 text-xs text-muted">
              Saldo actual: {money(pago.cliente.saldo_cta_cte)}. El pago baja el saldo e ingresa a la caja del dia.
            </p>
          </div>
        )}
      </Modal>
    </Page>
  )
}
