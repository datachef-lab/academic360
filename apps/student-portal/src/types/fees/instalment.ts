export interface DbInstalment {
    // studentinstlmain
    id: number;
    stdid: number;
    structid: number;

    // feesstructuremaintab and related joins
    classId: number;
    courseName: string;
    receipttype: number;
    receiptTypeName: string;
    className: string;
    sessionId: number;
    sessionName: string;
    lastdate: string | Date | null;
    closingdate: string | Date | null;
    advanceclassid: number | null;
    advanceClassName: string | null;
    instfromdt: string | Date | null;
    insttodt: string | Date | null;
    lastonlinedate: string | Date | null;
    lastonlinedateto: string | Date | null;
    shiftId: number;
    shiftName: string;

    // instalment details
    amount: number;
    instdt: string | Date | null;
    amtwords: string;
    
    instalmentNumber: number;
    feespaid: boolean;
    feespaydt: string | Date | null;
    feesreceiptid: number | null;
    cancel: boolean | null;
    remarks: string | null;
    fg: number;

    // studentinstlfees
    instalmentFeesId: number;
    parent_id: number;
    headid: number;
    feesHeadName: string;
    fees: number;

    // feesstructuresubtab
    feesStructureSubId: number;
    feesStructureSubHeadId: number;
    feesStructureSubHeadName: string;
    feestypeid: number;
    feesStructureSubType: string;
    feesStructureSubInstalmentAmount: number;
    feesStructureSubSpecialTypeName: string | null;
    feesStructureSubInstalmentTypeName: string | null;
    feesStructureSubLateTypeCalculation: string | null;
    feesStructureSubConcession: number | null;

    // feesreceiptmaintable
    feesReceiptMainId: number | null;
    receiptTypeId: number | null;
    feesReceiptMainType: string;
    collegePayModeId: number | null;
    paymentModeName: string | null;
    receiptDate: string | Date | null;
    academicyearId: number | null;
    academicYearName: string | null;
    isAdvPayement: boolean | null;
    cancelled: boolean | null;
    cancelremarks: string | null;
    challanno: string | null;

    // feesreceiptsubtable
    feesReceiptSubId: number | null;
    feesReceiptSubHeadId: number | null;
    feesReceiptSubHeadName: string | null;
    feesReceiptSubAmountPay: number | null;
    feesReceiptSubAmount: number | null;
}


export interface Instalment {
    readonly id: number;
    studentId: number;
    metadata: { // Table: `feesstructuremaintab`
        feesStructureId: number;
        courseName: string;
        receiptTypeName: string;
        className: string;
        sessionName: string;
        lastDate: Date | null | string;
        closingDate: Date | null | string;
        advanceClassName: null | string;
        instalmentFrom: Date | null | string;
        instalmentTo: Date | null | string;
        lastOnlineDateFrom: Date | null | string;
        lastOnlineDateTo: Date | null | string;
        shiftName: string | null;
    }
    details: { // Table: `feesreceiptmaintable`
        id: number;
        type: string;
        paymentMode: string;
        components: { // Table: `feesreceiptsubtable`
            id: number;
            headName: string;
            metadata: { // Table: `feesstructuresubtab`
                id: number;
                headName: string;
                type: string;
                amount: number;
                specialTypeName: string | null;
                instalmentTypeName: string | null;
                lateTypeCalculation: string | null;
                concession: number | null;
            },
            hasPaid: boolean;
        }[],
        date: Date | null | string;
        academicYear: string;
        isAdvancePayment: boolean;
        cancelled: boolean;
        cancelledRemarks: string | null;
        challanNumber: string | null | number;
    }
    amount: number;
    amountInWords: string;
    paidAt: Date | null | string;
    instalmentNumber: number;
    hasPaid: boolean;
    cancelled: boolean;
    remarks: string | null;
    fg: boolean;
}