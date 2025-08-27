
import { query } from "@/db";
import { Nationality } from "@/types/resources/nationality";
import { RowDataPacket } from "mysql2";

export async function findNationalityById(id: number | undefined) {
    if (!id) {
        return null;
    }

    console.log(`
        SELECT * 
        FROM nationality
        WHERE id = ${id}
    `);
    const [result] = await query<RowDataPacket[]>(`
        SELECT * 
        FROM nationality
        WHERE id = ${id}
    `);

    console.log(result);
    return result as unknown as Nationality || null; // Return the paginated batch data in descending order
}