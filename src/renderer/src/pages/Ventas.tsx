import { useEffect, useRef, useState } from 'react'
import Page from '../components/Page'
import { Button, TextInput, Badge } from '../components/ui'
import { money } from '../lib/format'
import type { ArticuloConPrecios, Cliente } from '../../../preload'

type Lista = 'mayorista' | 'consumidor'
type Medio = 'efectivo' | 'transferencia' | 'debito' | 'credito'
interface ItemCarrito {
  art: ArticuloConPrecios
  cantidad: number
}

const MEDIOS: { id: Medio; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'debito', label: 'Debito' },
  { id: 'credito', label: 'Credito' }
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
    setMensaje(
      fiar
        ? `Venta #${r.ventaId} a cuenta corriente por ${money(r.total)}.`
        : `Venta #${r.ventaId} cobrada por ${money(r.total)} (${medio}).`
    )
    scanRef.current?.focus()
  }

  return (
    <Page titulo="Ventas">
      <div className="flex gap-6">
        {/* Columna izquierda: escaneo + busqueda */}
        <div className="flex-1">
          <div className="mb-3 flex gap-2">
            <div className="flex overflow-hidden rounded border border-line">
              {(['consumidor', 'mayorista'] as Lista[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLista(l)}
                  className={
                    'px-3 py-2 text-sm ' +
                    (lista === l ? 'bg-primary text-white' : 'bg-panel text-muted hover:bg-app')
                  }
                >
                  {l === 'consumidor' ? 'Consumidor final' : 'Mayorista'}
                </button>
              ))}
            </div>
            <select
              value={clienteId ?? ''}
              onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
              className="rounded border border-line bg-panel px-3 py-2 text-sm text-ink"
            >
              <option value="">Sin cliente (mostrador)</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <input
            ref={scanRef}
            onKeyDown={onScan}
            placeholder="Escanea un codigo de barras y Enter (o busca abajo)"
            className="mb-3 w-full rounded border-2 border-primary bg-panel px-4 py-3 text-base outline-none"
          />
          <TextInput
            placeholder="Buscar por nombre, codigo o rubro..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          {resultados.length > 0 && (
            <div className="mt-2 overflow-hidden rounded border border-line bg-panel">
              {resultados.slice(0, 8).map((a) => (
                <button
                  key={a.id}
                  onClick={() => agregar(a)}
                  className="flex w-full items-center justify-between border-b border-line px-4 py-2 text-left text-sm last:border-0 hover:bg-app"
                >
                  <span>
                    {a.nombre}{' '}
                    <span className="num text-xs text-muted">{a.codigo_barras}</span>
                  </span>
                  <span className="num">{money(precioDe(a, lista))}</span>
                </button>
              ))}
            </div>
          )}

          {mensaje && (
            <div className="mt-4 rounded border border-ok/30 bg-ok/10 px-4 py-2 text-sm text-ok">
              {mensaje}
            </div>
          )}
        </div>

        {/* Columna derecha: ticket */}
        <div className="flex w-[420px] flex-col rounded-lg border border-line bg-panel">
          <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">Ticket</div>
          <div className="flex-1 overflow-auto">
            {carrito.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-muted">Sin items todavia.</p>
            )}
            {carrito.map((it) => (
              <div key={it.art.id} className="flex items-center gap-2 border-b border-line px-4 py-2 text-sm">
                <div className="flex-1">
                  <div className="text-ink">{it.art.nombre}</div>
                  <div className="num text-xs text-muted">{money(precioDe(it.art, lista))} c/u</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => cambiarCantidad(it.art.id, -1)} className="h-6 w-6 rounded border border-line">−</button>
                  <span className="num w-6 text-center">{it.cantidad}</span>
                  <button onClick={() => cambiarCantidad(it.art.id, 1)} className="h-6 w-6 rounded border border-line">+</button>
                </div>
                <div className="num w-20 text-right font-medium">
                  {money(precioDe(it.art, lista) * it.cantidad)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-line p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-muted">Total</span>
              <span className="num text-3xl font-bold text-ink">{money(total)}</span>
            </div>
            <div className="mb-3 grid grid-cols-4 gap-1">
              {MEDIOS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMedio(m.id)}
                  className={
                    'rounded px-1 py-2 text-xs ' +
                    (medio === m.id ? 'bg-primary text-white' : 'border border-line text-muted hover:bg-app')
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" disabled={carrito.length === 0} onClick={() => cobrar(false)}>
                Cobrar {total > 0 && money(total)}
              </Button>
              <Button
                variant="secondary"
                disabled={carrito.length === 0}
                onClick={() => cobrar(true)}
                title="Cargar a cuenta corriente del cliente"
              >
                Fiar
              </Button>
            </div>
            {clienteId && (
              <div className="mt-2 text-center">
                <Badge tone="primary">Cliente: {clientes.find((c) => c.id === clienteId)?.nombre}</Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  )
}
