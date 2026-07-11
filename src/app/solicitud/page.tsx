import SolicitudForm from './SolicitudForm'

export default function SolicitudPage({
  searchParams,
}: {
  searchParams: { t?: string }
}) {
  let email = ''
  if (searchParams.t) {
    try {
      email = Buffer.from(searchParams.t, 'base64url').toString('utf-8')
    } catch {}
  }

  return (
    <main className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-white font-bold text-2xl tracking-tight mb-4">
            On<span className="text-accent">Concilia</span>
          </div>
          <h1 className="text-white text-xl font-bold mb-2">Solicitud de acceso beta</h1>
          <p className="text-slate-400 text-sm">4 preguntas · menos de 2 minutos</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <SolicitudForm email={email} />
        </div>

        <p className="text-slate-600 text-xs text-center mt-4">
          Acceso gratuito por 60 días · A cambio, 30 minutos de feedback
        </p>
      </div>
    </main>
  )
}
