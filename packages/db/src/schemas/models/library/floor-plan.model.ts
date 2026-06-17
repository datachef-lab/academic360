import { integer, jsonb, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { branchModel } from "./branch.model";

export const floorPlanModel = pgTable("library_floor_plans", {
    id: serial().primaryKey(),
    branchId: integer("branch_id_fk")
        .notNull()
        .references(() => branchModel.id),
    name: varchar({ length: 255 }).notNull(),
    /**
     * JSON document describing the layout. Shape:
     *   { width: number; height: number;
     *     racks: Array<{ id: string; rackId: number|null; x: number; y: number; w: number; h: number; label?: string }>
     *   }
     */
    layout: jsonb().notNull().$type<FloorPlanLayout>(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export type FloorPlanLayout = {
    width: number;
    height: number;
    racks: Array<{
        id: string;
        rackId: number | null;
        x: number;
        y: number;
        w: number;
        h: number;
        label?: string;
    }>;
};

export const createFloorPlanSchema = createInsertSchema(floorPlanModel);
export type FloorPlan = z.infer<typeof createFloorPlanSchema>;
