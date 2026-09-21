"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Prospecto,
  Interaccion,
  EstadoProspecto,
  ESTADOS,
  ESTADOS_ORDEN,
  SECTORES,
  ORIGEN_STYLE,
  PRIORIDAD_CONTACTO,
} from '@/lib/types'
import Drawer from '@/components/prospectos/Drawer'
import ContactChips from '@/components/prospectos/ContactChips'

type Tab = 'resumen' | 'acciones' | 'timeline'

function fmtFecha(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Una fila del bloque de resumen. "—" en vez de esconder lo vacío. */
function Fila({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-slate-100 last:border-0">
      <span className="w-28 shrink-0 text-xs text-slate-400 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0 text-xs text-slate-600 break-words">{children}</div>
    </div>
  )
}

export default function ProspectoDrawer({
  prospecto,
  onClose,
  onPrev,
  onNext,
  position,
}: {
  prospecto: Prospecto | null
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  position?: { index: number; total: number }
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('resumen')
  const [shownId, setShownId] = useState(prospecto?.id ?? null)

  // Se conserva el último prospecto mostrado mientras el panel se desliza
  // afuera, para que el contenido no desaparezca de golpe.
  const [current, setCurrent] = useState(prospecto)
  if (prospecto && prospecto.id !== shownId) {
    setShownId(prospecto.id)
    setCurrent(prospecto)
    setTab('resumen')
  } else if (prospecto && prospecto !== current) {
    // Mismo id, datos actualizados (después de un router.refresh()).
    setCurrent(prospecto)
  }

  const shown = current
  if (!shown) return null

  const origin = ORIGEN_STYLE[shown.origen]

  return (
    <Drawer
      open={Boolean(prospecto)}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 flex-wrap">
          <span>{shown.nombre}</span>
          <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase border rounded-full ${origin.color}`}>
            {origin.label}
          </span>
        </div>
      }
      subtitle={
        <div className="flex items-center gap-2 flex-wrap">
          <span>{[shown.empresa !== shown.nombre ? shown.empresa : null, shown.localidad].filter(Boolean).join(' · ') || SECTORES[shown.sector]}</span>
          {shown.prioridad_contacto != null && (
            <span>· Prioridad {shown.prioridad_contacto} — {PRIORIDAD_CONTACTO[shown.prioridad_contacto]?.label}</span>
          )}
        </div>
      }
    >
      {/* Tabs + navegación prev/next */}
      <div className="flex items-center justify-between gap-2 px-6 py-2 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div className="flex gap-1">
          {([
            ['resumen', 'Resumen'],
            ['acciones', 'Acciones'],
            ['timeline', 'Timeline'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition ${
                tab === key ? 'bg-navy text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {position && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
            <button
              onClick={onPrev}
              disabled={!onPrev}
              className="px-1 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Anterior"
            >
              ↑
            </button>
            <span>{position.index + 1}/{position.total}</span>
            <button
              onClick={onNext}
              disabled={!onNext}
              className="px-1 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Siguiente"
            >
              ↓
            </button>
          </div>
        )}
      </div>

      {tab === 'resumen' && <TabResumen p={shown} />}
      {tab === 'acciones' && <TabAcciones p={shown} onGuardado={() => router.refresh()} />}
      {tab === 'timeline' && <TabTimeline prospectoId={shown.id} />}
    </Drawer>
  )
}

function TabResumen({ p }: { p: Prospecto }) {
  return (
    <div className="px-6 py-4 space-y-5">
      <div>
        <ContactChips p={p} />
      </div>

      {/* Lo primero que se mira de un prospecto es en qué punto está y qué
          hay que hacer. Antes el Resumen no mostraba el estado en ningún
          lado, y "dejó sus datos pero no agendó" sólo se podía deducir
          leyendo el Timeline. */}
      <div>
        <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-400 mb-1.5">Situación</p>
        <Fila label="Estado">
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${ESTADOS[p.estado].color}`}>
            {ESTADOS[p.estado].label}
          </span>
        </Fila>
        <Fila label="Próxima acción">
          {p.proxima_accion ?? '—'}
          {p.fecha_proxima_accion && ` (${p.fecha_proxima_accion})`}
        </Fila>
      </div>

      <div>
        <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-400 mb-1.5">Contacto</p>
        <Fila label="Empresa">{p.empresa}</Fila>
        <Fila label="Cargo">{p.cargo ?? '—'}</Fila>
        <Fila label="Dirección">{p.direccion ?? '—'}</Fila>
        <Fila label="Localidad">{p.localidad ?? '—'}</Fila>
      </div>

      <div>
        <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-400 mb-1.5">De dónde salió</p>
        <Fila label="Origen">{ORIGEN_STYLE[p.origen].label}</Fila>
        <Fila label="Segmento">{SECTORES[p.sector]}</Fila>
        <Fila label="En Google">
          {p.rating != null ? (
            <>★ {p.rating}{p.reviews_count != null && ` (${p.reviews_count} reseñas)`}</>
          ) : '—'}
        </Fila>
        <Fila label="Alta">{fmtFecha(p.created_at)}</Fila>
        {p.enriquecido_en && <Fila label="Enriquecido">{fmtFecha(p.enriquecido_en)}</Fila>}
      </div>

      {p.notas && (
        <div>
          <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-400 mb-1.5">Notas</p>
          <Fila label="Notas">
            <span className="whitespace-pre-wrap">{p.notas}</span>
          </Fila>
        </div>
      )}
    </div>
  )
}

function TabAcciones({ p, onGuardado }: { p: Prospecto; onGuardado: () => void }) {
  const [nuevoEstado, setNuevoEstado] = useState<EstadoProspecto>(p.estado)
  const [proximaAccion, setProximaAccion] = useState(p.proxima_accion ?? '')
  const [fechaAccion, setFechaAccion] = useState(p.fecha_proxima_accion ?? '')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  async function guardar() {
    setSaving(true)
    const supabase = createClient()
    const estadoCambio = nuevoEstado !== p.estado

    await supabase.from('prospectos').update({
      estado: nuevoEstado,
      proxima_accion: proximaAccion || null,
      fecha_proxima_accion: fechaAccion || null,
      ...(estadoCambio && !p.fecha_primer_contacto && nuevoEstado !== 'por_contactar'
        ? { fecha_primer_contacto: new Date().toISOString().split('T')[0] }
        : {}),
      fecha_ultimo_contacto: new Date().toISOString().split('T')[0],
    }).eq('id', p.id)

    if (estadoCambio) {
      await supabase.from('interacciones').insert({
        prospecto_id: p.id,
        tipo: 'cambio_estado',
        estado_anterior: p.estado,
        estado_nuevo: nuevoEstado,
      })
    }

    if (nota.trim()) {
      await supabase.from('interacciones').insert({ prospecto_id: p.id, tipo: 'nota', contenido: nota.trim() })
      setNota('')
    }

    setSaving(false)
    onGuardado()
  }

  return (
    <div className="px-6 py-4 flex flex-col gap-4">
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-2 block">Actualizar estado</label>
        <div className="grid grid-cols-2 gap-1.5">
          {ESTADOS_ORDEN.map((e) => (
            <button
              key={e}
              onClick={() => setNuevoEstado(e)}
              className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                nuevoEstado === e ? `${ESTADOS[e].color} ring-1 ring-offset-1 ring-brand` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {ESTADOS[e].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Próxima acción</label>
          <input
            value={proximaAccion}
            onChange={(e) => setProximaAccion(e.target.value)}
            placeholder="Enviar mensaje de valor..."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">Fecha</label>
          <input
            type="date"
            value={fechaAccion}
            onChange={(e) => setFechaAccion(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">Agregar nota</label>
        <textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          rows={2}
          placeholder="Ej: Mencionó que cierran con Tango pero igual mostró interés..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none"
        />
      </div>

      <button
        onClick={guardar}
        disabled={saving}
        className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  )
}

function TabTimeline({ prospectoId }: { prospectoId: string }) {
  const [timeline, setTimeline] = useState<Interaccion[] | null>(null)

  useEffect(() => {
    let cancelado = false
    setTimeline(null)
    const supabase = createClient()
    supabase
      .from('interacciones')
      .select('*')
      .eq('prospecto_id', prospectoId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!cancelado) setTimeline((data as Interaccion[]) ?? [])
      })
    return () => {
      cancelado = true
    }
  }, [prospectoId])

  if (timeline === null) {
    return <div className="px-6 py-8 text-center text-slate-400 text-sm">Cargando…</div>
  }

  if (timeline.length === 0) {
    return <p className="px-6 py-8 text-slate-400 text-sm text-center">Sin interacciones todavía.</p>
  }

  return (
    <div className="px-6 py-4 flex flex-col gap-3">
      {timeline.map((item) => (
        <div key={item.id} className="flex gap-3 items-start">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
            {item.tipo === 'mensaje' ? '💬' :
             item.tipo === 'email' ? '✉' :
             item.tipo === 'cambio_estado' ? '→' :
             item.tipo === 'demo' ? '📹' :
             item.tipo === 'llamada' ? '📞' : '📝'}
          </div>
          <div className="flex-1">
            {item.tipo === 'cambio_estado' ? (
              <p className="text-xs text-slate-500">
                Estado: <span className="line-through">{item.estado_anterior?.replace(/_/g, ' ')}</span>
                {' → '}
                <span className="font-medium text-slate-700">{item.estado_nuevo?.replace(/_/g, ' ')}</span>
              </p>
            ) : (
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{item.contenido}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">{fmtFecha(item.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
