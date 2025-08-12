import dbConnect from '@/lib/mongodb';
import SynthesizedEvent from '@/models/SynthesizedEvent';
import { EventList } from '@/components/EventList';
import { PaginationControls } from '@/components/PaginationControls';
import { EVENTS_PER_PAGE } from '@/config/constants';

export async function EventsView({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const searchTerm = searchParams.q || '';
  const countryFilter = searchParams.country || '';

  await dbConnect();

  const queryFilter = {};

  if (searchTerm) {
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    queryFilter.$or = [
      { synthesized_headline: searchRegex },
      { synthesized_summary: searchRegex },
      { 'key_individuals.name': searchRegex },
    ];
  }
  if (countryFilter) {
    queryFilter.country = countryFilter;
  }

  const totalEventsPromise = SynthesizedEvent.countDocuments(queryFilter);
  const eventsPromise = SynthesizedEvent.find(queryFilter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * EVENTS_PER_PAGE)
    .limit(EVENTS_PER_PAGE)
    .lean();

  const [totalEvents, events] = await Promise.all([totalEventsPromise, eventsPromise]);
  
  const totalPages = Math.ceil(totalEvents / EVENTS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <h2 className="text-lg sm:text-xl font-medium text-slate-300">
                Displaying {events.length} of {totalEvents} synthesized events
            </h2>
            {totalPages > 1 && (
                <PaginationControls totalPages={totalPages} currentPage={page} />
            )}
        </div>
        
        {events.length > 0 ? (
            <EventList events={JSON.parse(JSON.stringify(events))} />
        ) : (
            <div className="text-center text-gray-500 py-20 rounded-lg bg-black/20 border border-white/10">
                <p>No synthesized events found matching your criteria.</p>
            </div>
        )}
    </div>
  );
}