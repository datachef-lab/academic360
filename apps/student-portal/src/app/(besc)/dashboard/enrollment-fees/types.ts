export interface Installment {
  id: number;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  paidOn: string | null;
}

export interface Fee {
  id: number;
  name: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue" | "partially_paid";
  installments: Installment[];
}

export interface EnrollmentFeesClientProps {
  initialFeesData: Fee[];
} 