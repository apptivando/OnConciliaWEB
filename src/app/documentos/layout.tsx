import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '../login/LogoutButton'

/**
 * Guard del módulo de documentos.
 *
 * El middleware ya protege /documentos con el mismo criterio que el resto del CRM
 * (sesión + is_staff). Esto es la segunda capa, y va porque acá el contenido NO
 * vive en tablas de Supabase: se lee de /content en el servidor, así que RLS no lo
 * cubre. Si alguna vez se toca el matcher del middleware, este chequeo evita que
 * el material interno quede expuesto.
 */
export const dynamic = 'force-dynamic'

export default async function DocumentosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/documentos')

  const { data: staff } = await supabase
    .from('profiles_crm')
    .select('is_staff')
    .eq('id', user.id)
    .maybeSingle()

  if (!staff?.is_staff) redirect('/login?error=no-autorizado')

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          On<span className="text-accent">Concilia</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/prospectos"
            className="text-slate-400 hover:text-white text-sm transition"
          >
            Prospectos
          </Link>
          <Link href="/documentos" className="text-white text-sm font-medium">
            Documentos
          </Link>
          <LogoutButton />
        </div>
      </nav>
      {children}
    </div>
  )
}
