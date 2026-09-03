'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Estado = 'idle' | 'buscando' | 'listo' | 'error'

export default function EnriquecerAgent() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [estado, setEstado] = useState<Estado>('idle')
  const [error, setError] = useState('')
  const [resultado, setResultado] = useState<{
    procesados: number
    con_email: number
    con_whatsapp: number
    con_telefono: number
  } | null>(null)

  function cerrar() {
    setOpen(false)
    setEstado('idle')
    setResultado(null)
    setError('')
  }

  async function enriquecer() {
    setEstado('buscando')
    setResultado(null)
    setError('')
    try {
      const res = await fetch('/api/prospects/enrich', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? `Error ${res.status}`)
        setEstado('error')
        return
      }
      setResultado(data)
      setEstado('listo')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red')
      setEstado('error')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-slate-200 hover:border-brand bg-white text-slate-700 hover:text-brand px-4 py-2 rounded-lg text-sm font-medium transition"
      >
        🔎 Enriquecer contactos
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-navy text-base">Enriquecer contactos</h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Visita el sitio web de los prospectos con teléfono solo y busca email o WhatsApp
                </p>
              </div>
              <button onClick={cerrar} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
                ×
              </button>
            </div>

            <div className="p-5">
              {estado === 'idle' && (
                <div className="py-4 text-center">
                  <p className="text-slate-500 text-xs mb-4 leading-relaxed">
                    Procesa hasta 12 prospectos con sitio web pendientes de visitar por corrida.
                    Los que no tienen sitio quedan como están — hay que resolverlos a mano.
                  </p>
                  <button
                    onClick={enriquecer}
                    className="bg-brand hover:bg-brand-hover text-white font-semibold py-2.5 px-6 rounded-xl transition text-sm"
                  >
                    Iniciar
                  </button>
                </div>
              )}

              {estado === 'buscando' && (
                <div className="py-10 text-center">
                  <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-navy font-medium text-sm">Visitando sitios...</p>
                  <p className="text-slate-400 text-xs mt-1">Puede tardar hasta un minuto</p>
                </div>
              )}

              {estado === 'listo' && resultado && (
                <div className="py-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl mx-auto mb-4">
                    ✓
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-2">
                    <div>
                      <p className="text-navy font-bold text-xl">{resultado.con_whatsapp}</p>
                      <p className="text-slate-500 text-xs">con WhatsApp</p>
                    </div>
                    <div>
                      <p className="text-navy font-bold text-xl">{resultado.con_email}</p>
                      <p className="text-slate-500 text-xs">con email</p>
                    </div>
                    <div>
                      <p className="text-navy font-bold text-xl">{resultado.con_telefono}</p>
                      <p className="text-slate-500 text-xs">con teléfono nuevo</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs mb-4">
                    {resultado.procesados} sitios visitados
                  </p>
                  <button
                    onClick={cerrar}
                    className="bg-brand hover:bg-brand-hover text-white font-semibold px-6 py-2 rounded-xl text-sm transition"
                  >
                    Ver en el CRM
                  </button>
                </div>
              )}

              {estado === 'error' && (
                <div className="py-10 text-center">
                  <p className="text-red-500 text-sm mb-1">Algo salió mal.</p>
                  {error && <p className="text-slate-400 text-xs mb-3 break-words">{error}</p>}
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
