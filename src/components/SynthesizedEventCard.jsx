// src/components/SynthesizedEventCard.jsx (version 7.3)
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { FileText } from 'lucide-react'
import useAppStore from '@/store/use-app-store'
import { SwipeToDelete } from './swipe/SwipeToDelete'
import { EventCardDesktop } from './events/EventCardDesktop'
import { EventCardMobile } from './events/EventCardMobile'
import { EventCardDetails } from './events/EventCardDetails'

export const SynthesizedEventCard = ({ event, onDelete }) => {
  const [isPending, startTransition] = useTransition()
  const setChatContextPrompt = useAppStore((state) => state.setChatContextPrompt)
  const router = useRouter()

  const handleDelete = () => {
    startTransition(() => {
      onDelete()
    })
  }

  const handleChatAboutEvent = (e) => {
    e.stopPropagation()
    const prompt = `Tell me more about the event: "${event.synthesized_headline}". What are the key implications?`
    setChatContextPrompt(prompt)
    router.push('/chat')
  }

  return (
    <div className="relative w-full">
      <AccordionItem
        value={event.event_key}
        className={`relative border-none rounded-xl overflow-hidden transition-all duration-300 ${isPending ? 'opacity-50' : ''}`}
      >
        <SwipeToDelete onDelete={handleDelete}>
          <div className="p-4 bg-transparent relative z-10">
            <EventCardMobile
              event={event}
              onChat={handleChatAboutEvent}
              onDelete={handleDelete}
              isPending={isPending}
            />
            <EventCardDesktop
              event={event}
              onChat={handleChatAboutEvent}
              onDelete={handleDelete}
              isPending={isPending}
            />
          </div>
        </SwipeToDelete>

        <AccordionTrigger className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 hover:no-underline rounded-b-xl bg-black/20 hover:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Show Intelligence Details & Sources</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4 pt-4 bg-slate-900/50">
          <EventCardDetails event={event} />
        </AccordionContent>
      </AccordionItem>
    </div>
  )
}
