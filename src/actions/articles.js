"use server";

import dbConnect from "@/lib/mongodb";
import Article from "@/models/Article";
import { revalidatePath } from "next/cache";

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

    // Invalidate the cache for the home page, forcing a data refetch on next visit.
    revalidatePath("/");
    return { success: true, message: "Article deleted successfully." };

  } catch (error) {
    console.error("Delete Article Error:", error);
    return { success: false, message: "Failed to delete article." };
  }
}