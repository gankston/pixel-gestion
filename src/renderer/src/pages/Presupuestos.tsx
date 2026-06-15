import { useEffect, useState } from 'react'
import Page from '../components/Page'
import { Button, TextInput, Field, Modal, Badge } from '../components/ui'
import { money, fmtFecha } from '../lib/format'
import { imprimirPresupuesto } from '../lib/print'
import type { ArticuloConPrecios, Cliente, Presupuesto } from '../../../preload'

type Lista = 'mayorista' | 'consumidor'
interface ItemCarrito {
  art: ArticuloConPrecios
  cantidad: number
}

const precioDe = (a: ArticuloConPrecios, lista: Lista): number => {
  if (a.en_oferta && a.precio_oferta != null) return a.precio_oferta
  return lista === 'mayorista' ? a.precios.mayorista : a.precios.consumidor
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

  // estado del formulario
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [listaPrecio, setListaPrecio] = useState<Lista>('consumidor')
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ArticuloConPrecios[]>([])
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])

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
  }

  async function aprobar(id: number): Promise<void> {
    if (!confirm('Aprobar el presupuesto? Se descuenta el stock y se genera la venta.')) return
    try {
      await window.api.aprobarPresupuesto(id)
      recargar()
    } catch (e) {
      setError(`No se pudo aprobar: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  async function anular(id: number): Promise<void> {
    if (!confirm('Anular el presupuesto? Se libera el stock reservado.')) return
    try {
      await window.api.anularPresupuesto(id)
      recargar()
    } catch (e) {
      setError(`No se pudo anular: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  async function imprimir(id: number): Promise<void> {
    const det = await window.api.detallePresupuesto(id)
    if (det) imprimirPresupuesto(det)
  }

  return (
    <Page titulo="Presupuestos" acciones={<Button onClick={abrir}>+ Nuevo presupuesto</Button>}>
      {error && (
        <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-3 font-bold">✕</button>
        </div>
      )}
      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-app text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-medium">#</th>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 text-right font-medium">Total</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} className="border-b border-line last:border-0 hover:bg-app">
                <td className="num px-4 py-2 text-muted">{p.id}</td>
                <td className="num px-4 py-2 text-xs text-muted">{fmtFecha(p.fecha)}</td>
                <td className="px-4 py-2 text-ink">{p.cliente_nombre ?? 'Mostrador'}</td>
                <td className="num px-4 py-2 text-right">{money(p.total)}</td>
                <td className="px-4 py-2">
                  <Badge tone={TONO[p.estado]}>{p.estado}</Badge>
                </td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => imprimir(p.id)} className="mr-3 text-muted hover:underline">
                    Imprimir
                  </button>
                  {p.estado === 'vigente' && (
                    <>
                      <button onClick={() => aprobar(p.id)} className="mr-3 text-ok hover:underline">
                        Aprobar
                      </button>
                      <button onClick={() => anular(p.id)} className="text-danger hover:underline">
                        Anular
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  Sin presupuestos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modal}
        title="Nuevo presupuesto"
        onClose={() => setModal(false)}
        footer={
          <>
            <span className="num mr-auto self-center text-lg font-bold">{money(total)}</span>
            <Button variant="secondary" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button disabled={carrito.length === 0} onClick={guardar}>
              Crear (reserva stock)
            </Button>
          </>
        }
      >
        <div className="mb-3 grid grid-cols-2 gap-3">
          <Field label="Cliente">
            <select
              value={clienteId ?? ''}
              onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded border border-line bg-panel px-3 py-2 text-sm"
            >
              <option value="">Mostrador</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lista de precio">
            <select
              value={listaPrecio}
              onChange={(e) => setListaPrecio(e.target.value as Lista)}
              className="w-full rounded border border-line bg-panel px-3 py-2 text-sm"
            >
              <option value="consumidor">Consumidor final</option>
              <option value="mayorista">Mayorista</option>
            </select>
          </Field>
        </div>

        <TextInput placeholder="Buscar articulo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        {resultados.length > 0 && (
          <div className="mt-1 overflow-hidden rounded border border-line">
            {resultados.slice(0, 6).map((a) => (
              <button
                key={a.id}
                onClick={() => agregar(a)}
                className="flex w-full justify-between border-b border-line px-3 py-2 text-left text-sm last:border-0 hover:bg-app"
              >
                <span>{a.nombre}</span>
                <span className="num">{money(precioDe(a, listaPrecio))}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-3">
          {carrito.map((it) => (
            <div key={it.art.id} className="flex items-center justify-between border-b border-line py-2 text-sm">
              <span className="flex-1">{it.art.nombre}</span>
              <span className="num mx-3">x{it.cantidad}</span>
              <span className="num w-20 text-right">{money(precioDe(it.art, listaPrecio) * it.cantidad)}</span>
            </div>
          ))}
          {carrito.length === 0 && <p className="py-3 text-center text-sm text-muted">Agrega articulos.</p>}
        </div>
      </Modal>
    </Page>
  )
}
