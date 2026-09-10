'use client'

import { useEffect, useState } from 'react'
import Cal, { getCalApi } from '@calcom/embed-react'

/**
 * `guillermo-onconcilia/15min` es un placeholder — reemplazar por
 * NEXT_PUBLIC_CAL_LINK una vez creada la cuenta en cal.com (el servicio
 * hosteado, no el repo self-hosted: eso es una app entera aparte).
 * Formato del link: "tu-usuario/tu-tipo-de-evento".
 */
const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK ?? 'guillermo-onconcilia/15min'
const CAL_NAMESPACE = '15min'

export default function CoordinarForm({ prospectoId }: { prospectoId: string }) {
  const [form, setForm] = useState({ nombre: '', telefono: '', nota: '' })
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'agendar' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Boilerplate oficial de @calcom/embed-react: hay que inicializar la API
  // antes de que el <Cal> embebido pueda pintar el calendario. theme:'light'
  // fuerza el tema claro — sin esto Cal.com usa el tema del sistema/navegador
  // del visitante, y en modo oscuro rompe contra la tarjeta blanca de acá.
  useEffect(() => {
    ;(async function () {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE })
      cal('ui', {
        theme: 'light',
        styles: { branding: { brandColor: '#2563EB' } },
        hideEventTypeDetails: false,
        layout: 'month_view',
      })
    })()
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEstado('enviando')
    setErrorMsg('')

    // Guarda el contacto en el CRM primero — que Cal.com no tenga el turno
    // todavía no debería perder el teléfono/nota si algo falla después.
    const res = await fetch('/api/coordinar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospecto_id: prospectoId, ...form }),
    })

    if (res.ok) {
      setEstado('agendar')
    } else {
      const data = await res.json()
      setErrorMsg(data.error ?? 'Algo salió mal. Intentá de nuevo.')
      setEstado('error')
    }
  }

  // La tarjeta vive acá (no en page.tsx) para poder ensancharla solo en el
  // paso de Cal.com. month_view de Cal.com recién pone el calendario y los
  // horarios lado a lado (en vez de apilados, que obliga a scrollear) a
  // partir de un ancho de iframe bastante generoso — max-w-2xl (672px) se
  // quedaba corto y seguía apilando. max-w-5xl con menos padding le da
  // ~960px reales al iframe.
  const ancho = estado === 'agendar' ? 'max-w-5xl' : 'max-w-md'
  const padding = estado === 'agendar' ? 'p-4' : 'p-6'

  return (
    <div className={`w-full ${ancho} bg-white rounded-2xl ${padding} shadow-xl mx-auto`}>
      {estado === 'agendar' ? (
        <>
          <p className="text-navy font-semibold text-sm mb-1">¡Gracias, {form.nombre.split(' ')[0]}!</p>
          <p className="text-slate-500 text-sm mb-4">Elegí el horario que más te convenga:</p>
          <Cal
            namespace={CAL_NAMESPACE}
            calLink={CAL_LINK}
            style={{ width: '100%', height: '680px', overflow: 'auto' }}
            config={{ theme: 'light', layout: 'month_view', name: form.nombre, notes: form.nota }}
          />
        </>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tu teléfono *</label>
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
            <label className="text-xs font-medium text-slate-600 mb-1 block">Algo más que quieras contarnos (opcional)</label>
            <textarea
              value={form.nota}
              onChange={(e) => set('nota', e.target.value)}
              rows={2}
              placeholder="Ej: manejamos 3 cuentas bancarias distintas..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none"
            />
          </div>

          {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}

          <button
            type="submit"
            disabled={estado === 'enviando'}
            className="bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 mt-1"
          >
            {estado === 'enviando' ? 'Enviando...' : 'Elegir horario →'}
          </button>
        </form>
      )}
    </div>
  )
}
