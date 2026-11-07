'use client'

import { useState } from 'react'

/**
 * Formulario de la landing. Desde el 2026-11-07 lo recibe Apptivando CRM
 * (crm.apptivando.com), formulario «OnConciliaBETA» de la marca OnConcilia: el
 * CRM crea o actualiza el contacto, avisa al equipo, le manda la copia y, si no
 * agenda, lo sigue con la secuencia «Interesado que no agendó».
 *
 * Datos primero, calendario después: el que abandona en el calendario igual
 * queda guardado. Al responder, el CRM devuelve `next`, su página de agenda con
 * la marca de OnConcilia, y la reserva queda enlazada al contacto.
 *
 * La clave del formulario es pública (identifica el formulario, no da acceso).
 */
const CRM_FORM_URL = 'https://crm.apptivando.com/api/forms/0df63f3574cd450ea33510a81a4169fc'

// `fuente` queda por compatibilidad con page.tsx; el CRM registra el formulario.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function BetaForm(_props: { fuente?: string }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', nota: '', website: '' })
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'listo' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')

  function set(campo: keyof typeof form, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEstado('enviando')
    setMensaje('')

    try {
      const res = await fetch(CRM_FORM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nombre,
          email: form.email,
          phone: form.telefono,
          message: form.nota ? `Trabaja con: ${form.nota}` : '',
          website: form.website, // trampa para bots: una persona no la ve
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; next?: string | null; message?: string; error?: string } | null
      if (res.ok && data?.ok) {
        if (data.next) {
          window.location.href = data.next
          return
        }
        setMensaje(data.message ?? '¡Gracias! Te vamos a contactar.')
        setEstado('listo')
      } else {
        setMensaje(data?.error ?? 'Algo salió mal. Intentá de nuevo.')
        setEstado('error')
      }
    } catch {
      setMensaje('Algo salió mal. Intentá de nuevo.')
      setEstado('error')
    }
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl mx-auto text-left">
      {estado === 'listo' ? (
        <p className="text-navy font-semibold text-sm">{mensaje}</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Trampa para bots: oculta para las personas. */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" value={form.website} onChange={(e) => set('website', e.target.value)} />
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tu nombre *</label>
            <input
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              required
              placeholder="Juan García"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tu correo *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
              placeholder="vos@tuempresa.com"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Tu teléfono o WhatsApp *
            </label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
              required
              placeholder="341 555-1234"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              ¿Con qué bancos trabajan? (opcional)
            </label>
            <textarea
              value={form.nota}
              onChange={(e) => set('nota', e.target.value)}
              rows={2}
              placeholder="Ej: Nación, Santander y Mercado Pago"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none"
            />
          </div>

          {estado === 'error' && <p className="text-red-500 text-xs">{mensaje}</p>}

          <button
            type="submit"
            disabled={estado === 'enviando'}
            className="bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 mt-1"
          >
            {estado === 'enviando' ? 'Guardando...' : 'Elegir horario →'}
          </button>

          <p className="text-slate-400 text-xs text-center leading-relaxed">
            Te escribimos sólo por esto. Podés darte de baja de un clic.
          </p>
        </form>
      )}
    </div>
  )
}
