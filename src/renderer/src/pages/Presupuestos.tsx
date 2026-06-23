import { useEffect, useState } from 'react'
import { Plus, FileText, Printer, CheckCheck, Ban } from 'lucide-react'
import Page from '../components/Page'
import { Button, TextInput, Field, Modal, Badge } from '../components/ui'
import { money, fmtFecha } from '../lib/format'
import { imprimirPresupuesto, verPdfPresupuesto } from '../lib/print'
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
  const [errorGuardar, setErrorGuardar] = useState('')

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
      setErrorGuardar(e instanceof Error ? e.message : 'No se pudo crear el presupuesto')
    }
  }

  async function aprobar(id: number): Promise<void> {
    if (!confirm('Aprobar el presupuesto? Se descuenta el stock y se genera la venta.')) return
    try {
      await window.api.aprobarPresupuesto(id)
      recargar()
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).replace(/^Error invoking remote method '[^']+': Error: /, '')
      setError(`No se pudo aprobar: ${msg}`)
    }
  }
  async function anular(id: number): Promise<void> {
    if (!confirm('Anular el presupuesto? Se libera el stock reservado.')) return
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
          <button onClick={() => setError('')} className="ml-3 text-danger/60 hover:text-danger">✕</button>
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
                          onClick={() => aprobar(p.id)}
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

      <Modal
        open={modal}
        title="Nuevo presupuesto"
        onClose={() => setModal(false)}
        footer={
          <>
            <span className="mr-auto font-mono text-lg font-bold text-ink">{money(total)}</span>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button disabled={carrito.length === 0} onClick={guardar}>Crear (reserva stock)</Button>
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
