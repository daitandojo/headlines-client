"use server";

import wiki from 'wikijs';

const WIKI_SUMMARY_LENGTH = 750; // Max characters for a summary

/**
 * Fetches a concise summary of a Wikipedia page.
 * @param {string} query - The search term (e.g., a person or company name).
 * @returns {Promise<{success: boolean, summary?: string, error?: string}>}
 */
export async function fetchWikipediaSummary(query) {
    if (!query) {
        return { success: false, error: "Query cannot be empty." };
    }
    try {
        const page = await wiki().page(query);
        const summary = await page.summary();
        
        // Return the first paragraph or a truncated version for brevity
        const firstParagraph = summary.split('\n')[0];
        const conciseSummary = firstParagraph.length > WIKI_SUMMARY_LENGTH 
            ? firstParagraph.substring(0, WIKI_SUMMARY_LENGTH) + '...'
            : firstParagraph;

        return { success: true, summary: conciseSummary };
    } catch (error) {
        // This often happens if a page is not found, which is not a critical error.
        console.log(`Wikipedia lookup for "${query}" failed: ${error.message}`);
        return { success: false, error: `Page not found or API error for "${query}".` };
    }
}