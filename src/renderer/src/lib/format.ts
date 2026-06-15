/** Formatea un numero como pesos argentinos, redondeado a entero. */
export const money = (n: number): string => '$' + Math.round(n).toLocaleString('es-AR')

/** Fecha/hora corta legible. */
export const fmtFecha = (iso: string): string => {
  if (!iso) return ''
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}
