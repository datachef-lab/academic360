import { NextRequest, NextResponse } from "next/server";
import { uploadDegreesFromFile } from "@/lib/services/degree.service";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const result = await uploadDegreesFromFile(formData);
    
    if (result.success) {
      revalidatePath("/settings/masters/degrees");
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error uploading degrees:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload degrees" },
      { status: 500 }
    );
  }
} 