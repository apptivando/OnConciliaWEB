import { redirect } from 'next/navigation'

// La tabla `leads` quedó como archivo histórico: los leads de la landing
// ahora se crean directo como prospectos con `origen = 'landing'`, así que
// esta pantalla se jubila a favor del filtro del CRM.
export default function LeadsPage() {
  redirect('/prospectos?origen=landing')
}
