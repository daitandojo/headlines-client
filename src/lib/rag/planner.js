// src/lib/rag/planner.js (version 1.0)
'use server'

import OpenAI from 'openai'
import { env } from '@/lib/env.mjs'
import { PLANNER_PROMPT } from './prompts'

let groq
function getGroqClient() {
  if (!groq) {
    groq = new OpenAI({
      apiKey: env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  }
  return groq
}

const PLANNER_MODEL = 'llama3-70b-8192'

/**
 * Runs the Planner Agent to decompose the user's query into a logical plan
 * and a set of optimized search queries.
 * @param {Array<object>} messages - The conversation history.
 * @returns {Promise<object>} An object containing the plan and search queries.
 */
export async function runPlannerAgent(messages) {
  const client = getGroqClient()
  const userQuery = messages[messages.length - 1].content
  const conversationHistory =
    messages.length > 1
      ? messages
          .slice(-5, -1)
          .map((m) => `${m.role}: ${m.content}`)
          .join('\n')
      : 'No history.'

  const prompt = PLANNER_PROMPT.replace(
    '{CONVERSATION_HISTORY}',
    conversationHistory
  ).replace('{USER_QUERY}', userQuery)

  console.log('[Planner Agent] Generating plan...')
  const response = await client.chat.completions.create({
    model: PLANNER_MODEL,
    messages: [{ role: 'system', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.0,
  })

  const planObject = JSON.parse(response.choices[0].message.content)

  console.groupCollapsed('[Planner Agent] Plan Generated')
  console.log('User Query:', planObject.user_query)
  console.log('Reasoning:', planObject.reasoning)
  console.log('Plan Steps:', planObject.plan)
  console.log('Search Queries:', planObject.search_queries)
  console.groupEnd()

  return planObject
}
