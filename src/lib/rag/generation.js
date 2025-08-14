// src/lib/rag/generation.js (version 4.0)
import OpenAI from 'openai'
import { getSynthesizerPrompt, FAILED_GROUNDEDNESS_PROMPT } from './prompts'
import { checkGroundedness } from './validation'
import { env } from '@/lib/env.mjs'

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

const SYNTHESIZER_MODEL = 'llama3-70b-8192'

function assembleContext(ragResults, wikiResults, searchResults) {
  const dbContext =
    ragResults.length > 0
      ? ragResults
          .map(
            (match) =>
              `- [Similarity: ${match.score.toFixed(3)}] ${match.metadata.headline}: ${match.metadata.summary}`
          )
          .join('\n')
      : 'None'

  const wikiContext =
    wikiResults.length > 0
      ? wikiResults
          .map(
            (res) => `- [Quality: ${res.validation.quality}] ${res.title}: ${res.summary}`
          )
          .join('\n')
      : 'None'

  const searchContext =
    searchResults.length > 0
      ? searchResults
          .map((res) => `- [${res.title}](${res.link}): ${res.snippet}`)
          .join('\n')
      : 'None'

  return `---
Internal Database Context:
${dbContext}
---
Wikipedia Context:
${wikiContext}
---
Search Results Context:
${searchContext}
---`
}

async function runSynthesizerAgent(plan, contextString) {
  const client = getGroqClient()

  console.groupCollapsed('[RAG Generation] Final Context Sent to Synthesizer Agent')
  console.log('PLAN:', plan.plan)
  console.log('CONTEXT:', contextString)
  console.groupEnd()

  console.log('[RAG Generation] Calling Synthesizer Agent...')
  const synthesizerResponse = await client.chat.completions.create({
    model: SYNTHESIZER_MODEL,
    messages: [
      { role: 'system', content: getSynthesizerPrompt() },
      {
        role: 'user',
        content: `CONTEXT:\n${contextString}\n\nPLAN:\n${JSON.stringify(
          plan.plan,
          null,
          2
        )}\n\nUSER'S QUESTION: "${plan.user_query}"`,
      },
    ],
    temperature: 0.0,
  })

  const rawResponse = synthesizerResponse.choices[0].message.content

  console.groupCollapsed('[RAG Generation] Raw Synthesizer Response Received')
  console.log(rawResponse)
  console.groupEnd()

  return rawResponse
}

export async function generateFinalResponse({ plan, context }) {
  const fullContextString = assembleContext(
    context.ragResults,
    context.wikiResults,
    context.searchResults
  )

  const initialResponse = await runSynthesizerAgent(plan, fullContextString)
  const groundednessResult = await checkGroundedness(initialResponse, fullContextString)

  if (groundednessResult.is_grounded) {
    let finalResponse = initialResponse.replace(/<rag>/g, '<span class="rag-source">')
    finalResponse = finalResponse.replace(/<\/rag>/g, '</span>')
    finalResponse = finalResponse.replace(/<wiki>/g, '<span class="wiki-source">')
    finalResponse = finalResponse.replace(/<\/wiki>/g, '</span>')
    finalResponse = finalResponse.replace(/<search>/g, '<span class="llm-source">')
    finalResponse = finalResponse.replace(/<\/search>/g, '</span>')
    return finalResponse
  } else {
    console.warn('[RAG Pipeline] Groundedness check failed. Returning safe response.')
    return FAILED_GROUNDEDNESS_PROMPT
  }
}
