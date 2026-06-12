"use client"

import { useState } from 'react'
import NuevoProspectoForm from '@/components/NuevoProspectoForm'

export default function ProspectosClient({ accion }: { accion: 'nuevo' | 'nuevo-inline' }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {accion === 'nuevo' ? (
        <button onClick={() => setOpen(true)}
          className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + Nuevo prospecto
        </button>
      ) : (
        <button onClick={() => setOpen(true)}
          className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
          Agregar el primero
        </button>
      )}
      {open && <NuevoProspectoForm onClose={() => setOpen(false)} />}
    </>
  )
}
