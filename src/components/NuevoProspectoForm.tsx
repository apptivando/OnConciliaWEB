"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sector, Canal } from '@/lib/types'

export default function NuevoProspectoForm({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    empresa: '',
    sector: 'pyme' as Sector,
    cargo: '',
    canal: 'linkedin' as Canal,
    linkedin_url: '',
    email: '',
    notas: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('prospectos').insert({
      ...form,
      cargo: form.cargo || null,
      linkedin_url: form.linkedin_url || null,
      email: form.email || null,
      notas: form.notas || null,
    })
    setLoading(false)
    if (!error) {
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold text-navy text-base">Nuevo prospecto</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre *</label>
              <input required value={form.nombre} onChange={e => set('nombre', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Empresa *</label>
              <input required value={form.empresa} onChange={e => set('empresa', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Segmento *</label>
              <select value={form.sector} onChange={e => set('sector', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand bg-white">
                <option value="pyme">Pyme</option>
                <option value="estudio">Estudio contable</option>
                <option value="franquicia">Franquicia</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Canal</label>
              <select value={form.canal} onChange={e => set('canal', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand bg-white">
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email frío</option>
                <option value="referido">Referido</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Cargo</label>
            <input value={form.cargo} onChange={e => set('cargo', e.target.value)}
              placeholder="Gerente Administrativo, CFO, Contador..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">LinkedIn URL</label>
              <input value={form.linkedin_url} onChange={e => set('linkedin_url', e.target.value)}
                placeholder="linkedin.com/in/..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Notas</label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand resize-none" />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="bg-brand hover:bg-brand-hover text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar prospecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
