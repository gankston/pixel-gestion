import Page, { EnConstruccion } from '../components/Page'

export default function Stock(): JSX.Element {
  return (
    <Page titulo="Stock">
      <EnConstruccion detalle="Control de inventario: ingreso de mercaderia, ajustes, conteo por lector de codigo, y vista de stock fisico / reservado / disponible con avisos de stock bajo el minimo." />
    </Page>
  )
}
