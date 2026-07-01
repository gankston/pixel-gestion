import { useEffect, useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import Page from '../components/Page'
import { Button, TextInput, Field, Modal, Badge } from '../components/ui'
import { money } from '../lib/format'
import type { ArticuloConPrecios } from '../../../preload'

interface Form {
  id?: number
  codigo_barras: string
  nombre: string
  rubro: string
  neto: number
  descuento_pct: number
  desc2_pct: number
  desc3_pct: number
  desc4_pct: number
  desc5_pct: number
  ganancia_pct: number
  markup_mayorista_pct: number
  markup_consumidor_pct: number
  en_oferta: boolean
  precio_oferta: number | null
  stock_fisico: number
  stock_minimo: number
  iva_alicuota: number
  precio_usd: number | null
  tipo_cambio: number | null
}

const vacio: Form = {
  codigo_barras: '',
  nombre: '',
  rubro: '',
  neto: 0,
  descuento_pct: 0,
  desc2_pct: 0,
  desc3_pct: 0,
  desc4_pct: 0,
  desc5_pct: 0,
  ganancia_pct: 0,
  markup_mayorista_pct: 10,
  markup_consumidor_pct: 60,
  en_oferta: false,
  precio_oferta: null,
  stock_fisico: 0,
  stock_minimo: 0,
  iva_alicuota: 21,
  precio_usd: null,
  tipo_cambio: null
}

function calcularCostoPreview(f: Form): number {
  return f.neto
    * (1 - f.descuento_pct / 100)
    * (1 - f.desc2_pct / 100)
    * (1 - f.desc3_pct / 100)
    * (1 - f.desc4_pct / 100)
    * (1 - f.desc5_pct / 100)
}

export default function Articulos(): JSX.Element {
  const [articulos, setArticulos] = useState<ArticuloConPrecios[]>([])
  const [filtro, setFiltro] = useState('')
  const [form, setForm] = useState<Form | null>(null)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  function recargar(): void {
    window.api.listArticulos(filtro).then(setArticulos)
  }
  useEffect(recargar, [filtro])

  function abrirNuevo(): void {
    setForm({ ...vacio })
    setErrorGuardar(null)
  }
  function abrirEditar(a: ArticuloConPrecios): void {
    setErrorGuardar(null)
    setForm({
      id: a.id,
      codigo_barras: a.codigo_barras ?? '',
      nombre: a.nombre,
      rubro: a.rubro ?? '',
      neto: a.neto,
      descuento_pct: a.descuento_pct,
      desc2_pct: a.desc2_pct ?? 0,
      desc3_pct: a.desc3_pct ?? 0,
      desc4_pct: a.desc4_pct ?? 0,
      desc5_pct: a.desc5_pct ?? 0,
      ganancia_pct: a.ganancia_pct ?? 0,
      markup_mayorista_pct: a.markup_mayorista_pct,
      markup_consumidor_pct: a.markup_consumidor_pct,
      en_oferta: a.en_oferta === 1,
      precio_oferta: a.precio_oferta,
      stock_fisico: a.stock_fisico,
      stock_minimo: a.stock_minimo,
      iva_alicuota: a.iva_alicuota ?? 21,
      precio_usd: a.precio_usd ?? null,
      tipo_cambio: null
    })
  }

  async function guardar(): Promise<void> {
    if (!form || !form.nombre.trim()) return
    setErrorGuardar(null)
    try {
      if (form.id) await window.api.actualizarArticulo(form.id, form)
      else await window.api.crearArticulo(form)
      setForm(null)
      recargar()
    } catch (e) {
      setErrorGuardar(
        (e instanceof Error ? e.message : 'No se pudo guardar el artículo')
          .replace(/^Error invoking remote method '[^']+': Error: /, '')
      )
    }
  }

  async function eliminar(a: ArticuloConPrecios): Promise<void> {
    if (!confirm(`Eliminar "${a.nombre}"?`)) return
    try {
      await window.api.eliminarArticulo(a.id)
      recargar()
    } catch (e) {
      setErrorEliminar(
        (e instanceof Error ? e.message : 'No se pudo eliminar el artículo')
          .replace(/^Error invoking remote method '[^']+': Error: /, '')
      )
    }
  }

  const set = (campo: keyof Form, valor: unknown): void =>
    setForm((f) => (f ? { ...f, [campo]: valor } : f))

  function handleTipoCambio(valor: string): void {
    const tc = valor ? Number(valor) : null
    setForm((f) => {
      if (!f) return f
      const usd = f.precio_usd
      const neto = tc && usd ? usd * tc : f.neto
      return { ...f, tipo_cambio: tc, neto: tc && usd ? neto : f.neto }
    })
  }

  function handlePrecioUsd(valor: string): void {
    const usd = valor ? Number(valor) : null
    setForm((f) => {
      if (!f) return f
      const tc = f.tipo_cambio
      const neto = tc && usd ? usd * tc : f.neto
      return { ...f, precio_usd: usd, neto: tc && usd ? neto : f.neto }
    })
  }

  return (
    <Page
      titulo="Artículos y precios"
      acciones={
        <Button onClick={abrirNuevo}>
          <Plus size={14} />
          Nuevo artículo
        </Button>
      }
    >
      {errorEliminar && (
        <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-4 py-2.5 text-[13px] text-danger">
          <span>{errorEliminar}</span>
          <button onClick={() => setErrorEliminar(null)} className="ml-3 text-danger/60 hover:text-danger">✕</button>
        </div>
      )}

      <div className="mb-4 max-w-sm">
        <TextInput
          placeholder="Buscar por nombre, código o rubro..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded border border-line bg-panel">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line bg-app text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Código</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Artículo</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Disponible</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Mayor</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">Mostrador</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => {
              const stockBajo = a.stock_disponible < a.stock_minimo
              return (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-app">
                  <td className="px-4 py-2.5 font-mono text-[12px] text-muted">{a.codigo_barras}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-ink">{a.nombre}</div>
                    {a.rubro && <div className="text-[11px] text-muted">{a.rubro}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium">
                    {a.stock_disponible}
                    {a.stock_reservado > 0 && (
                      <span className="ml-1 text-[11px] text-muted">({a.stock_reservado} res.)</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px]">
                    {a.en_oferta && a.precio_oferta != null ? money(a.precio_oferta) : money(a.precios.mayorista)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[13px]">
                    {a.en_oferta && a.precio_oferta != null ? money(a.precio_oferta) : money(a.precios.consumidor)}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1">
                      {a.en_oferta === 1 && <Badge tone="ok">Oferta</Badge>}
                      {stockBajo && <Badge tone="danger">Stock bajo</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => abrirEditar(a)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-line hover:text-ink"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => eliminar(a)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-transparent text-muted transition-colors hover:border-danger/30 hover:text-danger"
                        title="Eliminar"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {articulos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Sin artículos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!form}
        title={form?.id ? 'Editar artículo' : 'Nuevo artículo'}
        onClose={() => setForm(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setForm(null)}>Cancelar</Button>
            <Button onClick={guardar}>Guardar</Button>
          </>
        }
      >
        {errorGuardar && (
          <div className="mb-3 flex items-center justify-between rounded border border-danger/30 bg-danger/8 px-3 py-2 text-[12px] text-danger">
            <span>{errorGuardar}</span>
            <button onClick={() => setErrorGuardar(null)} className="ml-3 text-danger/60 hover:text-danger">✕</button>
          </div>
        )}
        {form && (
          <div className="space-y-4">
            {/* Datos del artículo */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre">
                <TextInput value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
              </Field>
              <Field label="Código de barras">
                <TextInput value={form.codigo_barras} onChange={(e) => set('codigo_barras', e.target.value)} />
              </Field>
              <Field label="Rubro">
                <TextInput value={form.rubro} onChange={(e) => set('rubro', e.target.value)} />
              </Field>
              <Field label="Stock mínimo">
                <TextInput type="number" value={form.stock_minimo} onChange={(e) => set('stock_minimo', Number(e.target.value))} />
              </Field>
              {!form.id && (
                <Field label="Stock inicial">
                  <TextInput type="number" value={form.stock_fisico} onChange={(e) => set('stock_fisico', Number(e.target.value))} />
                </Field>
              )}
              <Field label="IVA">
                <select
                  value={form.iva_alicuota}
                  onChange={(e) => set('iva_alicuota', Number(e.target.value))}
                  className="w-full rounded border border-line bg-panel px-3 py-[7px] text-[13px] outline-none focus:border-primary"
                >
                  <option value={21}>21%</option>
                  <option value={10.5}>10.5%</option>
                  <option value={0}>Exento (0%)</option>
                </select>
              </Field>
            </div>

            {/* Tipo de cambio dólar */}
            <div className="rounded border border-line bg-app p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Precio en dólares (opcional)</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Precio USD">
                  <TextInput
                    type="number"
                    value={form.precio_usd ?? ''}
                    onChange={(e) => handlePrecioUsd(e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
                <Field label="Cotización dólar ($)">
                  <TextInput
                    type="number"
                    value={form.tipo_cambio ?? ''}
                    onChange={(e) => handleTipoCambio(e.target.value)}
                    placeholder="0.00"
                  />
                </Field>
              </div>
              {form.precio_usd && form.tipo_cambio && (
                <p className="mt-1.5 text-[11px] text-primary">
                  Precio de lista calculado: ${(form.precio_usd * form.tipo_cambio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>

            {/* Precio de lista */}
            <div className="rounded border border-line bg-app p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Precio de lista y descuentos</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Precio de lista ($)">
                    <TextInput
                      type="number"
                      value={form.neto}
                      onChange={(e) => set('neto', Number(e.target.value))}
                    />
                    {form.neto === 0 && (
                      <p className="mt-1 text-[11px] text-warn">Precio de lista $0 — los precios de venta serán $0.</p>
                    )}
                  </Field>
                </div>
                <Field label="Descuento 1 (%)">
                  <TextInput type="number" value={form.descuento_pct} onChange={(e) => set('descuento_pct', Number(e.target.value))} />
                </Field>
                <Field label="Descuento 2 (%)">
                  <TextInput type="number" value={form.desc2_pct} onChange={(e) => set('desc2_pct', Number(e.target.value))} />
                </Field>
                <Field label="Descuento 3 (%)">
                  <TextInput type="number" value={form.desc3_pct} onChange={(e) => set('desc3_pct', Number(e.target.value))} />
                </Field>
                <Field label="Descuento 4 (%)">
                  <TextInput type="number" value={form.desc4_pct} onChange={(e) => set('desc4_pct', Number(e.target.value))} />
                </Field>
                <Field label="Descuento 5 (%)">
                  <TextInput type="number" value={form.desc5_pct} onChange={(e) => set('desc5_pct', Number(e.target.value))} />
                </Field>
                <div className="col-span-2">
                  <p className="text-[11px] text-muted">
                    Costo tras descuentos: <span className="font-semibold text-ink">${calcularCostoPreview(form).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Ganancia y descuentos de venta */}
            <div className="rounded border border-line bg-app p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Ganancia y precios de venta</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Ganancia (%)">
                    <TextInput type="number" value={form.ganancia_pct} onChange={(e) => set('ganancia_pct', Number(e.target.value))} />
                  </Field>
                </div>
                <Field label="Descuento por mayor (%)">
                  <TextInput type="number" value={form.markup_mayorista_pct} onChange={(e) => set('markup_mayorista_pct', Number(e.target.value))} />
                </Field>
                <Field label="Descuento mostrador (%)">
                  <TextInput type="number" value={form.markup_consumidor_pct} onChange={(e) => set('markup_consumidor_pct', Number(e.target.value))} />
                </Field>
              </div>
            </div>

            {/* Oferta */}
            <div className="flex items-center gap-3 rounded border border-line bg-app p-3">
              <label className="flex cursor-pointer items-center gap-2 text-[13px]">
                <input type="checkbox" checked={form.en_oferta} onChange={(e) => set('en_oferta', e.target.checked)} />
                <span className="font-medium text-ink">En oferta</span>
              </label>
              {form.en_oferta && (
                <div className="flex-1">
                  <TextInput
                    type="number"
                    placeholder="Precio de oferta"
                    value={form.precio_oferta ?? ''}
                    onChange={(e) => set('precio_oferta', e.target.value ? Number(e.target.value) : null)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Page>
  )
}
