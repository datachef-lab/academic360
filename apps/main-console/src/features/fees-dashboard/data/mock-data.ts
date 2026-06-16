export type LiveStudentAction =
  | "viewing_fees"
  | "on_gateway"
  | "downloading_pdf"
  | "generating_challan"
  | "viewing_slabs"
  | "installment_plan";

export interface LiveStudent {
  id: string;
  name: string;
  prn: string;
  program: string;
  course: string;
  batch: string;
  semester: string;
  action: LiveStudentAction;
  detail: string;
  device: "Web" | "Mobile" | "Kiosk";
  startedAt: string;
  lastSeenSec: number;
}

export interface ProgramEnrollmentRow {
  course: string;
  total: number;
  paid: number;
  notPaid: number;
  collectionPct: number;
  pendingAmount: number;
}

export interface SemesterMisBlock {
  semester: string;
  receivable: number;
  received: number;
  pending: number;
  challanGenerated: number;
  challanNotGenerated: number;
  paidPct: number;
  programs: ProgramEnrollmentRow[];
}

export const KPI_STATS = {
  receivable: 375_740_000,
  collected: 309_030_000,
  pending: 66_710_000,
  collectionEfficiency: 82.3,
  onlineSuccessRate: 94.6,
  failedTransactions: 127,
  challansGenerated: 9842,
  installmentPending: 2140,
  dueToday: 18_450_000,
  totalStudents: 10023,
};

export const LIVE_STUDENTS: LiveStudent[] = [
  {
    id: "1",
    name: "Ananya Sharma",
    prn: "PRN2401842",
    program: "B.Com (H)",
    course: "B.Com (H)",
    batch: "2024-28",
    semester: "Sem IV",
    action: "downloading_pdf",
    detail: "Receipt RCP-9492 (PDF)",
    device: "Web",
    startedAt: "2 min ago",
    lastSeenSec: 12,
  },
  {
    id: "2",
    name: "Rahul Verma",
    prn: "PRN2400911",
    program: "BBA (H)",
    course: "BBA (H)",
    batch: "2023-27",
    semester: "Sem VI",
    action: "on_gateway",
    detail: "Razorpay · ₹92,000",
    device: "Mobile",
    startedAt: "Just now",
    lastSeenSec: 8,
  },
  {
    id: "3",
    name: "Priya Nair",
    prn: "PRN2402205",
    program: "M.Com",
    course: "M.Com",
    batch: "2024-26",
    semester: "Sem II",
    action: "viewing_fees",
    detail: "Fee breakdown · Installment 2/4",
    device: "Web",
    startedAt: "5 min ago",
    lastSeenSec: 22,
  },
  {
    id: "4",
    name: "Arjun Patel",
    prn: "PRN2401567",
    program: "BCA",
    course: "BCA",
    batch: "2024-28",
    semester: "Sem I",
    action: "generating_challan",
    detail: "Challan CH-8821",
    device: "Kiosk",
    startedAt: "1 min ago",
    lastSeenSec: 18,
  },
  {
    id: "5",
    name: "Sneha Das",
    prn: "PRN2403012",
    program: "B.Sc",
    course: "B.Sc",
    batch: "2023-27",
    semester: "Sem VI",
    action: "installment_plan",
    detail: "Planning · 4 installments",
    device: "Mobile",
    startedAt: "3 min ago",
    lastSeenSec: 28,
  },
  {
    id: "6",
    name: "Vikram Singh",
    prn: "PRN2400888",
    program: "BA (H)",
    course: "BA (H)",
    batch: "2024-28",
    semester: "Sem IV",
    action: "viewing_slabs",
    detail: "Category: General · Slab A",
    device: "Web",
    startedAt: "4 min ago",
    lastSeenSec: 45,
  },
];

