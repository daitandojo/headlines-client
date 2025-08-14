// src/actions/auth.js
'use server'

import { cookies } from 'next/headers'
import { env } from '@/lib/env.mjs' // <-- Import the validated env object

const COOKIE_NAME = 'headlines-auth'

/**
 * Server action to verify the password and set the authentication cookie.
 * @param {string} password - The password entered by the user.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function login(password) {
  if (password.toLowerCase() === env.LOGIN_PASSWORD.toLowerCase()) {
    console.log('[Auth] Login successful. Setting auth cookie.')
    cookies().set({
      name: COOKIE_NAME,
      value: env.COOKIE_SECRET,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    return { success: true }
  } else {
    console.warn('[Auth] Login failed: Incorrect password attempt.')
    return { success: false, error: 'Incorrect password.' }
  }
}
