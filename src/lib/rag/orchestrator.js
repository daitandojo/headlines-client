// src/lib/rag/orchestrator.js (version 1.0)
import { retrieveContextForQuery } from './retrieval';
import { assessContextQuality, crossValidateSources } from './validation';
import { generateFinalResponse } from './generation';

/**
 * Main orchestrator for the RAG chat pipeline.
 * @param {Array<object>} messages - The chat messages from the client.
 * @returns {Promise<StreamingTextResponse|Response>} The final response object for the API route.
 */
export async function processChatRequest(messages) {
    // 1. Retrieval Phase
    const context = await retrieveContextForQuery(messages);

    // 2. Validation & Quality Assessment Phase
    const contextQuality = assessContextQuality(context.ragResults, context.wikiResults);
    const sourceValidation = crossValidateSources(context.ragResults, context.wikiResults);
    
    const fullContext = { ...context, contextQuality };

    // 3. Generation Phase
    const finalResponse = await generateFinalResponse({
        context: fullContext,
        sourceValidation,
        messages
    });

    return finalResponse;
}