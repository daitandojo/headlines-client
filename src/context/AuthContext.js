// src/context/AuthContext.jsx (version 1.1)
'use client'

import { createContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import { updateUserProfile } from '@/actions/subscriber'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    console.log('[AuthContext] Attempting to fetch user profile...')
    try {
      const res = await fetch('/api/subscribers/me')
      if (res.ok) {
        const userData = await res.json()
        console.log('[AuthContext] User profile fetched successfully:', userData)
        setUser(userData)
      } else {
        console.log('[AuthContext] No active session found or session expired.')
        setUser(null)
        await fetch('/api/auth/logout', { method: 'POST' })
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (email, password) => {
    setIsLoading(true)
    console.log(`[AuthContext] Attempting login for ${email}...`)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (response.ok) {
        toast.success(`Welcome back, ${data.user.firstName}!`)
        await fetchUser()
        router.push('/events')
      } else {
        toast.error(data.error || 'Login failed.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('[AuthContext] Login request failed:', error)
      toast.error('An unexpected error occurred during login.')
      setIsLoading(false)
    }
  }

  const logout = async () => {
    console.log('[AuthContext] Logging out...')
    setUser(null)
    await fetch('/api/auth/logout', { method: 'POST' })
    toast.info('You have been logged out.')
    router.push('/login')
  }

  const updateUserPreferences = async (updateData) => {
    if (!user) return

    const previousUser = { ...user }
    // Optimistic UI update
    setUser((currentUser) => ({ ...currentUser, ...updateData }))

    const result = await updateUserProfile({ userId: user._id, updateData })

    if (result.success) {
      toast.success('Preferences updated.')
      // Update user state with the definitive data from the server
      setUser(result.user)
    } else {
      toast.error('Failed to update preferences. Reverting.')
      // Revert on failure
      setUser(previousUser)
    }
  }

  const value = {
    user,
    isLoading,
    login,
    logout,
    refetchUser: fetchUser,
    updateUserPreferences,
  }

  if (isLoading) {
    return <LoadingOverlay isLoading={true} text="Authenticating..." />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
