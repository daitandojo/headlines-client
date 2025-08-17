// src/app/(main)/settings/page.js (version 1.0)
'use client'

import { useAuth } from '@/hooks/useAuth'

export default function SettingsPage() {
  const { user } = useAuth()

  if (!user) {
    return null // Or a loading spinner
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <p className="text-lg text-slate-300">
        Welcome, {user.firstName}. This is where you will manage your profile and
        preferences.
      </p>
      {/* Forms and toggles for profile management will be implemented in a future phase. */}
      <div className="mt-8 p-8 bg-slate-800/50 rounded-lg border border-slate-700">
        <h2 className="text-xl font-semibold">User Profile Data</h2>
        <pre className="mt-4 text-sm bg-slate-900 p-4 rounded-md overflow-x-auto custom-scrollbar">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
    </div>
  )
}
