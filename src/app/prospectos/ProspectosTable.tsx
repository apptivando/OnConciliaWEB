"use client"

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Prospecto, SECTORES, ORIGEN_STYLE, PRIORIDAD_CONTACTO } from '@/lib/types'
import ContactChips from '@/components/prospectos/ContactChips'
import { IconChat, IconActividad, IconRefresh } from '@/components/prospectos/icons'
import ProspectoDrawer from './ProspectoDrawer'

/**
 * Cuánto contenido de la tabla queda fuera de la vista al hacer scroll
 * horizontal. Sin esto no hay señal de que haya más columnas — adaptado de
 * `ClientsTable.tsx` de FORCOM.
 */
function useHorizontalOverflow() {
  const ref = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ left: false, right: false })

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const hidden = el.scrollWidth - el.clientWidth
      setEdges({
        left: el.scrollLeft > 4,
        right: hidden > 4 && el.scrollLeft < hidden - 4,
      })
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      observer.disconnect()
    }
  }, [])

  return { ref, ...edges }
}

/** Prioridad "0" agrupa lo que no tiene prioridad calculada (manual/landing). */
type Grupo = 1 | 2 | 3 | 4 | 0
const LABEL_GRUPO: Record<Grupo, string> = {
  1: PRIORIDAD_CONTACTO[1].label,
  2: PRIORIDAD_CONTACTO[2].label,
  3: PRIORIDAD_CONTACTO[3].label,
  4: PRIORIDAD_CONTACTO[4].label,
  0: 'Sin prioridad calculada',
}

const ACCION_CLS =
  'inline-flex items-center justify-center p-1.5 rounded-md text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors'

