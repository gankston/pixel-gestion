import { ReactNode } from 'react'

interface PageProps {
  titulo: string
  acciones?: ReactNode
  children: ReactNode
}

/** Encabezado + cuerpo estandar de cada seccion (DESIGN.md). */
export default function Page({ titulo, acciones, children }: PageProps): JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-line bg-panel px-6 py-4">
        <h1 className="text-xl font-semibold text-ink">{titulo}</h1>
        <div className="flex gap-2">{acciones}</div>
      </header>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  )
}

/** Placeholder sobrio para secciones aun no implementadas. */
export function EnConstruccion({ detalle }: { detalle: string }): JSX.Element {
  return (
    <div className="rounded-md border border-line bg-panel p-8 text-sm text-muted">
      <p className="mb-2 font-medium text-ink">Pendiente de implementar</p>
      <p>{detalle}</p>
    </div>
  )
}
