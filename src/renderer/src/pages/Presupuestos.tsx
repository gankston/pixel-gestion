import Page, { EnConstruccion } from '../components/Page'

export default function Presupuestos(): JSX.Element {
  return (
    <Page titulo="Presupuestos">
      <EnConstruccion detalle="Emision de presupuestos que RESERVAN stock (con aviso de reservado). Al aprobarse, se convierten en venta y descuentan el stock fisico. Vencimiento configurable que libera la reserva." />
    </Page>
  )
}
