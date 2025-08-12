// src/app/api/chat/route.js (version 2.0 - Anti-Hallucination)
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { generateEmbedding, generateQueryEmbeddings, getCacheStats } from '@/lib/embeddings';
import { fetchWikipediaSummary, fetchBatchWikipediaSummaries, validateWikipediaContent, getWikipediaCacheStats } from '@/lib/wikipedia';
import { crossValidateSources, detectHallucinations, generateConfidenceDisclaimer, generateQualityReport } from '@/lib/qualityControl';
import { logQuery, logPerformance, startTimer, checkAlerts } from '@/lib/monitoring';

// --- Initialize Clients ---
if (!process.env.GROQ_API_KEY || !process.env.PINECONE_API_KEY) {
    throw new Error('Missing API keys in environment variables');
}
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pc.index(process.env.PINECONE_INDEX_NAME);

// --- Models & Config ---
const QUERY_REWRITER_MODEL = 'openai/gpt-oss-20b'; // A smaller, faster model is fine for this
const ENTITY_EXTRACTOR_MODEL = 'openai/gpt-oss-120b';
const GENERATION_MODEL = 'openai/gpt-oss-120b';
const FACT_CHECKER_MODEL = 'openai/gpt-oss-120b';
// CORRECTED: Lowered the threshold to improve recall.
const SIMILARITY_THRESHOLD = 0.38;
const HIGH_CONFIDENCE_THRESHOLD = 0.75;

// --- Agent Prompts ---
const QUERY_REWRITER_PROMPT = `You are a query rewriting expert. Your task is to take a conversation history and the latest user question, and rewrite the question into a single, standalone query that is optimal for a vector database search.

- If the latest question is already a complete, standalone question, use it as is.
- If the latest question is a follow-up (e.g., "what about him?", "and his wife?"), combine it with context from the history.
- The rewritten query should be concise and contain all the necessary keywords.

Example 1:
History:
"assistant: Bestseller was founded by Troels Holch Povlsen."
"user: What is his net worth?"
Rewritten Query: "What is Troels Holch Povlsen's net worth?"

Example 2:
History:
"user: Tell me about Bestseller."
"assistant: Bestseller is a fashion company..."
"user: Who founded it?"
Rewritten Query: "Who founded the Bestseller company?"

Respond ONLY with the rewritten query, with no extra text or quotes.`;

const ENTITY_EXTRACTOR_PROMPT = `You are a highly intelligent entity extraction and disambiguation agent. Your task is to analyze the "User's Question" and identify the 1-2 most important proper nouns (people, companies, specific events).

CRITICAL INSTRUCTIONS:
1.  **Disambiguate the entity type.** If the entity is a company, append "(company)". If it is a person, append "(person)".
2.  Be precise and return only the essential search term.

Example 1:
User's Question: "Who founded Bestseller?"
Your Output: { "entities": ["Bestseller (company)"] }

Example 2:
User's Question: "Tell me about Troels Holch Povlsen"
Your Output: { "entities": ["Troels Holch Povlsen (person)"] }

Example 3:
User's Question: "What is the history of Nine United?"
Your Output: { "entities": ["Nine United (company)"] }

Respond ONLY with a valid JSON object: { "entities": ["Entity 1", "Entity 2"] }`;

const getGeneratorPrompt = (sourceValidation) => `You are an elite intelligence analyst. Your primary directive is to synthesize ONLY the provided context to answer the "User's Question".

**CRITICAL RULES:**
1. You MUST ONLY use information explicitly provided in the context sources below
2. If you cannot answer the question with the provided context, say "I don't have enough information in my sources to answer this question"
3. NEVER add information from your general knowledge unless explicitly marked as inference
4. Be precise about what each source says - don't extrapolate beyond what's written
5. If sources conflict, acknowledge the conflict and present both perspectives

**SOURCE VALIDATION STATUS:**
- Cross-source validation: ${sourceValidation.reliability} reliability
- Detected conflicts: ${sourceValidation.conflicts.length}
- Confirmed facts: ${sourceValidation.confirmations.length}

**SOURCE HIERARCHY:**
1. **Internal Database Context** - Highest priority, treat as authoritative
2. **Wikipedia Context** - Secondary source for background
3. **Inference** - Only if you must connect obvious dots, mark clearly as inference

**OUTPUT FORMATTING:**
- Use <rag>fact</rag> for Internal Database information
- Use <wiki>fact</wiki> for Wikipedia information  
- Use <inference>logical connection</inference> for necessary inferences
- If sources conflict, acknowledge the conflict explicitly

**EXAMPLE GOOD RESPONSE:**
<rag>Anders Holch Povlsen's net worth is $7.8 billion according to Forbes 2023.</rag> <wiki>He owns Bestseller fashion company and is the largest private landowner in Scotland.</wiki> However, I don't have specific information about his current investment strategies in my sources.

**EXAMPLE BAD RESPONSE:**
He's probably investing in sustainable fashion because that's a trend among billionaires. (This adds unsourced speculation)`;

