'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SolicitudForm({ email }: { email: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email,
    nombre: '',
    empresa: '',
    sector: 'pyme',
    cargo: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/leads/qualify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      router.push('/solicitud/gracias')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Algo salió mal. Intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Tu email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:border-brand"
        />
      </div>

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
        <label className="text-xs font-medium text-slate-600 mb-1 block">Empresa o estudio *</label>
        <input
          value={form.empresa}
          onChange={(e) => set('empresa', e.target.value)}
          required
          placeholder="García & Asociados"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">¿Qué tipo de negocio es? *</label>
        <select
          value={form.sector}
          onChange={(e) => set('sector', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand"
        >
          <option value="pyme">Pyme (empresa de servicios o comercio)</option>
          <option value="estudio">Estudio contable</option>
          <option value="franquicia">Franquicia o cadena de locales</option>
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-slate-600 mb-1 block">Tu cargo</label>
        <input
          value={form.cargo}
          onChange={(e) => set('cargo', e.target.value)}
          placeholder="Contador, Gerente Administrativo..."
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
        />
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-brand hover:bg-brand-hover text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 mt-1"
      >
        {loading ? 'Enviando...' : 'Solicitar acceso beta →'}
      </button>
    </form>
  )
}
