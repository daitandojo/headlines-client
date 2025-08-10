import dbConnect from '@/lib/mongodb';
import SynthesizedEvent from '@/models/SynthesizedEvent';
import { Filters } from '@/components/Filters';
import { EventList } from '@/components/EventList';
import { PaginationControls } from '@/components/PaginationControls';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EVENTS_PER_PAGE } from '@/config/constants';

export async function EventsView({ searchParams }) {
  const page = parseInt(searchParams.page) || 1;
  const searchTerm = searchParams.q || '';
  const countryFilter = searchParams.country || '';
  const sortOption = searchParams.sort || 'date_desc';

  await dbConnect();

  const queryFilter = {};

  if (searchTerm) {
    const searchRegex = { $regex: searchTerm, $options: 'i' };
    queryFilter.$or = [
      { synthesized_headline: searchRegex },
      { synthesized_summary: searchRegex },
      { 'key_individuals.name': searchRegex },
      { 'key_individuals.company': searchRegex },
      { 'source_articles.headline': searchRegex },
    ];
  }
  if (countryFilter) {
    queryFilter.country = countryFilter;
  }

  let sort = {};
  switch (sortOption) {
    case 'relevance_asc': sort = { highest_relevance_score: 1, createdAt: -1 }; break;
    case 'relevance_desc': sort = { highest_relevance_score: -1, createdAt: -1 }; break;
    case 'date_asc': sort = { createdAt: 1 }; break;
    case 'date_desc':
    default: sort = { createdAt: -1 }; break;
  }

  const uniqueCountriesPromise = SynthesizedEvent.distinct('country', { country: { $ne: null }});
  const totalEventsPromise = SynthesizedEvent.countDocuments(queryFilter);
  const eventsPromise = SynthesizedEvent.find(queryFilter)
    .sort(sort)
    .skip((page - 1) * EVENTS_PER_PAGE)
    .limit(EVENTS_PER_PAGE)
    .lean();

  const [uniqueCountries, totalEvents, events] = await Promise.all([
    uniqueCountriesPromise,
    totalEventsPromise,
    eventsPromise,
  ]);
  
  const uniqueSources = []; 

  const totalPages = Math.ceil(totalEvents / EVENTS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="bg-black/20 backdrop-blur-sm border border-white/10 shadow-2xl shadow-black/30">
        <CardHeader className="border-b border-white/10">
          <Filters uniqueSources={uniqueSources} uniqueCountries={uniqueCountries} />
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
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
        </CardContent>
      </Card>
    </div>
  );
}