const FACT_CHECKER_PROMPT = `You are a fact-checking agent. Review the proposed response and verify that:

1. All factual claims are supported by the provided sources
2. No unsourced information has been added
3. Any inferences are logical and clearly marked

Respond with JSON:
{
  "approved": boolean,
  "issues": ["list of specific problems if any"],
  "confidence_score": number (0-1),
  "recommendation": "approve/revise/insufficient_data"
}`;

const INSUFFICIENT_DATA_PROMPT = `The user asked: "{question}"

Based on your search, you found:
- {ragResults} relevant documents in the internal database
- {wikiResults} Wikipedia articles

Generate a helpful response that:
1. Acknowledges what you searched for
2. Explains what information is missing
3. Suggests how they might find this information
4. Offers to help with related questions you CAN answer

Be specific about what you looked for and what would be needed to answer their question.`;

// Helper function to assess context quality
function assessContextQuality(ragResults, wikiResults, question) {
    const ragScore = ragResults.length > 0 ? Math.max(...ragResults.map(r => r.score)) : 0;
    
    const highQualityWiki = wikiResults.filter(r => r.validation?.quality === 'high').length;
    const mediumQualityWiki = wikiResults.filter(r => r.validation?.quality === 'medium').length;
    const wikiScore = highQualityWiki > 0 ? 0.7 : (mediumQualityWiki > 0 ? 0.5 : 0);
    
    const combinedScore = Math.max(ragScore, wikiScore);
    
    const hasMultipleSources = ragResults.length > 0 && wikiResults.length > 0;
    const hasHighQualityContent = ragScore >= HIGH_CONFIDENCE_THRESHOLD || highQualityWiki > 0;
    
    return {
        hasHighConfidenceRAG: ragScore >= HIGH_CONFIDENCE_THRESHOLD,
        hasSufficientContext: combinedScore >= SIMILARITY_THRESHOLD,
        ragResultCount: ragResults.length,
        wikiResultCount: wikiResults.length,
        highQualityWikiCount: highQualityWiki,
        maxSimilarity: ragScore,
        combinedConfidence: combinedScore,
        hasMultipleSources,
        hasHighQualityContent
    };
}

// Helper function to detect potential hallucinations
async function validateResponse(response, sources, originalQuestion) {
    try {
        const validation = await groq.chat.completions.create({
            model: FACT_CHECKER_MODEL,
            messages: [
                { role: 'system', content: FACT_CHECKER_PROMPT },
                { 
                    role: 'user', 
                    content: `Sources: ${sources}\n\nProposed Response: ${response}\n\nOriginal Question: ${originalQuestion}` 
                }
            ],
            response_format: { type: 'json_object' },
        });
        
        return JSON.parse(validation.choices[0].message.content);
    } catch (error) {
        console.error('[VALIDATION ERROR]', error);
        return { approved: false, confidence_score: 0, recommendation: 'revise' };
    }
}

