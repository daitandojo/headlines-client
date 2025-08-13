// src/actions/opportunities.js (version 4.0)
'use server'

import dbConnect from '@/lib/mongodb'
import Opportunity from '@/models/Opportunity'
import Article from '@/models/Article'
import { revalidatePath } from 'next/cache'

const OPPORTUNITIES_PER_PAGE = 10

/**
 * Fetches opportunities with pagination and filtering.
 * @param {{page?: number, filters?: {country?: string}}} params
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of opportunities.
 */
export async function getOpportunities({ page = 1, filters = {} }) {
  await dbConnect()

  const queryFilter = {}
  if (filters.country) {
    // Use a case-insensitive regex for broader matching
    queryFilter.basedIn = { $regex: new RegExp(`^${filters.country}$`, 'i') }
  }

  const skipAmount = (page - 1) * OPPORTUNITIES_PER_PAGE

  const opportunities = await Opportunity.find(queryFilter)
    .populate('sourceArticleId', 'headline link newspaper')
    .sort({ createdAt: -1 })
    .skip(skipAmount)
    .limit(OPPORTUNITIES_PER_PAGE)
    .lean()

  return JSON.parse(JSON.stringify(opportunities))
}

/**
 * Gets the total count of opportunities, optionally applying filters.
 * @param {{filters?: {country?: string}}} params
 * @returns {Promise<number>} The total number of matching opportunities.
 */
export async function getTotalOpportunitiesCount({ filters = {} } = {}) {
  await dbConnect()

  const queryFilter = {}
  if (filters.country) {
    queryFilter.basedIn = { $regex: new RegExp(`^${filters.country}$`, 'i') }
  }

  const count = await Opportunity.countDocuments(queryFilter)
  return count
}

/**
 * Fetches a list of unique countries from the opportunities collection.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of country names.
 */
export async function getOpportunityCountries() {
  await dbConnect()
  const countries = await Opportunity.distinct('basedIn')
  return countries.filter((c) => c).sort()
}

/**
 * Deletes a specific opportunity from the database.
 * @param {string} opportunityId - The ID of the opportunity to delete.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function deleteOpportunity(opportunityId) {
  if (!opportunityId) {
    return { success: false, message: 'Opportunity ID is required.' }
  }
  try {
    await dbConnect()
    const result = await Opportunity.findByIdAndDelete(opportunityId)
    if (!result) {
      return { success: false, message: 'Opportunity not found.' }
    }
    revalidatePath('/opportunities')
    return { success: true, message: 'Opportunity deleted successfully.' }
  } catch (error) {
    console.error('Delete Opportunity Error:', error)
    return { success: false, message: 'Failed to delete opportunity.' }
  }
}
