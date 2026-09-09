import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Markdown from '@/components/documentos/Markdown'
import { NIVELES, getDocumento } from '@/lib/documentos'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function DocumentoPage({ params }: { params: { slug: string } }) {
  const doc = getDocumento(params.slug)

  // La página del FAQ es propia; acá sólo se sirven los documentos de /content.
  if (!doc?.archivo) notFound()

  let contenido: string
  try {
    contenido = await readFile(path.join(process.cwd(), 'content', doc.archivo), 'utf8')
  } catch {
    notFound()
  }

  const nivel = NIVELES[doc.nivel]

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link href="/documentos" className="text-slate-500 hover:text-navy text-sm transition">
          ← Documentos
        </Link>
        <span
          title={nivel.detalle}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${nivel.clase}`}
        >
          {nivel.etiqueta} · {nivel.detalle}
        </span>
      </div>

      <article className="bg-white rounded-2xl border border-slate-200 px-6 py-7 sm:px-9 sm:py-9">
        <Markdown>{contenido}</Markdown>
      </article>
    </div>
  )
}
