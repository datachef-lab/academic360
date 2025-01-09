import "dotenv/config";
import app from "@/app.js";
import { connectToDatabase } from "@/db/index.js";

const PORT = process.env.PORT || 8080;

(async () => {
  console.log("\nInitializing academic360...\n");
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(
        `[backend] - academic360 is running on http://localhost:${PORT} 🚀\n`,
      );
    });
  } catch (error) {
    console.error("[backend] - Failed to start the application: ⚠️\n", error);
  }
})();
