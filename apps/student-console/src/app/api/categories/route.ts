import { NextResponse } from 'next/server';
import {dbPostgres} from '@/db';
import { categories } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const categorySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1),
  documentRequired: z.boolean().optional(),
  code: z.string().min(1),
});

export async function GET() {
  try {
    const allCategories = await dbPostgres.select().from(categories);
    return NextResponse.json({ success: true, data: allCategories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch categories', error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = categorySchema.parse(body);

    const [newCategory] = await dbPostgres
      .insert(categories)
      .values({ name: validatedData.name, documentRequired: validatedData.documentRequired, code: validatedData.code })
      .returning();

    return NextResponse.json({ success: true, data: newCategory });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ success: false, message: 'Failed to create category', error: error.message }, { status: 400 });
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
    const validatedData = categorySchema.parse(body);

    const [updatedCategory] = await dbPostgres
      .update(categories)
      .set({ name: validatedData.name, documentRequired: validatedData.documentRequired, code: validatedData.code })
      .where(eq(categories.id, parseInt(id)))
      .returning();

    if (!updatedCategory) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedCategory });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ success: false, message: 'Failed to update category', error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const [deletedCategory] = await dbPostgres
      .delete(categories)
      .where(eq(categories.id, parseInt(id)))
      .returning();

    if (!deletedCategory) {
      return NextResponse.json({ success: false, message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deletedCategory });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete category', error: error.message }, { status: 500 });
  }
} 