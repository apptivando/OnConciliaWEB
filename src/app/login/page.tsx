import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-navy font-bold text-lg tracking-tight">
            On<span className="text-accent">Concilia</span>
          </span>
          <p className="text-slate-500 text-sm mt-1">Acceso al CRM interno</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
