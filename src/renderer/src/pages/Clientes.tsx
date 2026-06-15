import Page, { EnConstruccion } from '../components/Page'

export default function Clientes(): JSX.Element {
  return (
    <Page titulo="Clientes">
      <EnConstruccion detalle="Clientes con cuenta corriente: saldo, tipo (mayorista/consumidor), historial de compras y pagos. Registro de pagos con imputacion a comprobantes especificos." />
    </Page>
  )
}
