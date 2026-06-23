import { useEffect, useRef, useState } from 'react'
import { FileText, Printer, Minus, Plus, Scan, UserCircle, CheckCircle2 } from 'lucide-react'
import Page from '../components/Page'
import { Button, TextInput, Field, Badge } from '../components/ui'
import { money } from '../lib/format'
import { imprimirVenta, verPdfVenta } from '../lib/print'
import type { ArticuloConPrecios, Cliente } from '../../../preload'

type Lista = 'mayorista' | 'consumidor'
type Medio = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'cheque'
interface ItemCarrito {
  art: ArticuloConPrecios
  cantidad: number
}

interface ChequeForm {
  numero: string
  banco: string
  librador: string
  tipo: 'personal' | 'empresa'
  fechaEmision: string
  fechaCobro: string
}

const FORM_CHEQUE_VACIO: ChequeForm = { numero: '', banco: '', librador: '', tipo: 'personal', fechaEmision: '', fechaCobro: '' }

const MEDIOS: { id: Medio; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transfer.' },
  { id: 'debito', label: 'Débito' },
  { id: 'credito', label: 'Crédito' },
  { id: 'cheque', label: 'Cheque' }
]

function precioDe(art: ArticuloConPrecios, lista: Lista): number {
  if (art.en_oferta && art.precio_oferta != null) return art.precio_oferta
  return lista === 'mayorista' ? art.precios.mayorista : art.precios.consumidor
}

