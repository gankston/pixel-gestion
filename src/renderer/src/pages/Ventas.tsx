import { useEffect, useRef, useState } from 'react'
import { FileText, Printer, Minus, Plus, Scan, UserCircle, CheckCircle2 } from 'lucide-react'
import Page from '../components/Page'
import { Button, TextInput, Badge } from '../components/ui'
import { money } from '../lib/format'
import { imprimirVenta, verPdfVenta } from '../lib/print'
import type { ArticuloConPrecios, Cliente } from '../../../preload'

type Lista = 'mayorista' | 'consumidor'
type Medio = 'efectivo' | 'transferencia' | 'debito' | 'credito'
interface ItemCarrito {
  art: ArticuloConPrecios
  cantidad: number
}

const MEDIOS: { id: Medio; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transfer.' },
  { id: 'debito', label: 'Débito' },
  { id: 'credito', label: 'Crédito' }
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
  const [mensaje, setMensaje] = useState('')
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
    setUltimaVentaId(null)
    scanRef.current?.focus()
  }

  async function onScan(e: React.KeyboardEvent<HTMLInputElement>): Promise<void> {
    if (e.key !== 'Enter') return
    const codigo = (e.target as HTMLInputElement).value.trim()
    if (!codigo) return
    const art = await window.api.buscarCodigo(codigo)
    if (art) agregar(art)
    else setBusqueda(codigo)
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
    if (fiar && !clienteId) {
      setMensaje('Para fiar tenes que elegir un cliente.')
      return
    }
    const items = carrito.map((it) => ({
      articuloId: it.art.id,
      cantidad: it.cantidad,
      precioUnit: precioDe(it.art, lista)
    }))
    const pagos = fiar ? [] : [{ medio, monto: total }]
    const r = await window.api.crearVenta({ clienteId, lista, items, pagos })
    setCarrito([])
    setUltimaVentaId(r.ventaId)
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
                onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
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
            <div className="mt-4 flex items-center gap-3 rounded border border-ok/30 bg-ok/8 px-4 py-3">
              <CheckCircle2 size={16} className="shrink-0 text-ok" />
              <span className="flex-1 text-[13px] text-ok">{mensaje}</span>
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
            <div className="mb-3 grid grid-cols-4 gap-1">
              {MEDIOS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMedio(m.id)}
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

            <div className="flex gap-2">
              <Button
                className="flex-1"
                disabled={carrito.length === 0}
                onClick={() => cobrar(false)}
              >
                Cobrar {total > 0 && money(total)}
              </Button>
              <Button
                variant="secondary"
                disabled={carrito.length === 0}
                onClick={() => cobrar(true)}
                title="Cargar a cuenta corriente"
              >
                Fiar
              </Button>
            </div>

            {clienteId && (
              <div className="mt-2 text-center">
                <Badge tone="primary">
                  {clientes.find((c) => c.id === clienteId)?.nombre}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  )
}
