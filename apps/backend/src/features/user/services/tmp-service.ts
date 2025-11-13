import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { mysqlConnection } from "@/db";

/**
 * Fetches staff data from MySQL (old database) and creates an Excel file
 * with two sheets: staff-personal-details and staff-historical-record
 * @returns {Promise<{buffer: Buffer, filePath: string, fileName: string}>} Excel file buffer and file path
 */
export async function exportStaffDataToExcel() {
  try {
    console.log("[STAFF-EXPORT] Starting data fetch from MySQL...");

    // Query 1: Staff Historical Record
    const staffHistoricalRecordQuery = `
      SELECT
        shr.id,
        shr.parent_id as staff_id_fk,
        dpt.department,
        dsg.designation,
        shr.instincrday, shr.instincrmonth, shr.ugcincrday, shr.ugcincrmonth, 
        shr.startDate,
        shr.endDate,
        shr.present,
        apt.appotypeName,
        pgrp.name as paygroup,
        pg.name as paygrade,
        acu.name as accUnit_name,
        shr.unitid,
        shr.signauth,
        lg.name as leaveGroup_name,
        esf.name as empShify_name,
        stp.name as staffType_name,
        shr.daysperweek,
        pag.name as payacgroup_name,
        odg.name as offdaysgroup_name,
        shr.paySortOrder,
        h.name as holidaygroup,
        shr.memono,
        ic.name as calctype
      FROM staffhistoricalrecord shr
      left join department dpt ON dpt.id = shr.departmentId
      left join designation dsg On dsg.id = shr.designationId
      left join paygroup pgrp On pgrp.id = shr.payGroupId
      left join paygrade pg ON pg.id = shr.payGradeId
      left join accsunit acu On acu.id = shr.accUnitId
      left join employeeshift esf On esf.id = shr.empShiftId
      left join stafftype stp ON stp.id = shr.stafftypeid
      left join payacgroup pag ON pag.id = shr.payacgroupid
      left join offdaysgroup odg On odg.id = shr.offdaysgroupid
      left join leavegroup lg On lg.id = shr.leaveGroupId
      left join appotype apt On apt.id = shr.appointmentTypeId
      left join holidaygrouptbl h on h.id = shr.holidaygroupid
      left join itcalctype ic on ic.id = shr.calctypeid
    `;

    // Query 2: Staff Personal Details
    const staffPersonalDetailsQuery = `
      SELECT
        sp.id,
        sp.mailingPinNo,
        sp.resiPinNo,
        sp.admissionYear,
        sp.password,
        sp.uid,
        sp.codeNumber,
        sp.name,
        sp.email,
        sp.active,
        sp.contactNo,
        sp.imgFile,
        sp.isTeacher,
        sp.applicantSignature,
        sx.sexName,
        sp.mailingAddress,
        sp.phoneMobileNo,
        sp.residentialAddress,
        sp.resiPhoneMobileNo,
        rlg.religionName,
        sct.studentCName,
        mt.mothertongueName,
        sp.address,
        sp.dateOfBirth,
        sp.securityQ,
        sp.answer,
        sp.height,
        sp.weight,
        sp.bloodGroup,
        sp.eyePowerLeft,
        sp.eyePowerRight,
        sp.identificationMark,
        sp.maritalStatus,
        sp.medicalHistory,
        sp.bankAccNo,
        sp.providentFundAccNo,
        sp.panNo,
        sp.comleterete,
        sp.computeroperationknown,
        sp.lastschoolattend,
        sp.medium1,
        sp.medium2,
        sp.lastcollegeattend,
        sp.board,
        sp.university,
        sp.emergencyname,
        sp.emergencyrelationship,
        sp.emergencytellandno,
        sp.initialname, 
        sp.locationId,
        sp.privilegeGroupId,
        sp.staffAttendanceCode,
        sp.esiNo,
        sp.impNo,
        sp.clinicAddress,
        sp.paySortOrder,
        esf.name as emp_shift,
        sp.gratuityno,
        sp.libgrupid,
        crs.courseName,
        sp.pfnomination,
        sp.gratuitynominationdt,
        sp.univAccNo,
        bnk.bankName,
        sp.memprofbodies,
        sp.childrens,
        mcon.countryName as mailing_country,
        mst.stateName as mailing_state,
        mct.cityName as mailing_city,
        sp.mothstate,
        sp.mothcity,
        rcon.countryName as residential_country,
        rst.stateName as residential_state,
        rct.cityName as residential_city,
        sp.rothstate,
        sp.rothcity,
        sp.mediclaimid,
        sp.mediclaimprovider,
        sp.mediclaimproviderno,
        sp.mediclaimfilename,
        sp.voterIdNo,
        sp.passportNo,
        sp.aadharNo,
        sp.majorChildName,
        sp.majorChildContactNo,
        sp.otherengagements,
        sp.nomineename,
        sp.nomineedob,
        sp.nomineeaddrs,
        sp.privempnm,
        sp.privempaddrs,
        sp.privempleavingdt,
        sp.bankifsccode,
        sp.bankbranchname,
        sp.bankacctype,
        sp.panFileName,
        sp.aadharFileName,
        sp.fathername,
        sp.mothername,
        sp.spousename,
        sp.udid,
        sp.stuperuser,
        sp.dateofconfirmation,
        sp.dateofprobation,
        sp.rfidno
      FROM staffpersonaldetails sp
      LEFT JOIN sex sx ON sx.id = sp.sexId
      LEFT JOIN religion rlg ON rlg.id = sp.religionId
      LEFT JOIN studentcatagory sct ON sct.id = sp.studentCategoryId
      LEFT JOIN mothertongue mt ON mt.id = sp.motherTongueId
      LEFT JOIN nationality nl ON nl.id = sp.nationalityId
      LEFT JOIN employeeshift esf ON esf.id = sp.empShiftId
      LEFT JOIN course crs ON crs.id = sp.courseid
      LEFT JOIN countrymaintab mcon ON mcon.id = sp.mcountryid
      LEFT JOIN countrysubtab mst ON mst.id = sp.mstateid
      LEFT JOIN citysub mct ON mct.id = sp.mcityid
      LEFT JOIN countrymaintab rcon ON rcon.id = sp.rcountryid
      LEFT JOIN countrysubtab rst ON rst.id = sp.rstateid
      LEFT JOIN citysub rct ON rct.id = sp.rcityid
      LEFT JOIN adminbank bnk ON bnk.id = sp.bankId
    `;

    // Execute both queries in parallel
    console.log("[STAFF-EXPORT] Fetching staff historical records...");
    const [historicalRecords] = (await mysqlConnection.query(
      staffHistoricalRecordQuery,
    )) as [any[], any];

    console.log("[STAFF-EXPORT] Fetching staff personal details...");
    const [personalDetails] = (await mysqlConnection.query(
      staffPersonalDetailsQuery,
    )) as [any[], any];

    console.log(
      `[STAFF-EXPORT] Fetched ${historicalRecords.length} historical records and ${personalDetails.length} personal details`,
    );

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheets
    const historicalWorksheet = XLSX.utils.json_to_sheet(historicalRecords);
    const personalWorksheet = XLSX.utils.json_to_sheet(personalDetails);

    // Add worksheets to workbook with proper sheet names
    XLSX.utils.book_append_sheet(
      workbook,
      historicalWorksheet,
      "staff-historical-record",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      personalWorksheet,
      "staff-personal-details",
    );

    // Convert workbook to buffer
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // Save file to disk
    const exportsDir = path.join(process.cwd(), "exports");
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const fileName = `staff-export-${timestamp}.xlsx`;
    const filePath = path.join(exportsDir, fileName);

    XLSX.writeFile(workbook, filePath, { cellStyles: true });

    console.log("[STAFF-EXPORT] Excel file generated successfully");
    console.log(`[STAFF-EXPORT] File saved at: ${filePath}`);

    return {
      buffer: Buffer.from(excelBuffer),
      filePath: filePath,
      fileName: fileName,
    };
  } catch (error) {
    console.error("[STAFF-EXPORT] Error generating Excel file:", error);
    throw error;
  }
}
