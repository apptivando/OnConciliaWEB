"use client"

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, useEffect, useTransition } from 'react'
import { SECTORES, ESTADOS, ESTADOS_ORDEN } from '@/lib/types'

const PRIORIDADES = [
  { value: '1', label: '1 · Con WhatsApp' },
  { value: '2', label: '2 · Con email' },
  { value: '3', label: '3 · Solo teléfono' },
  { value: '4', label: '4 · Sin contacto' },
]

const selectClass =
  'bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 focus:outline-none focus:border-brand'

/**
 * Filtros de /prospectos. Van a la URL, no a estado de cliente: así filtra
 * el server (una sola consulta con `range`, no traer todo al navegador), la
 * vista filtrada se puede compartir por link, y "atrás" funciona como se
 * espera. Adaptado de `ClientsToolbar.tsx` de FORCOM.
 */
export default function ProspectosToolbar({ localidades }: { localidades: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [, startTransition] = useTransition()

  const [q, setQ] = useState(params.get('q') ?? '')

  useEffect(() => {
    const current = params.get('q') ?? ''
    if (q === current) return
    const timer = setTimeout(() => apply('q', q), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  function apply(key: string, value: string) {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }))
  }

  const activeFilters = ['sector', 'estado', 'prioridad', 'localidad', 'q'].filter((k) => params.get(k))

  return (
    <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nombre, empresa, email…"
        className="flex-1 min-w-[180px] bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs placeholder:text-slate-400 focus:outline-none focus:border-brand"
      />

      <select value={params.get('sector') ?? ''} onChange={(e) => apply('sector', e.target.value)} className={selectClass}>
        <option value="">Todos los segmentos</option>
        {(Object.keys(SECTORES) as Array<keyof typeof SECTORES>).map((s) => (
          <option key={s} value={s}>{SECTORES[s]}</option>
        ))}
      </select>

      <select value={params.get('estado') ?? ''} onChange={(e) => apply('estado', e.target.value)} className={selectClass}>
        <option value="">Todo estado</option>
        {ESTADOS_ORDEN.map((e) => (
          <option key={e} value={e}>{ESTADOS[e].label}</option>
        ))}
      </select>

      <select value={params.get('prioridad') ?? ''} onChange={(e) => apply('prioridad', e.target.value)} className={selectClass}>
        <option value="">Toda prioridad</option>
        {PRIORIDADES.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>

      {localidades.length > 0 && (
        <select value={params.get('localidad') ?? ''} onChange={(e) => apply('localidad', e.target.value)} className={selectClass}>
          <option value="">Todas las localidades</option>
          {localidades.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      )}

      {activeFilters.length > 0 && (
        <button
          onClick={() => startTransition(() => router.replace(pathname, { scroll: false }))}
          className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-navy transition-colors"
        >
          Limpiar
        </button>
      )}
    </div>
  )
}
