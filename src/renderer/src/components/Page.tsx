import { ReactNode } from 'react'

interface PageProps {
  titulo: string
  acciones?: ReactNode
  children: ReactNode
}

export default function Page({ titulo, acciones, children }: PageProps): JSX.Element {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-line bg-panel px-6">
        <h1 className="text-[15px] font-semibold text-ink">{titulo}</h1>
        {acciones && <div className="flex items-center gap-2">{acciones}</div>}
      </header>
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  )
}

export function EnConstruccion({ detalle }: { detalle: string }): JSX.Element {
  return (
    <div className="rounded border border-line bg-panel p-8 text-[13px] text-muted">
      <p className="mb-2 font-semibold text-ink">Pendiente de implementar</p>
      <p>{detalle}</p>
    </div>
  )
}
