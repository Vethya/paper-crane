import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_LATEX_API_URL: z.string().url(),
});

const parsed = clientEnvSchema.safeParse({
  NEXT_PUBLIC_LATEX_API_URL: process.env.NEXT_PUBLIC_LATEX_API_URL,
});

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const clientEnv = parsed.data;
