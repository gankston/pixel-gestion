import { useEffect, useState } from 'react'
import { Plus, FileText, Printer, CheckCheck, Ban } from 'lucide-react'
import Page from '../components/Page'
import { Button, TextInput, Field, Modal, Badge } from '../components/ui'
import { money, fmtFecha } from '../lib/format'
import { imprimirPresupuesto, verPdfPresupuesto, imprimirVenta, verPdfVenta } from '../lib/print'
import type { ArticuloConPrecios, Cliente, Presupuesto } from '../../../preload'

type Lista = 'mayorista' | 'consumidor'
type Medio = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'cheque'

interface ItemCarrito {
  art: ArticuloConPrecios
  cantidad: number
}

interface ChequeForm {
  numero: string; banco: string; librador: string; tipo: 'personal' | 'empresa'
  fechaEmision: string; fechaCobro: string
}

const FORM_CHEQUE_VACIO: ChequeForm = { numero: '', banco: '', librador: '', tipo: 'personal', fechaEmision: '', fechaCobro: '' }

const MEDIOS: { id: Medio; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transfer.' },
  { id: 'debito', label: 'Debito' },
  { id: 'credito', label: 'Credito' },
  { id: 'cheque', label: 'Cheque' }
]

const precioDe = (a: ArticuloConPrecios, lista: Lista): number =>
  lista === 'mayorista' ? a.precios.mayorista : a.precios.consumidor

function ChequeFormPanel({ form, onChange }: { form: ChequeForm; onChange: React.Dispatch<React.SetStateAction<ChequeForm>> }): JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-2 rounded border border-line bg-panel p-2">
      <Field label="N° Cheque">
        <input type="text" value={form.numero} onChange={(e) => onChange((f) => ({ ...f, numero: e.target.value }))} placeholder="Opcional" className="w-full rounded border border-line bg-app px-2 py-1.5 text-[12px] outline-none focus:border-primary" />
      </Field>
      <Field label="Banco">
        <input type="text" value={form.banco} onChange={(e) => onChange((f) => ({ ...f, banco: e.target.value }))} placeholder="Opcional" className="w-full rounded border border-line bg-app px-2 py-1.5 text-[12px] outline-none focus:border-primary" />
      </Field>
      <Field label="A nombre de" className="col-span-2">
        <input type="text" value={form.librador} onChange={(e) => onChange((f) => ({ ...f, librador: e.target.value }))} placeholder="Nombre o razón social" className="w-full rounded border border-line bg-app px-2 py-1.5 text-[12px] outline-none focus:border-primary" />
      </Field>
      <Field label="Fecha emision">
        <input type="date" value={form.fechaEmision} onChange={(e) => onChange((f) => ({ ...f, fechaEmision: e.target.value }))} className="w-full rounded border border-line bg-app px-2 py-1.5 text-[12px] outline-none focus:border-primary" />
      </Field>
      <Field label="Fecha cobro">
        <input type="date" value={form.fechaCobro} onChange={(e) => onChange((f) => ({ ...f, fechaCobro: e.target.value }))} className="w-full rounded border border-line bg-app px-2 py-1.5 text-[12px] outline-none focus:border-primary" />
      </Field>
      <Field label="Tipo" className="col-span-2">
        <select value={form.tipo} onChange={(e) => onChange((f) => ({ ...f, tipo: e.target.value as 'personal' | 'empresa' }))} className="w-full rounded border border-line bg-app px-2 py-1.5 text-[12px] outline-none focus:border-primary">
          <option value="personal">Personal</option>
          <option value="empresa">Empresa</option>
        </select>
      </Field>
    </div>
  )
}

const TONO: Record<string, 'primary' | 'ok' | 'muted' | 'danger'> = {
  vigente: 'primary',
  aprobado: 'ok',
  vencido: 'muted',
  anulado: 'danger'
}

