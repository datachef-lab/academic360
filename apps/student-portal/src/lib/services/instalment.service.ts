import { query } from "@/db";
import { DbInstalment, Instalment } from "@/types/fees/instalment";

export async function findFeesByStudentId(studentId: number) {
    const sqlQuery = ` 
    SELECT
        si.id,
        si.stdid,
        si.structid,

        fsm.classId,
        crs.courseName,
        fsm.receipttype,
        ft.name AS receiptTypeName,
        current_class.className AS className,
        fsm.sessionId,
        sess.sessionName,
        fsm.lastdate,
        fsm.closingdate,
        fsm.advanceclassid,
        advance_class.className AS advanceClassName,
        fsm.instfromdt,
        fsm.insttodt,
        fsm.lastonlinedate,
        fsm.lastonlinedateto,
        fsm.shiftId,
        shft.shiftName,

        si.amount,
        si.instdt,
        si.amtwords,
        si.instlid AS instalmentNumber,
        si.feespaid,
        si.feespaydt,
        si.feesreceiptid,
        si.cancel,
        si.remarks,
        si.fg,

        sif.id AS instalmentFeesId,
        sif.parent_id,
        sif.headid,
        fsh.name AS feesHeadName,
        sif.fees,

        fsb.id AS feesStructureSubId,
        fsb.headid AS feesStructureSubHeadId,
        fsb_head.name AS feesStructureSubHeadName,
        fsb.feestypeid,
        sft.name AS feesStructureSubType,
        fsb.instamount AS feesStructureSubInstalmentAmount,
        fsb.specialtypename AS feesStructureSubSpecialTypeName,
        fsb.installmenttypename AS feesStructureSubInstalmentTypeName,
        fsb.lateTypeCalculation AS feesStructureSubLateTypeCalculation,
        fsb.concession AS feesStructureSubConcession,

        frm.id AS feesReceiptMainId,
        frm.receiptType AS receiptTypeId,
        frm_rt.name AS feesReceiptMainType,
        frm.collegePayMode AS collegePayModeId,
        payModel.name AS paymentModeName,
        frm.date AS receiptDate,
        frm.academicyearId,
        ac.accademicYearName AS academicYearName,
        frm.isAdvPayement,
        frm.cancelled,
        frm.cancelremarks,
        frm.challanno,

        frsb.id AS feesReceiptSubId,
        frsb.headid AS feesReceiptSubHeadId,
        frsb_head.name AS feesReceiptSubHeadName,
        frsb.amountPay AS feesReceiptSubAmountPay,
        frsb.amount AS feesReceiptSubAmount


    FROM studentinstlmain si
    JOIN studentinstlfees sif ON si.id = sif.parent_id
    JOIN feesheadtable fsh ON fsh.id = sif.headid
    JOIN feesstructuremaintab fsm ON fsm.id = si.structid
    JOIN studentfeesreceipttype ft ON ft.id = fsm.receipttype
    JOIN course crs ON crs.id = fsm.courseId
    JOIN classes current_class ON current_class.id = fsm.classId
    JOIN classes advance_class ON advance_class.id = fsm.advanceclassid
    JOIN currentsessionmaster sess ON sess.id = fsm.sessionId 
    JOIN shift shft ON shft.id = fsm.shiftId
    JOIN feesstructuresubtab fsb ON fsb.parent_id = fsm.id
    JOIN feesheadtable fsb_head ON fsb_head.id = fsb.headid
    JOIN studentFeesType sft ON sft.id = fsb.feestypeid
    

    -- Optimized: Join to specific receipt using si.feereceiptid
    LEFT JOIN feesreceiptmaintable frm ON frm.id = si.feesreceiptid
    LEFT JOIN studentfeesreceipttype frm_rt ON frm_rt.id = frm.receiptType
    LEFT JOIN studentFeesPayMode payModel ON frm.collegePayMode = payModel.id
    LEFT JOIN accademicyear ac ON ac.id = frm.academicyearId
    LEFT JOIN feesreceiptsubtable frsb ON frsb.parent_id = frm.id
    LEFT JOIN feesheadtable frsb_head ON frsb_head.id = frsb.headid

    WHERE si.stdid = ${studentId}
    ;`;

    const result = await query(sqlQuery) as DbInstalment[];

    const instalments: Instalment[] = [];
    const done: number[] = [];
    for (let i = 0; i < result.length; i++) {

        if (done.includes(result[i].id)) continue;
        done.push(result[i].id);

        const {
            amount,
            amtwords: amountInWords,
            feespaydt: paidAt,
            instalmentNumber,
            feespaid,
            cancel: cancelledInst,
            remarks,
            fg,
            structid: feesStructureId,
            courseName,
            receiptTypeName,
            className, sessionName,
            lastdate: lastDate,
            closingdate: closingDate,
            advanceClassName,
            instdt: instalmentFrom,
            insttodt: instalmentTo,
            lastonlinedate: lastOnlineDateFrom,
            lastonlinedateto: lastOnlineDateTo,
            shiftName,
            feesReceiptMainId,
            feesReceiptMainType,
            paymentModeName,
            receiptDate,
            academicYearName,
            isAdvPayement,
            cancelled,
            cancelremarks: cancelledRemarks,
            challanno: challanNumber,


        } = result[i];

        const instl: Instalment = {
            id: result[i].id,
            studentId,
            metadata: {
                feesStructureId,
                courseName,
                receiptTypeName,
                className,
                sessionName,
                lastDate,
                closingDate,
                advanceClassName,
                instalmentFrom,
                instalmentTo,
                lastOnlineDateFrom,
                lastOnlineDateTo,
                shiftName
            },
            details: {
                id: feesReceiptMainId!,
                type: feesReceiptMainType,
                paymentMode: paymentModeName!,
                date: receiptDate,
                academicYear: academicYearName!,
                isAdvancePayment: !!isAdvPayement,
                cancelled: !!cancelled,
                challanNumber,
                cancelledRemarks,
                components: []
            },
            amount,
            amountInWords,
            paidAt,
            instalmentNumber,
            hasPaid: feespaid,
            cancelled: !!cancelledInst,
            remarks,
            fg: !!fg
        }

        // Receipt's components
        const subReceipts = result.filter(ele => ele.parent_id == result[i].id);
        const doneReceipts: number[] = [];
        for (let j = 0; j < subReceipts.length; j++) {
            if (doneReceipts.includes(subReceipts[j].feesStructureSubId)) continue;
            doneReceipts.push(subReceipts[j].feesStructureSubId);

            instl.details.components.push({
                id: subReceipts[j].feesStructureSubId!,
                headName: subReceipts[j].feesStructureSubHeadName!,
                metadata: {
                    id: subReceipts[j].feesStructureSubId!,
                    headName: subReceipts[j].feesStructureSubHeadName!,
                    type: subReceipts[j].feesStructureSubType!,
                    amount: subReceipts[j].feesStructureSubInstalmentAmount!,
                    specialTypeName: subReceipts[j].feesStructureSubSpecialTypeName || null,
                    instalmentTypeName: subReceipts[j].feesStructureSubInstalmentTypeName || null,
                    lateTypeCalculation: subReceipts[j].feesStructureSubLateTypeCalculation || null,
                    concession: subReceipts[j].feesStructureSubConcession || null
                },
                hasPaid: !!subReceipts[j].feesReceiptSubAmountPay
            });
        }


        instalments.push(instl);
    }

    // console.log(instalments);
    // console.log("instalments[0].details.components:", instalments[0].details.components);

    return instalments;
}