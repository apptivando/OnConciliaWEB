// Cron que corre cada mañana: busca prospectos en una ciudad argentina diferente por día
// Schedule en vercel.json: 0 11 * * 1-5 (8am AR = 11am UTC, lunes a viernes)

const CIUDADES = [
  { ciudad: 'Córdoba', sector: 'estudio' },
  { ciudad: 'Rosario', sector: 'estudio' },
  { ciudad: 'Mendoza', sector: 'estudio' },
  { ciudad: 'Tucumán', sector: 'estudio' },
  { ciudad: 'La Plata', sector: 'estudio' },
  { ciudad: 'Mar del Plata', sector: 'estudio' },
  { ciudad: 'Salta', sector: 'estudio' },
  { ciudad: 'Santa Fe', sector: 'estudio' },
  { ciudad: 'San Juan', sector: 'estudio' },
  { ciudad: 'Resistencia', sector: 'estudio' },
  { ciudad: 'Santiago del Estero', sector: 'estudio' },
  { ciudad: 'Corrientes', sector: 'estudio' },
  { ciudad: 'Posadas', sector: 'estudio' },
  { ciudad: 'Neuquén', sector: 'estudio' },
  { ciudad: 'Bahía Blanca', sector: 'estudio' },
  { ciudad: 'Paraná', sector: 'estudio' },
  { ciudad: 'Formosa', sector: 'estudio' },
  { ciudad: 'San Luis', sector: 'estudio' },
  { ciudad: 'Río Cuarto', sector: 'estudio' },
  { ciudad: 'Comodoro Rivadavia', sector: 'estudio' },
  { ciudad: 'San Salvador de Jujuy', sector: 'estudio' },
  { ciudad: 'San Rafael', sector: 'estudio' },
  { ciudad: 'Concordia', sector: 'estudio' },
  { ciudad: 'General Roca', sector: 'estudio' },
  { ciudad: 'Tandil', sector: 'estudio' },
  { ciudad: 'Zárate', sector: 'estudio' },
  { ciudad: 'Villa María', sector: 'estudio' },
  { ciudad: 'Pergamino', sector: 'estudio' },
  { ciudad: 'San Nicolás de los Arroyos', sector: 'estudio' },
  { ciudad: 'San Fernando del Valle de Catamarca', sector: 'estudio' },
]

export async function GET(req: Request) {
  const secret = req.headers.get('x-vercel-cron') ?? new URL(req.url).searchParams.get('secret')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Elegir ciudad según día del año
  const startOfYear = new Date(new Date().getFullYear(), 0, 0)
  const dayOfYear = Math.floor((Date.now() - startOfYear.getTime()) / 86400000)
  const target = CIUDADES[dayOfYear % CIUDADES.length]

  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const res = await fetch(`${base}/api/agents/lead-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(target),
  })

  const data = await res.json()

  return Response.json({
    ciudad: target.ciudad,
    fecha: new Date().toISOString().split('T')[0],
    ...data,
  })
}
