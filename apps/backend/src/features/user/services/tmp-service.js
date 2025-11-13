import XLSX from "xlsx";
import { mysqlConnection } from "@/db";

/**
 * Fetches staff data from MySQL (old database) and creates an Excel file
 * with two sheets: staff-personal-details and staff-historical-record
 * @returns {Promise<Buffer>} Excel file buffer
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
        shr.instincrday, 
        shr.instincrmonth, 
        shr.ugcincrday, 
        shr.ugcincrmonth, 
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
      LEFT JOIN department dpt ON dpt.id = shr.departmentId
      LEFT JOIN designation dsg ON dsg.id = shr.designationId
      LEFT JOIN paygroup pgrp ON pgrp.id = shr.payGroupId
      LEFT JOIN paygrade pg ON pg.id = shr.payGradeId
      LEFT JOIN accsunit acu ON acu.id = shr.accUnitId
      LEFT JOIN employeeshift esf ON esf.id = shr.empShiftId
      LEFT JOIN stafftype stp ON stp.id = shr.stafftypeid
      LEFT JOIN payacgroup pag ON pag.id = shr.payacgroupid
      LEFT JOIN offdaysgroup odg ON odg.id = shr.offdaysgroupid
      LEFT JOIN leavegroup lg ON lg.id = shr.leaveGroupId
      LEFT JOIN appotype apt ON apt.id = shr.appointmentTypeId
      LEFT JOIN holidaygrouptbl h ON h.id = shr.holidaygroupid
      LEFT JOIN itcalctype ic ON ic.id = shr.calctypeid
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
        sp.rfid
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
    const [historicalRecords] = await mysqlConnection.query(
      staffHistoricalRecordQuery,
    );

    console.log("[STAFF-EXPORT] Fetching staff personal details...");
    const [personalDetails] = await mysqlConnection.query(
      staffPersonalDetailsQuery,
    );

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

    console.log("[STAFF-EXPORT] Excel file generated successfully");

    return Buffer.from(excelBuffer);
  } catch (error) {
    console.error("[STAFF-EXPORT] Error generating Excel file:", error);
    throw error;
  }
}
