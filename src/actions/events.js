"use server";

import dbConnect from "@/lib/mongodb";
import SynthesizedEvent from "@/models/SynthesizedEvent";
import { revalidatePath } from "next/cache";

export async function deleteEvent(eventId) {
  if (!eventId) {
    return { success: false, message: "Event ID is required." };
  }

  try {
    await dbConnect();
    const result = await SynthesizedEvent.findByIdAndDelete(eventId);

    if (!result) {
      return { success: false, message: "Synthesized event not found." };
    }

    // Invalidate the cache for the home page, forcing a data refetch on next visit.
    revalidatePath("/");
    return { success: true, message: "Synthesized event deleted successfully." };

  } catch (error) {
    console.error("Delete Event Error:", error);
    return { success: false, message: "Failed to delete synthesized event." };
  }
}