import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import LeadsClient from './LeadsClient'
import LogoutButton from '../login/LogoutButton'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 0

interface Lead {
  id?: string
  email: string
  nombre?: string | null
  telefono?: string | null
  nota?: string | null
  fuente?: string | null
  estado?: string | null
  reunion_agendada_en?: string | null
  fecha_registro?: string | null
}

function fecha(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default async function LeadsPage() {
  // `fecha_registro`, no `created_at`: esta tabla no tiene esa columna, y la
  // versión anterior la pedía igual — por eso la fecha salía siempre vacía.
  const { data: leads, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .order('fecha_registro', { ascending: false })

  if (error) console.error('[leads page]', error.message)

  const lista = (leads ?? []) as Lead[]
  const agendados = lista.filter((l) => l.reunion_agendada_en).length

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
          <LogoutButton />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-navy text-xl font-bold">Leads de la landing</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {lista.length} lead{lista.length !== 1 ? 's' : ''}
            {' · '}
            <strong className="text-navy">{agendados}</strong> con la reunión agendada
          </p>
          <p className="text-slate-400 text-xs mt-2 max-w-2xl leading-relaxed">
            Este es el carril opt-in: gente que dejó sus datos en la landing. Es
            una tabla aparte de los prospectos del CRM, que salen de la búsqueda
            en Google Places — los dos carriles no se mezclan a propósito.
          </p>
        </div>

        {lista.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400 text-sm">
              No hay leads todavía. Cuando alguien complete el formulario de la landing aparece acá.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Contacto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Reunión</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Fuente</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Alta</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lista.map((lead) => (
                  <tr key={lead.id ?? lead.email} className="hover:bg-slate-50 transition align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-navy">{lead.nombre ?? '—'}</div>
                      {lead.nota && (
                        <div className="text-slate-400 text-xs mt-0.5 max-w-xs">{lead.nota}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700 text-xs">{lead.email}</div>
                      {lead.telefono && (
                        <div className="text-slate-500 text-xs mt-0.5">{lead.telefono}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {lead.reunion_agendada_en ? (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                          Agendada {fecha(lead.reunion_agendada_en)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                          Sin agendar
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{lead.fuente ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fecha(lead.fecha_registro)}</td>
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
