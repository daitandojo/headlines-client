import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIStream, StreamingTextResponse, experimental_StreamData } from 'ai';
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
- If the database context is relevant, you MUST use it as your primary source.
- If the database is not relevant, use your general knowledge, drawing from the conversation history.
- Be factual and avoid speculation. Use GitHub-flavored Markdown for formatting, including tables for structured data.`;

export async function POST(req) {
    try {
        const { messages } = await req.json();
        const latestUserMessage = messages[messages.length - 1].content;

        // 1. RAG: Retrieval Step
        const queryEmbedding = await generateEmbedding(latestUserMessage);
        const queryResponse = await pineconeIndex.query({ topK: 5, vector: queryEmbedding, includeMetadata: true });
        const relevantResults = queryResponse.matches.filter(match => match.score >= SIMILARITY_THRESHOLD);
        
        let dbContext = null;
        if (relevantResults.length > 0) {
            dbContext = relevantResults.map(match => `- ${match.metadata.headline}: ${match.metadata.summary}`).join('\n');
        }

        // 2. Prepare the final prompt for the Generator Agent
        const finalUserPrompt = `Database Context:\n${dbContext || 'No relevant context found.'}\n\nUser's Question:\n"${latestUserMessage}"`;
        const finalMessages = [
            ...messages.slice(0, -1),
            { role: 'user', content: finalUserPrompt }
        ];

        // 3. Create the StreamData object to send the RAG context to the client
        const data = new experimental_StreamData();
        data.append({ ragContext: dbContext });

        // 4. RAG: Generation Step (Streaming)
        const response = await groq.chat.completions.create({
            model: GENERATION_MODEL,
            stream: true,
            messages: [{ role: 'system', content: GENERATOR_PROMPT }, ...finalMessages],
            // Pass the StreamData object to the streaming response
            experimental_streamData: true,
        });

        const stream = OpenAIStream(response, {
            onFinal(completion) {
                // This callback is called when the stream is completely finished.
                // We close the data stream here.
                data.close();
            },
            // Pass the data object to the stream
            experimental_streamData: true,
        });

        return new StreamingTextResponse(stream, {}, data);

    } catch (error) {
        console.error('[CHAT API ERROR]', error);
        return new Response('An error occurred. Please check the server logs.', { status: 500 });
    }
}