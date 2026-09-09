import type { Metadata } from 'next'
import DocumentosIndex from './DocumentosIndex'

export const metadata: Metadata = {
  title: 'Documentos — OnConcilia',
  robots: { index: false, follow: false },
}

export default function DocumentosPage() {
  return <DocumentosIndex />
}
