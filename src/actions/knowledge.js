"use server";

import { revalidatePath } from "next/cache";
import { Pinecone } from '@pinecone-database/pinecone';
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import { generateEmbedding } from "@/lib/embeddings";

// Initialize Pinecone Client
if (!process.env.PINECONE_API_KEY) {
    throw new Error('Pinecone API Key must be defined in .env file');
}
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pc.index(process.env.PINECONE_INDEX_NAME || 'headlines');


/**
 * Saves a new piece of knowledge (article) to MongoDB and Pinecone.
 * @param {{headline: string, business_summary: string, source: string, country: string, link: string}} data
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function addKnowledge(data) {
    const { headline, business_summary, source, country, link } = data;

    if (!headline || !business_summary || !source || !country || !link) {
        return { success: false, message: "All fields are required." };
    }

    try {
        await dbConnect();

        // 1. Generate the embedding from the business-savvy summary
        const textToEmbed = `${headline}\n${business_summary}`;
        const embedding = await generateEmbedding(textToEmbed);

        // 2. Create the new Article document for MongoDB
        const newArticle = new Article({
            _id: new mongoose.Types.ObjectId(),
            headline,
            link,
            newspaper: source,
            source: "Manual Upload",
            country,
            relevance_headline: 100,
            assessment_headline: "Manually uploaded by user.",
            relevance_article: 100,
            assessment_article: business_summary, // Save the summary to the correct field
            embedding: embedding,
        });

        // 3. Save the structured data to MongoDB
        await newArticle.save();

        // 4. Upsert the vector and metadata to Pinecone
        await pineconeIndex.upsert([{
            id: newArticle._id.toString(),
            values: embedding,
            metadata: {
                headline: newArticle.headline,
                summary: newArticle.assessment_article,
                newspaper: newArticle.newspaper,
                country: newArticle.country
            }
        }]);

        // 5. Revalidate paths to update the UI
        revalidatePath("/articles");
        revalidatePath("/events");

        return { success: true, message: "Knowledge successfully added and embedded." };

    } catch (error) {
        console.error("Add Knowledge Error:", error);
        return { success: false, message: "Failed to add knowledge." };
    }
}