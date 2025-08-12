import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { generateEmbedding } from '@/lib/embeddings';
import { fetchWikipediaSummary } from '@/lib/wikipedia';

// --- Initialize Clients & Config ---
if (!process.env.GROQ_API_KEY || !process.env.PINECONE_API_KEY) {
    throw new Error('Missing API keys in environment variables');
}
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pc.index(process.env.PINECONE_INDEX_NAME);

// --- Models ---
const AGENT_MODEL = 'llama3-8b-8192'; // Fast model for planning and transforming
const GENERATION_MODEL = 'openai/gpt-oss-120b';
const SIMILARITY_THRESHOLD = 0.45;

// --- Agent Prompts ---
const QUERY_PLANNER_PROMPT = `You are a research planning agent. Analyze the "Conversation History" and "Latest Question" to determine the most critical entities to research. Resolve pronouns.
Respond ONLY with a valid JSON object: { "reasoning": "...", "search_queries": ["Entity 1", "Entity 2"] }`;

const QUERY_TRANSFORMER_PROMPT = `You are a query transformation agent. Your task is to rewrite a conversational user question into a direct, factual query optimized for a vector database search.
- Incorporate key entities from the conversation.
- Focus on the core intent of the question.
- The result should be a concise, keyword-rich statement.
Respond ONLY with a valid JSON object: { "rewritten_query": "Your optimized query here." }`;

const GENERATOR_PROMPT_WITH_CONTEXT = `You are an elite intelligence analyst. Your primary directive is to synthesize the provided "Internal Database Context" to answer the "User's Question".
- You MUST use the internal database as your primary source.
- You may use the "Public Wikipedia Context" to enrich your answer with background facts.
- Begin your response with "[FROM DATABASE]:".
- Use Markdown for formatting.`;

const GENERATOR_PROMPT_WITHOUT_CONTEXT = `You are an elite intelligence analyst. The internal database had no relevant information.
- You MUST answer the "User's Question" using the "Public Wikipedia Context" and your general knowledge.
- Begin your response with "[GENERAL KNOWLEDGE]:".
- If you are not highly confident, state that.
- Use Markdown for formatting.`;

export async function POST(req) {
    try {
        const { messages } = await req.json();
        const latestUserMessage = messages[messages.length - 1];
        const conversationHistory = messages.slice(0, -1);

        // --- Agent Step 1: Query Planner ---
        const plannerResponse = await groq.chat.completions.create({
            model: AGENT_MODEL,
            messages: [{ role: 'system', content: QUERY_PLANNER_PROMPT }, { role: 'user', content: `Conversation History:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nLatest Question:\n"${latestUserMessage.content}"` }],
            response_format: { type: 'json_object' },
        });
        const plan = JSON.parse(plannerResponse.choices[0].message.content);
        const searchQueries = plan.search_queries || [];
        console.log(`[Query Planner] Decided to search for: ${searchQueries.join(', ')}`);

        // --- Agent Step 2: Query Transformer ---
        const transformerResponse = await groq.chat.completions.create({
            model: AGENT_MODEL,
            messages: [{ role: 'system', content: QUERY_TRANSFORMER_PROMPT }, { role: 'user', content: `Conversation History:\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nLatest Question:\n"${latestUserMessage.content}"` }],
            response_format: { type: 'json_object' },
        });
        const { rewritten_query } = JSON.parse(transformerResponse.choices[0].message.content);
        console.log(`[Query Transformer] Rewrote question to: "${rewritten_query}"`);

        // --- Step 3: Perform Planner-Led RAG in Parallel ---
        const queryEmbedding = await generateEmbedding(rewritten_query); // Use the transformed query for embedding
        
        const pineconePromise = pineconeIndex.query({ topK: 3, vector: queryEmbedding, includeMetadata: true });
        const wikipediaPromises = searchQueries.map(entity => fetchWikipediaSummary(entity));
        const [pineconeResponse, ...wikiResults] = await Promise.all([pineconePromise, ...wikipediaPromises]);

        // --- Step 4: Assemble Context and Choose Final Prompt ---
        const relevantPineconeResults = pineconeResponse.matches.filter(match => match.score >= SIMILARITY_THRESHOLD);
        const dbContext = relevantPineconeResults.length > 0 
            ? relevantPineconeResults.map(match => `- ${match.metadata.headline}: ${match.metadata.summary}`).join('\n')
            : null;
        const wikiContext = wikiResults.filter(res => res.success).map(res => res.summary).join('\n\n---\n\n');
        
        console.log(`[RAG Result] Found ${relevantPineconeResults.length} relevant documents in Pinecone.`);
        
        const systemPrompt = dbContext ? GENERATOR_PROMPT_WITH_CONTEXT : GENERATOR_PROMPT_WITHOUT_CONTEXT;

        // --- Step 5: Generate Final Response ---
        const finalUserPrompt = `Internal Database Context:\n${dbContext || 'None'}\n\nPublic Wikipedia Context:\n${wikiContext || 'None'}\n\nUser's Question:\n"${latestUserMessage.content}"`;
        const finalMessages = [ ...messages.slice(0, -1), { role: 'user', content: finalUserPrompt }];

        const response = await groq.chat.completions.create({
            model: GENERATION_MODEL,
            stream: true,
            messages: [{ role: 'system', content: systemPrompt }, ...finalMessages],
        });

        const stream = OpenAIStream(response);
        return new StreamingTextResponse(stream);

    } catch (error) {
        console.error('[GENERATE API ERROR]', error);
        return new Response('An error occurred during generation.', { status: 500 });
    }
}