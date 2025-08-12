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

// --- Models & Config ---
const AGENT_MODEL = 'llama3-8b-8192'; // Use the fast model for these structured tasks
const SIMILARITY_THRESHOLD = 0.45;

// --- Agent Prompts ---
const CLAIM_EXTRACTOR_PROMPT = `You are a claim extraction agent. Your task is to read the "AI-Generated Answer" and extract every distinct factual claim it makes.
Respond ONLY with a valid JSON object with a single key "claims", which is an array of strings.
Example:
{
  "claims": ["Troels Holch Povlsen is married to Gitte Holch Povlsen.", "She is a Danish philanthropist.", "They built the family's business empire together."]
}`;

const VERIFIER_PROMPT = `You are a meticulous fact-checking agent. Your task is to verify a "Claim" against the provided "Database Context (Ground Truth)".
For the given claim, respond ONLY with a valid JSON object with a single key "isVerified", which is a boolean.
- Set to true if the Database Context directly states or strongly supports the claim.
- Set to false if the Database Context contradicts the claim or does not mention it.`;

export async function POST(req) {
    try {
        const { answer, originalQuestion } = await req.json();
        if (!answer || !originalQuestion) {
            return new Response(JSON.stringify({ error: "Missing answer or original question" }), { status: 400 });
        }

        // 1. Re-run RAG to get the ground truth context
        const queryEmbedding = await generateEmbedding(originalQuestion);
        const queryResponse = await pineconeIndex.query({ topK: 5, vector: queryEmbedding, includeMetadata: true });
        const relevantResults = queryResponse.matches.filter(match => match.score >= SIMILARITY_THRESHOLD);
        const dbContext = relevantResults.map(match => match.metadata.summary).join('\n');

        // 2. Step 1 of Agent: Extract Claims from the answer
        const extractorResponse = await groq.chat.completions.create({
            model: AGENT_MODEL,
            messages: [
                { role: 'system', content: CLAIM_EXTRACTOR_PROMPT },
                { role: 'user', content: `AI-Generated Answer:\n${answer}` }
            ],
            response_format: { type: 'json_object' },
        });
        const { claims } = JSON.parse(extractorResponse.choices[0].message.content);

        // 3. Step 2 of Agent: Verify each claim against the context
        const verifiedClaims = await Promise.all(claims.map(async (claim) => {
            const verifierResponse = await groq.chat.completions.create({
                model: AGENT_MODEL,
                messages: [
                    { role: 'system', content: VERIFIER_PROMPT },
                    { role: 'user', content: `Database Context (Ground Truth):\n${dbContext}\n\nClaim to verify:\n"${claim}"` }
                ],
                response_format: { type: 'json_object' },
            });
            const { isVerified } = JSON.parse(verifierResponse.choices[0].message.content);
            return { text: claim, isVerified };
        }));

        return new Response(JSON.stringify({ verifiedClaims }), { status: 200 });

    } catch (error) {
        console.error('[VERIFY API ERROR]', error);
        return new Response('An error occurred during verification.', { status: 500 });
    }
}