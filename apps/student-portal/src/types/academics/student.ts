import { Nationality } from "../resources/nationality";

export type DbStudent = {
    readonly id?: number;
    

    tmpApplicationId: number | null;

    mailingPinNo: string | undefined;
    resiPinNo: string | undefined;
    admissionYear: number | undefined;
    codeNumber: string;
    oldcodeNumber: string | undefined;
    name: string;
    email: string | undefined;
    active: boolean | undefined;
    alumni: boolean | undefined;
    contactNo: string | undefined;
    imgFile: string | undefined;
    applicantSignature: string | undefined;
    sexId: number | undefined; // 0 means not entered
    mailingAddress: string | undefined;
    phoneMobileNo: string | undefined;
    residentialAddress: string | undefined;
    resiPhoneMobileNo: string | undefined;
    religionId: number | undefined; // 0 means not entered
    studentCategoryId: number | undefined; // 0 means not entered
    motherTongueId: number | undefined; // 0 means not entered
    dateOfBirth: Date | undefined;
    nationalityId: number | undefined; // 0 means not entered

    rollNumber: string | undefined; // class roll, 0 means entered


    bloodGroup: number | undefined; // 0 means entered
    eyePowerLeft: string | undefined; // 0 means entered
    eyePowerRight: string | undefined; // 0 means entered
    emrgnResidentPhNo: string | undefined;
    emrgnOfficePhNo: string | undefined;
    emrgnMotherMobNo: string | undefined;
    emrgnFatherMobNo: string | undefined;
    lastInstitution: string | undefined; // TODO
    lastInstitutionAddress: string | undefined;

    handicapped: string | undefined; // YES/NO
    handicappedDetails: string | number | undefined; // contains 0 or blank


    lsmedium: number | string | undefined; //contains blank


    annualFamilyIncome: string | undefined;
    lastBoardUniversity: number | undefined; // 0 means not entered

    institutionId: number | undefined;

    fatherName: string | undefined;


    fatherOccupation: number; // Contains 0




    fatherOffPhone: string | undefined;
    fatherMobNo: string | undefined;


    fatherEmail: string | undefined;
    motherName: string | undefined;


    motherOccupation: number; // Contains 0
    // motherOccupationDetail


    motherOffPhone: string | undefined;
    motherMobNo: string | undefined;


    motherEmail: string | undefined;
    guardianName: string | undefined;


    guardianOccupation: number; // Contains 0


    guardianOffAddress: string | undefined;
    guardianOffPhone: string | undefined;
    guardianMobNo: string | undefined;


    guardianEmail: string | undefined;


    admissioncodeno: string | undefined;
    // mcountryid
    // mstateid
    // mcityid
    // mothstate
    // mothcity
    // rcountryid
    // rstateid
    // rcityid
    // rothstate
    // rothcity
    // lastschoolid
    // lscountryid
    // lsstateid
    // lscityid
    // lsothstate
    // lsothcity
    placeofstay: string | undefined;
    placeofstaycontactno: string | undefined;
    placeofstayaddr: string | undefined;
    // grdrelation
    // grdspfrelation
    // grdhmaddr
    universityRegNo: string | undefined;
    admissiondate: Date | undefined;
    emercontactpersonnm: string | undefined;
    emerpersreltostud: string | undefined;
    emercontactpersonmob: string | undefined;
    emercontactpersonphr: string | undefined;
    emercontactpersonpho: string | undefined;
    // familydocnm
    // familydocmob
    // familydocphr
    // familydocpho
    // ecscode
    // accounttype
    // accountno
    // accountholder
    // ecscheck
    // relationid
    // libgrupid
    leavingdate: string | undefined;
    univregno: string | undefined;
    univlstexmrollno: string | undefined;
    communityid: number | null | 0; // 0 means not enetered, 1: GUJARATI, 2: NON-GUJARATI
    lspassedyr: number;
    cuformno: string | undefined;
    // menstrualhistory
    // menstrualhistory2
    // menstrualhistory3
    // menstrualhistorydate
    // pastmedicalhistory
    // pastsurgicalhistory
    // pastfamilyhistory
    // drugallergy
    // grdhomeaddr
    chkrepeat: boolean | undefined;
    notes: string | undefined;
    // ifsccode
    // micrcode
    // bankname
    // maxamount
    // umrn
    // informationsent
    // lsmediumId: number | undefined;
    // degreecourseId
    // distanceFromSchool
    // fatherannualinc
    // motherannualinc
    // guardianannualinc
    fatherPic: string | undefined;
    motherPic: string | undefined;
    guardianPic: string | undefined;
    lastotherBoardUniversity: number | undefined;
    // paymodepreference
    // parentpassword
    // parentPrivilegeGroupId
    boardresultid: number; // Contains 0
    rfidno: string | undefined;
    // addressproof: string | undefined;
    // enrollfrmno
    specialisation: string | undefined,
    // concessiontyp
    // lunchfees
    // hostel
    // siaccntno
    aadharcardno: string | undefined;
    leavingreason: string | undefined;
    localitytyp: string | undefined;
    rationcardtyp: string | undefined;
    // aouthToken
    // udid
    fatheraadharno: string | undefined;
    motheraadharno: string | undefined;
    gurdianaadharno: string | undefined;
    // secondlang
    // ecsdestbank
    // fatherdob
    // motherdob
    // fatherweight
    // motherweight
    // fatherbloodgrp
    // motherbloodgrp
    // fatherheight
    // motherheight
    // cwsn
    issnglprnt: string | undefined;
    // bankbranch
    // gurdianinitialnm
    // gurdianIdproof
    // gurdianSlNo
    handicappedpercentage: string | undefined;
    disabilitycode: string | undefined;
    institutionalemail: string | undefined;
    // spqtaapprovedby
    // spqtaapproveddt
    // banglashiksha
    // banglashikshaid
    // resipo
    // resips
    // resiblock
    // mailpo
    // mailps
    // mailblock
    // ews
    coursetype: "NA" | "CCF" | "CBCS" | null;
    whatsappno: string | undefined;
    // middleName
    // lastName
    // mdistrictid
    // mothdistrict
    // rdistrictid
    // rothdistrict
    // fathermiddleName
    // fatherlastName
    // mothermiddleName
    // motherlastName
    // societyid
    // secondsocietyid
    // outreachid
    // minorityid
    // guardianmiddleName
    // guardianlastName
    // studentfirstName
    // fatherfirstName
    // motherfirstName
    // guardianfirstName
    alternativeemail: string | undefined;
    othernationality: string | undefined;
    pursuingca: string | undefined;
    abcid: string | undefined;
    apprid: string | undefined;
    isAdmin?: boolean;
}

export interface Student extends DbStudent, Omit<Nationality, "id"> {
    isAdmin?: boolean;
}