export default function Presupuestos(): JSX.Element {
  const [lista, setLista] = useState<Presupuesto[]>([])
  const [modal, setModal] = useState(false)
  const [error, setError] = useState('')
  const [errorGuardar, setErrorGuardar] = useState('')
  const [mensajeOk, setMensajeOk] = useState('')
  const [ultimaVentaId, setUltimaVentaId] = useState<number | null>(null)

  const [clienteId, setClienteId] = useState<number | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [listaPrecio, setListaPrecio] = useState<Lista>('consumidor')
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ArticuloConPrecios[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])

  // Payment modal state
  const [modalPago, setModalPago] = useState(false)
  const [presupAprobando, setPresupAprobando] = useState<Presupuesto | null>(null)
  const [medio, setMedio] = useState<Medio>('efectivo')
  const [chequeForm, setChequeForm] = useState<ChequeForm>(FORM_CHEQUE_VACIO)
  const [dosPagos, setDosPagos] = useState(false)
  const [medio2, setMedio2] = useState<Medio>('transferencia')
  const [monto1Str, setMonto1Str] = useState('')
  const [chequeForm2, setChequeForm2] = useState<ChequeForm>(FORM_CHEQUE_VACIO)
  const [errorPago, setErrorPago] = useState('')

  function recargar(): void {
    window.api.listPresupuestos().then(setLista)
  }
  useEffect(recargar, [])
  useEffect(() => {
    window.api.listClientes().then(setClientes)
  }, [])
  useEffect(() => {
    if (busqueda.trim().length < 2) return setResultados([])
    window.api.listArticulos(busqueda).then(setResultados)
  }, [busqueda])

  const total = carrito.reduce((s, it) => s + precioDe(it.art, listaPrecio) * it.cantidad, 0)

  function abrir(): void {
    setClienteId(null)
    setListaPrecio('consumidor')
    setCarrito([])
    setBusqueda('')
    setErrorGuardar('')
    setModal(true)
  }
  function agregar(a: ArticuloConPrecios): void {
    setCarrito((p) => {
      const i = p.findIndex((it) => it.art.id === a.id)
      if (i >= 0) {
        const c = [...p]
        c[i] = { ...c[i], cantidad: c[i].cantidad + 1 }
        return c
      }
      return [...p, { art: a, cantidad: 1 }]
    })
    setBusqueda('')
    setResultados([])
  }

  async function guardar(): Promise<void> {
    if (carrito.length === 0) return
    setErrorGuardar('')
    try {
      await window.api.crearPresupuesto({
        clienteId,
        lista: listaPrecio,
        items: carrito.map((it) => ({
          articuloId: it.art.id,
          cantidad: it.cantidad,
          precioUnit: precioDe(it.art, listaPrecio)
        }))
      })
      setModal(false)
      recargar()
    } catch (e) {
      setErrorGuardar((e instanceof Error ? e.message : 'No se pudo crear el presupuesto').replace(/^Error invoking remote method '[^']+': Error: /, ''))
    }
  }

  function iniciarAprobar(p: Presupuesto): void {
    setPresupAprobando(p)
    setMedio('efectivo')
    setChequeForm(FORM_CHEQUE_VACIO)
    setDosPagos(false)
    setMedio2('transferencia')
    setMonto1Str('')
    setChequeForm2(FORM_CHEQUE_VACIO)
    setErrorPago('')
    setModalPago(true)
  }

  async function confirmarVenta(): Promise<void> {
    if (!presupAprobando) return
    const totalPres = presupAprobando.total
    const monto1 = dosPagos ? Math.max(0, parseFloat(monto1Str) || 0) : totalPres
    const monto2 = dosPagos ? Math.max(0, totalPres - monto1) : 0

    if (medio === 'cheque' && !chequeForm.fechaCobro) {
      setErrorPago('Para pagar con cheque (forma 1) completá la fecha de cobro.')
      return
    }
    if (dosPagos && medio2 === 'cheque' && !chequeForm2.fechaCobro) {
      setErrorPago('Para pagar con cheque (forma 2) completá la fecha de cobro.')
      return
    }

    const pagos = dosPagos
      ? [{ medio, monto: monto1 }, { medio: medio2, monto: monto2 }].filter((p) => p.monto > 0)
      : [{ medio, monto: totalPres }]

    let ventaId: number
    try {
      ventaId = await window.api.aprobarPresupuesto(presupAprobando.id, pagos)
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).replace(/^Error invoking remote method '[^']+': Error: /, '')
      setErrorPago(`No se pudo aprobar: ${msg}`)
      return
    }

    if (medio === 'cheque' && monto1 > 0) {
      try {
        await window.api.registrarCheque({
          numero: chequeForm.numero.trim() || null,
          banco: chequeForm.banco.trim() || null,
          monto: dosPagos ? monto1 : totalPres,
          fechaEmision: chequeForm.fechaEmision || null,
          fechaCobro: chequeForm.fechaCobro,
          librador: chequeForm.librador.trim() || null,
          tipo: chequeForm.tipo,
          origenTipo: 'venta',
          origenId: ventaId
        })
      } catch { /* cheque fallback: venta already registered */ }
    }
    if (dosPagos && medio2 === 'cheque' && monto2 > 0) {
      try {
        await window.api.registrarCheque({
          numero: chequeForm2.numero.trim() || null,
          banco: chequeForm2.banco.trim() || null,
          monto: monto2,
          fechaEmision: chequeForm2.fechaEmision || null,
          fechaCobro: chequeForm2.fechaCobro,
          librador: chequeForm2.librador.trim() || null,
          tipo: chequeForm2.tipo,
          origenTipo: 'venta',
          origenId: ventaId
        })
      } catch { /* cheque fallback */ }
    }

    setModalPago(false)
    setUltimaVentaId(ventaId)
    setMensajeOk(`Presupuesto #${presupAprobando.id} aprobado — Venta #${ventaId} registrada.`)
    recargar()
  }
  async function anular(id: number): Promise<void> {
    if (!confirm('Anular el presupuesto? Se libera el stock reservado.')) return
    setError('')
    try {
      await window.api.anularPresupuesto(id)
      recargar()
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).replace(/^Error invoking remote method '[^']+': Error: /, '')
      setError(`No se pudo anular: ${msg}`)
    }
  }
  async function imprimir(id: number): Promise<void> {
    try {
      const det = await window.api.detallePresupuesto(id)
      if (det) await imprimirPresupuesto(det)
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).replace(/^Error invoking remote method '[^']+': Error: /, '')
      setError(`Error al imprimir: ${msg}`)
    }
  }
  async function verPdf(id: number): Promise<void> {
    try {
      const det = await window.api.detallePresupuesto(id)
      if (det) await verPdfPresupuesto(det)
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).replace(/^Error invoking remote method '[^']+': Error: /, '')
      setError(`Error al generar PDF: ${msg}`)
    }
  }

  return (
    <Page
      titulo="Presupuestos"
      acciones={
        <Button onClick={abrir}>
          <Plus size={14} />
          Nuevo presupuesto
        </Button>
      }
    >
      {error && (
        <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-4 py-2.5 text-[13px] text-danger">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-3 text-danger/60 hover:text-danger">x</button>
        </div>
      )}
      {mensajeOk && (
        <div className="mb-3 flex items-center justify-between rounded border border-ok/30 bg-ok/8 px-4 py-2.5 text-[13px] text-ok">
          <span>{mensajeOk}</span>
          <div className="flex items-center gap-2">
            {ultimaVentaId && (
              <>
                <button
                  className="flex items-center gap-1 rounded border border-ok/30 px-2 py-0.5 text-[11px] font-semibold hover:bg-ok/10"
                  onClick={async () => {
                    const det = await window.api.detalleVenta(ultimaVentaId)
                    if (det) await verPdfVenta(det)
                  }}
                >
                  <FileText size={11} /> Ver PDF
                </button>
                <button
                  className="flex items-center gap-1 rounded border border-ok/30 px-2 py-0.5 text-[11px] font-semibold hover:bg-ok/10"
                  onClick={async () => {
                    const det = await window.api.detalleVenta(ultimaVentaId)
                    if (det) await imprimirVenta(det)
                  }}
                >
                  <Printer size={11} /> Imprimir
                </button>
              </>
            )}
            <button onClick={() => { setMensajeOk(''); setUltimaVentaId(null) }} className="ml-1 text-ok/60 hover:text-ok">x</button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded border border-line bg-panel">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-app text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">#</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Fecha</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Cliente</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Total</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-app">
                <td className="px-4 py-2.5 font-mono text-[12px] text-muted">{p.id}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-muted">{fmtFecha(p.fecha)}</td>
                <td className="px-4 py-2.5 font-medium text-ink">{p.cliente_nombre ?? 'Mostrador'}</td>
                <td className="px-4 py-2.5 text-right font-mono font-semibold">{money(p.total)}</td>
                <td className="px-4 py-2.5">
                  <Badge tone={TONO[p.estado]}>{p.estado}</Badge>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => verPdf(p.id)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-line hover:text-ink"
                      title="Ver PDF"
                    >
                      <FileText size={13} />
                    </button>
                    <button
                      onClick={() => imprimir(p.id)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-line hover:text-ink"
                      title="Imprimir"
                    >
                      <Printer size={13} />
                    </button>
                    {p.estado === 'vigente' && (
                      <>
                        <button
                          onClick={() => iniciarAprobar(p)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-ok/40 hover:text-ok"
                          title="Aprobar"
                        >
                          <CheckCheck size={13} />
                        </button>
                        <button
                          onClick={() => anular(p.id)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-danger/30 hover:text-danger"
                          title="Anular"
                        >
                          <Ban size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Sin presupuestos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment modal for approving a presupuesto */}
      {presupAprobando && (
        <Modal
          open={modalPago}
          title={`Confirmar venta — Presupuesto #${presupAprobando.id}`}
          onClose={() => setModalPago(false)}
          footer={
            <>
              <span className="mr-auto font-mono text-lg font-bold text-ink">{money(presupAprobando.total)}</span>
              <Button variant="secondary" onClick={() => setModalPago(false)}>Cancelar</Button>
              <Button
                onClick={confirmarVenta}
                disabled={
                  (medio === 'cheque' && !chequeForm.fechaCobro) ||
                  (dosPagos && medio2 === 'cheque' && !chequeForm2.fechaCobro)
                }
              >
                Confirmar venta
              </Button>
            </>
          }
        >
          {errorPago && (
            <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-3 py-2 text-[12px] text-danger">
              <span>{errorPago}</span>
              <button onClick={() => setErrorPago('')} className="ml-2 text-danger/60 hover:text-danger">x</button>
            </div>
          )}

          {/* Toggle 2 formas de pago */}
          <label className="mb-3 flex cursor-pointer items-center gap-2 text-[13px] text-muted">
            <input
              type="checkbox"
              checked={dosPagos}
              onChange={(e) => {
                setDosPagos(e.target.checked)
                setMonto1Str('')
                setChequeForm(FORM_CHEQUE_VACIO)
                setChequeForm2(FORM_CHEQUE_VACIO)
              }}
              className="accent-primary"
            />
            2 formas de pago
          </label>

          {!dosPagos ? (
            <>
              <div className="mb-3 grid grid-cols-5 gap-1">
                {MEDIOS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setMedio(m.id); setChequeForm(FORM_CHEQUE_VACIO) }}
                    className={
                      'rounded py-1.5 text-[12px] font-semibold transition-colors ' +
                      (medio === m.id ? 'bg-primary text-white' : 'border border-line text-muted hover:border-ink/30 hover:text-ink')
                    }
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {medio === 'cheque' && <ChequeFormPanel form={chequeForm} onChange={setChequeForm} />}
            </>
          ) : (
            <>
              {/* Forma 1 */}
              <div className="mb-3 rounded border border-line bg-app px-3 py-2.5">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Forma 1</div>
                <div className="mb-2 grid grid-cols-5 gap-1">
                  {MEDIOS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setMedio(m.id); setChequeForm(FORM_CHEQUE_VACIO) }}
                      className={
                        'rounded py-1.5 text-[12px] font-semibold transition-colors ' +
                        (medio === m.id ? 'bg-primary text-white' : 'border border-line text-muted hover:border-ink/30 hover:text-ink')
                      }
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={monto1Str}
                  onChange={(e) => setMonto1Str(e.target.value)}
                  placeholder={`Monto (total: ${money(presupAprobando.total)})`}
                  className="w-full rounded border border-line bg-panel px-2.5 py-1.5 text-[13px] font-mono outline-none focus:border-primary"
                />
                {medio === 'cheque' && <div className="mt-2"><ChequeFormPanel form={chequeForm} onChange={setChequeForm} /></div>}
              </div>

              {/* Forma 2 */}
              <div className="rounded border border-line bg-app px-3 py-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Forma 2</span>
                  <span className="font-mono text-[13px] font-semibold text-primary">
                    {money(Math.max(0, presupAprobando.total - (parseFloat(monto1Str) || 0)))}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {MEDIOS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setMedio2(m.id); setChequeForm2(FORM_CHEQUE_VACIO) }}
                      className={
                        'rounded py-1.5 text-[12px] font-semibold transition-colors ' +
                        (medio2 === m.id ? 'bg-primary text-white' : 'border border-line text-muted hover:border-ink/30 hover:text-ink')
                      }
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {medio2 === 'cheque' && <div className="mt-2"><ChequeFormPanel form={chequeForm2} onChange={setChequeForm2} /></div>}
              </div>
            </>
          )}
        </Modal>
      )}

      <Modal
        open={modal}
        title="Nuevo presupuesto"
        onClose={() => setModal(false)}
        footer={
          <>
            <span className="mr-auto font-mono text-lg font-bold text-ink">{money(total)}</span>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button disabled={carrito.length === 0} onClick={guardar}>Crear presupuesto</Button>
          </>
        }
      >
        {errorGuardar && (
          <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-3 py-2 text-[12px] text-danger">
            <span>{errorGuardar}</span>
            <button onClick={() => setErrorGuardar('')} className="ml-3 text-danger/60 hover:text-danger">✕</button>
          </div>
        )}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <Field label="Cliente">
            <select
              value={clienteId ?? ''}
              onChange={(e) => {
                const id = e.target.value ? Number(e.target.value) : null
                setClienteId(id)
                const c = clientes.find((x) => x.id === id)
                if (c) setListaPrecio(c.tipo === 'mayorista' ? 'mayorista' : 'consumidor')
              }}
              className="w-full rounded border border-line bg-panel px-3 py-[7px] text-[13px] outline-none focus:border-primary"
            >
              <option value="">Mostrador</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </Field>
          <Field label="Lista de precio">
            <select
              value={listaPrecio}
              onChange={(e) => setListaPrecio(e.target.value as Lista)}
              className="w-full rounded border border-line bg-panel px-3 py-[7px] text-[13px] outline-none focus:border-primary"
            >
              <option value="consumidor">Consumidor final</option>
              <option value="mayorista">Mayorista</option>
            </select>
          </Field>
        </div>

        <TextInput
          placeholder="Buscar artículo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {resultados.length > 0 && (
          <div className="mt-1.5 overflow-hidden rounded border border-line">
            {resultados.slice(0, 6).map((a) => (
              <button
                key={a.id}
                onClick={() => agregar(a)}
                className="flex w-full justify-between border-b border-line px-3 py-2 text-left text-[13px] last:border-0 hover:bg-app"
              >
                <span>{a.nombre}</span>
                <span className="font-mono">{money(precioDe(a, listaPrecio))}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-3">
          {carrito.map((it) => (
            <div key={it.art.id} className="flex items-center justify-between border-b border-line py-2 text-[13px]">
              <span className="flex-1 text-ink">{it.art.nombre}</span>
              <span className="font-mono mx-3 text-muted">×{it.cantidad}</span>
              <span className="font-mono w-20 text-right font-medium">{money(precioDe(it.art, listaPrecio) * it.cantidad)}</span>
            </div>
          ))}
          {carrito.length === 0 && (
            <p className="py-4 text-center text-[13px] text-muted">Agregá artículos.</p>
          )}
        </div>
      </Modal>
    </Page>
  )
}
