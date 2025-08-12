import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { generateEmbedding } from '@/lib/embeddings';

// --- Initialize Clients ---
if (!process.env.GROQ_API_KEY || !process.env.PINECONE_API_KEY) {
    throw new Error('Missing API keys in environment variables');
}
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pc.index(process.env.PINECONE_INDEX_NAME);

// --- Models & Config ---
const GENERATION_MODEL = 'openai/gpt-oss-120b';
const SIMILARITY_THRESHOLD = 0.45;

const GENERATOR_PROMPT = `You are an elite intelligence analyst. Synthesize the provided "Database Context" and "Conversation History" to answer the "User's Question".
- You MUST use the database context as your primary source.
- If the database is not relevant, use your general knowledge.
- Be factual and avoid speculation. Use GitHub-flavored Markdown for formatting.`;

export async function POST(req) {
    try {
        const { messages } = await req.json();
        const latestUserMessage = messages[messages.length - 1];

        // 1. RAG: Retrieval Step
        const queryEmbedding = await generateEmbedding(latestUserMessage.content);
        const queryResponse = await pineconeIndex.query({ topK: 5, vector: queryEmbedding, includeMetadata: true });
        const relevantResults = queryResponse.matches.filter(match => match.score >= SIMILARITY_THRESHOLD);
        
        let dbContext = null;
        if (relevantResults.length > 0) {
            dbContext = relevantResults.map(match => `- ${match.metadata.headline}: ${match.metadata.summary}`).join('\n');
        }

        // 2. Prepare the final prompt for the Generator Agent
        const finalUserPrompt = `Database Context:\n${dbContext || 'Not used.'}\n\nUser's Question:\n"${latestUserMessage.content}"`;
        const finalMessages = [
            ...messages.slice(0, -1),
            { role: 'user', content: finalUserPrompt }
        ];

        // 3. RAG: Generation Step (Streaming)
        const response = await groq.chat.completions.create({
            model: GENERATION_MODEL,
            stream: true,
            messages: [{ role: 'system', content: GENERATOR_PROMPT }, ...finalMessages],
        });

        const stream = OpenAIStream(response);
        return new StreamingTextResponse(stream);

    } catch (error) {
        console.error('[GENERATE API ERROR]', error);
        return new Response('An error occurred during generation.', { status: 500 });
    }
}