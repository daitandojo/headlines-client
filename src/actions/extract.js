"use server";

import OpenAI from 'openai';
import { JSDOM } from 'jsdom';
import { COMMON_COUNTRIES } from '@/lib/countries';

// Initialize GROQ Client
if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ API Key is missing from environment variables');
}
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

// Use the more powerful model for this complex analytical task
const ANALYST_MODEL = 'openai/gpt-oss-120b';

const ANALYST_PROMPT = `You are a senior analyst at a top-tier wealth management firm. Your task is to analyze the text content of a webpage and extract only the business-critical, factual intelligence.

**Your Mandate:**
1.  **Identify Core Entities:** Find the primary company, key individuals (founders, CEOs, chairmen), and any mentioned portfolio companies, investors, or partners.
2.  **Extract Factual Statements:** Isolate concrete facts about the company's business, heritage, investments, and strategy.
3.  **AGGRESSIVELY DISCARD FLUFF:** You MUST ignore all generic marketing language, mission statements, corporate values, and other non-factual embellishments (e.g., "we have a profound belief," "we strive to make a positive contribution," "the right mindset will always be paramount").
4.  **Synthesize a Business Summary:** Combine the extracted facts into a concise, dense, business-savvy summary. List key portfolio companies or partners in a clear, accessible way (e.g., using a bulleted list).
5.  **Deduce Metadata:** Based on the text and URL, determine the publication name and the primary country the news is relevant to from the provided list.

Respond ONLY with a valid JSON object with the following structure:
{
  "headline": "A concise, factual headline describing the entity.",
  "publication": "The name of the newspaper or website.",
  "country": "The country this news is about. Choose one from this list: [${COMMON_COUNTRIES.join(', ')}].",
  "business_summary": "The synthesized, business-critical summary, formatted with Markdown."
}`;

/**
 * Uses an AI Analyst Agent to extract business-savvy information from a URL.
 * @param {string} url The URL to scrape.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function scrapeAndExtractWithAI(url) {
    if (!url) {
        return { success: false, error: "URL is required." };
    }

    try {
        // 1. Fetch the raw HTML of the page
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' } });
        if (!response.ok) return { success: false, error: `Failed to fetch URL. Status: ${response.status}` };
        
        const html = await response.text();
        
        // 2. Extract all text from the body to give the AI full context
        const dom = new JSDOM(html);
        const bodyText = dom.window.document.body.textContent.replace(/\s\s+/g, ' ').trim();

        // Truncate to a safe length to avoid context window errors
        const truncatedText = bodyText.substring(0, 12000);

        // 3. Send the full context to the AI Analyst Agent
        const analysis = await groq.chat.completions.create({
            model: ANALYST_MODEL,
            messages: [
                { role: 'system', content: ANALYST_PROMPT },
                { role: 'user', content: `Analyze the following webpage content from URL: ${url}\n\n---WEBPAGE TEXT---\n${truncatedText}` }
            ],
            response_format: { type: 'json_object' },
        });

        const extractedData = JSON.parse(analysis.choices[0].message.content);

        if (!extractedData.headline || !extractedData.business_summary) {
             return { success: false, error: "AI Analyst could not reliably extract a headline and summary." };
        }

        return { success: true, data: extractedData };

    } catch (error) {
        console.error("AI Extraction Error:", error);
        if (error.code === 'context_length_exceeded') {
             return { success: false, error: "The article is too long for the AI to process." };
        }
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}