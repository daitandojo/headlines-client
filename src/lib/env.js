import { z } from "zod";

const envSchema = z.object({
  MONGO_URI: z.string().url(),
  // Add other environment variables here as your app grows
  // e.g., NEXT_PUBLIC_API_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);

    