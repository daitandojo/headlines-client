import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { generateEmbedding } from '@/lib/embeddings';

// --- Initialize Clients ---
if (!process.env.GROQ_API_KEY || !process.env.PINECONE_API_KEY) {
    throw new Error('Missing API keys in environment variables');
}
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pc.index(process.env.PINECONE_INDEX_NAME);

// --- Model & Config ---
const ANNOTATOR_MODEL = 'llama3-8b-8192';
const SIMILARITY_THRESHOLD = 0.45;

// --- Annotator Prompt ---
const ANNOTATOR_PROMPT = `You are a meticulous fact-checking agent... (This prompt is unchanged)`;

export async function POST(req) {
    try {
        const { answer, originalQuestion } = await req.json();

        if (!answer || !originalQuestion) {
            return new Response(JSON.stringify({ error: "Missing answer or original question" }), { status: 400 });
        }
        
        // --- Self-Contained RAG Search ---
        const queryEmbedding = await generateEmbedding(originalQuestion);
        const queryResponse = await pineconeIndex.query({ topK: 5, vector: queryEmbedding, includeMetadata: true });
        const relevantResults = queryResponse.matches.filter(match => match.score >= SIMILARITY_THRESHOLD);
        
        let dbContext = "No relevant context found in the database.";
        if (relevantResults.length > 0) {
            dbContext = relevantResults.map(match => `- ${match.metadata.headline}: ${match.metadata.summary}`).join('\n');
        }
        // --- End RAG Search ---

        const response = await groq.chat.completions.create({
            model: ANNOTATOR_MODEL,
            messages: [
                { role: 'system', content: ANNOTATOR_PROMPT },
                { role: 'user', content: `Database Context (Ground Truth):\n${dbContext}\n\nAI-Generated Answer to fact-check:\n${answer}` }
            ],
            response_format: { type: 'json_object' },
        });

        const annotation = JSON.parse(response.choices[0].message.content);
        return new Response(JSON.stringify(annotation), { status: 200 });

    } catch (error) {
        console.error('[ANNOTATE API ERROR]', error);
        return new Response('An error occurred during annotation.', { status: 500 });
    }
}