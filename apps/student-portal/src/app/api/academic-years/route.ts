import { NextResponse } from 'next/server';
import { createAcademicYear, getAllAcademicYears, getAcademicYearById, updateAcademicYear, deleteAcademicYear } from '@/lib/services/academic-year.service';
import { createAcademicYearSchema } from '@/db/schema';
import { z } from 'zod';

export async function GET() {
  try {
    const allAcademicYears = await getAllAcademicYears();
    return NextResponse.json({ success: true, data: allAcademicYears });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch academic years', error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = createAcademicYearSchema.parse(body);
    const newAcademicYear = await createAcademicYear(validatedData);
    return NextResponse.json({ success: true, data: newAcademicYear });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to create academic year', error: error.message }, { status: 400 });
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
    const validatedData = createAcademicYearSchema.parse(body);
    const updatedAcademicYear = await updateAcademicYear(Number(id), validatedData);
    if (!updatedAcademicYear) {
      return NextResponse.json({ success: false, message: 'Academic year not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updatedAcademicYear });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to update academic year', error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }
    const deleted = await deleteAcademicYear(Number(id));
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Academic year not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to delete academic year', error: error.message }, { status: 500 });
  }
}
