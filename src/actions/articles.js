// src/actions/articles.js (version 1.1)
"use server";

import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import { revalidatePath } from "next/cache";
import { ARTICLES_PER_PAGE } from "@/config/constants";

export async function deleteArticle(articleId) {
  if (!articleId) {
    return { success: false, message: "Article ID is required." };
  }

  try {
    await dbConnect();
    const result = await Article.findByIdAndDelete(articleId);

    if (!result) {
      return { success: false, message: "Article not found." };
    }

    revalidatePath("/");
    return { success: true, message: "Article deleted successfully." };

  } catch (error) {
    console.error("Delete Article Error:", error);
    return { success: false, message: "Failed to delete article." };
  }
}

export async function getArticles({ page = 1, filters = {}, sort = 'date_desc' }) {
    await dbConnect();

    const queryFilter = {
        $or: [
            { relevance_article: { $gt: 25 } },
            { relevance_headline: { $gt: 25 } }
        ]
    };

    if (filters.q) {
        const searchRegex = { $regex: filters.q, $options: 'i' };
        queryFilter.$or.push(
            { headline: searchRegex },
            { headline_en: searchRegex },
            { assessment_article: searchRegex },
            { 'key_individuals.name': searchRegex }
        );
    }
    if (filters.country) {
        queryFilter.country = filters.country;
    }

    const sortOptions = {};
    if (sort === 'date_asc') sortOptions.createdAt = 1;
    else if (sort === 'relevance_desc') sortOptions.relevance_article = -1;
    else sortOptions.createdAt = -1;

    const skipAmount = (page - 1) * ARTICLES_PER_PAGE;

    const articles = await Article.find(queryFilter)
        .sort(sortOptions)
        .skip(skipAmount)
        .limit(ARTICLES_PER_PAGE)
        .lean();
    
    return JSON.parse(JSON.stringify(articles));
}