export const SEMESTER_MIS: SemesterMisBlock[] = [
  {
    semester: "Semester I",
    receivable: 140_350_000,
    received: 140_350_000,
    pending: 0,
    challanGenerated: 3420,
    challanNotGenerated: 12,
    paidPct: 98.2,
    programs: [
      {
        course: "B.COM (H)",
        total: 842,
        paid: 820,
        notPaid: 22,
        collectionPct: 97.4,
        pendingAmount: 1_240_000,
      },
      {
        course: "BBA (H)",
        total: 612,
        paid: 598,
        notPaid: 14,
        collectionPct: 97.7,
        pendingAmount: 890_000,
      },
      {
        course: "BCA",
        total: 445,
        paid: 430,
        notPaid: 15,
        collectionPct: 96.6,
        pendingAmount: 720_000,
      },
      {
        course: "BA (H)",
        total: 380,
        paid: 365,
        notPaid: 15,
        collectionPct: 96.1,
        pendingAmount: 650_000,
      },
    ],
  },
  {
    semester: "Semester IV",
    receivable: 185_970_000,
    received: 136_550_000,
    pending: 49_420_000,
    challanGenerated: 4102,
    challanNotGenerated: 186,
    paidPct: 73.4,
    programs: [
      {
        course: "B.COM (H)",
        total: 798,
        paid: 612,
        notPaid: 186,
        collectionPct: 76.7,
        pendingAmount: 12_400_000,
      },
      {
        course: "BBA (H)",
        total: 590,
        paid: 445,
        notPaid: 145,
        collectionPct: 75.4,
        pendingAmount: 9_800_000,
      },
      {
        course: "M.COM",
        total: 220,
        paid: 168,
        notPaid: 52,
        collectionPct: 76.4,
        pendingAmount: 6_200_000,
      },
      {
        course: "BCA",
        total: 412,
        paid: 310,
        notPaid: 102,
        collectionPct: 75.2,
        pendingAmount: 8_100_000,
      },
    ],
  },
  {
    semester: "Semester VI",
    receivable: 49_420_000,
    received: 32_130_000,
    pending: 17_290_000,
    challanGenerated: 2320,
    challanNotGenerated: 94,
    paidPct: 65.0,
    programs: [
      {
        course: "B.COM (H)",
        total: 756,
        paid: 498,
        notPaid: 258,
        collectionPct: 65.9,
        pendingAmount: 5_400_000,
      },
      {
        course: "BBA (H)",
        total: 548,
        paid: 352,
        notPaid: 196,
        collectionPct: 64.2,
        pendingAmount: 4_200_000,
      },
      {
        course: "BA (H)",
        total: 312,
        paid: 198,
        notPaid: 114,
        collectionPct: 63.5,
        pendingAmount: 2_890_000,
      },
    ],
  },
];

export const COLLECTION_TREND = [
  { monthLabel: "April 2025", collected: 42, pending: 18 },
  { monthLabel: "May 2025", collected: 48, pending: 15 },
  { monthLabel: "June 2025", collected: 52, pending: 14 },
  { monthLabel: "July 2025", collected: 58, pending: 12 },
  { monthLabel: "August 2025", collected: 55, pending: 16 },
  { monthLabel: "September 2025", collected: 62, pending: 11 },
  { monthLabel: "October 2025", collected: 68, pending: 10 },
];

export const PAYMENT_MODE_DATA = [
  { name: "UPI", value: 42, color: "#6366f1" },
  { name: "Net Banking", value: 28, color: "#06b6d4" },
  { name: "Card", value: 18, color: "#10b981" },
  { name: "Cash", value: 8, color: "#f59e0b" },
  { name: "Cheque", value: 4, color: "#8b5cf6" },
];

export const PROGRAM_COLLECTION = [
  { program: "B.Com (H)", amount: 98.2 },
  { program: "BBA (H)", amount: 86.4 },
  { program: "BCA", amount: 72.1 },
  { program: "M.Com", amount: 68.5 },
  { program: "BA (H)", amount: 61.3 },
  { program: "B.Sc", amount: 74.8 },
];

export const CATEGORY_FEES = [
  { category: "General", amount: 142 },
  { category: "OBC-A", amount: 118 },
  { category: "OBC-B", amount: 112 },
  { category: "SC", amount: 86 },
  { category: "ST", amount: 78 },
  { category: "EWS", amount: 94 },
];

export const RELIGION_DIST = [
  { name: "Hindu", value: 62 },
  { name: "Muslim", value: 18 },
  { name: "Christian", value: 12 },
  { name: "Sikh", value: 5 },
  { name: "Other", value: 3 },
];

/** Student counts per fee slab (from fee_student_mappings → fee_group → fee_slab) — mock until API */
export interface SlabStudentStat {
  slabName: string;
  eligibleStudents: number;
  fullyPaid: number;
  partialOrUnpaid: number;
  structuresUsing: number;
}

