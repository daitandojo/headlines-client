// src/actions/events.js (version 2.0)
'use server'

import dbConnect from '@/lib/mongodb'
import SynthesizedEvent from '@/models/SynthesizedEvent'
import { revalidatePath } from 'next/cache'
import { EVENTS_PER_PAGE } from '@/config/constants'

export async function deleteEvent(eventId) {
  if (!eventId) {
    return { success: false, message: 'Event ID is required.' }
  }

  try {
    await dbConnect()
    const result = await SynthesizedEvent.findByIdAndDelete(eventId)

    if (!result) {
      return { success: false, message: 'Synthesized event not found.' }
    }

    revalidatePath('/')
    return { success: true, message: 'Synthesized event deleted successfully.' }
  } catch (error) {
    console.error('Delete Event Error:', error)
    return { success: false, message: 'Failed to delete synthesized event.' }
  }
}

export async function getEvents({ page = 1, filters = {}, sort = 'date_desc' }) {
  await dbConnect()

  const queryFilter = {
    highest_relevance_score: { $gt: 25 },
  }

  if (filters.q) {
    const searchRegex = { $regex: filters.q, $options: 'i' }
    queryFilter.$or = [
      { synthesized_headline: searchRegex },
      { synthesized_summary: searchRegex },
      { 'key_individuals.name': searchRegex },
    ]
  }
  if (filters.country) {
    queryFilter.country = filters.country
  }

  const sortOptions = {}
  if (sort === 'date_asc') sortOptions.createdAt = 1
  else if (sort === 'relevance_desc') sortOptions.highest_relevance_score = -1
  else sortOptions.createdAt = -1

  const skipAmount = (page - 1) * EVENTS_PER_PAGE

  const events = await SynthesizedEvent.find(queryFilter)
    .sort(sortOptions)
    .skip(skipAmount)
    .limit(EVENTS_PER_PAGE)
    .lean()

  return JSON.parse(JSON.stringify(events))
}

/**
 * Gets the total count of relevant events for header stats.
 * @returns {Promise<number>} The total number of relevant events.
 */
export async function getTotalEventCount() {
  await dbConnect()
  const count = await SynthesizedEvent.countDocuments({
    highest_relevance_score: { $gt: 25 },
  })
  return count
}
