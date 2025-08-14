// src/lib/rag/orchestrator.js (version 4.1)
import { retrieveContextForQuery } from './retrieval'
import { generateFinalResponse } from './generation'
import { runPlannerAgent } from './planner'

/**
 * Main orchestrator for the Agentic RAG chat pipeline.
 * @param {Array<object>} messages - The chat messages from the client.
 * @returns {Promise<string>} The final, validated text response.
 */
export async function processChatRequest(messages) {
  console.log('--- [RAG Pipeline Start] ---')

  // 1. Planning Phase
  console.log('[RAG Pipeline] Step 1: Planning Phase Started...')
  const plan = await runPlannerAgent(messages)
  console.log('[RAG Pipeline] Step 1: Planning Phase Completed.')

  // 2. Retrieval Phase
  console.log('[RAG Pipeline] Step 2: Retrieval Phase Started...')
  // CORRECTED: Pass the entire 'plan' object, not just the search_queries.
  const context = await retrieveContextForQuery(plan, messages)
  console.log('[RAG Pipeline] Step 2: Retrieval Phase Completed.')

  // 3. Synthesis Phase
  console.log('[RAG Pipeline] Step 3: Synthesis Phase Started...')
  const finalResponseText = await generateFinalResponse({
    plan,
    context,
  })
  console.log('[RAG Pipeline] Step 3: Synthesis Phase Completed.')

  console.log('--- [RAG Pipeline End] ---')
  return finalResponseText
}
