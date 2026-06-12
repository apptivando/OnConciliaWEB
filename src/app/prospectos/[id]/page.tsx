import { createClient } from '@/lib/supabase/server'
import { Prospecto, Interaccion, SECTORES, ESTADOS_ORDEN } from '@/lib/types'
import EstadoBadge from '@/components/EstadoBadge'
import FichaClient from './FichaClient'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function FichaPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: prospecto }, { data: interacciones }] = await Promise.all([
    supabase.from('prospectos').select('*').eq('id', params.id).single(),
    supabase.from('interacciones').select('*').eq('prospecto_id', params.id).order('created_at', { ascending: false }),
  ])

  if (!prospecto) notFound()

  const p = prospecto as Prospecto
  const timeline = (interacciones as Interaccion[]) ?? []

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy px-6 py-4 flex items-center gap-3">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          On<span className="text-accent">Concilia</span>
        </Link>
        <span className="text-slate-600">/</span>
        <Link href="/prospectos" className="text-slate-400 text-sm hover:text-slate-300">Prospectos</Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 text-sm">{p.nombre}</span>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-3 gap-5">

        {/* Columna izquierda — datos + estado */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* Datos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="font-bold text-navy text-base">{p.nombre}</h1>
                <p className="text-slate-500 text-sm">{p.empresa}</p>
                {p.cargo && <p className="text-slate-400 text-xs mt-0.5">{p.cargo}</p>}
              </div>
              <span className="text-sm">{p.sector === 'pyme' ? '🏢' : p.sector === 'estudio' ? '📊' : '🏪'}</span>
            </div>

            <div className="flex flex-col gap-2 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Segmento</span>
                <span className="font-medium text-slate-700">{SECTORES[p.sector]}</span>
              </div>
              <div className="flex justify-between">
                <span>Canal</span>
                <span className="font-medium text-slate-700 capitalize">{p.canal}</span>
              </div>
              {p.fecha_primer_contacto && (
                <div className="flex justify-between">
                  <span>Primer contacto</span>
                  <span className="font-medium text-slate-700">{p.fecha_primer_contacto}</span>
                </div>
              )}
            </div>

            {(p.linkedin_url || p.email) && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
                {p.linkedin_url && (
                  <a href={p.linkedin_url.startsWith('http') ? p.linkedin_url : `https://${p.linkedin_url}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-brand text-xs hover:underline">
                    → LinkedIn
                  </a>
                )}
                {p.email && (
                  <a href={`mailto:${p.email}`} className="text-brand text-xs hover:underline">
                    → {p.email}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Estado actual */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold text-slate-500 mb-3">Estado actual</p>
            <EstadoBadge estado={p.estado} />

            <div className="mt-4 flex flex-col gap-1">
              {ESTADOS_ORDEN.map((e, i) => (
                <div key={e} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    p.estado === e ? 'bg-brand' :
                    ESTADOS_ORDEN.indexOf(p.estado) > i ? 'bg-emerald-400' :
                    'bg-slate-200'
                  }`} />
                  <span className={`text-xs ${p.estado === e ? 'text-brand font-medium' : 'text-slate-400'}`}>
                    {e.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Próxima acción */}
          {(p.proxima_accion || p.notas) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              {p.proxima_accion && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Próxima acción</p>
                  <p className="text-sm text-slate-700">{p.proxima_accion}</p>
                  {p.fecha_proxima_accion && (
                    <p className="text-xs text-slate-400 mt-0.5">{p.fecha_proxima_accion}</p>
                  )}
                </div>
              )}
              {p.notas && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Notas</p>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{p.notas}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna derecha — generador + timeline */}
        <div className="col-span-2 flex flex-col gap-4">
          <FichaClient prospecto={p} timeline={timeline} />
        </div>
      </div>
    </div>
  )
}
