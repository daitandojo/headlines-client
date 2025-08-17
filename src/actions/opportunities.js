// src/actions/opportunities.js (version 10.0)
'use server'

import dbConnect from '@/lib/mongodb'
import Opportunity from '@/models/Opportunity'
import { revalidatePath } from 'next/cache'
import { OPPORTUNITIES_PER_PAGE } from '@/config/constants'

export async function getOpportunities({ page = 1, filters = {}, sort = 'date_desc' }) {
  await dbConnect()

  const andConditions = []

  if (filters.country && filters.country.length > 0) {
    const regex = filters.country.map((c) => `^${c}`).join('|')
    andConditions.push({ basedIn: { $regex: new RegExp(regex, 'i') } })
  }

  // START: ADDED TEXT SEARCH LOGIC
  if (filters.q) {
    const searchRegex = { $regex: filters.q, $options: 'i' }
    andConditions.push({
      $or: [
        { reachOutTo: searchRegex },
        { 'contactDetails.company': searchRegex },
        { whyContact: searchRegex },
      ],
    })
  }
  // END: ADDED TEXT SEARCH LOGIC

  const queryFilter = andConditions.length > 0 ? { $and: andConditions } : {}

  const sortOptions = {}
  if (sort === 'size_desc') {
    sortOptions.likelyMMDollarWealth = -1
  } else {
    sortOptions.createdAt = -1
  }

  const skipAmount = (page - 1) * OPPORTUNITIES_PER_PAGE

  const opportunities = await Opportunity.find(queryFilter)
    .populate('sourceArticleId', 'headline link newspaper')
    .populate(
      'sourceEventId',
      'synthesized_headline synthesized_summary source_articles highest_relevance_score'
    )
    .sort(sortOptions)
    .skip(skipAmount)
    .limit(OPPORTUNITIES_PER_PAGE)
    .lean()

  return JSON.parse(JSON.stringify(opportunities))
}

export async function getTotalOpportunitiesCount({ filters = {} } = {}) {
  await dbConnect()

  const andConditions = []

  if (filters.country && filters.country.length > 0) {
    const regex = filters.country.map((c) => `^${c}`).join('|')
    andConditions.push({ basedIn: { $regex: new RegExp(regex, 'i') } })
  }

  // START: ADDED TEXT SEARCH LOGIC TO COUNT
  if (filters.q) {
    const searchRegex = { $regex: filters.q, $options: 'i' }
    andConditions.push({
      $or: [
        { reachOutTo: searchRegex },
        { 'contactDetails.company': searchRegex },
        { whyContact: searchRegex },
      ],
    })
  }
  // END: ADDED TEXT SEARCH LOGIC TO COUNT

  const queryFilter = andConditions.length > 0 ? { $and: andConditions } : {}
  const count = await Opportunity.countDocuments(queryFilter)
  return count
}

export async function getOpportunityCountries() {
  await dbConnect()
  const rawCountries = await Opportunity.distinct('basedIn')
  const cleanedCountries = new Set()
  rawCountries
    .filter((c) => c)
    .forEach((rawCountry) => {
      const countryWithoutParentheses = rawCountry.split('(')[0].trim()
      const splitCountries = countryWithoutParentheses.split('&').map((c) => c.trim())
      splitCountries.forEach((country) => {
        if (country) cleanedCountries.add(country)
      })
    })
  return Array.from(cleanedCountries).sort()
}

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
