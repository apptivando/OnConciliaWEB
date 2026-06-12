"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Prospecto, Interaccion, EstadoProspecto, ESTADOS, ESTADOS_ORDEN } from '@/lib/types'
import { generarMensaje } from '@/lib/mensajes'

export default function FichaClient({
  prospecto,
  timeline,
}: {
  prospecto: Prospecto
  timeline: Interaccion[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'mensajes' | 'acciones' | 'timeline'>('mensajes')
  const [paso, setPaso] = useState<1 | 2 | 3>(1)
  const [copiado, setCopiado] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState<EstadoProspecto>(prospecto.estado)
  const [proximaAccion, setProximaAccion] = useState(prospecto.proxima_accion ?? '')
  const [fechaAccion, setFechaAccion] = useState(prospecto.fecha_proxima_accion ?? '')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  const mensaje = generarMensaje(prospecto.sector, paso, {
    nombre: prospecto.nombre.split(' ')[0],
    empresa: prospecto.empresa,
    cargo: prospecto.cargo ?? undefined,
  })

  async function copiar() {
    await navigator.clipboard.writeText(mensaje)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)

    // Registrar en interacciones
    const supabase = createClient()
    await supabase.from('interacciones').insert({
      prospecto_id: prospecto.id,
      tipo: paso === 3 ? 'email' : 'mensaje',
      contenido: mensaje,
      canal: paso === 3 ? 'email' : 'linkedin',
    })
    await supabase.from('prospectos').update({ fecha_ultimo_contacto: new Date().toISOString().split('T')[0] }).eq('id', prospecto.id)
  }

  async function guardarAcciones() {
    setSaving(true)
    const supabase = createClient()

    const estadoCambio = nuevoEstado !== prospecto.estado

    await supabase.from('prospectos').update({
      estado: nuevoEstado,
      proxima_accion: proximaAccion || null,
      fecha_proxima_accion: fechaAccion || null,
      ...(estadoCambio && !prospecto.fecha_primer_contacto && nuevoEstado !== 'por_contactar'
        ? { fecha_primer_contacto: new Date().toISOString().split('T')[0] }
        : {}),
      fecha_ultimo_contacto: new Date().toISOString().split('T')[0],
    }).eq('id', prospecto.id)

    if (estadoCambio) {
      await supabase.from('interacciones').insert({
        prospecto_id: prospecto.id,
        tipo: 'cambio_estado',
        estado_anterior: prospecto.estado,
        estado_nuevo: nuevoEstado,
      })
    }

    if (nota.trim()) {
      await supabase.from('interacciones').insert({
        prospecto_id: prospecto.id,
        tipo: 'nota',
        contenido: nota.trim(),
      })
      setNota('')
    }

    setSaving(false)
    router.refresh()
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
        {([
          { key: 'mensajes', label: 'Generador de mensajes' },
          { key: 'acciones', label: 'Estado y acciones' },
          { key: 'timeline', label: `Timeline (${timeline.length})` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition ${
              tab === t.key ? 'bg-navy text-white' : 'text-slate-500 hover:text-slate-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Mensajes */}
      {tab === 'mensajes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-500">Paso del mensaje</p>
            <div className="flex gap-1">
              {([1, 2, 3] as const).map(n => (
                <button key={n} onClick={() => setPaso(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                    paso === n ? 'bg-navy text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400 mb-3">
            {paso === 1 && 'Solicitud de conexión en LinkedIn (≤300 chars)'}
            {paso === 2 && 'Mensaje de valor tras la conexión (día 3)'}
            {paso === 3 && 'Email de seguimiento + CTA a demo (día 7)'}
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed min-h-[120px] border border-slate-100">
            {mensaje}
          </div>

          {paso === 1 && (
            <div className="mt-2 text-right">
              <span className={`text-xs ${mensaje.length > 300 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                {mensaje.length}/300 caracteres
              </span>
            </div>
          )}

          <button onClick={copiar}
            className="mt-3 w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-xl text-sm font-medium transition">
            {copiado ? '✓ Copiado al clipboard' : 'Copiar mensaje'}
          </button>
        </div>
      )}

      {/* Tab: Estado y acciones */}
      {tab === 'acciones' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-2 block">Actualizar estado</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ESTADOS_ORDEN.map(e => (
                <button key={e} onClick={() => setNuevoEstado(e)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition ${
                    nuevoEstado === e
                      ? `${ESTADOS[e].color} ring-1 ring-offset-1 ring-brand`
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}>
                  {ESTADOS[e].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Próxima acción</label>
              <input value={proximaAccion} onChange={e => setProximaAccion(e.target.value)}
                placeholder="Enviar mensaje de valor..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Fecha</label>
              <input type="date" value={fechaAccion} onChange={e => setFechaAccion(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Agregar nota</label>
            <textarea value={nota} onChange={e => setNota(e.target.value)}
              rows={2} placeholder="Ej: Mencionó que cierran con Tango pero igual mostró interés..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none" />
          </div>

          <button onClick={guardarAcciones} disabled={saving}
            className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      )}

      {/* Tab: Timeline */}
      {tab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          {timeline.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Sin interacciones todavía.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {timeline.map(item => (
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
                      <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                        {item.contenido}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(item.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
