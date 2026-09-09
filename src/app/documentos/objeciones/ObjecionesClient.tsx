'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ARGUMENTOS,
  CONCEDER,
  CONTEXTO,
  FRASE_CONCEDER,
  NO_DECIR,
  OBJECIONES,
  REENCUADRE,
  REGLA_GENERAL,
  TARJETA,
} from '@/lib/objeciones'

const ACENTOS: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n',
}

function normalizar(s: string) {
  return s.toLowerCase().replace(/[áéíóúüñ]/g, (c) => ACENTOS[c] ?? c)
}

function Chevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m5 8 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function ObjecionesClient() {
  const [q, setQ] = useState('')
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set())
  const term = normalizar(q.trim())

  // Al llegar con un ancla desde el buscador del índice, abrir y centrar ese bloque.
  useEffect(() => {
    const id = window.location.hash.replace('#', '')
    if (!id) return
    setAbiertos(new Set([id]))
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 60)
    return () => window.clearTimeout(t)
  }, [])

  function toggle(id: string) {
    setAbiertos((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const objeciones = useMemo(() => {
    if (!term) return OBJECIONES
    return OBJECIONES.filter((o) =>
      normalizar([o.objecion, o.respuesta, o.siInsiste ?? '', o.tags.join(' ')].join(' ')).includes(term)
    )
  }, [term])

  const argumentos = useMemo(() => {
    if (!term) return ARGUMENTOS
    return ARGUMENTOS.filter((a) =>
      normalizar([a.titulo, a.cuerpo, a.frase ?? '', a.tags.join(' ')].join(' ')).includes(term)
    )
  }, [term])

  const buscando = term.length > 0
  const sinResultados = buscando && objeciones.length === 0 && argumentos.length === 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link href="/documentos" className="text-slate-500 hover:text-navy text-sm transition">
          ← Documentos
        </Link>
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border bg-red-50 text-red-700 border-red-200">
          Interno · No compartir con clientes ni referidores
        </span>
      </div>

      <div className="mb-6">
        <h1 className="text-navy text-2xl font-bold leading-tight">Objeciones comerciales</h1>
        <p className="text-slate-500 text-sm mt-1">
          Por qué trabajamos con el extracto descargado y no con una API directa al banco, y cómo
          convertir esa objeción en ventaja.
        </p>
      </div>

      {/* Tarjeta de reunión: lo primero que se ve, siempre. */}
      <section className="bg-navy rounded-2xl p-6 mb-6 text-white">
        <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-4">
          Tarjeta de reunión
        </p>
        <dl className="space-y-3">
          {TARJETA.map((t) => (
            <div key={t.rotulo} className="sm:grid sm:grid-cols-[110px_1fr] sm:gap-4">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-0.5">
                {t.rotulo}
              </dt>
              <dd className="text-sm text-slate-100 leading-relaxed">{t.texto}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-3">
          El reencuadre — lo único que hay que saber de memoria
        </p>
        <blockquote className="border-l-[3px] border-brand pl-4 text-navy text-[15px] font-medium leading-relaxed">
          {REENCUADRE.frase}
        </blockquote>
        <p className="text-sm text-slate-600 mt-4 leading-relaxed">{REENCUADRE.detalle}</p>
      </section>

      <div className="relative mb-8">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscá la objeción…  (API, InterBanking, contador, seguridad, manual)"
          className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
        />
      </div>

      {sinResultados && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-8">
          <p className="text-slate-600 text-sm">
            Nada con <span className="font-semibold text-navy">{q}</span>.
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Si es una objeción nueva, sumala a <code className="font-mono">src/lib/objeciones.ts</code>{' '}
            con la respuesta que funcionó.
          </p>
        </div>
      )}

      {objeciones.length > 0 && (
        <section className="mb-10">
          <h2 className="text-navy font-semibold mb-1">Guion de objeciones</h2>
          <p className="text-slate-500 text-sm mb-4">Respuestas literales, listas para decir.</p>
          <div className="space-y-2.5">
            {objeciones.map((o) => {
              const abierto = abiertos.has(o.id)
              return (
                <div
                  key={o.id}
                  id={o.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden scroll-mt-24"
                >
                  <button
                    onClick={() => toggle(o.id)}
                    aria-expanded={abierto}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 transition"
                  >
                    <span className="text-navy font-medium text-[15px]">«{o.objecion}»</span>
                    <Chevron abierto={abierto} />
                  </button>
                  {abierto && (
                    <div className="px-5 pb-5 pt-1">
                      <blockquote className="border-l-[3px] border-accent pl-4 text-slate-700 text-[15px] leading-relaxed">
                        {o.respuesta}
                      </blockquote>
                      {o.siInsiste && (
                        <p className="mt-4 text-sm text-slate-600 bg-slate-50 rounded-lg px-4 py-3">
                          <span className="font-semibold text-navy">Si insiste: </span>
                          {o.siInsiste}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {argumentos.length > 0 && (
        <section className="mb-10">
          <h2 className="text-navy font-semibold mb-1">Argumentos de fondo</h2>
          <p className="text-slate-500 text-sm mb-4">
            Ordenados por fuerza. No se recitan todos: se elige el que le importa a ese prospecto.
          </p>
          <div className="space-y-2.5">
            {argumentos.map((a) => {
              const abierto = abiertos.has(a.id)
              return (
                <div
                  key={a.id}
                  id={a.id}
                  className={`bg-white rounded-xl border overflow-hidden scroll-mt-24 ${
                    a.destacado ? 'border-brand/40' : 'border-slate-200'
                  }`}
                >
                  <button
                    onClick={() => toggle(a.id)}
                    aria-expanded={abierto}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 transition"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      {a.destacado && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand">
                          Gana la discusión
                        </span>
                      )}
                      <span className="text-navy font-medium text-[15px]">{a.titulo}</span>
                    </span>
                    <Chevron abierto={abierto} />
                  </button>
                  {abierto && (
                    <div className="px-5 pb-5 pt-1">
                      {a.cuerpo.split('\n\n').map((parrafo, i) => (
                        <p key={i} className="text-slate-700 text-[15px] leading-relaxed mb-3">
                          {parrafo}
                        </p>
                      ))}
                      {a.frase && (
                        <blockquote className="mt-4 border-l-[3px] border-accent pl-4 text-navy text-[15px] font-medium leading-relaxed">
                          {a.frase}
                        </blockquote>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {!buscando && (
        <>
          <section className="mb-10">
            <h2 className="text-navy font-semibold mb-1">Dónde la objeción es legítima</h2>
            <p className="text-slate-500 text-sm mb-4">
              Reconocerlo da credibilidad para todo lo demás. No pelear estos casos.
            </p>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <ul className="space-y-3">
                {CONCEDER.map((c, i) => (
                  <li key={i} className="grid grid-cols-[18px_minmax(0,1fr)] gap-2.5 text-sm text-slate-700">
                    <span className="text-slate-300 font-mono">—</span>
                    <span className="leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
              <blockquote className="mt-5 border-l-[3px] border-accent pl-4 text-navy text-[15px] font-medium leading-relaxed">
                {FRASE_CONCEDER}
              </blockquote>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-navy font-semibold mb-1">Qué no decir</h2>
            <p className="text-slate-500 text-sm mb-4">
              Cada uno de estos convierte una posición sólida en una debilidad.
            </p>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {NO_DECIR.map((n, i) => (
                <div key={i} className="px-6 py-4">
                  <p className="text-navy font-medium text-sm flex items-start gap-2">
                    <span className="text-red-500 font-bold shrink-0">×</span>
                    <span>{n.que}</span>
                  </p>
                  <p className="text-slate-600 text-sm mt-1.5 pl-5 leading-relaxed">{n.porque}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-navy font-semibold mb-1">Contexto del mercado</h2>
            <p className="text-slate-500 text-sm mb-4">
              Para cuando el prospecto conoce el tema y quiere discutir en serio.
            </p>
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {CONTEXTO.map((c) => (
                <div key={c.titulo} className="px-6 py-4">
                  <p className="text-navy font-medium text-sm">{c.titulo}</p>
                  <p className="text-slate-600 text-sm mt-1 leading-relaxed">{c.texto}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-400 text-xs mt-3 leading-relaxed">
              Si el prospecto pregunta por un dato puntual —costo exacto de InterBanking, cobertura
              actual de un agregador— verificar antes de afirmar. Esto da el marco, no cifras para
              citar.
            </p>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Regla general
            </p>
            <p className="text-slate-700 text-[15px] leading-relaxed">{REGLA_GENERAL}</p>
          </section>
        </>
      )}
    </div>
  )
}
