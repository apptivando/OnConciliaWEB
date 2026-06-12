import { createClient } from '@/lib/supabase/server'
import { Prospecto, SECTORES, ESTADOS } from '@/lib/types'
import EstadoBadge from '@/components/EstadoBadge'
import ProspectosClient from './ProspectosClient'
import Link from 'next/link'

function vencido(fecha: string | null) {
  if (!fecha) return false
  return new Date(fecha) < new Date(new Date().toDateString())
}

export default async function ProspectosPage({
  searchParams,
}: {
  searchParams: { sector?: string; estado?: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from('prospectos')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchParams.sector) query = query.eq('sector', searchParams.sector)
  if (searchParams.estado) query = query.eq('estado', searchParams.estado)

  const { data: prospectos } = await query

  const lista = (prospectos as Prospecto[]) ?? []

  const stats = {
    total: lista.length,
    betas: lista.filter(p => p.estado === 'beta_activo').length,
    demos: lista.filter(p => ['demo_agendada', 'demo_realizada'].includes(p.estado)).length,
    vencidos: lista.filter(p => vencido(p.fecha_proxima_accion) && p.estado !== 'descartado' && p.estado !== 'feedback_recopilado').length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="bg-navy px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          On<span className="text-accent">Concilia</span>
        </Link>
        <span className="text-slate-400 text-sm">CRM de Prospectos</span>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-navy text-xl font-bold">Prospectos</h1>
            <p className="text-slate-500 text-sm mt-0.5">Fase 1 — Outreach y validación</p>
          </div>
          <ProspectosClient accion="nuevo" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Betas activos', value: stats.betas },
            { label: 'Demos', value: stats.demos },
            { label: 'Follow-ups vencidos', value: stats.vencidos, alerta: stats.vencidos > 0 },
          ].map(s => (
            <div key={s.label} className={`bg-white rounded-xl p-4 border ${s.alerta ? 'border-red-200' : 'border-slate-200'}`}>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.alerta ? 'text-red-600' : 'text-navy'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Link href="/prospectos"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${!searchParams.sector && !searchParams.estado ? 'bg-navy text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
            Todos
          </Link>
          {(['pyme', 'estudio', 'franquicia'] as const).map(s => (
            <Link key={s} href={`/prospectos?sector=${s}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${searchParams.sector === s ? 'bg-navy text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
              {SECTORES[s]}
            </Link>
          ))}
          <div className="w-px bg-slate-200 mx-1" />
          <Link href="/prospectos?estado=beta_activo"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${searchParams.estado === 'beta_activo' ? 'bg-green-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
            Betas activos
          </Link>
          <Link href="/prospectos?estado=demo_agendada"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${searchParams.estado === 'demo_agendada' ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
            Demos agendadas
          </Link>
        </div>

        {/* Tabla */}
        {lista.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400 text-sm mb-4">No hay prospectos todavía.</p>
            <ProspectosClient accion="nuevo-inline" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Nombre / Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Segmento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Próxima acción</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lista.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{p.nombre}</p>
                      <p className="text-slate-400 text-xs">{p.empresa}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-600 text-xs">{SECTORES[p.sector]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={p.estado} />
                    </td>
                    <td className="px-4 py-3">
                      {p.proxima_accion ? (
                        <div>
                          <p className="text-xs text-slate-600 truncate max-w-[180px]">{p.proxima_accion}</p>
                          {p.fecha_proxima_accion && (
                            <p className={`text-xs mt-0.5 ${vencido(p.fecha_proxima_accion) ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                              {vencido(p.fecha_proxima_accion) ? '⚠ ' : ''}{p.fecha_proxima_accion}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/prospectos/${p.id}`}
                        className="text-brand hover:text-brand-hover text-xs font-medium">
                        Ver →
                      </Link>
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
