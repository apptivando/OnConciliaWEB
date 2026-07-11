import Link from 'next/link'

export default function GraciasPage() {
  return (
    <main className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 text-center">
      <div className="text-white font-bold text-2xl tracking-tight mb-8">
        On<span className="text-accent">Concilia</span>
      </div>

      <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-2xl mb-6">
        ✓
      </div>

      <h1 className="text-white text-2xl font-bold mb-3">¡Solicitud recibida!</h1>
      <p className="text-slate-400 text-base max-w-sm leading-relaxed mb-8">
        Te contactamos en los próximos días para coordinar el acceso a la beta.
        Gracias por el interés.
      </p>

      <Link href="/" className="text-brand hover:text-blue-400 text-sm transition">
        ← Volver a onconcilia.com
      </Link>
    </main>
  )
}
