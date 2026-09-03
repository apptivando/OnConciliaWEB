import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PAGES = ['/prospectos', '/leads', '/cola']
const PROTECTED_API = ['/api/agents', '/api/outreach', '/api/prospects']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtectedPage = PROTECTED_PAGES.some((p) => pathname.startsWith(p))
  const isProtectedApi = PROTECTED_API.some((p) => pathname.startsWith(p))

  if (!isProtectedPage && !isProtectedApi) return NextResponse.next()

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const url = new URL('/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  const { data: staff } = await supabase
    .from('profiles_crm')
    .select('is_staff')
    .eq('id', user.id)
    .maybeSingle()

  if (!staff?.is_staff) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    const url = new URL('/login', request.url)
    url.searchParams.set('error', 'no-autorizado')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/prospectos/:path*',
    '/leads/:path*',
    '/cola/:path*',
    '/api/agents/:path*',
    '/api/outreach/:path*',
    '/api/prospects/:path*',
  ],
}
