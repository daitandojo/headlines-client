// src/components/EventList.jsx (version 4.0)
import { Accordion } from '@/components/ui/accordion'
import { SynthesizedEventCard } from '@/components/SynthesizedEventCard'
import { AnimatePresence, motion } from 'framer-motion'
import { AnimatedList, itemVariants } from './AnimatedList'

export const EventList = ({ events, onDelete }) => {
  return (
    <Accordion type="single" collapsible>
      <AnimatedList className="w-full space-y-4">
        <AnimatePresence>
          {events.map((event) => (
            <motion.div
              key={event.event_key}
              variants={itemVariants}
              exit={itemVariants.exit}
              layout
            >
              <SynthesizedEventCard event={event} onDelete={() => onDelete(event._id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </AnimatedList>
    </Accordion>
  )
}
