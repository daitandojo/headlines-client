"use server";

import { pipeline } from '@xenova/transformers';

// Singleton pattern to ensure we only load the model once per server instance.
class EmbeddingPipeline {
    static task = 'feature-extraction';
    static model = 'Xenova/all-MiniLM-L6-v2';
    static instance = null;

    static async getInstance() {
        if (this.instance === null) {
            // NOTE: This dynamic import is a best practice for server-only libraries.
            // It can sometimes help the Next.js bundler understand the context.
            const { pipeline } = await import('@xenova/transformers');
            this.instance = await pipeline(this.task, this.model);
        }
        return this.instance;
    }
}

/**
 * Generates an embedding for a given text.
 * @param {string} text The text to embed.
 * @returns {Promise<Array<number>>} A promise that resolves to the embedding vector.
 */
export async function generateEmbedding(text) {
    const extractor = await EmbeddingPipeline.getInstance();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}