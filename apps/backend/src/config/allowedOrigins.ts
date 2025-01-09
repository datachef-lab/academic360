import "dotenv/config";
export const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.CORS_ORIGIN!,
];
