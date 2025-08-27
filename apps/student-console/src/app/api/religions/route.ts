import { NextResponse } from 'next/server';
import { dbPostgres } from '@/db';
import { religion } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const religionSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1),
    sequence: z.number().optional(),
});

export async function GET() {
    try {
        const allReligions = await dbPostgres.select().from(religion);
        return NextResponse.json({ success: true, data: allReligions });
    } catch (error: any) {
        console.error('Error fetching religions:', error);
        return NextResponse.json({ success: false, message: 'Failed to fetch religions', error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validatedData = religionSchema.parse(body);

        const [newReligion] = await dbPostgres
            .insert(religion)
            .values({ name: validatedData.name, sequence: validatedData.sequence })
            .returning();

        return NextResponse.json({ success: true, data: newReligion });
    } catch (error: any) {
        console.error('Error creating religion:', error);
        return NextResponse.json({ success: false, message: 'Failed to create religion', error: error.message }, { status: 400 });
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
        const validatedData = religionSchema.parse(body);

        const [updatedReligion] = await dbPostgres
            .update(religion)
            .set({ name: validatedData.name, sequence: validatedData.sequence, })
            .where(eq(religion.id, parseInt(id)))
            .returning();

        if (!updatedReligion) {
            return NextResponse.json({ success: false, message: 'Religion not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updatedReligion });
    } catch (error: any) {
        console.error('Error updating religion:', error);
        return NextResponse.json({ success: false, message: 'Failed to update religion', error: error.message }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    try {
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
        }

        const [deletedReligion] = await dbPostgres
            .delete(religion)
            .where(eq(religion.id, parseInt(id)))
            .returning();

        if (!deletedReligion) {
            return NextResponse.json({ success: false, message: 'Religion not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: deletedReligion });
    } catch (error: any) {
        console.error('Error deleting religion:', error);
        return NextResponse.json({ success: false, message: 'Failed to delete religion', error: error.message }, { status: 500 });
    }
} 