// src/lib/env.mjs (version 2.0)
import { z } from 'zod'

/**
 * Defines the schema for all required server-side environment variables.
 * This schema is used to parse `process.env` and ensures that all necessary
 * variables are present and correctly formatted at application startup.
 */
const envSchema = z.object({
  // Core Infrastructure
  MONGO_URI: z.string().url({ message: 'MONGO_URI must be a valid URL.' }),

  // Authentication
  LOGIN_PASSWORD: z.string().min(1, { message: 'LOGIN_PASSWORD is required.' }),
  COOKIE_SECRET: z
    .string()
    .min(10, { message: 'COOKIE_SECRET must be at least 10 characters long.' }),

  // Third-Party Services
  GROQ_API_KEY: z.string().min(1, { message: 'GROQ_API_KEY is required.' }),
  SERPAPI_API_KEY: z.string().min(1, { message: 'SERPAPI_API_KEY is required.' }),
  PINECONE_API_KEY: z.string().min(1, { message: 'PINECONE_API_KEY is required.' }),
  PINECONE_INDEX_NAME: z.string().min(1, { message: 'PINECONE_INDEX_NAME is required.' }),

  // Pusher (Real-time) - These are public, so they need the NEXT_PUBLIC_ prefix
  NEXT_PUBLIC_PUSHER_KEY: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_PUSHER_KEY is required.' }),
  NEXT_PUBLIC_PUSHER_CLUSTER: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_PUSHER_CLUSTER is required.' }),

  // Push Notifications (PWA)
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z
    .string()
    .min(1, { message: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY is required.' }),
  VAPID_PRIVATE_KEY: z.string().min(1, { message: 'VAPID_PRIVATE_KEY is required.' }),
  VAPID_SUBJECT: z.preprocess(
    (val) => (typeof val === 'string' ? val.replace(/^mailto:/, '') : val),
    z.string().email({
      message: 'VAPID_SUBJECT must be a valid email address (e.g., contact@example.com).',
    })
  ),
})

/**
 * A pre-validated and typed environment object.
 *
 * This object is created by parsing `process.env` with our Zod schema.
 * If any environment variables are missing or invalid, the build process
 * will fail with a clear and helpful error message.
 *
 * All server-side code should import this `env` object instead of accessing
 * `process.env` directly.
 */
let env

try {
  env = envSchema.parse(process.env)
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(
      '\n\n\x1b[31mCRITICAL ERROR: Invalid or missing environment variables:\x1b[0m\n'
    )
    error.errors.forEach((e) => {
      console.error(`  - \x1b[33m${e.path.join('.')}:\x1b[0m \x1b[31m${e.message}\x1b[0m`)
    })
    console.error(
      '\n\x1b[32mACTION REQUIRED: Please check your .env.local file and ensure all required variables are set correctly.\x1b[0m\n'
    )
    // Exit the process with an error code to halt the build/start.
    process.exit(1)
  }
  // Re-throw other unexpected errors
  throw error
}

export { env }