export default function ProspectosTable({
  prospectos,
  filtered,
  initialClientId,
}: {
  prospectos: Prospecto[]
  /** Si hay filtros activos, no se agrupa: la agrupación confundiría los conteos. */
  filtered: boolean
  initialClientId: string | null
}) {
  const [collapsed, setCollapsed] = useState<Set<Grupo>>(new Set<Grupo>([4, 0]))
  const scroll = useHorizontalOverflow()
  const [openId, setOpenId] = useState<string | null>(initialClientId)
  const [exporting, setExporting] = useState(false)
  const router = useRouter()
  const pushedRef = useRef(false)

  function openProspecto(id: string) {
    const next = new URLSearchParams(window.location.search)
    next.set('cliente', id)
    if (openId) {
      window.history.replaceState(null, '', `?${next}`)
    } else {
      window.history.pushState(null, '', `?${next}`)
      pushedRef.current = true
    }
    setOpenId(id)
  }

  function closeProspecto() {
    setOpenId(null)
    if (pushedRef.current) {
      pushedRef.current = false
      window.history.back()
      return
    }
    const next = new URLSearchParams(window.location.search)
    next.delete('cliente')
    const qs = next.toString()
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
  }

  useEffect(() => {
    function onPop() {
      const id = new URLSearchParams(window.location.search).get('cliente')
      setOpenId(id)
      if (!id) pushedRef.current = false
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openIndex = prospectos.findIndex((p) => p.id === openId)
  const openRow = openIndex >= 0 ? prospectos[openIndex] : null

  function toggle(g: Grupo) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(g)) next.delete(g)
      else next.add(g)
      return next
    })
  }

  async function reBuscar(p: Prospecto, e: React.MouseEvent) {
    e.stopPropagation()
    const supabase = createClient()
    await supabase.from('prospectos').update({ enriquecido_en: null }).eq('id', p.id)
    router.refresh()
  }

  function exportarCsv() {
    setExporting(true)
    try {
      const header = ['Nombre', 'Empresa', 'Sector', 'Localidad', 'Email', 'Teléfono', 'WhatsApp', 'Sitio', 'Prioridad', 'Origen', 'Estado']
      const rows = prospectos.map((p) => [
        p.nombre, p.empresa, SECTORES[p.sector], p.localidad ?? '', p.email ?? '', p.telefono ?? '',
        p.whatsapp ?? '', p.sitio_web ?? '', p.prioridad_contacto ?? '', ORIGEN_STYLE[p.origen].label, p.estado,
      ])
      const csv = '﻿' + [header, ...rows]
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `prospectos_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (prospectos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
        {filtered ? 'Ningún prospecto coincide con estos filtros.' : 'Todavía no hay prospectos cargados.'}
      </div>
    )
  }

  // Vienen ordenados por prioridad desde el server, así que los grupos son
  // tramos contiguos: alcanza con detectar dónde cambia.
  const rows: Array<{ kind: 'header'; grupo: Grupo; count: number } | { kind: 'row'; p: Prospecto }> = []
  let lastGrupo: Grupo | null = null
  const counts: Record<Grupo, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
  for (const p of prospectos) counts[(p.prioridad_contacto ?? 0) as Grupo]++

  for (const p of prospectos) {
    const grupo = (p.prioridad_contacto ?? 0) as Grupo
    if (!filtered && grupo !== lastGrupo) {
      rows.push({ kind: 'header', grupo, count: counts[grupo] })
      lastGrupo = grupo
    }
    if (!filtered && collapsed.has(grupo)) continue
    rows.push({ kind: 'row', p })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-100">
        <p className="text-xs text-slate-400">{prospectos.length} en esta página</p>
        <button
          onClick={exportarCsv}
          disabled={exporting}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-navy bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-40 transition-colors"
        >
          {exporting ? 'Preparando…' : 'Exportar CSV'}
        </button>
      </div>

      <div className="relative">
        {scroll.right && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-10 z-20 bg-gradient-to-l from-white to-transparent"
          />
        )}
        <div ref={scroll.ref} className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wide uppercase text-slate-400 sticky left-0 z-10 bg-slate-50">Prospecto</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wide uppercase text-slate-400">Origen</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wide uppercase text-slate-400">Contacto</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wide uppercase text-slate-400 hidden md:table-cell">Localidad</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold tracking-wide uppercase text-slate-400 hidden lg:table-cell">Google</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold tracking-wide uppercase text-slate-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                if (item.kind === 'header') {
                  const isCollapsed = collapsed.has(item.grupo)
                  return (
                    <tr key={`h-${item.grupo}`} className="bg-slate-50/70 border-y border-slate-100">
                      <td colSpan={6} className="px-5 py-2">
                        <button
                          onClick={() => toggle(item.grupo)}
                          className="sticky left-0 flex items-center gap-2 text-xs font-bold tracking-wide uppercase text-slate-600 hover:text-navy transition-colors"
                        >
                          <span className="text-slate-400">{isCollapsed ? '▸' : '▾'}</span>
                          {item.grupo === 0 ? LABEL_GRUPO[0] : `${item.grupo} · ${LABEL_GRUPO[item.grupo]}`}
                          <span className="text-slate-400 font-normal tracking-normal normal-case">({item.count})</span>
                        </button>
                      </td>
                    </tr>
                  )
                }

                const p = item.p
                const origin = ORIGEN_STYLE[p.origen]
                const enCola = Boolean(p.sitio_web) && !p.enriquecido_en

                return (
                  <tr
                    key={p.id}
                    onClick={() => openProspecto(p.id)}
                    className={`group border-b border-slate-50 last:border-0 cursor-pointer transition-colors ${
                      p.id === openId ? 'bg-slate-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td
                      className={`px-5 py-3 max-w-[260px] sticky left-0 z-10 transition-colors ${
                        p.id === openId ? 'bg-slate-50' : 'bg-white group-hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-navy font-medium truncate">{p.nombre}</p>
                      <p className="text-slate-400 text-xs truncate">
                        {[p.empresa !== p.nombre ? p.empresa : null, SECTORES[p.sector]].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </td>

                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase border rounded-full ${origin.color}`}>
                        {origin.label}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <ContactChips p={p} />
                      {enCola && <p className="text-[11px] text-slate-400 mt-1">En cola de enriquecimiento</p>}
                    </td>

                    <td className="px-5 py-3 text-slate-500 text-xs hidden md:table-cell">{p.localidad ?? '—'}</td>

                    <td className="px-5 py-3 text-xs hidden lg:table-cell whitespace-nowrap">
                      {p.rating != null ? (
                        <span className="text-slate-500">
                          ★ {p.rating}{p.reviews_count != null && <span className="text-slate-400"> ({p.reviews_count})</span>}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        <button onClick={() => openProspecto(p.id)} title="Mensajes" aria-label={`Mensajes de ${p.nombre}`} className={ACCION_CLS}>
                          <IconChat />
                        </button>
                        <button onClick={() => openProspecto(p.id)} title="Timeline" aria-label={`Timeline de ${p.nombre}`} className={ACCION_CLS}>
                          <IconActividad />
                        </button>
                        {p.sitio_web && p.enriquecido_en && (
                          <button onClick={(e) => reBuscar(p, e)} title="Volver a enriquecer" aria-label={`Volver a enriquecer ${p.nombre}`} className={ACCION_CLS}>
                            <IconRefresh />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ProspectoDrawer
        prospecto={openRow}
        onClose={closeProspecto}
        onPrev={openIndex > 0 ? () => openProspecto(prospectos[openIndex - 1].id) : undefined}
        onNext={openIndex >= 0 && openIndex < prospectos.length - 1 ? () => openProspecto(prospectos[openIndex + 1].id) : undefined}
        position={openIndex >= 0 ? { index: openIndex, total: prospectos.length } : undefined}
      />
    </div>
  )
}
