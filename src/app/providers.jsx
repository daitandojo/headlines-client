// src/app/providers.jsx (version 1.1)
'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// REMOVED: The devtools import is the source of the error.
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function Providers({ children }) {
  // Using useState ensures that QueryClient is only created once per component lifecycle,
  // preventing re-creations on re-renders, which is critical for caching to work correctly.
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* REMOVED: The ReactQueryDevtools component is causing a critical ChunkLoadError. */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  )
}
