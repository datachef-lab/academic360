import "dotenv/config";
import app from "@/app.js";
import { connectToDatabase, connectToMySQL } from "@/db/index.js";
import { extractServices } from "./features/ai-agent/utils/tools";
// import { tools } from "./features/ai-agent/utils/tools";

const PORT = process.env.PORT || 8080;

(async () => {
    console.log("\nInitializing academic360...\n");
    try {
        await connectToDatabase();
        await connectToMySQL();
        app.listen(PORT, () => {
            console.log(
                `[backend] - academic360 is running on http://localhost:${PORT} 🚀\n`,
            );
            console.log(`PROFILE: ${process.env.NODE_ENV!}\n`);
            console.log("Press Ctrl+C to stop the application.\n");
            // console.log(tools)
            // extractServices()
        });
    } catch (error) {
        console.error("[backend] - Failed to start the application: ⚠️\n", error);
    }
})();