export default function Ventas(): JSX.Element {
  const [lista, setLista] = useState<Lista>('consumidor')
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ArticuloConPrecios[]>([])
  const [medio, setMedio] = useState<Medio>('efectivo')
  const [chequeForm, setChequeForm] = useState<ChequeForm>(FORM_CHEQUE_VACIO)
  const [mensaje, setMensaje] = useState('')
  const [mensajeError, setMensajeError] = useState(false)
  const [ultimaVentaId, setUltimaVentaId] = useState<number | null>(null)
  const scanRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.api.listClientes().then(setClientes)
    scanRef.current?.focus()
  }, [])

  useEffect(() => {
    if (busqueda.trim().length < 2) {
      setResultados([])
      return
    }
    window.api.listArticulos(busqueda).then(setResultados)
  }, [busqueda])

  const total = carrito.reduce((s, it) => s + precioDe(it.art, lista) * it.cantidad, 0)

  function agregar(art: ArticuloConPrecios): void {
    setCarrito((prev) => {
      const i = prev.findIndex((it) => it.art.id === art.id)
      if (i >= 0) {
        const copy = [...prev]
        copy[i] = { ...copy[i], cantidad: copy[i].cantidad + 1 }
        return copy
      }
      return [...prev, { art, cantidad: 1 }]
    })
    setBusqueda('')
    setResultados([])
    setMensaje('')
    setMensajeError(false)
    setUltimaVentaId(null)
    scanRef.current?.focus()
  }

  async function onScan(e: React.KeyboardEvent<HTMLInputElement>): Promise<void> {
    if (e.key !== 'Enter') return
    const codigo = (e.target as HTMLInputElement).value.trim()
    if (!codigo) return
    try {
      const art = await window.api.buscarCodigo(codigo)
      if (art) agregar(art)
      else setBusqueda(codigo)
    } catch (ex) {
      const raw = ex instanceof Error ? ex.message : String(ex)
      setMensaje(raw.replace(/^Error invoking remote method '[^']+': Error: /, ''))
      setMensajeError(true)
    }
    if (scanRef.current) scanRef.current.value = ''
  }

  function cambiarCantidad(id: number, delta: number): void {
    setCarrito((prev) =>
      prev
        .map((it) => (it.art.id === id ? { ...it, cantidad: Math.max(0, it.cantidad + delta) } : it))
        .filter((it) => it.cantidad > 0)
    )
  }

  async function cobrar(fiar: boolean): Promise<void> {
    if (carrito.length === 0) return
    if (fiar && !clienteId) return
    if (medio === 'cheque' && !chequeForm.fechaCobro) {
      setMensaje('Para pagar con cheque tenés que completar la fecha de cobro.')
      return
    }
    const items = carrito.map((it) => ({
      articuloId: it.art.id,
      cantidad: it.cantidad,
      precioUnit: precioDe(it.art, lista)
    }))
    const pagos = fiar ? [] : [{ medio, monto: total }]
    let r: { ventaId: number; total: number }
    try {
      r = await window.api.crearVenta({ clienteId, lista, items, pagos })
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e)
      setMensaje(raw.replace(/^Error invoking remote method '[^']+': Error: /, ''))
      setMensajeError(true)
      return
    }

    if (!fiar && medio === 'cheque') {
      try {
        await window.api.registrarCheque({
          numero: chequeForm.numero.trim() || null,
          banco: chequeForm.banco.trim() || null,
          monto: total,
          fechaEmision: chequeForm.fechaEmision || null,
          fechaCobro: chequeForm.fechaCobro,
          librador: chequeForm.librador.trim() || null,
          tipo: chequeForm.tipo,
          origenTipo: 'venta',
          origenId: r.ventaId
        })
      } catch {
        setCarrito([])
        setUltimaVentaId(r.ventaId)
        setChequeForm(FORM_CHEQUE_VACIO)
        setMensaje(`Venta #${r.ventaId} registrada, pero el cheque no se pudo guardar. Registralo manualmente en la sección Cheques.`)
        setMensajeError(true)
        return
      }
      setChequeForm(FORM_CHEQUE_VACIO)
    }

    setCarrito([])
    setUltimaVentaId(r.ventaId)
    setMensajeError(false)
    if (fiar) {
      setMedio('efectivo')
      setChequeForm(FORM_CHEQUE_VACIO)
    }
    setMensaje(
      fiar
        ? `Venta #${r.ventaId} a cuenta corriente por ${money(r.total)}.`
        : `Venta #${r.ventaId} cobrada por ${money(r.total)} — ${medio}.`
    )
    scanRef.current?.focus()
  }

  return (
    <Page titulo="Punto de venta">
      <div className="flex h-full gap-5">
        {/* Izquierda: búsqueda */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Controles de lista y cliente */}
          <div className="mb-3 flex gap-2">
            <div className="flex overflow-hidden rounded border border-line bg-panel">
              {(['consumidor', 'mayorista'] as Lista[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLista(l)}
                  className={
                    'px-3 py-[7px] text-[13px] font-semibold transition-colors ' +
                    (lista === l ? 'bg-primary text-white' : 'text-muted hover:text-ink')
                  }
                >
                  {l === 'consumidor' ? 'Consumidor' : 'Mayorista'}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <UserCircle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <select
                value={clienteId ?? ''}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : null
                  setClienteId(id)
                  const c = clientes.find((x) => x.id === id)
                  if (c) setLista(c.tipo === 'mayorista' ? 'mayorista' : 'consumidor')
                }}
                className="w-full rounded border border-line bg-panel py-[7px] pl-8 pr-3 text-[13px] text-ink outline-none focus:border-primary"
              >
                <option value="">Mostrador</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scanner */}
          <div className="relative mb-2">
            <Scan size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              ref={scanRef}
              onKeyDown={onScan}
              placeholder="Escanear código de barras y Enter..."
              className="w-full rounded border-2 border-primary bg-panel py-2.5 pl-10 pr-4 text-[13px] text-ink placeholder-muted/50 outline-none"
            />
          </div>

          {/* Búsqueda por nombre */}
          <TextInput
            placeholder="Buscar por nombre, código o rubro..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {/* Resultados */}
          {resultados.length > 0 && (
            <div className="mt-1.5 overflow-hidden rounded border border-line bg-panel shadow-sm">
              {resultados.slice(0, 8).map((a) => (
                <button
                  key={a.id}
                  onClick={() => agregar(a)}
                  className="flex w-full items-center justify-between border-b border-line px-4 py-2.5 text-left last:border-0 hover:bg-app"
                >
                  <span className="text-[13px] text-ink">{a.nombre}</span>
                  <span className="font-mono text-[13px] font-medium">{money(precioDe(a, lista))}</span>
                </button>
              ))}
            </div>
          )}

          {/* Banner resultado */}
          {mensaje && (
            <div className={`mt-4 flex items-center gap-3 rounded border px-4 py-3 ${mensajeError ? 'border-danger/30 bg-danger/8' : 'border-ok/30 bg-ok/8'}`}>
              <CheckCircle2 size={16} className={`shrink-0 ${mensajeError ? 'text-danger' : 'text-ok'}`} />
              <span className={`flex-1 text-[13px] ${mensajeError ? 'text-danger' : 'text-ok'}`}>{mensaje}</span>
              {ultimaVentaId && (
                <div className="flex shrink-0 gap-1">
                  <button
                    className="flex items-center gap-1.5 rounded border border-ok/30 px-2.5 py-1 text-[12px] font-semibold text-ok transition-colors hover:bg-ok/10"
                    onClick={async () => {
                      try {
                        const det = await window.api.detalleVenta(ultimaVentaId)
                        if (det) await verPdfVenta(det)
                      } catch (e) {
                        setMensaje(`Error: ${e instanceof Error ? e.message : String(e)}`)
                      }
                    }}
                  >
                    <FileText size={12} />
                    Ver PDF
                  </button>
                  <button
                    className="flex items-center gap-1.5 rounded border border-ok/30 px-2.5 py-1 text-[12px] font-semibold text-ok transition-colors hover:bg-ok/10"
                    onClick={async () => {
                      try {
                        const det = await window.api.detalleVenta(ultimaVentaId)
                        if (det) await imprimirVenta(det)
                      } catch (e) {
                        setMensaje(`Error: ${e instanceof Error ? e.message : String(e)}`)
                      }
                    }}
                  >
                    <Printer size={12} />
                    Imprimir
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Derecha: ticket */}
        <div className="flex w-[380px] flex-shrink-0 flex-col rounded-lg border border-line bg-panel">
          <div className="border-b border-line px-4 py-3">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">Ticket</span>
          </div>

          <div className="flex-1 overflow-auto">
            {carrito.length === 0 && (
              <p className="px-4 py-10 text-center text-[13px] text-muted">Sin productos.</p>
            )}
            {carrito.map((it) => (
              <div key={it.art.id} className="flex items-center gap-3 border-b border-line px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium text-ink">{it.art.nombre}</div>
                  <div className="font-mono text-[11px] text-muted">{money(precioDe(it.art, lista))} c/u</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => cambiarCantidad(it.art.id, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-line text-muted hover:border-ink hover:text-ink"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="font-mono w-7 text-center text-[13px] font-medium">{it.cantidad}</span>
                  <button
                    onClick={() => cambiarCantidad(it.art.id, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded border border-line text-muted hover:border-ink hover:text-ink"
                  >
                    <Plus size={11} />
                  </button>
                </div>
                <div className="font-mono w-20 text-right text-[13px] font-semibold text-ink">
                  {money(precioDe(it.art, lista) * it.cantidad)}
                </div>
              </div>
            ))}
          </div>

          {/* Footer: total + cobrar */}
          <div className="border-t border-line p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[12px] font-semibold uppercase tracking-wider text-muted">Total</span>
              <span className="font-mono text-3xl font-bold text-ink">{money(total)}</span>
            </div>

            {/* Medios de pago */}
            <div className="mb-2 grid grid-cols-5 gap-1">
              {MEDIOS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMedio(m.id); setChequeForm(FORM_CHEQUE_VACIO) }}
                  className={
                    'rounded py-1.5 text-[11px] font-semibold transition-colors ' +
                    (medio === m.id
                      ? 'bg-primary text-white'
                      : 'border border-line text-muted hover:border-ink/30 hover:text-ink')
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Datos del cheque — solo cuando está seleccionado */}
            {medio === 'cheque' && (
              <div className="mb-3 grid grid-cols-2 gap-2 rounded border border-line bg-app p-2.5">
                <Field label="N° Cheque">
                  <input
                    type="text"
                    value={chequeForm.numero}
                    onChange={(e) => setChequeForm((f) => ({ ...f, numero: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full rounded border border-line bg-panel px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Banco">
                  <input
                    type="text"
                    value={chequeForm.banco}
                    onChange={(e) => setChequeForm((f) => ({ ...f, banco: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full rounded border border-line bg-panel px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-primary"
                  />
                </Field>
                <Field label="A nombre de" className="col-span-2">
                  <input
                    type="text"
                    value={chequeForm.librador}
                    onChange={(e) => setChequeForm((f) => ({ ...f, librador: e.target.value }))}
                    placeholder="Nombre o razón social"
                    className="w-full rounded border border-line bg-panel px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Fecha de emisión">
                  <input
                    type="date"
                    value={chequeForm.fechaEmision}
                    onChange={(e) => setChequeForm((f) => ({ ...f, fechaEmision: e.target.value }))}
                    className="w-full rounded border border-line bg-panel px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Fecha de cobro">
                  <input
                    type="date"
                    value={chequeForm.fechaCobro}
                    onChange={(e) => setChequeForm((f) => ({ ...f, fechaCobro: e.target.value }))}
                    className="w-full rounded border border-line bg-panel px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-primary"
                  />
                </Field>
                <Field label="Tipo" className="col-span-2">
                  <select
                    value={chequeForm.tipo}
                    onChange={(e) => setChequeForm((f) => ({ ...f, tipo: e.target.value as 'personal' | 'empresa' }))}
                    className="w-full rounded border border-line bg-panel px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-primary"
                  >
                    <option value="personal">Personal</option>
                    <option value="empresa">Empresa</option>
                  </select>
                </Field>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={carrito.length === 0 || (medio === 'cheque' && !chequeForm.fechaCobro)}
                onClick={() => cobrar(false)}
              >
                Cobrar {total > 0 && money(total)}
              </Button>
              <Button
                variant="secondary"
                disabled={carrito.length === 0 || !clienteId}
                onClick={() => cobrar(true)}
                title={clienteId ? 'Cargar a cuenta corriente' : 'Seleccioná un cliente primero'}
              >
                Cta. Cte.
              </Button>
            </div>

            {clienteId ? (
              <div className="mt-2 text-center">
                <Badge tone="primary">
                  {clientes.find((c) => c.id === clienteId)?.nombre}
                </Badge>
              </div>
            ) : (
              <p className="mt-2 text-center text-[11px] text-muted">
                Seleccioná un cliente para habilitar Cta. Cte.
              </p>
            )}
          </div>
        </div>
      </div>
    </Page>
  )
}
