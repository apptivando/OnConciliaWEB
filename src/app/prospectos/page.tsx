import { createClient } from '@/lib/supabase/server'
import { Prospecto } from '@/lib/types'
import ProspectosToolbar from './ProspectosToolbar'
import ProspectosTable from './ProspectosTable'
import BuscadorAgent from './BuscadorAgent'
import EnriquecerAgent from './EnriquecerAgent'
import ProspectosClient from './ProspectosClient'
import Link from 'next/link'
import LogoutButton from '../login/LogoutButton'

const PAGE_SIZE = 100

function vencido(fecha: string | null) {
  if (!fecha) return false
  return new Date(fecha) < new Date(new Date().toDateString())
}

export default async function ProspectosPage({
  searchParams,
}: {
  searchParams: {
    q?: string
    sector?: string
    estado?: string
    prioridad?: string
    localidad?: string
    page?: string
    cliente?: string
  }
}) {
  const supabase = createClient()

  const page = Math.max(Number(searchParams.page ?? 1) || 1, 1)
  const isFiltered = Boolean(
    searchParams.q || searchParams.sector || searchParams.estado || searchParams.prioridad || searchParams.localidad
  )

  let query = supabase.from('prospectos').select('*', { count: 'exact' })

  if (searchParams.q) {
    const q = searchParams.q.replace(/[%,]/g, '')
    query = query.or(`nombre.ilike.%${q}%,empresa.ilike.%${q}%,email.ilike.%${q}%`)
  }
  if (searchParams.sector) query = query.eq('sector', searchParams.sector)
  if (searchParams.estado) query = query.eq('estado', searchParams.estado)
  if (searchParams.localidad) query = query.eq('localidad', searchParams.localidad)
  if (searchParams.prioridad) {
    const n = Number(searchParams.prioridad)
    if (n >= 1 && n <= 4) query = query.eq('prioridad_contacto', n)
  }

  query = query
    .order('prioridad_contacto', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  const [{ data: prospectosData, count }, { data: localidadesData }, { data: statsData }] = await Promise.all([
    query,
    supabase.from('prospectos').select('localidad').not('localidad', 'is', null),
    supabase.from('prospectos').select('estado, fecha_proxima_accion'),
  ])

  const lista = (prospectosData as Prospecto[]) ?? []
  const total = count ?? 0
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)
  const localidades = [...new Set((localidadesData ?? []).map((r) => (r as { localidad: string }).localidad))].sort()

  const statsRows = (statsData ?? []) as Array<{ estado: string; fecha_proxima_accion: string | null }>
  const stats = {
    total: statsRows.length,
    betas: statsRows.filter((p) => p.estado === 'beta_activo').length,
    demos: statsRows.filter((p) => ['demo_agendada', 'demo_realizada'].includes(p.estado)).length,
    vencidos: statsRows.filter((p) => vencido(p.fecha_proxima_accion) && p.estado !== 'descartado' && p.estado !== 'feedback_recopilado').length,
  }

  function pageHref(target: number) {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== 'page' && k !== 'cliente') next.set(k, v)
    }
    if (target > 1) next.set('page', String(target))
    const qs = next.toString()
    return qs ? `/prospectos?${qs}` : '/prospectos'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          On<span className="text-accent">Concilia</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">CRM de Prospectos</span>
          <LogoutButton />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-navy text-xl font-bold">Prospectos</h1>
            <p className="text-slate-500 text-sm mt-0.5">Fase 1 — Outreach y validación</p>
          </div>
          <div className="flex items-center gap-2">
            <EnriquecerAgent />
            <BuscadorAgent />
            <ProspectosClient accion="nuevo" />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Betas activos', value: stats.betas },
            { label: 'Demos', value: stats.demos },
            { label: 'Follow-ups vencidos', value: stats.vencidos, alerta: stats.vencidos > 0 },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-xl p-4 border ${s.alerta ? 'border-red-200' : 'border-slate-200'}`}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.alerta ? 'text-red-600' : 'text-navy'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-4">
          <ProspectosToolbar localidades={localidades} />
        </div>

        <ProspectosTable prospectos={lista} filtered={isFiltered} initialClientId={searchParams.cliente ?? null} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
            <span>{total.toLocaleString('es-AR')} resultados · página {page} de {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link href={pageHref(page - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:text-navy hover:border-slate-300 transition-colors">
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link href={pageHref(page + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg hover:text-navy hover:border-slate-300 transition-colors">
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
