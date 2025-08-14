// src/components/Header.jsx (version 1.4)
'use client'

import { Briefcase } from 'lucide-react'
import { InstallPwaButton } from '@/components/InstallPwaButton'
import { PushNotificationManager } from '@/components/PushNotificationManager'

export const Header = ({ articleCount, eventCount }) => {
  return (
    <header className="mb-4 sm:mb-6 relative">
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <InstallPwaButton />
        <PushNotificationManager />
      </div>

      <div className="flex flex-row items-center justify-center gap-x-3 sm:gap-x-4 mb-3 pt-8 sm:pt-0">
        <Briefcase size={28} className="text-blue-400 sm:size-10" />
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100 text-center sm:text-left">
          Headlines<span className="hidden sm:inline"> Intelligence</span>
        </h1>
      </div>

      <p className="text-center text-sm sm:text-base text-slate-400 max-w-3xl mx-auto">
        Search, analyze, chat...
        <span className="font-bold text-slate-300"> {eventCount?.toLocaleString()} </span>
        events from
        <span className="font-bold text-slate-300">
          {' '}
          {articleCount?.toLocaleString()}{' '}
        </span>
        articles.
      </p>
    </header>
  )
}
