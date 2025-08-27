import { NextResponse } from 'next/server';
import { createDepartment, getAllDepartments, getDepartmentById, updateDepartment, deleteDepartment } from '@/lib/services/department.service';
import { createDepartmentSchema } from '@/db/schema';
import { z } from 'zod';

export async function GET() {
  try {
    const allDepartments = await getAllDepartments();
    return NextResponse.json({ success: true, data: allDepartments });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to fetch departments', error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = createDepartmentSchema.parse(body);
    const newDepartment = await createDepartment(validatedData);
    return NextResponse.json({ success: true, data: newDepartment });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to create department', error: error.message }, { status: 400 });
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
    const validatedData = createDepartmentSchema.parse(body);
    const updatedDepartment = await updateDepartment(Number(id), validatedData);
    if (!updatedDepartment) {
      return NextResponse.json({ success: false, message: 'Department not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updatedDepartment });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to update department', error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }
    const deleted = await deleteDepartment(Number(id));
    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Department not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: 'Failed to delete department', error: error.message }, { status: 500 });
  }
}