import "dotenv/config";
export const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://13.235.168.107:3003",
  "http://localhost:3003",
  process.env.CORS_ORIGIN!,
  "*"
];
