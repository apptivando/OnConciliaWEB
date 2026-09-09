import type { Metadata } from 'next'
import ObjecionesClient from './ObjecionesClient'

export const metadata: Metadata = {
  title: 'Objeciones comerciales — OnConcilia',
  robots: { index: false, follow: false },
}

export default function ObjecionesPage() {
  return <ObjecionesClient />
}
