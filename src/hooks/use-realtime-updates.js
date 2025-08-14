// src/hooks/use-realtime-updates.js (version 4.0)
'use client'

import { useEffect, useRef } from 'react'
import Pusher from 'pusher-js'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
// NOTE: We cannot use the Zod schema here as this is a client component.
// NEXT_PUBLIC_ variables are directly available on the client.

export function useRealtimeUpdates({ channel, event, queryKey }) {
  const queryClient = useQueryClient()
  const pusherRef = useRef(null)

  useEffect(() => {
    if (!channel || !event || !queryKey) {
      console.warn(
        '[Realtime] Missing required props: channel, event, or queryKey. Updates disabled.'
      )
      return
    }

    const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY
    const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

    if (!pusherRef.current) {
      if (!PUSHER_KEY || !PUSHER_CLUSTER) {
        console.warn('Pusher keys not found, real-time updates are disabled.')
        return
      }
      try {
        pusherRef.current = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER })
      } catch (error) {
        console.error('Failed to initialize Pusher:', error)
        return
      }
    }

    try {
      const pusherChannel = pusherRef.current.subscribe(channel)

      pusherChannel.bind(event, (data) => {
        console.log(`Real-time event '${event}' received on channel '${channel}':`, data)

        queryClient.invalidateQueries({ queryKey: queryKey })

        toast('New Intelligence Received', {
          description: data.headline || data.synthesized_headline,
          icon: <Sparkles className="h-4 w-4 text-blue-400" />,
        })
      })

      console.log(`Successfully subscribed to real-time channel: '${channel}'`)

      return () => {
        if (pusherRef.current) {
          pusherRef.current.unsubscribe(channel)
          console.log(`Unsubscribed from real-time channel: '${channel}'`)
        }
      }
    } catch (error) {
      console.error(`Failed to subscribe to Pusher channel '${channel}':`, error)
    }
  }, [channel, event, queryKey, queryClient])
}
