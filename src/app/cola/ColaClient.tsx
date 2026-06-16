'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Prospecto } from '@/lib/types'

type Canal = 'email' | 'linkedin' | 'sin_contacto'

interface Props {
  prospecto: Prospecto
  mensajeInicial: string
  canal: Canal
}

export default function ColaClient({ prospecto: p, mensajeInicial, canal }: Props) {
  const router = useRouter()
  const [mensaje, setMensaje] = useState(mensajeInicial)
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'enviado' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function enviar() {
    setEstado('enviando')
    const res = await fetch('/api/outreach/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prospecto_id: p.id, canal, mensaje }),
    })
    if (res.ok) {
      setEstado('enviado')
      setTimeout(() => router.refresh(), 800)
    } else {
      const data = await res.json()
      setErrorMsg(data.error ?? 'Error al enviar')
      setEstado('error')
    }
  }

  async function abrirLinkedIn() {
    await navigator.clipboard.writeText(mensaje)
    window.open(p.linkedin_url!, '_blank')
  }

  if (estado === 'enviado') return null

  const nombreCorto = p.nombre.split(' ')[0]

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-navy text-sm truncate">{p.nombre}</p>
          <p className="text-slate-400 text-xs">{p.empresa} · {p.cargo ?? p.sector}</p>
          {p.email && (
            <p className="text-slate-400 text-xs mt-0.5">
              <span className="text-slate-300">✉</span> {p.email}
            </p>
          )}
          {p.linkedin_url && canal === 'linkedin' && (
            <p className="text-blue-500 text-xs mt-0.5 truncate">
              <span className="text-slate-300">in</span>{' '}
              <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {p.linkedin_url.replace('https://www.linkedin.com/', 'linkedin.com/')}
              </a>
            </p>
          )}
        </div>
        <div className="flex-shrink-0">
          {canal === 'email' && (
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-medium">
              Email
            </span>
          )}
          {canal === 'linkedin' && (
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-medium">
              LinkedIn
            </span>
          )}
          {canal === 'sin_contacto' && (
            <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
              Sin dato
            </span>
          )}
        </div>
      </div>

      {/* Mensaje editable (solo para email y LinkedIn) */}
      {canal !== 'sin_contacto' && (
        <div className="mb-3">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={4}
            className="w-full text-xs text-slate-700 leading-relaxed border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none bg-slate-50"
          />
          <p className={`text-xs mt-1 text-right ${mensaje.length > 300 ? 'text-red-500' : 'text-slate-400'}`}>
            {mensaje.length} chars {canal === 'linkedin' && mensaje.length > 300 ? '(LinkedIn: máx 300 para conexión)' : ''}
          </p>
        </div>
      )}

      {/* Acciones */}
      {canal === 'email' && (
        <div className="flex items-center gap-2">
          <button
            onClick={enviar}
            disabled={estado === 'enviando' || !mensaje.trim()}
            className="bg-accent hover:bg-accent/90 text-navy text-xs font-semibold px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {estado === 'enviando' ? 'Enviando...' : 'Aprobar y enviar email'}
          </button>
          {estado === 'error' && (
            <p className="text-red-500 text-xs">{errorMsg}</p>
          )}
        </div>
      )}

      {canal === 'linkedin' && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={abrirLinkedIn}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
          >
            Abrir LinkedIn + copiar mensaje
          </button>
          <button
            onClick={enviar}
            disabled={estado === 'enviando'}
            className="border border-slate-200 hover:border-emerald-300 text-slate-500 hover:text-emerald-700 text-xs font-medium px-3 py-2 rounded-lg transition disabled:opacity-50"
          >
            {estado === 'enviando' ? 'Registrando...' : 'Marcar enviado'}
          </button>
          {estado === 'error' && (
            <p className="text-red-500 text-xs">{errorMsg}</p>
          )}
        </div>
      )}

      {canal === 'sin_contacto' && (
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(`"${nombreCorto}" "${p.empresa}" contacto email`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 border border-slate-200 hover:border-slate-400 text-slate-600 text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Buscar en Google
          </a>
          <a
            href={`https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${nombreCorto} ${p.empresa}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Buscar en LinkedIn
          </a>
          <a
            href={`/prospectos/${p.id}`}
            className="text-slate-400 hover:text-slate-600 text-xs px-2 py-2 rounded-lg transition"
          >
            Editar ficha →
          </a>
        </div>
      )}
    </div>
  )
}
