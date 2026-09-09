'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { DOCUMENTOS, GRUPOS, NIVELES, type Documento } from '@/lib/documentos'
import { OBJECIONES, ARGUMENTOS } from '@/lib/objeciones'

const ACENTOS: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n',
}

/** Búsqueda tolerante a acentos: "comision" encuentra "comisión". */
function normalizar(s: string) {
  return s.toLowerCase().replace(/[áéíóúüñ]/g, (c) => ACENTOS[c] ?? c)
}

type Hit = { id: string; titulo: string; texto: string; tipo: 'objecion' | 'argumento' }

const INDICE_FAQ: Hit[] = [
  ...OBJECIONES.map((o) => ({
    id: o.id,
    titulo: o.objecion,
    texto: [o.objecion, o.respuesta, o.siInsiste ?? '', o.tags.join(' ')].join(' '),
    tipo: 'objecion' as const,
  })),
  ...ARGUMENTOS.map((a) => ({
    id: a.id,
    titulo: a.titulo,
    texto: [a.titulo, a.cuerpo, a.frase ?? '', a.tags.join(' ')].join(' '),
    tipo: 'argumento' as const,
  })),
]

function NivelBadge({ doc }: { doc: Documento }) {
  const n = NIVELES[doc.nivel]
  return (
    <span
      title={n.detalle}
      className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${n.clase}`}
    >
      {n.etiqueta}
    </span>
  )
}

function Ficha({ doc }: { doc: Documento }) {
  return (
    <Link
      href={`/documentos/${doc.slug}`}
      className="group block bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand hover:shadow-sm transition"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-navy font-semibold leading-snug group-hover:text-brand transition">
          {doc.titulo}
        </h3>
        <NivelBadge doc={doc} />
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{doc.resumen}</p>
      <p className="text-xs text-slate-400 mt-3 leading-relaxed">
        <span className="font-semibold text-slate-500">Cuándo:</span> {doc.cuando}
      </p>
    </Link>
  )
}

export default function DocumentosIndex() {
  const [q, setQ] = useState('')
  const term = normalizar(q.trim())

  const docsFiltrados = useMemo(() => {
    if (!term) return DOCUMENTOS
    return DOCUMENTOS.filter((d) =>
      normalizar([d.titulo, d.resumen, d.cuando, d.tags.join(' ')].join(' ')).includes(term)
    )
  }, [term])

  const faqHits = useMemo(() => {
    if (term.length < 3) return []
    return INDICE_FAQ.filter((h) => normalizar(h.texto).includes(term)).slice(0, 6)
  }, [term])

  const buscando = term.length > 0
  const sinResultados = buscando && docsFiltrados.length === 0 && faqHits.length === 0

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-navy text-xl font-bold">Documentos</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Material comercial y de estrategia. Todo el contenido es interno salvo lo marcado
          como compartible.
        </p>
      </div>

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
          placeholder="Buscá una objeción, un precio, un tema…  (API, InterBanking, comisión, seguridad)"
          className="w-full bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition"
        />
      </div>

      {faqHits.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Respuestas en el FAQ de objeciones
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {faqHits.map((h) => (
              <Link
                key={`${h.tipo}-${h.id}`}
                href={`/documentos/objeciones#${h.id}`}
                className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50 transition"
              >
                <div className="min-w-0">
                  <p className="text-sm text-navy font-medium truncate">{h.titulo}</p>
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">
                    {h.tipo === 'objecion' ? 'Objeción' : 'Argumento de fondo'}
                  </p>
                </div>
                <span className="shrink-0 text-brand text-sm">Abrir →</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sinResultados && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-600 text-sm">
            No hay nada con <span className="font-semibold text-navy">{q}</span>.
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Probá con un término más corto, o revisá el FAQ de objeciones completo.
          </p>
        </div>
      )}

      {buscando && docsFiltrados.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Documentos
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {docsFiltrados.map((doc) => (
              <Ficha key={doc.slug} doc={doc} />
            ))}
          </div>
        </section>
      )}

      {!buscando &&
        GRUPOS.map((grupo) => {
          const docs = DOCUMENTOS.filter((d) => d.grupo === grupo.id)
          if (docs.length === 0) return null
          return (
            <section key={grupo.id} className="mb-10">
              <div className="mb-3">
                <h2 className="text-navy font-semibold">{grupo.titulo}</h2>
                <p className="text-slate-500 text-sm">{grupo.bajada}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {docs.map((doc) => (
                  <Ficha key={doc.slug} doc={doc} />
                ))}
              </div>
            </section>
          )
        })}
    </div>
  )
}
