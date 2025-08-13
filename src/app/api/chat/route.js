// src/app/api/chat/route.js (version 3.0)
import { processChatRequest } from '@/lib/rag/orchestrator';
import { logQuery, startTimer } from '@/lib/monitoring';

export async function POST(req) {
    const overallTimer = await startTimer('overall_request');
    let queryForLogging = 'unknown';

    try {
        const { messages } = await req.json();
        queryForLogging = messages[messages.length - 1].content;
        
        // Delegate all complex logic to the RAG orchestrator
        const response = await processChatRequest(messages);
        
        // The orchestrator returns a complete Response object (e.g., StreamingTextResponse)
        return response;

    } catch (error) {
        console.error('[CHAT API Top-Level Error]', error);
        
        const responseTime = await overallTimer.end({ error: true });
        
        // Log the failed query
        await logQuery({
            query: queryForLogging,
            responseTime,
            confidenceLevel: 'error',
            error: error.message
        });
        
        return new Response('An error occurred while processing your request. Please check the server logs for details.', { status: 500 });
    }
}