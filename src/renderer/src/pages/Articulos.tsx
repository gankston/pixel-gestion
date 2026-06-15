import { useEffect, useState } from 'react'
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
  markup_mayorista_pct: number
  markup_consumidor_pct: number
  en_oferta: boolean
  precio_oferta: number | null
  stock_fisico: number
  stock_minimo: number
}

const vacio: Form = {
  codigo_barras: '',
  nombre: '',
  rubro: '',
  neto: 0,
  descuento_pct: 0,
  markup_mayorista_pct: 10,
  markup_consumidor_pct: 60,
  en_oferta: false,
  precio_oferta: null,
  stock_fisico: 0,
  stock_minimo: 0
}

export default function Articulos(): JSX.Element {
  const [articulos, setArticulos] = useState<ArticuloConPrecios[]>([])
  const [filtro, setFiltro] = useState('')
  const [form, setForm] = useState<Form | null>(null)

  function recargar(): void {
    window.api.listArticulos(filtro).then(setArticulos)
  }
  useEffect(recargar, [filtro])

  function abrirNuevo(): void {
    setForm({ ...vacio })
  }
  function abrirEditar(a: ArticuloConPrecios): void {
    setForm({
      id: a.id,
      codigo_barras: a.codigo_barras ?? '',
      nombre: a.nombre,
      rubro: a.rubro ?? '',
      neto: a.neto,
      descuento_pct: a.descuento_pct,
      markup_mayorista_pct: a.markup_mayorista_pct,
      markup_consumidor_pct: a.markup_consumidor_pct,
      en_oferta: a.en_oferta === 1,
      precio_oferta: a.precio_oferta,
      stock_fisico: a.stock_fisico,
      stock_minimo: a.stock_minimo
    })
  }

  async function guardar(): Promise<void> {
    if (!form || !form.nombre.trim()) return
    if (form.id) await window.api.actualizarArticulo(form.id, form)
    else await window.api.crearArticulo(form)
    setForm(null)
    recargar()
  }

  async function eliminar(a: ArticuloConPrecios): Promise<void> {
    if (!confirm(`Eliminar "${a.nombre}"?`)) return
    await window.api.eliminarArticulo(a.id)
    recargar()
  }

  const set = (campo: keyof Form, valor: unknown): void =>
    setForm((f) => (f ? { ...f, [campo]: valor } : f))

  return (
    <Page
      titulo="Articulos y precios"
      acciones={<Button onClick={abrirNuevo}>+ Nuevo articulo</Button>}
    >
      <div className="mb-3 max-w-sm">
        <TextInput
          placeholder="Buscar por nombre, codigo o rubro..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line bg-app text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-2 font-medium">Codigo</th>
              <th className="px-4 py-2 font-medium">Articulo</th>
              <th className="px-4 py-2 text-right font-medium">Disponible</th>
              <th className="px-4 py-2 text-right font-medium">Mayorista</th>
              <th className="px-4 py-2 text-right font-medium">Consumidor</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {articulos.map((a) => {
              const stockBajo = a.stock_disponible < a.stock_minimo
              return (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-app">
                  <td className="num px-4 py-2 text-xs text-muted">{a.codigo_barras}</td>
                  <td className="px-4 py-2 text-ink">
                    {a.nombre}
                    <span className="block text-xs text-muted">{a.rubro}</span>
                  </td>
                  <td className="num px-4 py-2 text-right">
                    {a.stock_disponible}
                    {a.stock_reservado > 0 && <span className="text-muted"> ({a.stock_reservado} res.)</span>}
                  </td>
                  <td className="num px-4 py-2 text-right">{money(a.precios.mayorista)}</td>
                  <td className="num px-4 py-2 text-right">
                    {a.en_oferta && a.precio_oferta != null ? money(a.precio_oferta) : money(a.precios.consumidor)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      {a.en_oferta === 1 && <Badge tone="ok">Oferta</Badge>}
                      {stockBajo && <Badge tone="danger">Stock bajo</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => abrirEditar(a)} className="mr-2 text-primary hover:underline">
                      Editar
                    </button>
                    <button onClick={() => eliminar(a)} className="text-danger hover:underline">
                      Eliminar
                    </button>
                  </td>
                </tr>
              )
            })}
            {articulos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-muted">
                  Sin articulos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!form}
        title={form?.id ? 'Editar articulo' : 'Nuevo articulo'}
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
            <Field label="Codigo de barras">
              <TextInput value={form.codigo_barras} onChange={(e) => set('codigo_barras', e.target.value)} />
            </Field>
            <Field label="Rubro">
              <TextInput value={form.rubro} onChange={(e) => set('rubro', e.target.value)} />
            </Field>
            <Field label="Neto ($)">
              <TextInput type="number" value={form.neto} onChange={(e) => set('neto', Number(e.target.value))} />
            </Field>
            <Field label="Descuento (%)">
              <TextInput type="number" value={form.descuento_pct} onChange={(e) => set('descuento_pct', Number(e.target.value))} />
            </Field>
            <Field label="Stock minimo">
              <TextInput type="number" value={form.stock_minimo} onChange={(e) => set('stock_minimo', Number(e.target.value))} />
            </Field>
            <Field label="Markup mayorista (%)">
              <TextInput type="number" value={form.markup_mayorista_pct} onChange={(e) => set('markup_mayorista_pct', Number(e.target.value))} />
            </Field>
            <Field label="Markup consumidor (%)">
              <TextInput type="number" value={form.markup_consumidor_pct} onChange={(e) => set('markup_consumidor_pct', Number(e.target.value))} />
            </Field>
            {!form.id && (
              <Field label="Stock inicial">
                <TextInput type="number" value={form.stock_fisico} onChange={(e) => set('stock_fisico', Number(e.target.value))} />
              </Field>
            )}
            <div className="col-span-2 flex items-center gap-3 rounded border border-line bg-app p-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.en_oferta} onChange={(e) => set('en_oferta', e.target.checked)} />
                En oferta
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
