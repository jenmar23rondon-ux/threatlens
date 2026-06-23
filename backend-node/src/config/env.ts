import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "change_me_threatlens_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "http://localhost:5175")
    .split(",")
    .map((origin) => origin.trim()),
  analyzerUrl: process.env.ANALYZER_URL || "http://localhost:8002"
};

export const isAllowedOrigin = (origin?: string) => {
  if (!origin) return true;
  return env.allowedOrigins.includes(origin) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
};
