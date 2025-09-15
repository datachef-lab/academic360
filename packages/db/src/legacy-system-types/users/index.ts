export interface OldStudent {
    readonly id: number
    mailingPinNo: string | null
    resiPinNo: string | null
    admissionYear: number | null
    codeNumber: string;
    oldcodeNumber: string | null
    password: string | null
    securityQ: string | null
    answer: string | null
    name: string | null
    email: string | null
    active: boolean | 1 | 0
    alumni: boolean | 1 | 0
    contactNo: string | null
    imgFile: string | null
    applicantSignature: string | null
    sexId: number | null
    mailingAddress: string | null
    phoneMobileNo: string | null
    residentialAddress: string | null
    resiPhoneMobileNo: string | null
    religionId: number | null
    studentCategoryId: number | null
    motherTongueId: number | null
    address: string | null
    dateOfBirth: Date | string | null
    nationalityId: number | null
    academicyearid: number | null
    rollNumber: number | null
    transportDetails: number | null
    height: number | null
    weight: number | null
    bloodGroup: number | null
    eyePowerLeft: string | null
    eyePowerRight: string | null
    emrgnResidentPhNo: string | null
    emrgnOfficePhNo: string | null
    emrgnMotherMobNo: string | null
    emrgnFatherMobNo: string | null
    lastInstitution: string | null
    lastInstitutionAddress: string | null
    studiedUptoClass: string | null
    handicapped: string | null
    handicappedDetails: string | null
    memberOfSchoolClub: string | null
    identificationmark: string | null
    acm: string | null
    house: string | null
    lsmedium: string | null
    csl: string | null
    nam1: string | null
    nam2: string | null
    cn1: string | null
    cn2: string | null
    annualFamilyIncome: string | null
    lastBoardUniversity: number | null
    transportId: number | null
    institutionId: number | null
    privilegeGroupId: number | null
    fatherName: string | null
    fatherQualification: number | null
    fatherQualificationDetails: string | null
    fatherOccupation: number | null
    fatherOccupationDetail: string | null
    fatherOrg: string | null
    fatherDesignation: string | null
    fatherOffAddress: string | null
    fatherOffPhone: string | null
    fatherMobNo: string | null
    fatherSign: string | null
    fatherAward: string | null
    fatherRemark: string | null
    fatherEmail: string | null
    motherName: string | null
    motherQualification: number | null
    motherQualificationDetails: string | null
    motherOccupation: number | null
    motherOccupationDetail: string | null
    motherOrg: string | null
    motherDesignation: string | null
    motherOffAddress: string | null
    motherOffPhone: string | null
    motherMobNo: string | null
    motherSign: string | null
    motherAward: string | null
    motherRemark: string | null
    motherEmail: string | null
    guardianName: string | null
    guardianQualification: number | null
    guardianQualificationDetails: string | null
    guardianOccupation: number | null
    guardianOccupationDetail: string | null
    guardianOrg: string | null
    guardianDesignation: string | null
    guardianOffAddress: string | null
    guardianOffPhone: string | null
    guardianMobNo: string | null
    guardianSign: string | null
    guardianAward: string | null
    guardianRemark: string | null
    guardianEmail: string | null
    dentalhygiene: string | null
    admissionid: number | null
    admissioncodeno: string | null
    mcountryid: number | null
    mstateid: number | null
    mcityid: number | null
    mothstate: string | null
    mothcity: string | null
    rcountryid: number | null
    rstateid: number | null
    rcityid: number | null
    rothstate: string | null
    rothcity: string | null
    lastschoolid: number | null
    lscountryid: number | null
    lsstateid: number | null
    lscityid: number | null
    lsothstate: string | null
    lsothcity: string | null
    placeofstay: string | null
    placeofstaycontactno: string | null
    placeofstayaddr: string | null
    grdrelation: string | null
    grdspfrelation: string | null
    grdhmaddr: string | null
    universityRegNo: string | null
    admissiondate: Date | string | null
    emercontactpersonnm: string | null
    emerpersreltostud: string | null
    emercontactpersonmob: string | null
    emercontactpersonphr: string | null
    emercontactpersonpho: string | null
    familydocnm: string | null
    familydocmob: string | null
    familydocphr: string | null
    familydocpho: string | null
    ecscode: string | null
    accounttype: string | null
    accountno: string | null
    accountholder: string | null
    ecscheck: boolean | 1 | 0
    relationid: number | null
    libgrupid: number | null
    leavingdate: Date | string | null
    univregno: string | null
    univlstexmrollno: string | null
    communityid: number | null
    lspassedyr: number | null
    cuformno: string | null
    menstrualhistory: string | null
    menstrualhistory2: string | null
    menstrualhistory3: string | null
    menstrualhistorydate: Date | string | null
    pastmedicalhistory: string | null
    pastsurgicalhistory: string | null
    pastfamilyhistory: string | null
    drugallergy: string | null
    grdhomeaddr: string | null
    chkrepeat: boolean | 1 | 0
    notes: string | null
    ifsccode: string | null
    micrcode: string | null
    bankname: string | null
    maxamount: string | null
    umrn: string | null
    informationsent: boolean | 1 | 0
    lsmediumId: number | null
    degreecourseId: number | null
    distanceFromSchool: number | null
    fatherannualinc: string | null
    motherannualinc: string | null
    guardianannualinc: string | null
    fatherPic: string | null
    motherPic: string | null
    guardianPic: string | null
    lastotherBoardUniversity: string | null
    paymodepreference: string | null
    parentpassword: string | null
    parentPrivilegeGroupId: number | null
    boardresultid: number | null
    rfidno: string | null
    addressproof: number | null
    enrollfrmno: string | null
    specialisation: string | null
    concessiontyp: string | null
    lunchfees: string | null
    hostel: string | null
    siaccntno: string | null
    aadharcardno: string | null
    leavingreason: string | null
    localitytyp: string | null
    rationcardtyp: string | null
    aouthToken: string | null
    udid: string | null
    fatheraadharno: string | null
    motheraadharno: string | null
    gurdianaadharno: string | null
    secondlang: string | null
    ecsdestbank: string | null
    fatherdob: Date | string | null
    motherdob: Date | string | null
    fatherweight: string | null
    motherweight: string | null
    fatherbloodgrp: number | null
    motherbloodgrp: number | null
    fatherheight: string | null
    motherheight: string | null
    cwsn: string | null
    issnglprnt: string | null
    bankbranch: string | null
    gurdianinitialnm: string | null
    gurdianIdproof: string | null
    gurdianSlNo: string | null
    handicappedpercentage: string | null
    disabilitycode: string | null
    institutionalemail: string | null
    spqtaapprovedby: number | null
    spqtaapproveddt: Date | string | null
    banglashiksha: string | null
    banglashikshaid: string | null
    resipo: string | null
    resips: string | null
    resiblock: string | null
    mailpo: string | null
    mailps: string | null
    mailblock: string | null
    ews: string | null
    coursetype: string | null
    whatsappno: string | null
    middleName: string | null
    lastName: string | null
    mdistrictid: number | null
    mothdistrict: string | null
    rdistrictid: number | null
    rothdistrict: string | null
    fathermiddleName: string | null
    fatherlastName: string | null
    mothermiddleName: string | null
    motherlastName: string | null
    societyid: number | null
    secondsocietyid: number | null
    outreachid: number | null
    minorityid: number | null
    guardianmiddleName: string | null
    guardianlastName: string | null
    studentfirstName: string | null
    fatherfirstName: string | null
    motherfirstName: string | null
    guardianfirstName: string | null
    alternativeemail: string | null
    othernationality: string | null
    pursuingca: string | null
    abcid: string | null
    apprid: string | null
    prevcourseid: number | null
    prevcollegeid: number | null
    fttl: string | null
    mttl: string | null
    gttl: string | null
    quotatype: string | null
    prevcourseother: string | null
    prevcollegeother: string | null
    pen: string | null
    communityname: string | null
    meritalstatus: string | null
    genlearn: string | null
    guardiancountryid: number | null
    guardianstateid: number | null
    guardiancityid: number | null
    guardianothstate: string | null
    guardianothcity: string | null
    guardiandistrictid: number | null
    guardianothdistrict: string | null
    guardianPinNo: string | null
    vaccinated: string | null
    creationdt: Date | string | null
    modifydt: Date | string | null
    alternateemail: string | null
}

