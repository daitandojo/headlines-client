// src/actions/chat.js (version 1.0)
"use server";

import OpenAI from 'openai';

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ API Key is missing');
}
const groq = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' });

const TITLE_GENERATOR_MODEL = 'llama3-8b-8192';

const TITLE_GENERATOR_PROMPT = `You are a title generation AI. Your task is to read a conversation and create a concise, 5-word-or-less title that accurately summarizes the main topic.
- Be direct and factual.
- Do not use quotes or introductory phrases.
- The title should be in the same language as the conversation.

Example Conversation:
"user: Who is Anders Holch Povlsen?
assistant: Anders Holch Povlsen is a Danish billionaire, the CEO and sole owner of the international fashion retailer Bestseller."

Example Title:
"Anders Holch Povlsen's Bestseller"`;

/**
 * Generates a concise title for a chat conversation.
 * @param {Array<{role: string, content: string}>} messages - The chat messages.
 * @returns {Promise<{success: boolean, title?: string, error?: string}>}
 */
export async function generateChatTitle(messages) {
    if (!messages || messages.length < 2) {
        return { success: false, error: 'Not enough messages to generate a title.' };
    }

    try {
        const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n');

        const response = await groq.chat.completions.create({
            model: TITLE_GENERATOR_MODEL,
            messages: [
                { role: 'system', content: TITLE_GENERATOR_PROMPT },
                { role: 'user', content: conversationText }
            ],
            temperature: 0.1,
        });

        const title = response.choices[0].message.content.trim().replace(/"/g, '');
        return { success: true, title };

    } catch (error) {
        console.error("Chat Title Generation Error:", error);
        return { success: false, error: "Failed to generate title." };
    }
}