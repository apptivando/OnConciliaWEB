'use client'

import { useState } from 'react'

const HORARIOS = [
  { value: 'manana', label: 'Mañana (9 a 13)' },
  { value: 'tarde', label: 'Tarde (13 a 18)' },
  { value: 'cualquiera', label: 'Cualquier horario' },
]

export default function CoordinarForm({ prospectoId }: { prospectoId: string }) {
  const [form, setForm] = useState({ nombre: '', telefono: '', horario: 'cualquiera', nota: '' })
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'enviado' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEstado('enviando')
    setErrorMsg('')

    const res = await fetch('/api/coordinar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospecto_id: prospectoId, ...form }),
    })

    if (res.ok) {
      setEstado('enviado')
    } else {
      const data = await res.json()
      setErrorMsg(data.error ?? 'Algo salió mal. Intentá de nuevo.')
      setEstado('error')
    }
  }

  if (estado === 'enviado') {
    return (
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl mx-auto mb-4">
          ✓
        </div>
        <p className="text-navy font-semibold text-sm mb-1">¡Listo!</p>
        <p className="text-slate-500 text-sm">
          Te llamamos a {form.telefono} {form.horario !== 'cualquiera' ? `por la ${form.horario === 'manana' ? 'mañana' : 'tarde'}` : 'cuando mejor te quede'}.
        </p>
      </div>
    )
  }

  return (
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
        <label className="text-xs font-medium text-slate-600 mb-1 block">¿Cuándo te queda mejor? *</label>
        <div className="flex flex-col gap-2">
          {HORARIOS.map((h) => (
            <label
              key={h.value}
              className={`flex items-center gap-2 border rounded-lg px-3 py-2 text-sm cursor-pointer transition ${
                form.horario === h.value ? 'border-brand bg-blue-50 text-navy' : 'border-slate-200 text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="horario"
                value={h.value}
                checked={form.horario === h.value}
                onChange={(e) => set('horario', e.target.value)}
                className="accent-brand"
              />
              {h.label}
            </label>
          ))}
        </div>
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
        {estado === 'enviando' ? 'Enviando...' : 'Coordinar llamada →'}
      </button>
    </form>
  )
}
