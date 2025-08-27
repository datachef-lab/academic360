import { NextResponse } from "next/server";
import { createAdmission, createAdmissionWithCourses, findAllAdmissionSummary, admissionStats, updateAdmission } from "@/lib/services/admission.service";
import { createAdmissionSchema } from "@/db/schema";
import { ZodError } from "zod";
import { dbPostgres } from '@/db';
import { admissions, admissionCourses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const size = parseInt(searchParams.get("size") || "10");

        const [admissions, stats] = await Promise.all([
            findAllAdmissionSummary(page, size),
            admissionStats()
        ]);

        return NextResponse.json({
            admissions,
            stats,
            page,
            size
        });
    } catch (error) {
        console.error("Error fetching admissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch admissions" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { courseIds, startDate, endDate, ...admissionData } = body;
        // Accept both endDate and lastDate for flexibility
        const lastDate = endDate || body.lastDate;
        const validatedData = createAdmissionSchema.parse({ ...admissionData, startDate, lastDate });
        let result;
        if (courseIds && Array.isArray(courseIds) && courseIds.length > 0) {
            // Create admission with course mappings
            result = await createAdmissionWithCourses(validatedData, courseIds);
        } else {
            // Create admission without course mappings
            result = await createAdmission(validatedData);
        }

        if (!result) {
            return NextResponse.json(
                { error: "Admission for this year already exists" },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error creating admission:", error);
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid admission data", details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create admission" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, year, startDate, endDate, isClosed, courses } = body;
        if (!id) {
            return NextResponse.json(
                { error: "Admission ID is required for update" },
                { status: 400 }
            );
        }
        const lastDate = endDate || body.lastDate;
        const updateData: any = {};
        if (year) updateData.year = year;
        if (startDate) updateData.startDate = startDate;
        if (lastDate) updateData.lastDate = lastDate;
        if (typeof isClosed === 'boolean') updateData.isClosed = isClosed;

        // Transaction: update admission and sync course map
        await dbPostgres.transaction(async (tx) => {
            // Update admission
            await tx.update(admissions)
                .set(updateData)
                .where(eq(admissions.id, id));

            if (Array.isArray(courses)) {
                for (const c of courses) {
                    const [existing] = await tx
                        .select()
                        .from(admissionCourses)
                        .where(and(eq(admissionCourses.admissionId, id), eq(admissionCourses.courseId, c.courseId)));
                    const courseIsClosed = isClosed ? true : !!c.isClosed;
                    if (existing) {
                        await tx.update(admissionCourses)
                            .set({ disabled: c.disabled, isClosed: courseIsClosed })
                            .where(eq(admissionCourses.id, existing.id));
                    } else {
                        await tx.insert(admissionCourses)
                            .values({
                                admissionId: id,
                                courseId: c.courseId,
                                disabled: c.disabled,
                                isClosed: courseIsClosed,
                            });
                    }
                }
            }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating admission:", error);
        return NextResponse.json(
            { error: "Failed to update admission" },
            { status: 500 }
        );
    }
}
