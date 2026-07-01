import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-sm',
  secondary: 'border border-line bg-panel text-ink hover:bg-app',
  danger: 'bg-danger text-white hover:bg-danger/90 shadow-sm',
  ghost: 'text-muted hover:bg-app hover:text-ink'
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }): JSX.Element {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 rounded px-3 py-[7px] text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    />
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return (
    <input
      {...props}
      className={`w-full rounded border border-line bg-panel px-3 py-[7px] text-[13px] text-ink placeholder-muted/60 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 ${props.className ?? ''}`}
    />
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}): JSX.Element | null {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`flex max-h-[88vh] flex-col rounded-lg border border-line bg-panel shadow-2xl ${wide ? 'w-full max-w-2xl' : 'w-full max-w-lg'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:bg-app hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
        {footer && (
          <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function Badge({
  tone = 'muted',
  children
}: {
  tone?: 'muted' | 'ok' | 'warn' | 'danger' | 'primary'
  children: ReactNode
}): JSX.Element {
  const tones: Record<string, string> = {
    muted: 'bg-line text-muted',
    ok: 'bg-ok/10 text-ok',
    warn: 'bg-warn/10 text-warn',
    danger: 'bg-danger/10 text-danger',
    primary: 'bg-primary/10 text-primary'
  }
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  )
}
