// src/lib/rag/generation.js (version 1.0)
import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { getGeneratorPrompt, INSUFFICIENT_DATA_PROMPT } from './prompts';
import { generateConfidenceDisclaimer } from './validation';

// --- Client & Model ---
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
const GENERATION_MODEL = 'openai/gpt-oss-120b';

function assembleContext(ragResults, wikiResults, rewrittenQuery, contextQuality, sourceValidation) {
    const dbContext = ragResults.length > 0 
        ? ragResults.map(match => `- [Similarity: ${match.score.toFixed(3)}] ${match.metadata.headline}: ${match.metadata.summary}`).join('\n')
        : null;
    
    const wikiContext = wikiResults.length > 0
        ? wikiResults.map(res => `- [Quality: ${res.validation.quality}] ${res.title}: ${res.summary}`).join('\n')
        : null;

    return `Context Quality Assessment:
- Internal Database: ${contextQuality.ragResultCount} documents (max similarity: ${contextQuality.maxSimilarity.toFixed(3)})
- Wikipedia: ${contextQuality.wikiResultCount} high-quality articles
- Confidence Level: ${contextQuality.hasHighConfidenceRAG ? 'HIGH' : 'MEDIUM'}

Internal Database Context:
${dbContext || 'None'}

Wikipedia Context:
${wikiContext || 'None'}

User's Question:
"${rewrittenQuery}"

IMPORTANT: Base your answer ONLY on the context provided above. If information is missing, explicitly state what is needed.`;
}

async function generateStreamingResponse(context, sourceValidation, messages) {
    const disclaimer = generateConfidenceDisclaimer(context.contextQuality, sourceValidation);
    const enhancedContextInfo = `${disclaimer}\n\n${context.fullContext}\n\nIMPORTANT: Start your response with the confidence level and be explicit about limitations.`;
    const messagesForApi = [...messages.slice(0, -1), { role: 'user', content: enhancedContextInfo }];
    
    const response = await groq.chat.completions.create({
        model: GENERATION_MODEL,
        stream: true,
        messages: [{ role: 'system', content: getGeneratorPrompt(sourceValidation) }, ...messagesForApi],
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream, {
        headers: {
            'X-Confidence-Level': context.contextQuality.hasHighConfidenceRAG ? 'high' : 'medium',
            'X-Source-Validation': sourceValidation.reliability
        }
    });
}

async function generateInsufficientDataResponse(context, rewrittenQuery) {
     const insufficientDataResponse = INSUFFICIENT_DATA_PROMPT
        .replace('{question}', rewrittenQuery)
        .replace('{ragResults}', context.contextQuality.ragResultCount)
        .replace('{wikiResults}', context.contextQuality.wikiResultCount);
    
    const fallbackResponse = await groq.chat.completions.create({
        model: GENERATION_MODEL,
        messages: [{ role: 'user', content: insufficientDataResponse }],
        stream: true,
    });
    
    const stream = OpenAIStream(fallbackResponse);
    return new StreamingTextResponse(stream);
}

export async function generateFinalResponse({ context, sourceValidation, messages }) {
    if (!context.contextQuality.hasSufficientContext) {
        return generateInsufficientDataResponse(context, context.rewrittenQuery);
    }

    const fullContext = assembleContext(context.ragResults, context.wikiResults, context.rewrittenQuery, context.contextQuality, sourceValidation);
    const finalContext = { ...context, fullContext };
    
    // For now, we will always stream. The logic for non-streaming can be added later if needed.
    return generateStreamingResponse(finalContext, sourceValidation, messages);
}