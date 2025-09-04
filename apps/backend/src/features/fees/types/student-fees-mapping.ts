import { paymentModeEnum, paymentStatusEnum, studentFeesMappingEnum } from "@repo/db/schemas/enums";

export type StudentFeesMapping = {
    id: number;
    studentId: number;
    feesStructureId: number;
    type: "FULL" | "INSTALMENT";
    instalmentNumber?: number;
    amountPaid?: number;
    lateFee: number;
    paymentStatus: "PENDING" | "PAID" | "PARTIAL";
    paymentMode?: "CASH" | "CHEQUE" | "ONLINE";
    transactionRef?: string;
    transactionDate?: Date;
    receiptNumber?: string;
    createdAt: Date;
    updatedAt: Date;
};
