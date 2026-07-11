import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import LeadsClient from './LeadsClient'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 0

export default async function LeadsPage() {
  const { data: leads, error } = await supabaseAdmin
    .from('leads')
    .select('*')

  if (error) console.error('[leads page]', error.message)

  const lista = (leads ?? []) as Array<{
    id?: string
    email: string
    fuente?: string
    estado?: string
    created_at?: string
  }>

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          On<span className="text-accent">Concilia</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/prospectos" className="text-slate-400 text-sm hover:text-white transition">
            CRM
          </Link>
          <span className="text-slate-300 text-sm font-medium">Leads</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-navy text-xl font-bold">Leads de la Landing</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {lista.length} email{lista.length !== 1 ? 's' : ''} capturado{lista.length !== 1 ? 's' : ''}
            {' · '}Hacé click en <strong>Calificar</strong> para enviarles el formulario y agregarlos al CRM
          </p>
        </div>

        {lista.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400 text-sm">No hay leads todavía. Cuando alguien complete el formulario de la landing aparece acá.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Fuente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Fecha</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lista.map((lead) => (
                  <tr key={lead.id ?? lead.email} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-navy">{lead.email}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{lead.fuente ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString('es-AR')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <LeadsClient email={lead.email} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
