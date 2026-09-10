import { createClient } from '@supabase/supabase-js'
import CoordinarForm from './CoordinarForm'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Página pública (sin login) a la que llega el link del email frío a
 * comercios. Usa el service role porque quien visita no tiene sesión —
 * mismo criterio que /api/leads/capture y /api/outreach/send.
 */
export default async function CoordinarPage({ params }: { params: { id: string } }) {
  const { data: prospecto } = await supabase
    .from('prospectos')
    .select('id, empresa, estado')
    .eq('id', params.id)
    .maybeSingle()

  if (!prospecto) {
    return (
      <main className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="text-white font-bold text-2xl tracking-tight mb-6">
            On<span className="text-accent">Concilia</span>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <p className="text-slate-600 text-sm">
              No encontramos esta solicitud. Si venís de un email nuestro, respondelo
              directamente y coordinamos por ahí — o escribinos a{' '}
              <a href="mailto:guillermo@onconcilia.com" className="text-brand hover:underline">
                guillermo@onconcilia.com
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center mb-8">
        <div className="text-white font-bold text-2xl tracking-tight mb-4">
          On<span className="text-accent">Concilia</span>
        </div>
        <h1 className="text-white text-xl font-bold mb-2">Coordinemos tu acceso</h1>
        <p className="text-slate-400 text-sm">
          Para {prospecto.empresa} · dejanos tu teléfono y un horario que te quede bien
        </p>
      </div>

      {/* Sin envoltorio de ancho fijo acá — CoordinarForm controla su propio
          ancho (se ensancha solo en el paso de Cal.com). */}
      <CoordinarForm prospectoId={prospecto.id} />

      <p className="w-full max-w-md text-slate-600 text-xs text-center mt-4">
        Te llamamos para coordinar en 15 minutos · sin compromiso
      </p>
    </main>
  )
}
