// src/actions/events.js (version 3.0)
'use server'

import dbConnect from '@/lib/mongodb'
import mongoose from 'mongoose'
import SynthesizedEvent from '@/models/SynthesizedEvent'
import Opportunity from '@/models/Opportunity'
import Article from '@/models/Article'
import { revalidatePath } from 'next/cache'
import { EVENTS_PER_PAGE } from '@/config/constants'

/**
 * Gets the potential impact of deleting an event.
 * @param {string} eventId - The ID of the event.
 * @returns {Promise<{success: boolean, opportunityCount: number, articleIds: Array<string>}>}
 */
export async function getEventDeletionImpact(eventId) {
  if (!eventId) {
    return { success: false, message: 'Event ID is required.' }
  }
  try {
    await dbConnect()
    const opportunities = await Opportunity.find({ sourceEventId: eventId }).lean()
    const opportunityCount = opportunities.length
    const articleIds = [
      ...new Set(opportunities.map((opp) => opp.sourceArticleId.toString())),
    ]

    return { success: true, opportunityCount, articleIds }
  } catch (error) {
    console.error('Get Deletion Impact Error:', error)
    return { success: false, message: 'Failed to calculate deletion impact.' }
  }
}

/**
 * Deletes an event and, optionally, its associated opportunities and articles.
 * @param {{eventId: string, deleteOpportunities: boolean, deleteArticleIds: Array<string>}} params
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteEvent({
  eventId,
  deleteOpportunities = false,
  deleteArticleIds = [],
}) {
  if (!eventId) {
    return { success: false, message: 'Event ID is required.' }
  }

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    await dbConnect()

    let deletedOpps = 0
    let deletedArticles = 0

    // Conditionally delete associated opportunities
    if (deleteOpportunities) {
      const oppResult = await Opportunity.deleteMany(
        { sourceEventId: eventId },
        { session }
      )
      deletedOpps = oppResult.deletedCount
      console.log(`[Delete Event] Deleted ${deletedOpps} associated opportunities.`)
    }

    // Conditionally delete associated source articles
    if (deleteArticleIds && deleteArticleIds.length > 0) {
      const articleResult = await Article.deleteMany(
        { _id: { $in: deleteArticleIds } },
        { session }
      )
      deletedArticles = articleResult.deletedCount
      console.log(`[Delete Event] Deleted ${deletedArticles} associated source articles.`)
    }

    // Delete the event itself
    const eventResult = await SynthesizedEvent.findByIdAndDelete(eventId, { session })
    if (!eventResult) {
      throw new Error('Synthesized event not found.')
    }
    console.log(`[Delete Event] Deleted synthesized event: ${eventId}`)

    await session.commitTransaction()

    revalidatePath('/')
    revalidatePath('/opportunities')
    revalidatePath('/articles')

    let message = `Event deleted successfully.`
    if (deletedOpps > 0) message += ` ${deletedOpps} opportunities removed.`
    if (deletedArticles > 0) message += ` ${deletedArticles} articles removed.`

    return { success: true, message }
  } catch (error) {
    await session.abortTransaction()
    console.error('Delete Event Transaction Error:', error)
    return { success: false, message: `Failed to delete event: ${error.message}` }
  } finally {
    session.endSession()
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
