import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  DATABASE_URL: z.string().default("file:./dev.db"),
});

export const env = envSchema.parse(process.env);
