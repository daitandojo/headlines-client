import { Accordion } from '@/components/ui/accordion';
import { SynthesizedEventCard } from '@/components/SynthesizedEventCard';

export const EventList = ({ events }) => {
  return (
    <Accordion type="single" collapsible className="w-full space-y-4">
      {events.map((event) => (
        <SynthesizedEventCard key={event.event_key} event={event} />
      ))}
    </Accordion>
  );
};