// src/app/api/auth/login/route.js
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env.mjs' // <-- Import the validated env object

export const runtime = 'nodejs'

const COOKIE_NAME = 'headlines-auth'

export async function POST(request) {
  try {
    // The `env` object is already validated. No need to parse here.
    const { password } = await request.json()

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required.' },
        { status: 400 }
      )
    }

    if (password.toLowerCase() === env.LOGIN_PASSWORD.toLowerCase()) {
      console.log('[API Auth] Login successful. Setting auth cookie.')
      cookies().set({
        name: COOKIE_NAME,
        value: env.COOKIE_SECRET,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
      return NextResponse.json({ success: true })
    } else {
      console.warn('[API Auth] Login failed: Incorrect password attempt.')
      return NextResponse.json(
        { success: false, error: 'Incorrect password.' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('[API Auth Error]', error)
    // The centralized env loader will catch config errors, so this is for other issues.
    return NextResponse.json(
      { success: false, error: 'An internal server error occurred.' },
      { status: 500 }
    )
  }
}
