import { EstadoProspecto, ESTADOS } from '@/lib/types'

export default function EstadoBadge({ estado }: { estado: EstadoProspecto }) {
  const { label, color } = ESTADOS[estado]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  )
}
