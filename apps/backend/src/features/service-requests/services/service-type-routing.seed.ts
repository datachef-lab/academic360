import { db } from "@/db/index.js";
import { eq, ilike } from "drizzle-orm";
import { departmentModel, serviceTypeRoutingModel } from "@repo/db/schemas";
import { createLogger } from "@/config/logger.js";

const log = createLogger("service-type-routing-seed");

interface ServiceTypeRoutingSeedRow {
    code: string;
    name: string;
    departmentSearchName: string;
    slaDays: number;
    requiresPhysicalPresenceDefault: boolean;
    requiresIdProof: boolean;
}

const SERVICE_TYPE_ROUTING_SEED: ServiceTypeRoutingSeedRow[] = [
    {
        code: "BONAFIDE",
        name: "Bonafide Certificate",
        departmentSearchName: "Registrar",
        slaDays: 2,
        requiresPhysicalPresenceDefault: false,
        requiresIdProof: false,
    },
    {
        code: "CHARACTER",
        name: "Character Certificate",
        departmentSearchName: "Registrar",
        slaDays: 2,
        requiresPhysicalPresenceDefault: false,
        requiresIdProof: false,
    },
    {
        code: "TRANSCRIPT",
        name: "Transcript",
        departmentSearchName: "CoE",
        slaDays: 5,
        requiresPhysicalPresenceDefault: true,
        requiresIdProof: true,
    },
    {
        code: "MIGRATION",
        name: "Migration Certificate",
        departmentSearchName: "CoE",
        slaDays: 5,
        requiresPhysicalPresenceDefault: true,
        requiresIdProof: true,
    },
    {
        code: "ORIGINAL_DEGREE",
        name: "Original Degree Certificate",
        departmentSearchName: "CoE",
        slaDays: 5,
        requiresPhysicalPresenceDefault: true,
        requiresIdProof: true,
    },
    {
        code: "CAUTION_MONEY_REFUND",
        name: "Caution Money Refund",
        departmentSearchName: "Accounts",
        slaDays: 3,
        requiresPhysicalPresenceDefault: false,
        requiresIdProof: true,
    },
    {
        code: "NO_DUES",
        name: "No Dues Certificate",
        departmentSearchName: "Accounts",
        slaDays: 3,
        requiresPhysicalPresenceDefault: false,
        requiresIdProof: false,
    },
    {
        code: "SYLLABUS",
        name: "Syllabus Copy",
        departmentSearchName: "HOD",
        slaDays: 4,
        requiresPhysicalPresenceDefault: false,
        requiresIdProof: false,
    },
    {
        code: "RECOMMENDATION",
        name: "Recommendation Letter",
        departmentSearchName: "HOD",
        slaDays: 4,
        requiresPhysicalPresenceDefault: false,
        requiresIdProof: false,
    },
];

export async function seedServiceTypeRouting(): Promise<void> {
    for (const row of SERVICE_TYPE_ROUTING_SEED) {
        const [existing] = await db
            .select()
            .from(serviceTypeRoutingModel)
            .where(eq(serviceTypeRoutingModel.code, row.code));
        if (existing) continue;

        // Look up department by name (case-insensitive); null if not yet created.
        // Select only `id` to avoid coupling to other department columns (some
        // may lag the model in older databases). Best-effort: never block the seed.
        let dept: { id: number } | undefined;
        try {
            [dept] = await db
                .select({ id: departmentModel.id })
                .from(departmentModel)
                .where(ilike(departmentModel.name, `%${row.departmentSearchName}%`));
        } catch {
            dept = undefined;
        }

        const { departmentSearchName: _, ...rest } = row;
        await db.insert(serviceTypeRoutingModel).values({
            ...rest,
            departmentId: dept?.id ?? null,
        });
    }
    log.info("Service type routing seed complete.");
}
