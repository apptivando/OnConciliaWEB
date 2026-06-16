import { createClient } from '@supabase/supabase-js'
import { Prospecto, Sector } from '@/lib/types'
import { generarMensaje } from '@/lib/mensajes'
import Link from 'next/link'
import ColaClient from './ColaClient'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 0

function mensajeEmail(p: Prospecto) {
  const vars = { nombre: p.nombre.split(' ')[0], empresa: p.empresa, cargo: p.cargo ?? undefined }
  return generarMensaje(p.sector as Sector, 1, vars)
}

function mensajeLinkedIn(p: Prospecto) {
  const vars = { nombre: p.nombre.split(' ')[0], empresa: p.empresa, cargo: p.cargo ?? undefined }
  return generarMensaje(p.sector as Sector, 1, vars)
}

export default async function ColaPage() {
  const { data: todos } = await supabase
    .from('prospectos')
    .select('*')
    .eq('estado', 'por_contactar')
    .order('created_at', { ascending: true })

  const lista = (todos ?? []) as Prospecto[]

  const conEmail = lista.filter((p) => p.email)
  const sinEmailConLinkedIn = lista.filter((p) => !p.email && p.linkedin_url)
  const sinContacto = lista.filter((p) => !p.email && !p.linkedin_url)

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-navy px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          On<span className="text-accent">Concilia</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/prospectos" className="text-slate-400 text-sm hover:text-white transition">CRM</Link>
          <Link href="/leads" className="text-slate-400 text-sm hover:text-white transition">Leads</Link>
          <span className="text-slate-300 text-sm font-medium">Cola de aprobación</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-navy text-xl font-bold">Cola de aprobación de mensajes</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Revisá y editá cada mensaje antes de enviarlo.
          </p>
          <div className="flex items-center gap-4 mt-3">
            <Stat count={conEmail.length} label="con email" color="emerald" />
            <Stat count={sinEmailConLinkedIn.length} label="LinkedIn" color="blue" />
            <Stat count={sinContacto.length} label="sin contacto" color="slate" />
          </div>
        </div>

        {lista.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <p className="text-slate-400 text-sm">No hay prospectos pendientes de contactar.</p>
            <Link href="/prospectos" className="text-accent text-sm font-medium hover:underline mt-2 inline-block">
              Ver CRM →
            </Link>
          </div>
        )}

        {/* Sección email */}
        {conEmail.length > 0 && (
          <Section
            titulo="Por email"
            subtitulo="Editá el mensaje y aprobá el envío uno por uno."
            badge="Envío manual"
            badgeColor="emerald"
          >
            {conEmail.map((p) => (
              <ColaClient key={p.id} prospecto={p} mensajeInicial={mensajeEmail(p)} canal="email" />
            ))}
          </Section>
        )}

        {/* Sección LinkedIn */}
        {sinEmailConLinkedIn.length > 0 && (
          <Section
            titulo="Por LinkedIn"
            subtitulo="Abrí el perfil, pegá el mensaje y marcalo como enviado."
            badge="Semi-manual"
            badgeColor="blue"
          >
            {sinEmailConLinkedIn.map((p) => (
              <ColaClient key={p.id} prospecto={p} mensajeInicial={mensajeLinkedIn(p)} canal="linkedin" />
            ))}
          </Section>
        )}

        {/* Sección sin contacto */}
        {sinContacto.length > 0 && (
          <Section
            titulo="Sin dato de contacto"
            subtitulo="Usá los links para buscar el email o LinkedIn manualmente y actualizar la ficha."
            badge="Investigar"
            badgeColor="slate"
          >
            {sinContacto.map((p) => (
              <ColaClient key={p.id} prospecto={p} mensajeInicial="" canal="sin_contacto" />
            ))}
          </Section>
        )}
      </div>
    </div>
  )
}

function Stat({ count, label, color }: { count: number; label: string; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    slate: 'bg-slate-100 text-slate-500 border-slate-200',
  }
  return (
    <span className={`text-xs border px-2 py-1 rounded-full font-medium ${colors[color]}`}>
      {count} {label}
    </span>
  )
}

function Section({
  titulo,
  subtitulo,
  badge,
  badgeColor,
  children,
}: {
  titulo: string
  subtitulo: string
  badge: string
  badgeColor: string
  children: React.ReactNode
}) {
  const badgeColors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    slate: 'bg-slate-100 text-slate-500 border-slate-200',
  }
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-navy font-semibold text-sm">{titulo}</h2>
        <span className={`text-xs border px-2 py-0.5 rounded-full font-medium ${badgeColors[badgeColor]}`}>
          {badge}
        </span>
      </div>
      <p className="text-slate-400 text-xs mb-3">{subtitulo}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}
