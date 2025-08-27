import { NextResponse } from 'next/server';
import { nationality } from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { z } from 'zod';
import {dbPostgres} from '@/db/index';

const nationalitySchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1),
    sequence: z.number().optional(),
    code: z.number().optional(),
});

export async function GET() {
    try {
        const allNationalities = await dbPostgres.select().from(nationality);
        return NextResponse.json({ success: true, data: allNationalities });
    } catch (error: any) {
        console.error('Error fetching nationalities:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch nationalities', error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = nationalitySchema.parse(body);
        console.log(validatedData);

        const [existingNationality] = await dbPostgres
            .select()
            .from(nationality)
            .where(
                ilike(nationality.name, validatedData.name.trim())
            );

        if (existingNationality) {
            return NextResponse.json({ success: true, data: existingNationality });
        }

        const [newNationality] = await dbPostgres
            .insert(nationality)
            .values({
                name: validatedData.name.trim(),
                sequence: validatedData.sequence || null,
                code: validatedData.code || null
            })
            .returning();

        return NextResponse.json({ success: true, data: newNationality });
    } catch (error: any) {
        console.error('Error creating nationality:', error);
        return NextResponse.json({ success: false, message: 'Failed to create nationality', error: error.message }, { status: 400 });
    }
}

export async function PUT(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        const body = await req.json();
        const validatedData = nationalitySchema.parse(body);

        const [updatedNationality] = await dbPostgres
            .update(nationality)
            .set({
                name: validatedData.name,
                sequence: validatedData.sequence || null,
                code: validatedData.code || null,
                updatedAt: new Date().toISOString()
            })
            .where(eq(nationality.id, parseInt(id)))
            .returning();

        if (!updatedNationality) {
            return NextResponse.json({ success: false, message: 'Nationality not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedNationality });
    } catch (error: any) {
        console.error('Error updating nationality:', error);
        return NextResponse.json({ success: false, message: 'Failed to update nationality', error: error.message }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        const [deletedNationality] = await dbPostgres
            .delete(nationality)
            .where(eq(nationality.id, parseInt(id)))
            .returning();

        if (!deletedNationality) {
            return NextResponse.json({ success: false, message: 'Nationality not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: deletedNationality });
    } catch (error: any) {
        console.error('Error deleting nationality:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete nationality', error: error.message }, { status: 500 });
    }
} 