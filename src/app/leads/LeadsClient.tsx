'use client'

import { useState } from 'react'

export default function LeadsClient({ email }: { email: string }) {
  const [estado, setEstado] = useState<'idle' | 'loading' | 'enviado' | 'error'>('idle')

  async function calificar() {
    setEstado('loading')
    const res = await fetch('/api/agents/qualify-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setEstado(res.ok ? 'enviado' : 'error')
  }

  if (estado === 'enviado') {
    return <span className="text-emerald-600 text-xs font-medium">Email enviado ✓</span>
  }
  if (estado === 'error') {
    return <span className="text-red-500 text-xs">Error al enviar</span>
  }

  return (
    <button
      onClick={calificar}
      disabled={estado === 'loading'}
      className="text-brand hover:text-brand-hover text-xs font-medium disabled:opacity-50"
    >
      {estado === 'loading' ? 'Enviando...' : 'Calificar →'}
    </button>
  )
}
