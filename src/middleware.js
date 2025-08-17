// src/middleware.js (version 2.0)
import { NextResponse } from 'next/server'
import * as jose from 'jose'
import { env } from '@/lib/env.mjs'

const JWT_COOKIE_NAME = 'headlines-jwt'

async function verifyToken(token) {
  if (!token) return null
  try {
    const secret = new TextEncoder().encode(env.JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secret)
    return payload
  } catch (e) {
    console.warn('[Middleware] JWT verification failed:', e.message)
    return null
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  console.log(`[Middleware] Checking path: ${pathname}`)

  const publicPaths = ['/login']

  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') || // API routes have their own auth checks
    pathname.includes('/icons/') ||
    pathname.includes('/manifest.json') ||
    pathname.includes('/favicon.ico')
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get(JWT_COOKIE_NAME)?.value
  const userPayload = await verifyToken(token)

  if (userPayload) {
    console.log(`[Middleware] User authenticated: ${userPayload.email}`)
    return NextResponse.next()
  }

  console.log(`[Middleware] User not authenticated. Redirecting to /login.`)
  const loginUrl = new URL('/login', request.url)
  // Pass the intended destination for a better user experience after login
  loginUrl.searchParams.set('from', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)'],
}