export async function POST(req) {
    const overallTimer = await startTimer('overall_request');
    let latestUserMessage;
    
    try {
        const { messages } = await req.json();
        let queryForRetrieval = messages[messages.length - 1].content;

        if (messages.length > 1) {
            const conversationHistory = messages.slice(-5, -1)
                .map(m => `${m.role}: ${m.content}`)
                .join('\n');
            
            const rewriteResponse = await groq.chat.completions.create({
                model: QUERY_REWRITER_MODEL,
                messages: [
                    { role: 'system', content: QUERY_REWRITER_PROMPT },
                    { role: 'user', content: `History:\n${conversationHistory}\n\nLatest question: "${queryForRetrieval}"` }
                ],
                temperature: 0.0
            });
            const rewrittenQuery = rewriteResponse.choices[0].message.content.trim();
            console.log(`[Query Rewriter] Original: "${queryForRetrieval}" | Rewritten: "${rewrittenQuery}"`);
            queryForRetrieval = rewrittenQuery;
        }
        
        latestUserMessage = queryForRetrieval;

        const entityTimer = await startTimer('entity_extraction');
        const entityResponse = await groq.chat.completions.create({
            model: ENTITY_EXTRACTOR_MODEL,
            messages: [
                { role: 'system', content: ENTITY_EXTRACTOR_PROMPT },
                { role: 'user', content: `User's Question: "${latestUserMessage}"` }
            ],
            response_format: { type: 'json_object' },
        });
        const { entities } = JSON.parse(entityResponse.choices[0].message.content);
        await entityTimer.end();
        console.log(`[Entity Agent] Extracted & Disambiguated: ${entities.join(', ')}`);

        const ragTimer = await startTimer('rag_retrieval');
        
        const fullQueryEmbeddingsPromise = generateQueryEmbeddings(latestUserMessage);
        
        const entityEmbeddingsPromise = entities.length > 0 ? generateQueryEmbeddings(entities[0]) : Promise.resolve([]);

        const [fullQueryEmbeddings, entityEmbeddings] = await Promise.all([
            fullQueryEmbeddingsPromise,
            entityEmbeddingsPromise
        ]);

        const allQueryEmbeddings = [...fullQueryEmbeddings, ...entityEmbeddings];
        console.log(`[RAG] Performing search with ${allQueryEmbeddings.length} embedding vectors.`);

        const pineconePromises = allQueryEmbeddings.map(embedding => 
            pineconeIndex.query({ 
                topK: 3, 
                vector: embedding, 
                includeMetadata: true 
            })
        );
        
        const wikiTimer = await startTimer('wikipedia_fetch');
        const wikiPromise = fetchBatchWikipediaSummaries(entities);
        
        const [pineconeResponses, wikiResults] = await Promise.all([
            Promise.all(pineconePromises),
            wikiPromise
        ]);
        await ragTimer.end();
        await wikiTimer.end();
        
        const uniqueMatches = new Map();
        pineconeResponses.forEach(response => {
            if (response && response.matches) {
                response.matches.forEach(match => {
                    if (!uniqueMatches.has(match.id) || match.score > uniqueMatches.get(match.id).score) {
                        uniqueMatches.set(match.id, match);
                    }
                });
            }
        });
        
        const relevantPineconeResults = Array.from(uniqueMatches.values())
            .filter(match => match.score >= SIMILARITY_THRESHOLD)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
            
        const validWikiResults = [];
        for (const res of wikiResults.filter(r => r.success)) {
            const validation = await validateWikipediaContent(res.summary);
            if (validation.valid) {
                validWikiResults.push({ ...res, validation });
            }
        }
            
        const sourceValidation = crossValidateSources(relevantPineconeResults, validWikiResults, latestUserMessage);
        console.log(`[Source Validation] Conflicts: ${sourceValidation.conflicts.length}, Confirmations: ${sourceValidation.confirmations.length}`);
        
        const contextQuality = assessContextQuality(relevantPineconeResults, validWikiResults, latestUserMessage);
        
        console.log(`[RAG] Found ${relevantPineconeResults.length} relevant documents. Max similarity: ${contextQuality.maxSimilarity.toFixed(3)}`);
        console.log(`[Wikipedia] ${validWikiResults.length} valid Wikipedia articles found`);
        
        const [embeddingStats, wikiStats] = await Promise.all([
            getCacheStats(),
            getWikipediaCacheStats()
        ]);
        console.log(`[Cache Stats] Embeddings: ${JSON.stringify(embeddingStats)}, Wikipedia: ${JSON.stringify(wikiStats)}`);
        
        if (!contextQuality.hasSufficientContext) {
            const insufficientDataResponse = INSUFFICIENT_DATA_PROMPT
                .replace('{question}', latestUserMessage)
                .replace('{ragResults}', contextQuality.ragResultCount)
                .replace('{wikiResults}', contextQuality.wikiResultCount);
            
            const fallbackResponse = await groq.chat.completions.create({
                model: GENERATION_MODEL,
                messages: [{ role: 'user', content: insufficientDataResponse }],
                stream: true,
            });
            
            const stream = OpenAIStream(fallbackResponse);
            return new StreamingTextResponse(stream);
        }

        const dbContext = relevantPineconeResults.length > 0 
            ? relevantPineconeResults.map(match => 
                `- [Similarity: ${match.score.toFixed(3)}] ${match.metadata.headline}: ${match.metadata.summary}`
              ).join('\n')
            : null;
        
        const wikiContext = validWikiResults
            .map(res => `- [Quality: ${res.validation.quality}] ${res.title}: ${res.summary}`)
            .join('\n');

        const contextInfo = `Context Quality Assessment:
- Internal Database: ${contextQuality.ragResultCount} documents (max similarity: ${contextQuality.maxSimilarity.toFixed(3)})
- Wikipedia: ${validWikiResults.length} high-quality articles
- Confidence Level: ${contextQuality.hasHighConfidenceRAG ? 'HIGH' : 'MEDIUM'}
- Search Strategy: Multi-query expansion used

Internal Database Context:
${dbContext || 'None'}

Wikipedia Context:
${wikiContext || 'None'}

User's Question:
"${latestUserMessage}"

IMPORTANT: Base your answer ONLY on the context provided above. If information is missing, explicitly state what additional information would be needed.`;

        const generatorPrompt = getGeneratorPrompt(sourceValidation);

        const messagesForApi = [...messages.slice(0, -1), { role: 'user', content: contextInfo }];
        
        if (contextQuality.hasHighConfidenceRAG) {
            const response = await groq.chat.completions.create({
                model: GENERATION_MODEL,
                messages: [{ role: 'system', content: generatorPrompt }, ...messagesForApi],
            });
            
            const generatedContent = response.choices[0].message.content;
            
            const allSources = [...relevantPineconeResults, ...validWikiResults];
            const hallucinationReport = detectHallucinations(generatedContent, allSources);
            
            const qualityReport = generateQualityReport({
                contextQuality,
                validation: sourceValidation,
                hallucinationReport,
                responseLength: generatedContent.length,
                sourceCount: allSources.length
            });
            
            console.log(`[Quality Control] Overall Score: ${qualityReport.overallScore.toFixed(3)}, Recommendation: ${qualityReport.recommendation}`);
            
            if (qualityReport.recommendation === 'reject' || hallucinationReport.recommendation === 'reject') {
                console.log(`[Quality Control] Response rejected. Issues: ${[...qualityReport.weaknesses, ...hallucinationReport.suspiciousStatements.map(s => s.reason)].join(', ')}`);
                
                const fallbackPrompt = `The previous response was flagged for quality issues. Please provide a very conservative answer that:
1. Only states facts explicitly found in the sources
2. Acknowledges any limitations or gaps in information
3. Avoids any speculation or inference
4. Uses phrases like "According to the sources" and "The available information suggests"

${contextInfo}`;
                
                const fallbackResponse = await groq.chat.completions.create({
                    model: GENERATION_MODEL,
                    stream: true,
                    messages: [{ role: 'system', content: generatorPrompt }, { role: 'user', content: fallbackPrompt }],
                });
                
                const stream = OpenAIStream(fallbackResponse);
                return new StreamingTextResponse(stream);
            }
            
            const disclaimer = generateConfidenceDisclaimer(contextQuality, sourceValidation);
            const enhancedResponse = `${disclaimer}\n\n${generatedContent}`;
            
            console.log(`[Quality Metrics] Hallucination Score: ${hallucinationReport.confidenceScore}, Source Validation: ${sourceValidation.reliability}`);
            
            const responseTime = await overallTimer.end();
            await logQuery({
                query: latestUserMessage,
                entities,
                ragResults: relevantPineconeResults.length,
                wikiResults: validWikiResults.length,
                maxSimilarity: contextQuality.maxSimilarity,
                qualityScore: qualityReport.overallScore,
                responseTime,
                confidenceLevel: contextQuality.hasHighConfidenceRAG ? 'high' : 'medium',
                hadHallucinations: hallucinationReport.recommendation === 'reject',
                sourceConflicts: sourceValidation.conflicts.length
            });
            
            const alerts = await checkAlerts();
            if (alerts.length > 0) {
                console.warn(`[SYSTEM ALERTS] ${alerts.length} active alerts:`, alerts.map(a => a.message).join('; '));
            }
            
            return new Response(enhancedResponse, {
                headers: { 
                    'Content-Type': 'text/plain',
                    'X-Quality-Score': qualityReport.overallScore.toString(),
                    'X-Source-Count': allSources.length.toString(),
                    'X-Response-Time': responseTime.toString(),
                    'X-Confidence': contextQuality.hasHighConfidenceRAG ? 'high' : 'medium'
                }
            });
        } else {
            console.log(`[Streaming Mode] Using streaming response due to medium/low confidence context`);
            
            const disclaimer = generateConfidenceDisclaimer(contextQuality, sourceValidation);
            const enhancedContextInfo = `${disclaimer}\n\n${contextInfo}\n\nIMPORTANT: Start your response with the confidence level and be explicit about limitations.`;
            const messagesForStreamingApi = [...messages.slice(0, -1), { role: 'user', content: enhancedContextInfo }];
            
            const response = await groq.chat.completions.create({
                model: GENERATION_MODEL,
                stream: true,
                messages: [{ role: 'system', content: generatorPrompt }, ...messagesForStreamingApi],
            });

            const stream = OpenAIStream(response);
            return new StreamingTextResponse(stream, {
                headers: {
                    'X-Confidence-Level': contextQuality.hasHighConfidenceRAG ? 'high' : 'medium',
                    'X-Source-Validation': sourceValidation.reliability
                }
            });
        }

    } catch (error) {
        const responseTime = await overallTimer.end({ error: true });
        console.error('[CHAT API ERROR]', error);
        
        await logQuery({
            query: latestUserMessage || 'unknown',
            entities: [],
            ragResults: 0,
            wikiResults: 0,
            maxSimilarity: 0,
            qualityScore: 0,
            responseTime,
            confidenceLevel: 'error',
            hadHallucinations: false,
            sourceConflicts: 0,
            error: error.message
        });
        
        return new Response('An error occurred while processing your request. Please check the server logs.', { status: 500 });
    }
}