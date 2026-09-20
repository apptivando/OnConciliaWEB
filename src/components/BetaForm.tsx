'use client'

import { useEffect, useState } from 'react'
import Cal, { getCalApi } from '@calcom/embed-react'

const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK ?? 'guillermo-onconcilia/15min'
const CAL_NAMESPACE = '15min'

/**
 * Formulario de la landing. Es el mismo de `/coordinar/[id]` —datos primero,
 * calendario después— con dos diferencias: acá el visitante es anónimo (no
 * hay prospecto que actualizar, se crea un lead) y se le pide el correo,
 * que es lo que permite seguirlo si no agenda.
 *
 * Por qué en dos pasos y no directo al calendario: el que abandona en el
 * calendario se pierde entero. Guardando los datos primero, ese abandono
 * entra igual a la secuencia de correos, que son recordatorios de agendar.
 */
export default function BetaForm({ fuente = 'landing' }: { fuente?: string }) {
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', nota: '' })
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'agendar' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Boilerplate oficial de @calcom/embed-react: hay que inicializar la API
  // antes de que el <Cal> embebido pueda pintar el calendario. theme:'light'
  // fuerza el tema claro — sin esto Cal.com usa el del sistema del visitante,
  // y en modo oscuro rompe contra la tarjeta blanca.
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

  function set(campo: keyof typeof form, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEstado('enviando')
    setErrorMsg('')

    try {
      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fuente }),
      })
      if (res.ok) {
        setEstado('agendar')
      } else {
        setErrorMsg('Algo salió mal. Intentá de nuevo.')
        setEstado('error')
      }
    } catch {
      setErrorMsg('Algo salió mal. Intentá de nuevo.')
      setEstado('error')
    }
  }

  // El paso del calendario necesita bastante más ancho: month_view de Cal.com
  // recién pone el calendario y los horarios lado a lado a partir de ~900px
  // de iframe; con menos los apila y obliga a scrollear.
  const ancho = estado === 'agendar' ? 'max-w-5xl' : 'max-w-md'
  const padding = estado === 'agendar' ? 'p-4' : 'p-6'

  return (
    <div className={`w-full ${ancho} bg-white rounded-2xl ${padding} shadow-xl mx-auto text-left`}>
      {estado === 'agendar' ? (
        <>
          <p className="text-navy font-semibold text-sm mb-1">
            ¡Gracias{form.nombre ? `, ${form.nombre.split(' ')[0]}` : ''}!
          </p>
          <p className="text-slate-500 text-sm mb-4">
            Elegí el horario que más te convenga. Son 15 minutos, por videollamada.
          </p>
          <Cal
            namespace={CAL_NAMESPACE}
            calLink={CAL_LINK}
            style={{ width: '100%', height: '680px', overflow: 'auto' }}
            config={{
              theme: 'light',
              layout: 'month_view',
              name: form.nombre,
              email: form.email,
              notes: form.nota,
            }}
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

          {errorMsg && <p className="text-red-500 text-xs">{errorMsg}</p>}

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
