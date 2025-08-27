import { dbPostgres } from "@/db";
import { applicationForms } from "@/db/schema";

import { findAdmissionById, findAdmissionByYear, getApplicationFormStats, getApplicationFormsByAdmissionId } from "@/lib/services/admission.service";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

// List of valid formStatus values from the enum
const validFormStatuses = [
  'DRAFT',
  'PAYMENT_DUE',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'WAITING_FOR_APPROVAL',
  'WAITING_FOR_PAYMENT',
  'WAITING_FOR_DOCUMENTS',
  'DOCUMENTS_VERIFIED',
  'DOCUMENTS_PENDING',
  'DOCUMENTS_REJECTED',
] as const;
type FormStatus = typeof validFormStatuses[number];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const year = parseInt((await params).year);
    if (isNaN(year)) {
      return NextResponse.json({ message: "Invalid year provided." }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const size = parseInt(searchParams.get("size") || "10");

    // Fetch admission for the year
    const admission = await findAdmissionByYear(year);
    if (!admission) {
      return NextResponse.json({ message: `Admission for year ${year} not found.` }, { status: 404 });
    }

    // Build filters for applications
    const filters: any = {};
    if (searchParams.get("category") && searchParams.get("category") !== "All" && searchParams.get("category") !== "all") filters.category = searchParams.get("category");
    if (searchParams.get("religion") && searchParams.get("religion") !== "All" && searchParams.get("religion") !== "all") filters.religion = searchParams.get("religion");
    if (searchParams.get("annualIncome") && searchParams.get("annualIncome") !== "All" && searchParams.get("annualIncome") !== "all") filters.annualIncome = searchParams.get("annualIncome");
    if (searchParams.get("gender") && searchParams.get("gender") !== "All" && searchParams.get("gender") !== "all") filters.gender = searchParams.get("gender");
    if (searchParams.get("isGujarati") && searchParams.get("isGujarati") !== "All" && searchParams.get("isGujarati") !== "all") filters.isGujarati = searchParams.get("isGujarati") === 'true';
    if (searchParams.get("formStatus") && searchParams.get("formStatus") !== "All" && searchParams.get("formStatus") !== "all") filters.formStatus = searchParams.get("formStatus");
    if (searchParams.get("course") && searchParams.get("course") !== "All" && searchParams.get("course") !== "all") filters.course = searchParams.get("course");
    if (searchParams.get("boardUniversity") && searchParams.get("boardUniversity") !== "All" && searchParams.get("boardUniversity") !== "all") filters.boardUniversity = searchParams.get("boardUniversity");
    if (searchParams.get("search")) filters.search = searchParams.get("search");

    // Debug: log filters
    console.log('API filters:', filters);

    // Get stats and applications using service functions
    const stats = await getApplicationFormStats(admission.id!);
    const { applications, totalItems } = await getApplicationFormsByAdmissionId(
      admission.id!,
      page,
      size,
      filters
    );

    // Add compatibility fields for frontend
    const statsWithCompat = {
      ...stats,
      totalDrafts: stats.drafts,
      totalPayments: stats.paymentsDone,
      admissionYearCount: 0,
      paymentsDone: stats.paymentsDone || 0,
      paymentDue: stats.paymentDue || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0,
      submitted: stats.submitted || 0,
      drafts: stats.drafts || 0,
    };

    return NextResponse.json({
      admission,
      stats: statsWithCompat,
      applications,
      totalItems,
    });
  } catch (error) {
    console.error("Error fetching admission:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
