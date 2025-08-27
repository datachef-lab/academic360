import { NextResponse } from 'next/server';
import { dbPostgres } from '@/db';
import { boardUniversities } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createBoardUniversity, updateBoardUniversity, toggleBoardUniversityStatus, getAllBoardUniversities, getBoardUniversityById } from "@/lib/services/board-university.service";
import { BoardUniversityDto } from '@/types/admissions';
import { createSubject } from '@/lib/services/academic-subject.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const disabled = searchParams.get("disabled");

    if (id) {
      const university = await getBoardUniversityById(+id) 

      if (!university) {
        return NextResponse.json({ error: "Board/University not found" }, { status: 404 });
      }

      return NextResponse.json(university);
    }

    const universities = await getAllBoardUniversities(disabled === null ? undefined : disabled === "true");
    return NextResponse.json(universities);
  } catch (error) {
    console.error("Error fetching board universities:", error);
    return NextResponse.json({ error: "Failed to fetch board universities" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body: BoardUniversityDto = await request.json();
    const { subjects, ...base } = body as BoardUniversityDto;
    console.log("in board-university post route: ", body);
    const result = await createBoardUniversity(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating board university:", error);
    return NextResponse.json({ error: "Failed to create board university" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const updatedUniversity = await updateBoardUniversity(parseInt(id), body);

    // Handle subject updates here if needed, or in a separate endpoint

    if (!updatedUniversity) {
      return NextResponse.json({ error: "Board/University not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUniversity);
  } catch (error) {
    console.error("Error updating board university:", error);
    return NextResponse.json({ error: "Failed to update board university" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const result = await toggleBoardUniversityStatus(parseInt(id));

    if (!result) {
      return NextResponse.json({ error: "Board/University not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling board university status:", error);
    return NextResponse.json({ error: "Failed to toggle board university status" }, { status: 500 });
  }
} 