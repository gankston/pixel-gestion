import Page, { EnConstruccion } from '../components/Page'

export default function Ventas(): JSX.Element {
  return (
    <Page titulo="Ventas">
      <EnConstruccion detalle="Pantalla de venta rapida: campo de escaneo siempre con foco (lector de codigo de barras como teclado), ticket a la derecha, atajos F2-F12, seleccion de lista (mayorista/consumidor) y cobro con desglose por medio de pago." />
    </Page>
  )
}
