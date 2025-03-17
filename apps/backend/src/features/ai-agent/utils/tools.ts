import { db } from "@/db/index.js";
import { sql } from "drizzle-orm";
import ollama from "ollama";

// Global cache for schema and prompt
let schemaCache: Record<string, any> = {}; // Initialize as empty object
let promptCache: string | null = null; // Initialize as null (will be populated later)

// Get schema metadata (cached)
export const getSchemaMetadata = async () => {
    // Return cached schema if already populated
    if (Object.keys(schemaCache).length > 0) return schemaCache;

    // Fetch table columns with type information
    const tables = await db.execute<{
        table_name: string;
        column_name: string;
        data_type: string;
        udt_name: string;
        is_nullable: string;
        column_default: string;
        character_maximum_length: number | null;
        numeric_precision: number | null;
        numeric_scale: number | null;
    }>(sql`
    SELECT 
        table_name,
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale
    FROM information_schema.columns 
    WHERE table_schema = 'public'
  `);

    // Fetch foreign key relationships
    const foreignKeys = await db.execute<{
        table_name: string;
        column_name: string;
        foreign_table_name: string;
        foreign_column_name: string;
    }>(sql`
    SELECT 
        tc.table_name AS table_name,
        kcu.column_name AS column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
    FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
  `);

    // Fetch table and column descriptions
    const comments = await db.execute<{
        table_name: string;
        column_name: string | null;
        description: string;
    }>(sql`
    SELECT
        c.relname as table_name,
        a.attname as column_name,
        d.description
    FROM pg_class c
    JOIN pg_attribute a ON c.oid = a.attrelid
    LEFT JOIN pg_description d ON d.objoid = a.attrelid AND d.objsubid = a.attnum
    WHERE c.relkind = 'r'
    AND c.relname NOT LIKE 'pg_%'
  `);

    // Process tables and columns
    tables.rows.forEach(row => {
        if (!schemaCache[row.table_name]) {
            schemaCache[row.table_name] = {
                columns: {},
                relations: {},
                description: comments.rows.find(c =>
                    c.table_name === row.table_name &&
                    c.column_name === null
                )?.description
            };
        }

        schemaCache[row.table_name].columns[row.column_name] = {
            type: row.udt_name,
            nullable: row.is_nullable === 'YES',
            default: row.column_default,
            maxLength: row.character_maximum_length || undefined,
            precision: row.numeric_precision || undefined,
            scale: row.numeric_scale || undefined,
            description: comments.rows.find(c =>
                c.table_name === row.table_name &&
                c.column_name === row.column_name
            )?.description
        };
    });

    // Add relationships to schema
    foreignKeys.rows.forEach(fk => {
        const tableName = fk.table_name;
        const foreignTableName = fk.foreign_table_name;

        if (!schemaCache[tableName]) return;

        if (!schemaCache[tableName].relations[foreignTableName]) {
            schemaCache[tableName].relations[foreignTableName] = [];
        }

        schemaCache[tableName].relations[foreignTableName].push(fk.column_name);
    });

    return schemaCache;
};

// Generate schema prompt (cached)
export const createSchemaPrompt = async () => {
    // Return cached prompt if already generated
    if (promptCache) return promptCache;

    const schema = await getSchemaMetadata();

    // Convert schema to natural language description
    const schemaDescription = Object.entries(schema).map(([table, details]) => {
        const columns = Object.entries(details.columns)
            .map(([col, meta]) => {
                // Add type assertion for column metadata
                const columnMeta = meta as {
                    type: string;
                    nullable: boolean;
                    default: string | null;
                    maxLength?: number;
                    precision?: number;
                    scale?: number;
                    description?: string;
                };
                return `${col} (${columnMeta.type}${columnMeta.nullable ? ', nullable' : ''})`;
            })
            .join(", ");

        const relations = Object.entries(details.relations)
            .map(([relatedTable, fks]) => `${table}.${(fks as string[]).join(", ")} → ${relatedTable}`)
            .join("\n  ");

        return `## ${table}
- **Columns**: ${columns}
- **Relationships**: ${relations || 'None'}
- **Description**: ${details.description || 'No description available'}`;
    }).join("\n\n");

    // Create explicit prompt template
    promptCache = `Database Schema:
${schemaDescription}
Return ONLY valid SQL code
Generate SQL queries following these rules:
1. Use exact table/column names from schema
2. Prefer INNER JOIN for relationships
3. Use ILIKE for text comparisons
4. Include required WHERE clauses
5. Format consistently

Examples:
1. Find student by name:
   SELECT s.id 
   FROM students s
   JOIN users u ON s.user_id_fk = u.id
   WHERE u.name ILIKE '%search_term%'

2. Count active students:
   SELECT COUNT(*) 
   FROM students 
   WHERE active = true

3. Get student transport details:
   SELECT t.vehicle_number 
   FROM transport_details td
   JOIN transport t ON td.transport_id_fk = t.id
   WHERE td.student_id_fk = $1

Current Query Request:`;

    return promptCache;
};