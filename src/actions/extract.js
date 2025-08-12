"use server";

import OpenAI from 'openai';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { COMMON_COUNTRIES } from '@/lib/countries';

// Initialize GROQ Client
if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ API Key is missing from environment variables');
}
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

const EXTRACTION_MODEL = 'llama3-8b-8192';

const CONTENT_EXTRACTION_PROMPT = `You are an expert web page analyst. Your task is to extract the core article content from the provided HTML text. Ignore all irrelevant content such as navigation, headers, footers, ads, and related articles. Focus exclusively on the main journalistic content.
Respond ONLY with a valid JSON object with the following structure:
{
  "headline": "The main headline of the article.",
  "content": "The full text of the article body, cleaned and combined into a single string with proper paragraph spacing."
}`;

const METADATA_EXTRACTION_PROMPT = `You are a metadata analyst. Based on the provided URL, article headline, and content, your task is to deduce the publication's name and the primary country this news is relevant to. The country should be from the provided list.
Respond ONLY with a valid JSON object:
{
  "publication": "The name of the newspaper or website.",
  "country": "The country this news is about. Choose one from the list: [${COMMON_COUNTRIES.join(', ')}]."
}`;

/**
 * Scrapes a URL, pre-processes it, and uses a multi-step AI chain to extract and analyze content.
 * @param {string} url The URL to scrape.
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function scrapeAndExtractWithAI(url) {
    if (!url) {
        return { success: false, error: "URL is required." };
    }

    try {
        // Step 1: Fetch and pre-process HTML with Readability
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36' } });
        if (!response.ok) return { success: false, error: `Failed to fetch URL. Status: ${response.status}` };
        
        const html = await response.text();
        const doc = new JSDOM(html, { url });
        const reader = new Readability(doc.window.document);
        const article = reader.parse();

        if (!article || !article.textContent) return { success: false, error: "Readability could not extract main content." };
        
        const articleText = article.textContent.trim();

        // Step 2: Use AI to extract the core content
        const contentExtraction = await groq.chat.completions.create({
            model: EXTRACTION_MODEL,
            messages: [
                { role: 'system', content: CONTENT_EXTRACTION_PROMPT },
                { role: 'user', content: `Article Text:\n\n${articleText}` }
            ],
            response_format: { type: 'json_object' },
        });
        const contentData = JSON.parse(contentExtraction.choices[0].message.content);
        contentData.headline = contentData.headline || article.title; // Fallback to Readability's title

        if (!contentData.headline || !contentData.content) {
             return { success: false, error: "AI could not reliably extract headline and content." };
        }

        // Step 3: Use AI to deduce metadata (publication and country)
        const metadataExtraction = await groq.chat.completions.create({
            model: EXTRACTION_MODEL,
            messages: [
                { role: 'system', content: METADATA_EXTRACTION_PROMPT },
                { role: 'user', content: `URL: ${url}\n\nHeadline: ${contentData.headline}\n\nContent Snippet: ${contentData.content.substring(0, 500)}...` }
            ],
            response_format: { type: 'json_object' },
        });
        const metadata = JSON.parse(metadataExtraction.choices[0].message.content);
        
        // Final assembly of data
        const finalData = {
            headline: contentData.headline,
            content: contentData.content,
            publication: metadata.publication || new URL(url).hostname.replace(/^www\./, ''), // Fallback for publication
            country: metadata.country || '',
        };

        return { success: true, data: finalData };

    } catch (error) {
        console.error("AI Extraction Error:", error);
        if (error.code === 'context_length_exceeded') {
             return { success: false, error: "The article is too long for the AI to process." };
        }
        return { success: false, error: `An unexpected error occurred: ${error.message}` };
    }
}