export interface OldStaff {
    readonly id: number | null;
    mailingPinNo: string | null;
    resiPinNo: string | null;
    admissionYear: number | null;
    password: string | null;
    uid: number | null;
    codeNumber: string;
    name: string | null;
    email: string | null;
    active: boolean;
    contactNo: string | null;
    imgFile: string | null;
    isTeacher: boolean;
    applicantSignature: string | null;
    sexId: number | null;
    mailingAddress: string | null;
    phoneMobileNo: string | null;
    residentialAddress: string | null;
    resiPhoneMobileNo: string | null;
    religionId: number | null;
    studentCategoryId: number | null;
    motherTongueId: number | null;
    address: string | null;
    dateOfBirth: Date | string | null;
    nationalityId: number | null;
    securityQ: string | null;
    answer: string | null;
    height: number | null;
    weight: number | null;
    bloodGroup: number | null;
    eyePowerLeft: string | null;
    eyePowerRight: string | null;
    identificationMark: string | null;
    maritalStatus: number | null;
    medicalHistory: string | null;
    bankAccNo: string | null;
    providentFundAccNo: string | null;
    panNo: string | null;
    comleterete: string | null;
    computeroperationknown: string | null;
    lastschoolattend: string | null;
    medium1: string | null;
    medium2: string | null;
    lastcollegeattend: string | null;
    board: string | null;
    university: string | null;
    emergencyname: string | null;
    emergencyrelationship: string | null;
    emergencytellandno: string | null;
    emergencytelmobile: string | null;
    initialname: string | null;
    locationId: number | null;
    privilegeGroupId: number | null;
    staffAttendanceCode: string | null;
    esiNo: string | null;
    impNo: string | null;
    clinicAddress: string | null;
    paySortOrder: number | null;
    empShiftId: number | null;
    gratuityno: string | null;
    libgrupid: number | null;
    courseid: number | null;
    pfnomination: boolean;
    gratuitynominationdt: Date | string | null;
    univAccNo: string | null;
    bankid: number | null;
    memprofbodies: string | null;
    childrens: string | null;
    mcountryid: number | null;
    mstateid: number | null;
    mcityid: number | null;
    mothstate: string | null;
    mothcity: string | null;
    rcountryid: number | null;
    rstateid: number | null;
    rcityid: number | null;
    rothstate: string | null;
    rothcity: string | null;
    mediclaimid: string | null;
    mediclaimprovider: string | null;
    mediclaimproviderno: string | null;
    mediclaimfilename: string | null;
    voterIdNo: string | null;
    passportNo: string | null;
    aadharNo: string | null;
    majorChildName: string | null;
    majorChildContactNo: string | null;
    otherengagements: string | null;
    nomineename: string | null;
    nomineedob: string | null;
    nomineeaddrs: string | null;
    privempnm: string | null;
    privempaddrs: string | null;
    privempleavingdt: string | null;
    bankifsccode: string | null;
    bankbranchname: string | null;
    bankacctype: string | null;
    panFileName: string | null;
    aadharFileName: string | null;
    fathername: string | null;
    mothername: string | null;
    spousename: string | null;
    aouthToken: string | null;
    udid: string | null;
    stuperuser: number | null;
    dateofconfirmation: Date | string | null;
    dateofprobation: Date | string | null;
}

export interface OldHistoricalRecord {
    id: number;
    index_col: number;
    parent_id: number;
    courseId: number;
    classId: number;
    sectionId: number;
    shiftId: number;
    present: boolean;
    startDate: Date | string | null;
    endDate: Date | string | null;
    sessionid: number;
    alumni: boolean;
    rollNo: number;
    dateofJoining: Date | string | null;
    instid: number;
    promotionstatus: number;
    boardresultid: number;
    univrollno: string | null;
    univrollnosi: string | null;
    exmno: string | null;
    exmsrl: string | null;
    specialisation: string | null;
}