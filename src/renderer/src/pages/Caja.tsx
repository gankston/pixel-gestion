import Page, { EnConstruccion } from '../components/Page'

export default function Caja(): JSX.Element {
  return (
    <Page titulo="Caja diaria">
      <EnConstruccion detalle="Caja del dia con cinco totales por medio de pago: efectivo, transferencia, debito, credito y total. Apertura/cierre con arqueo y diferencia. Ventas y pagos de cuenta corriente impactan automaticamente." />
    </Page>
  )
}
