import ollama from "ollama";
import { getSchemaMetadata, createSchemaPrompt } from "../utils/tools.js";

export const generateQuery = async (userQuestion: string) => {
    try {
        // Load schema and generate prompt (cached)
        const schema = await getSchemaMetadata();
        const prompt = await createSchemaPrompt();

        console.log("Schema:", schema);
        console.log("Prompt:", prompt);
        console.log("Generating SQL query...");

        // Get model response
        const response = await ollama.chat({
            model: "llama3.2",
            messages: [
                {
                    role: "system",
                    content: `STRICT RULES:
${prompt}
1. NEVER use information_schema or system tables
2. Return 'SELECT 0 AS table_count' for table count requests
3. Respond ONLY with SQL code`
                },
                {
                    role: "user",
                    content: `Generate SQL for: ${userQuestion}`
                }
            ],
            options: {
                temperature: 0.1 // Reduce creativity for precise results
            }
        });

        // Clean and validate response
        let cleanSQL = response.message.content
            .replace(/```sql/g, '')
            .replace(/```/g, '')
            .split(';')[0]?.trim() + ';';

        // Ensure valid termination
        if (!cleanSQL.endsWith(';')) {
            cleanSQL += ';';
        }

        return cleanSQL;
    } catch (error) {
        console.error("Query generation failed:", error);
        throw new Error("Failed to generate SQL query");
    }
};
