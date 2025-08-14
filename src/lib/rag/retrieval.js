// src/lib/rag/retrieval.js (version 4.0)
import OpenAI from 'openai'
import { Pinecone } from '@pinecone-database/pinecone'
import { generateQueryEmbeddings } from '@/lib/embeddings'
import { fetchBatchWikipediaSummaries, validateWikipediaContent } from '@/lib/wikipedia'
import { getGoogleSearchResults } from '@/lib/serpapi'
import { QUERY_REWRITER_PROMPT, ENTITY_EXTRACTOR_PROMPT } from './prompts'
import { env } from '@/lib/env.mjs'

let groq, pineconeIndex
function initializeClients() {
  if (!groq) {
    groq = new OpenAI({
      apiKey: env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
    const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY })
    pineconeIndex = pc.index(env.PINECONE_INDEX_NAME)
  }
}

const QUERY_REWRITER_MODEL = 'llama3-8b-8192'
const ENTITY_EXTRACTOR_MODEL = 'llama3-70b-8192'
const SIMILARITY_THRESHOLD = 0.38

async function rewriteQuery(messages) {
  initializeClients()
  let queryForRetrieval = messages[messages.length - 1].content
  if (messages.length > 1) {
    const conversationHistory = messages
      .slice(-5, -1)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n')
    const rewriteResponse = await groq.chat.completions.create({
      model: QUERY_REWRITER_MODEL,
      messages: [
        { role: 'system', content: QUERY_REWRITER_PROMPT },
        {
          role: 'user',
          content: `History:\n${conversationHistory}\n\nLatest question: "${queryForRetrieval}"`,
        },
      ],
      temperature: 0.0,
    })
    queryForRetrieval = rewriteResponse.choices[0].message.content.trim()
    console.log(`[RAG Retrieval] Rewritten Query: "${queryForRetrieval}"`)
  }
  return queryForRetrieval
}

async function extractEntities(query) {
  initializeClients()
  const entityResponse = await groq.chat.completions.create({
    model: ENTITY_EXTRACTOR_MODEL,
    messages: [
      { role: 'system', content: ENTITY_EXTRACTOR_PROMPT },
      { role: 'user', content: `User's Question: "${query}"` },
    ],
    response_format: { type: 'json_object' },
  })
  const { entities } = JSON.parse(entityResponse.choices[0].message.content)
  console.log(`[RAG Retrieval] Extracted Entities: ${entities.join(', ')}`)
  return entities
}

async function extractEntitiesFromHistory(messages) {
  if (messages.length < 2) {
    return []
  }
  const historyText = messages
    .slice(-4)
    .map((m) => m.content)
    .join('\n')

  initializeClients()
  try {
    const entityResponse = await groq.chat.completions.create({
      model: ENTITY_EXTRACTOR_MODEL,
      messages: [
        { role: 'system', content: ENTITY_EXTRACTOR_PROMPT },
        {
          role: 'user',
          content: `Extract all key people and companies from this text:\n"${historyText}"`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const { entities } = JSON.parse(entityResponse.choices[0].message.content)
    const cleanEntities = entities.map((e) =>
      e.replace(/\s*\((person|company)\)$/, '').trim()
    )
    console.log(
      `[RAG Retrieval] Entities from history for exclusion: ${cleanEntities.join(', ')}`
    )
    return cleanEntities
  } catch (error) {
    console.error('Could not extract entities from history:', error)
    return []
  }
}

async function fetchPineconeContext(query, entities, exclude_entities = []) {
  initializeClients()
  const fullQueryEmbeddings = await generateQueryEmbeddings(query)
  const entityEmbeddings =
    entities.length > 0 ? await generateQueryEmbeddings(entities[0]) : []
  const allQueryEmbeddings = [...fullQueryEmbeddings, ...entityEmbeddings]

  const filter =
    exclude_entities.length > 0
      ? { key_individuals: { $nin: exclude_entities } }
      : undefined

  if (filter) {
    console.log('[RAG Retrieval] Applying Pinecone filter to exclude:', exclude_entities)
  }

  const pineconePromises = allQueryEmbeddings.map((embedding) =>
    pineconeIndex.query({
      topK: 3,
      vector: embedding,
      includeMetadata: true,
      filter: filter,
    })
  )
  const pineconeResponses = await Promise.all(pineconePromises)

  const uniqueMatches = new Map()
  pineconeResponses.forEach((response) => {
    response?.matches?.forEach((match) => {
      if (
        !uniqueMatches.has(match.id) ||
        match.score > uniqueMatches.get(match.id).score
      ) {
        uniqueMatches.set(match.id, match)
      }
    })
  })

  const results = Array.from(uniqueMatches.values())
    .filter((match) => match.score >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  console.groupCollapsed(`[RAG Retrieval] Pinecone Results (${results.length})`)
  results.forEach((match) => {
    console.log(`- Score: ${match.score.toFixed(4)} | ID: ${match.id}`)
    console.log(`  Headline: ${match.metadata.headline}`)
    console.log(`  Summary: ${match.metadata.summary}`)
  })
  console.groupEnd()

  return results
}

async function fetchValidatedWikipediaContext(entities) {
  const wikiResults = await fetchBatchWikipediaSummaries(entities)
  const validWikiResults = []
  for (const res of wikiResults.filter((r) => r.success)) {
    const validation = await validateWikipediaContent(res.summary)
    if (validation.valid) {
      validWikiResults.push({ ...res, validation })
    }
  }

  console.groupCollapsed(`[RAG Retrieval] Wikipedia Results (${validWikiResults.length})`)
  validWikiResults.forEach((res) => {
    console.log(`- Title: ${res.title}`)
    console.log(`  Summary: ${res.summary.substring(0, 200)}...`)
  })
  console.groupEnd()

  return validWikiResults
}

export async function retrieveContextForQuery(messages) {
  const rewrittenQuery = await rewriteQuery(messages)
  const entitiesToSearch = await extractEntities(rewrittenQuery)
  const entitiesToExclude = await extractEntitiesFromHistory(messages)

  const [pineconeResults, wikipediaResults, searchResultsObj] = await Promise.all([
    fetchPineconeContext(rewrittenQuery, entitiesToSearch, entitiesToExclude),
    fetchValidatedWikipediaContext(entitiesToSearch),
    getGoogleSearchResults(rewrittenQuery),
  ])

  const searchResults = searchResultsObj.success ? searchResultsObj.results : []

  console.groupCollapsed(
    `[RAG Retrieval] SerpAPI Google Search Results (${searchResults.length})`
  )
  searchResults.forEach((res) => {
    console.log(`- Title: ${res.title}`)
    console.log(`  Link: ${res.link}`)
    console.log(`  Snippet: ${res.snippet}`)
  })
  console.groupEnd()

  return {
    rewrittenQuery,
    entities: entitiesToSearch,
    ragResults: pineconeResults,
    wikiResults: wikipediaResults,
    searchResults: searchResults,
  }
}
