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
    enriquecidos: number
    descartados: number
    con_datos_nuevos: number
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
      const resContacto = await fetch('/api/agents/enrich-contacto', { method: 'POST' })
      const dataContacto = await resContacto.json()
      if (!resContacto.ok) {
        setError(dataContacto.error ?? `Error ${resContacto.status}`)
        setEstado('error')
        return
      }

      const resScrape = await fetch('/api/agents/scrape-sitios', { method: 'POST' })
      const dataScrape = await resScrape.json()
      if (!resScrape.ok) {
        setError(dataScrape.error ?? `Error ${resScrape.status}`)
        setEstado('error')
        return
      }

      setResultado({
        enriquecidos: dataContacto.enriquecidos ?? 0,
        descartados: dataContacto.descartados ?? 0,
        con_datos_nuevos: dataScrape.con_datos_nuevos ?? 0,
      })
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
                  Busca sitio web/email para prospectos con solo teléfono, y scrapea los sitios encontrados en busca de WhatsApp o email
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
                    Procesa hasta 12 prospectos con solo teléfono y hasta 15 sitios pendientes de scrapear por corrida.
                    Los que no tengan más datos que el teléfono quedan como &quot;Descartado&quot;.
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
                  <p className="text-navy font-medium text-sm">Buscando y scrapeando...</p>
                  <p className="text-slate-400 text-xs mt-1">Puede tardar hasta un minuto</p>
                </div>
              )}

              {estado === 'listo' && resultado && (
                <div className="py-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl mx-auto mb-4">
                    ✓
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div>
                      <p className="text-navy font-bold text-xl">{resultado.enriquecidos}</p>
                      <p className="text-slate-500 text-xs">con datos nuevos</p>
                    </div>
                    <div>
                      <p className="text-navy font-bold text-xl">{resultado.con_datos_nuevos}</p>
                      <p className="text-slate-500 text-xs">sitios scrapeados</p>
                    </div>
                    <div>
                      <p className="text-navy font-bold text-xl">{resultado.descartados}</p>
                      <p className="text-slate-500 text-xs">descartados</p>
                    </div>
                  </div>
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