export const SLAB_STUDENT_STATS: SlabStudentStat[] = [
  {
    slabName: "Slab A",
    eligibleStudents: 4120,
    fullyPaid: 3380,
    partialOrUnpaid: 740,
    structuresUsing: 28,
  },
  {
    slabName: "Slab B",
    eligibleStudents: 2890,
    fullyPaid: 2102,
    partialOrUnpaid: 788,
    structuresUsing: 22,
  },
  {
    slabName: "Slab C",
    eligibleStudents: 1560,
    fullyPaid: 980,
    partialOrUnpaid: 580,
    structuresUsing: 18,
  },
  {
    slabName: "Slab D",
    eligibleStudents: 890,
    fullyPaid: 620,
    partialOrUnpaid: 270,
    structuresUsing: 12,
  },
  {
    slabName: "Slab M",
    eligibleStudents: 312,
    fullyPaid: 198,
    partialOrUnpaid: 114,
    structuresUsing: 8,
  },
  {
    slabName: "Slab S",
    eligibleStudents: 251,
    fullyPaid: 142,
    partialOrUnpaid: 109,
    structuresUsing: 6,
  },
];

export interface PaymentChannelStat {
  channel: "Online" | "Cash" | "Cheque";
  studentCount: number;
  amount: number;
  recordedBy: string;
}

export const PAYMENT_CHANNEL_STATS: PaymentChannelStat[] = [
  { channel: "Online", studentCount: 8412, amount: 290_630_000, recordedBy: "Gateway · auto" },
  { channel: "Cash", studentCount: 612, amount: 14_200_000, recordedBy: "Staff · fees desk" },
  { channel: "Cheque", studentCount: 148, amount: 4_200_000, recordedBy: "Staff · fees desk" },
];

export const RECENT_RECEIPTS = [
  {
    receipt: "RCP-98421",
    student: "Ananya Sharma",
    program: "B.Com (H)",
    semester: "IV",
    amount: 48500,
    mode: "UPI",
    time: "10:42 AM",
    status: "Success",
  },
  {
    receipt: "RCP-98420",
    student: "Rahul Verma",
    program: "BBA (H)",
    semester: "VI",
    amount: 92000,
    mode: "Card",
    time: "10:38 AM",
    status: "Success",
  },
  {
    receipt: "RCP-98419",
    student: "Priya Nair",
    program: "M.Com",
    semester: "II",
    amount: 35200,
    mode: "Net Banking",
    time: "10:31 AM",
    status: "Success",
  },
  {
    receipt: "RCP-98418",
    student: "Arjun Patel",
    program: "BCA",
    semester: "I",
    amount: 41800,
    mode: "UPI",
    time: "10:28 AM",
    status: "Pending",
  },
  {
    receipt: "RCP-98417",
    student: "Sneha Das",
    program: "B.Sc",
    semester: "VI",
    amount: 55600,
    mode: "Cash",
    time: "10:15 AM",
    status: "Success",
  },
];

export const TOP_PENDING = [
  {
    student: "George Lucas",
    course: "MBA",
    pending: 120000,
    dueSince: "92 days",
    priority: "High",
  },
  {
    student: "Charlie Brown",
    course: "BCA",
    pending: 60000,
    dueSince: "78 days",
    priority: "High",
  },
  {
    student: "Alice Johnson",
    course: "BBA (H)",
    pending: 55000,
    dueSince: "65 days",
    priority: "Medium",
  },
  {
    student: "John Doe",
    course: "B.Com (H)",
    pending: 50000,
    dueSince: "45 days",
    priority: "Medium",
  },
  { student: "Jane Smith", course: "B.Com", pending: 45000, dueSince: "38 days", priority: "Low" },
];

export const RECENT_ACTIVITIES = [
  {
    staff: "Dr. Meera Iyer",
    action: "Fee structure updated",
    time: "2 min ago",
    type: "structure",
  },
  {
    staff: "Admin · Fees Desk",
    action: "Bulk receipts generated (142)",
    time: "8 min ago",
    type: "receipt",
  },
  {
    staff: "R. Kapoor",
    action: "Student payment received · ₹48,500",
    time: "12 min ago",
    type: "payment",
  },
  { staff: "System", action: "Challan generated · CH-8821", time: "18 min ago", type: "challan" },
  {
    staff: "Dr. S. Banerjee",
    action: "New fee slab added · Category SC",
    time: "25 min ago",
    type: "slab",
  },
];

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `₹${(amount / 1_000_000).toFixed(2)}M`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatFullCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
