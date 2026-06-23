import { useEffect, useState, Fragment } from 'react'
import { Plus, ChevronDown, ChevronUp, Pencil, Trash2, FileText, CreditCard } from 'lucide-react'
import Page from '../components/Page'
import { Button, TextInput, Field, Modal, Badge } from '../components/ui'
import { money } from '../lib/format'
import type { Proveedor, FacturaProveedor, ChequeCartera } from '../../../preload'

type Medio = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'cheque'

interface FormProv {
  nombre: string
  cuit: string
  telefono: string
  email: string
}

const FORM_VACIO: FormProv = { nombre: '', cuit: '', telefono: '', email: '' }

export default function Proveedores(): JSX.Element {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [filtro, setFiltro] = useState('')
  const [expandido, setExpandido] = useState<number | null>(null)
  const [facturasMap, setFacturasMap] = useState<Record<number, FacturaProveedor[]>>({})

  const [modalProv, setModalProv] = useState(false)
  const [editando, setEditando] = useState<Proveedor | null>(null)
  const [form, setForm] = useState<FormProv>(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardarProv, setErrorGuardarProv] = useState<string | null>(null)
  const [errorFactura, setErrorFactura] = useState<string | null>(null)

  const [modalFactura, setModalFactura] = useState<Proveedor | null>(null)
  const [montoFactura, setMontoFactura] = useState('')
  const [numFactura, setNumFactura] = useState('')

  const [modalPago, setModalPago] = useState<{ prov: Proveedor; factura: FacturaProveedor | null } | null>(null)
  const [montoPago, setMontoPago] = useState('')
  const [medioPago, setMedioPago] = useState<Medio>('efectivo')
  const [pagando, setPagando] = useState(false)
  const [chequesCartera, setChequesCartera] = useState<ChequeCartera[]>([])
  const [chequeId, setChequeId] = useState<number | null>(null)
  const [errorPago, setErrorPago] = useState<string | null>(null)
  const [errorProv, setErrorProv] = useState<string | null>(null)

  function recargar(): void {
    window.api.listProveedores(filtro).then(setProveedores)
  }
  useEffect(recargar, [filtro])

  async function toggleExpandido(id: number): Promise<void> {
    if (expandido === id) { setExpandido(null); return }
    setExpandido(id)
    if (!facturasMap[id]) {
      const f = await window.api.facturasProveedor(id)
      setFacturasMap((m) => ({ ...m, [id]: f }))
    }
  }

  function abrirNuevo(): void {
    setEditando(null)
    setForm(FORM_VACIO)
    setErrorGuardarProv(null)
    setModalProv(true)
  }

  function abrirEditar(p: Proveedor): void {
    setEditando(p)
    setForm({ nombre: p.nombre, cuit: p.cuit ?? '', telefono: p.telefono ?? '', email: p.email ?? '' })
    setErrorGuardarProv(null)
    setModalProv(true)
  }

  async function guardarProv(): Promise<void> {
    if (!form.nombre.trim()) return
    setGuardando(true)
    try {
      const data = {
        nombre: form.nombre.trim(),
        cuit: form.cuit.trim() || null,
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null
      }
      if (editando) {
        await window.api.actualizarProveedor(editando.id, data)
      } else {
        await window.api.crearProveedor(data)
      }
      setModalProv(false)
      setFacturasMap({})
      recargar()
    } catch (e) {
      setErrorGuardarProv(e instanceof Error ? e.message : 'No se pudo guardar el proveedor')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminarProv(id: number): Promise<void> {
    if (!confirm('¿Eliminar este proveedor?')) return
    try {
      await window.api.eliminarProveedor(id)
      recargar()
    } catch (e) {
      setErrorProv(e instanceof Error ? e.message : 'No se pudo eliminar el proveedor')
    }
  }

  async function cargarFactura(): Promise<void> {
    if (!modalFactura || !montoFactura) return
    const monto = Number(montoFactura)
    if (monto <= 0) return
    setErrorFactura(null)
    setGuardando(true)
    try {
      await window.api.cargarFacturaProveedor(modalFactura.id, monto, numFactura.trim() || undefined)
      setModalFactura(null)
      setMontoFactura('')
      setNumFactura('')
      setFacturasMap({})
      recargar()
    } catch (e) {
      setErrorFactura(e instanceof Error ? e.message : 'No se pudo cargar la factura')
    } finally {
      setGuardando(false)
    }
  }

  async function cargarChequesCartera(): Promise<void> {
    try {
      const cheques = await window.api.chequesEnCartera()
      setChequesCartera(cheques)
      if (cheques[0]) {
        setChequeId(cheques[0].id)
        setMontoPago(String(cheques[0].monto))
      }
    } catch (e) {
      setErrorPago(e instanceof Error ? e.message : 'No se pudieron cargar los cheques')
    }
  }

  async function registrarPago(): Promise<void> {
    if (!modalPago || !montoPago) return
    const monto = Number(montoPago)
    if (monto <= 0) return
    if (medioPago === 'cheque' && !chequeId) return
    setErrorPago(null)
    setPagando(true)
    try {
      await window.api.pagarProveedor({
        proveedorId: modalPago.prov.id,
        facturaId: modalPago.factura?.id ?? null,
        medioPago,
        chequeId: medioPago === 'cheque' ? chequeId : null,
        monto
      })
      setModalPago(null)
      setMontoPago('')
      setMedioPago('efectivo')
      setChequeId(null)
      setChequesCartera([])
      setFacturasMap({})
      recargar()
    } catch (e) {
      setErrorPago(e instanceof Error ? e.message : 'No se pudo registrar el pago')
    } finally {
      setPagando(false)
    }
  }

  const totalDeuda = proveedores.reduce((s, p) => s + p.saldo_cta_cte, 0)

  return (
    <Page titulo="Proveedores">
      <div className="mb-4 flex items-center gap-3">
        <TextInput
          placeholder="Buscar por nombre o CUIT..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="flex-1"
        />
        <Button onClick={abrirNuevo}>
          <Plus size={14} />
          Nuevo proveedor
        </Button>
      </div>

      {errorProv && (
        <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-4 py-2.5 text-[13px] text-danger">
          <span>{errorProv}</span>
          <button onClick={() => setErrorProv(null)} className="ml-3 text-danger/60 hover:text-danger">✕</button>
        </div>
      )}

      {totalDeuda > 0 && (
        <div className="mb-4 flex items-center justify-between rounded border border-line bg-panel px-4 py-3">
          <span className="text-[13px] text-muted">
            {proveedores.filter(p => p.saldo_cta_cte > 0).length} proveedor(es) con saldo
          </span>
          <span className="font-mono text-[15px] font-semibold text-danger">
            Total adeudado: {money(totalDeuda)}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded border border-line bg-panel">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-app text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Proveedor</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">CUIT</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Contacto</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Saldo</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {proveedores.map((p) => (
              <Fragment key={p.id}>
                <tr
                  className="cursor-pointer border-b border-line last:border-0 hover:bg-app"
                  onClick={() => toggleExpandido(p.id)}
                >
                  <td className="px-4 py-2.5 font-medium text-ink">{p.nombre}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-muted">{p.cuit ?? '—'}</td>
                  <td className="px-4 py-2.5 text-muted">
                    {p.telefono ?? p.email ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold">
                    <span className={p.saldo_cta_cte > 0 ? 'text-danger' : 'text-ok'}>
                      {money(p.saldo_cta_cte)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); setModalFactura(p); setMontoFactura(''); setNumFactura('') }}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:text-primary"
                        title="Cargar factura"
                      >
                        <FileText size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setModalPago({ prov: p, factura: null }); setMontoPago(p.saldo_cta_cte > 0 ? String(p.saldo_cta_cte) : '') }}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:text-ok"
                        title="Registrar pago"
                      >
                        <CreditCard size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirEditar(p) }}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:text-ink"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); eliminarProv(p.id) }}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted transition-colors hover:text-danger"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                      {expandido === p.id ? <ChevronUp size={13} className="text-muted" /> : <ChevronDown size={13} className="text-muted" />}
                    </div>
                  </td>
                </tr>

                {expandido === p.id && (
                  <tr key={`${p.id}-facturas`} className="border-b border-line bg-app/50">
                    <td colSpan={5} className="px-6 pb-3 pt-2">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Facturas
                      </p>
                      {(facturasMap[p.id] ?? []).length === 0 ? (
                        <p className="text-[12px] text-muted">Sin facturas cargadas.</p>
                      ) : (
                        <div className="space-y-1">
                          {(facturasMap[p.id] ?? []).map((f) => (
                            <div key={f.id} className="flex items-center justify-between text-[12px]">
                              <span className="text-muted">
                                {f.numero ? `Factura ${f.numero}` : `Factura #${f.id}`} — {f.fecha?.slice(0, 10)}
                              </span>
                              <div className="flex items-center gap-3">
                                <Badge tone={f.estado === 'pagada' ? 'ok' : f.estado === 'parcial' ? 'warn' : 'danger'}>
                                  {f.estado}
                                </Badge>
                                <span className="font-mono text-muted">Total: {money(f.total)}</span>
                                <span className="font-mono font-semibold text-danger">Saldo: {money(f.saldo)}</span>
                                {f.estado !== 'pagada' && (
                                  <button
                                    onClick={() => { setModalPago({ prov: p, factura: f }); setMontoPago(String(f.saldo)); setMedioPago('efectivo') }}
                                    className="text-[11px] text-primary hover:underline"
                                  >
                                    Pagar
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {proveedores.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Sin proveedores. Hacé clic en "Nuevo proveedor" para agregar uno.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal ABM Proveedor */}
      <Modal
        open={modalProv}
        title={editando ? 'Editar proveedor' : 'Nuevo proveedor'}
        onClose={() => { setModalProv(false); setErrorGuardarProv(null) }}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalProv(false); setErrorGuardarProv(null) }}>Cancelar</Button>
            <Button onClick={guardarProv} disabled={guardando || !form.nombre.trim()}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        {errorGuardarProv && (
          <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-3 py-2 text-[12px] text-danger">
            <span>{errorGuardarProv}</span>
            <button onClick={() => setErrorGuardarProv(null)} className="ml-3 text-danger/60 hover:text-danger">✕</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre" className="col-span-2">
            <TextInput
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="CUIT">
            <TextInput
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
              placeholder="20-12345678-9"
            />
          </Field>
          <Field label="Teléfono">
            <TextInput
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />
          </Field>
          <Field label="Email" className="col-span-2">
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      {/* Modal cargar factura */}
      <Modal
        open={!!modalFactura}
        title={`Cargar factura — ${modalFactura?.nombre}`}
        onClose={() => { setModalFactura(null); setErrorFactura(null) }}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalFactura(null); setErrorFactura(null) }}>Cancelar</Button>
            <Button onClick={cargarFactura} disabled={guardando || !montoFactura}>
              {guardando ? 'Cargando...' : 'Cargar factura'}
            </Button>
          </>
        }
      >
        {errorFactura && (
          <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-3 py-2 text-[12px] text-danger">
            <span>{errorFactura}</span>
            <button onClick={() => setErrorFactura(null)} className="ml-3 text-danger/60 hover:text-danger">✕</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="N° Factura">
            <TextInput
              value={numFactura}
              onChange={(e) => setNumFactura(e.target.value)}
              placeholder="0001-00001234"
            />
          </Field>
          <Field label="Monto total">
            <TextInput
              type="number"
              value={montoFactura}
              onChange={(e) => setMontoFactura(e.target.value)}
              autoFocus
            />
          </Field>
        </div>
      </Modal>

      {/* Modal registrar pago */}
      <Modal
        open={!!modalPago}
        title={`Pagar a ${modalPago?.prov.nombre}`}
        onClose={() => { setModalPago(null); setChequesCartera([]); setChequeId(null); setErrorPago(null) }}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalPago(null); setChequesCartera([]); setChequeId(null); setErrorPago(null) }}>Cancelar</Button>
            <Button onClick={registrarPago} disabled={pagando || !montoPago}>
              {pagando ? 'Registrando...' : 'Registrar pago'}
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
        {modalPago && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Medio de pago">
              <select
                value={medioPago}
                onChange={(e) => {
                  const m = e.target.value as Medio
                  setMedioPago(m)
                  if (m === 'cheque' && chequesCartera.length === 0) cargarChequesCartera()
                }}
                className="w-full rounded border border-line bg-panel px-3 py-[7px] text-[13px] outline-none focus:border-primary"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="debito">Débito</option>
                <option value="credito">Crédito</option>
                <option value="cheque">Cheque de cartera</option>
              </select>
            </Field>
            <Field label="Monto">
              <TextInput
                type="number"
                value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
              />
            </Field>
            {medioPago === 'cheque' && (
              <Field label="Cheque a entregar" className="col-span-2">
                {chequesCartera.length === 0 ? (
                  <p className="rounded border border-warn/30 bg-warn/8 px-3 py-2 text-[12px] text-warn">
                    No hay cheques en cartera disponibles.
                  </p>
                ) : (
                  <select
                    value={chequeId ?? ''}
                    onChange={(e) => {
                      const id = Number(e.target.value)
                      setChequeId(id)
                      const c = chequesCartera.find((x) => x.id === id)
                      if (c) setMontoPago(String(c.monto))
                    }}
                    className="w-full rounded border border-line bg-panel px-3 py-[7px] text-[13px] outline-none focus:border-primary"
                  >
                    {chequesCartera.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.numero ? `N° ${c.numero}` : `Cheque #${c.id}`}
                        {c.banco ? ` — ${c.banco}` : ''}
                        {` — ${money(c.monto)}`}
                        {` (cobro: ${c.fecha_cobro?.slice(0, 10)})`}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            )}
            {modalPago.factura && (
              <p className="col-span-2 text-[12px] text-muted">
                Factura #{modalPago.factura.id} — Saldo: <span className="font-semibold text-danger">{money(modalPago.factura.saldo)}</span>
              </p>
            )}
            <div className="col-span-2 space-y-1">
              <p className="text-[12px] text-muted">
                Saldo proveedor: <span className="font-semibold text-danger">{money(modalPago.prov.saldo_cta_cte)}</span>
              </p>
              {Number(montoPago) > modalPago.prov.saldo_cta_cte + 0.01 && (
                <p className="text-[12px] text-danger">El monto supera el saldo del proveedor.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Page>
  )
}
