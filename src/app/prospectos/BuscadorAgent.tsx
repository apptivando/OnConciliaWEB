'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Estado = 'idle' | 'buscando' | 'listo' | 'error'

export default function BuscadorAgent() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [estado, setEstado] = useState<Estado>('idle')
  const [resultado, setResultado] = useState<{
    prospectos_guardados: number
    resumen: string
  } | null>(null)
  const [form, setForm] = useState({ sector: 'estudio', ciudad: '' })

  function cerrar() {
    setOpen(false)
    setEstado('idle')
    setResultado(null)
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    setEstado('buscando')
    setResultado(null)
    try {
      const res = await fetch('/api/agents/lead-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setResultado(data)
      setEstado('listo')
      router.refresh()
    } catch {
      setEstado('error')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-slate-200 hover:border-brand bg-white text-slate-700 hover:text-brand px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        ✦ Buscar con IA
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-navy text-base">Buscar prospectos con IA</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  El agente busca en Google y guarda los resultados en el CRM
                </p>
              </div>
              <button onClick={cerrar} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
                ×
              </button>
            </div>

            <div className="p-5">
              {estado === 'idle' && (
                <form onSubmit={buscar} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Segmento a buscar
                    </label>
                    <select
                      value={form.sector}
                      onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand"
                    >
                      <option value="estudio">Estudios contables</option>
                      <option value="pyme">Pymes</option>
                      <option value="franquicia">Franquicias</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Ciudad o provincia
                    </label>
                    <input
                      value={form.ciudad}
                      onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
                      placeholder="Córdoba, Buenos Aires, Rosario..."
                      required
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-brand hover:bg-brand-hover text-white font-semibold py-2.5 rounded-xl transition text-sm"
                  >
                    Iniciar búsqueda
                  </button>
                </form>
              )}

              {estado === 'buscando' && (
                <div className="py-10 text-center">
                  <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-navy font-medium text-sm">Buscando prospectos...</p>
                  <p className="text-slate-400 text-xs mt-1">Puede tardar hasta 60 segundos</p>
                </div>
              )}

              {estado === 'listo' && resultado && (
                <div className="py-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl mx-auto mb-4">
                    ✓
                  </div>
                  <p className="text-navy font-bold text-3xl mb-1">
                    {resultado.prospectos_guardados}
                  </p>
                  <p className="text-slate-500 text-sm mb-4">prospectos nuevos en el CRM</p>
                  {resultado.resumen && (
                    <p className="text-slate-500 text-xs leading-relaxed bg-slate-50 rounded-lg p-3 text-left">
                      {resultado.resumen}
                    </p>
                  )}
                  <button
                    onClick={cerrar}
                    className="mt-5 bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-2 rounded-xl text-sm transition"
                  >
                    Ver en el CRM
                  </button>
                </div>
              )}

              {estado === 'error' && (
                <div className="py-10 text-center">
                  <p className="text-red-500 text-sm mb-3">Algo salió mal. Intentá de nuevo.</p>
                  <button onClick={() => setEstado('idle')} className="text-brand text-sm underline">
                    Reintentar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
