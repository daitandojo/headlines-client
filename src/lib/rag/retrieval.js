// src/lib/rag/retrieval.js (version 1.0)
import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { generateQueryEmbeddings } from '@/lib/embeddings';
import { fetchBatchWikipediaSummaries, validateWikipediaContent } from '@/lib/wikipedia';
import { QUERY_REWRITER_PROMPT, ENTITY_EXTRACTOR_PROMPT } from './prompts';

// --- Initialize Clients ---
if (!process.env.GROQ_API_KEY || !process.env.PINECONE_API_KEY) {
    throw new Error('Missing API keys in environment variables');
}
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pc.index(process.env.PINECONE_INDEX_NAME);

// --- Models & Config ---
const QUERY_REWRITER_MODEL = 'openai/gpt-oss-20b';
const ENTITY_EXTRACTOR_MODEL = 'openai/gpt-oss-120b';
const SIMILARITY_THRESHOLD = 0.38;

async function rewriteQuery(messages) {
    let queryForRetrieval = messages[messages.length - 1].content;
    if (messages.length > 1) {
        const conversationHistory = messages.slice(-5, -1).map(m => `${m.role}: ${m.content}`).join('\n');
        const rewriteResponse = await groq.chat.completions.create({
            model: QUERY_REWRITER_MODEL,
            messages: [{ role: 'system', content: QUERY_REWRITER_PROMPT }, { role: 'user', content: `History:\n${conversationHistory}\n\nLatest question: "${queryForRetrieval}"` }],
            temperature: 0.0
        });
        queryForRetrieval = rewriteResponse.choices[0].message.content.trim();
        console.log(`[Query Rewriter] Rewritten to: "${queryForRetrieval}"`);
    }
    return queryForRetrieval;
}

async function extractEntities(query) {
    const entityResponse = await groq.chat.completions.create({
        model: ENTITY_EXTRACTOR_MODEL,
        messages: [{ role: 'system', content: ENTITY_EXTRACTOR_PROMPT }, { role: 'user', content: `User's Question: "${query}"` }],
        response_format: { type: 'json_object' },
    });
    const { entities } = JSON.parse(entityResponse.choices[0].message.content);
    console.log(`[Entity Agent] Extracted & Disambiguated: ${entities.join(', ')}`);
    return entities;
}

async function fetchPineconeContext(query, entities) {
    const fullQueryEmbeddings = await generateQueryEmbeddings(query);
    const entityEmbeddings = entities.length > 0 ? await generateQueryEmbeddings(entities[0]) : [];
    const allQueryEmbeddings = [...fullQueryEmbeddings, ...entityEmbeddings];
    
    const pineconePromises = allQueryEmbeddings.map(embedding =>
        pineconeIndex.query({ topK: 3, vector: embedding, includeMetadata: true })
    );
    const pineconeResponses = await Promise.all(pineconePromises);
    
    const uniqueMatches = new Map();
    pineconeResponses.forEach(response => {
        response?.matches?.forEach(match => {
            if (!uniqueMatches.has(match.id) || match.score > uniqueMatches.get(match.id).score) {
                uniqueMatches.set(match.id, match);
            }
        });
    });
    
    return Array.from(uniqueMatches.values())
        .filter(match => match.score >= SIMILARITY_THRESHOLD)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

async function fetchValidatedWikipediaContext(entities) {
    const wikiResults = await fetchBatchWikipediaSummaries(entities);
    const validWikiResults = [];
    for (const res of wikiResults.filter(r => r.success)) {
        const validation = await validateWikipediaContent(res.summary);
        if (validation.valid) {
            validWikiResults.push({ ...res, validation });
        }
    }
    return validWikiResults;
}

export async function retrieveContextForQuery(messages) {
    const rewrittenQuery = await rewriteQuery(messages);
    const entities = await extractEntities(rewrittenQuery);
    
    const [pineconeResults, wikipediaResults] = await Promise.all([
        fetchPineconeContext(rewrittenQuery, entities),
        fetchValidatedWikipediaContext(entities)
    ]);
    
    console.log(`[RAG] Found ${pineconeResults.length} relevant documents from Pinecone.`);
    console.log(`[Wikipedia] Found ${wikipediaResults.length} valid articles from Wikipedia.`);
    
    return {
        rewrittenQuery,
        entities,
        ragResults: pineconeResults,
        wikiResults: wikipediaResults
    };
}