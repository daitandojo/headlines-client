import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { generateEmbedding } from '@/lib/embeddings';

// --- Initialize Clients & Config (unchanged) ---
if (!process.env.GROQ_API_KEY || !process.env.PINECONE_API_KEY) {
    throw new Error('Missing API keys in environment variables');
}
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pc.index(process.env.PINECONE_INDEX_NAME);
const GENERATION_MODEL = 'openai/gpt-oss-120b';
const SIMILARITY_THRESHOLD = 0.45;

// --- UPDATED: Generator prompt now instructs on <br> usage ---
const GENERATOR_PROMPT = `You are an elite intelligence analyst. Synthesize the provided "Database Context" and "Conversation History" to answer the "User's Question".
- If the database context is relevant, you MUST use it as your primary source.
- If the database is not relevant, use your general knowledge, drawing from the conversation history.
- Be factual and avoid speculation.
- Use GitHub-flavored Markdown for formatting.
- CRITICAL: For line breaks within a table cell, you MUST use the HTML <br> tag.`;

export async function POST(req) {
    try {
        const { messages } = await req.json();
        const latestUserMessage = messages[messages.length - 1];

        // RAG and prompt preparation logic... (unchanged)
        const queryEmbedding = await generateEmbedding(latestUserMessage.content);
        const queryResponse = await pineconeIndex.query({ topK: 5, vector: queryEmbedding, includeMetadata: true });
        const relevantResults = queryResponse.matches.filter(match => match.score >= SIMILARITY_THRESHOLD);
        
        let dbContext = null;
        if (relevantResults.length > 0) {
            dbContext = relevantResults.map(match => `- ${match.metadata.headline}: ${match.metadata.summary}`).join('\n');
        }

        const finalUserPrompt = `Database Context:\n${dbContext || 'Not used.'}\n\nUser's Question:\n"${latestUserMessage.content}"`;
        const finalMessages = [
            ...messages.slice(0, -1),
            { role: 'user', content: finalUserPrompt }
        ];

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