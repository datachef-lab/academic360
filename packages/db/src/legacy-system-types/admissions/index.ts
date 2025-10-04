export interface OldCourseDetails {
    readonly id: number
    index_col: number
    parent_id: number
    eligibilityCriteriaId: number
    studentCategoryId: number
    courseid: number
    classid: number
    shiftid: number
    rollNumber: number
    appno: string | null
    chllno: string | null
    amt: number | null
    paymentDate: Date | string | null
    payreceived: boolean | 1 | 0
    paymentType: string | null
    applicationdt: Date | string | null
    smssent: boolean | 1 | 0
    smssenton: Date | string | null
    verifydt: Date | string | null
    verifytime: string | null
    verified: boolean | 1 | 0
    verifiedby: number
    verifiedon: Date | string | null
    fincome: number
    mincome: number
    totincome: number
    freeshipdate: Date | string | null
    freeshipappby: number
    freeshipappdate: Date | string | null
    freeshipperc: number
    freeshipapplied: boolean | 1 | 0
    freeshippercapplied: boolean | 1 | 0
    freeshipapproved: boolean | 1 | 0
    feeschallangenerated: boolean | 1 | 0
    feeschallanno: number
    feeschallandate: Date | string | null
    feespaid: boolean | 1 | 0
    feespaidtype: string | null
    feespaymentdate: Date | string | null
    feespaymentbrnchid: number
    feeschallaninstamt: number | null
    meritlisted: boolean | 1 | 0
    chkantiragstud: boolean | 1 | 0
    chkantiragparnt: boolean | 1 | 0
    feespaymententrydate: Date | string | null
    feespaidreconciled: boolean | 1 | 0
    docpending: boolean | 1 | 0
    docpendingdtls: string | null
    admfrmdwnld: boolean | 1 | 0
    admfrmdwnldentrydate: Date | string | null
    feespaymentbrnchothr: string | null
    feespaymentbankid: number
    feesdraftno: string | null
    feesdraftdt: Date | string | null
    feesdraftdrawnon: string | null
    feesdraftamt: number | null
    block: boolean | 1 | 0
    blockremark: string | null
    shiftchangeremark: string | null
    transferred: boolean | 1 | 0
    specialization: string | null
    lstedtdt: string | null
    edtcutofffail: number
    bestofFour: number | null
    totalscore: number | null
    meritlistid: number
    freeshipamtid: number
    uid: string | null
    idcardprinted: boolean | 1 | 0
    idcardprintdate: Date | string | null
    gdpirank: string | null
    chkgdpi: boolean | 1 | 0
    admitapplied: boolean | 1 | 0
    admtestmarks: number | null
    admtestpresent: number
    bo4_old: number | null
    totscore_old: number | null
    instlapplied: boolean | 1 | 0
    instlapplieddt: Date | string | null
    rfidno: string | null
    onlinerefno: string | null
    pmtmsg: string | null
    docvrfcalldate: Date | string | null
    instltranid: string | null
    instlrefno: string | null
    dvtoken: string | null
    meritlistdt: Date | string | null
    admitcardselected: boolean | 1 | 0
    admitcardselectedon: Date | string | null
    admtestsmssenton: Date | string | null
    verifymastersubid: number
    verifytype: string | null
    verifyremarks: string | null
    verifymastersuborig1id: number
    verifymastersuborig2id: number
    verifytypeorig1: string | null
    verifytypeorig2: string | null
    verifyremarks1: string | null
    meritlistcount: number
    meritlistby: number
    gujaratiperiod: number
    gujaratiadmtype: string | null
    gujaratiadmdate: Date | string | null
    sportsquotaadmtype: string | null
    sportsquotaadmdate: Date | string | null
    subjectselection: number
    sportsquotaapplied: boolean | 1 | 0
    documentstatus: string | null
    documentuploaddate: Date | string | null
    cancelled: boolean | 1 | 0
    cancelsourceid: number
    cancelremarks: string | null
    canceldate: Date | string | null
    canceluserid: number
    cancelentrydt: Date | string | null
    chkeoi: boolean | 1 | 0
    eoidate: Date | string | null
    eoicount: number
    eoihistory: string | null
    noofoptry: number
}

export interface OldShift {
    readonly id: number;
    shiftName: string;
    codeprefix: string;
}

export interface OldMeritList {
    readonly id: number
    name: string;
    description: string;
    checkauto: boolean | 1 | 0;
}

export interface OldStudentCategory {
    readonly id: number;
    studentCName: string;
    document: boolean | 1 | 0;
    courseId: number;
    classId: number;
    flgyes: string;
}

export interface OldFreeshipMain {
    readonly id: number;
    freeshipamt: number | null;
    admid: number | null;
    approved: boolean | 1 | 0;
    appldt: Date | string | null;
    applied: boolean | 1 | 0;
    xiifeespaid: number | null;
    schoolfreeshipdtls: string | null;
    resistatus: string | null;
    prevfinaid: string | null;
    prevfinaiddtls: string | null;
    addrproof: string | null;
    addrprooffile: string | null;
    supportdtls: string | null;
    panno: string | null;
    spldisability: string | null;
    spldisabilitydtls: string | null;
    policerecord: string | null;
    policerecorddtls: string | null;
    bplcardno: string | null;
    famfinaid: string | null;
    famfinaiddtls: string | null;
    salarydtls: string | null;
    salarydtlsfile: string | null;
    approvedby: number | null;
    verifiedby: number | null;
    apprdt: Date | string | null;
}

export interface OldCvSubjectSelection {
    readonly id: number;
    index_col: number | null;
    parent_id: number;
    subjecttypeid: number;
    subjectid: number;
}

export interface OldSubjectType {
    readonly id: number;
    subjectTypeName: string | null;
    rptpos: number | null;
    shortname: string | null;
}

export interface OldSubject {
    id: number;
    subjectName: string | null;
    subjectTypeId: number;
    univcode: string | null;
    ifgroup: boolean | 1 | 0;
}

export interface OldAdmStudentPersonalDetail {
    id: number | null;
    bestofFour: number | null;
    totalscore: number | null;
    categoryId: number | null;
    codenumber: string | null;
    firstName: string | null;
    middleName: string | null;
    lastName: string | null;
    eligibilityCriteriaId: number | null;
    instituteId: number | null;
    studentCategoryId: number | null;
    admissionYear: number | null;
    sessionId: number | null;
    courseHeaderId: number | null;
    dateOfBirth: Date | string | null;
    placeofBirth: string | null;
    motherTongueId: number | null;
    religionId: number | null;
    bloodgroupcomboName: string | null;
    sexId: number | null;
    nationalityId: number | null;
    email: string | null;
    familyDetails: string | null;
    famOccupationId: number | null;
    resiStateId: number | null;
    cityId: number | null;
    resiPinNo: string | null;
    familyIncome: string | null;
    localGuardianname: string | null;
    localguardianoccupation: number | null;
    localguardianAddress: string | null;
    localguardianStateId: number | null;
    countryId: number | null;
    contactNo: string | null;
    mailingAddress: string | null;
    parmanentAddress: string | null;
    placeofStay: string | null;
    newcountryId: number | null;
    newstateId: number | null;
    newcityId: number | null;
    newresipinno: string | null;
    otherState: string | null;
    otherCity: string | null;
    othernewState: string | null;
    othernewCity: string | null;
    maritialStatus: string | null;
    fttl: string | null;
    fatherName: string | null;
    resiLandno: string | null;
    mailingLandno: string | null;
    fatherEmail: string | null;
    mttl: string | null;
    motherName: string | null;
    motherEmail: string | null;
    motherOccupationId: string | null;
    placestayConractNo: string | null;
    placestayaddress: string | null;
    studentPersonalContactNo: string | null;
    gttl: string | null;
    otherGuardianName: string | null;
    fmobno: string | null;
    fresphno: string | null;
    foffcphno: string | null;
    mmobno: string | null;
    mresphno: string | null;
    moffcphno: string | null;
    gmobno: string | null;
    gresphno: string | null;
    goffcphno: string | null;
    picpath: string | null;
    emergencycontactno: string | null;
    uid: string | null;
    community: string | null;
    password: string | null;
    privilegeGroupId: number | null;
    sportsquota: string | null;
    logintp: string | null;
    adhaarcardno: string | null;
    bankBranch: string | null;
    rollNumber: number | null;
    courseId: number | null;
    classId: number | null;
    famAddress: string | null;
    mailingPinNo: string | null;
    localguardianphoneNo: string | null;
    lastschoolName: string | null;
    lastSchoolAddress: string | null;
    yearofPassing: string | null;
    firstGenerationLerner: string | null;
    mediumofInstruction: string | null;
    chkacDe: boolean | 0 | 1;
    chkacCho: boolean | 0 | 1;
    chkacArt: boolean | 0 | 1;
    chkacNE: boolean | 0 | 1;
    chkacSw: boolean | 0 | 1;
    chkacDrama: boolean | 0 | 1;
    draftNo: string | null;
    amt: number | null;
    paymentDate: Date | string | null;
    drawnOn: string | null;
    drawnOnId: number | null;
    selected: boolean | 0 | 1;
    famName: string | null;
    paymentType: string | null;
    studentcontactNo: string | null;
    schoolCountryId: number | null;
    schoolcityId: number | null;
    otherSchoolState: string | null;
    otherSchoolCity: string | null;
    isMinority: string | null;
    landphoneNo: string | null;
    fatherContactno: string | null;
    motherContactNo: string | null;
    handicapped: string | null;
    dtls: string | null;
    gujraticlass: string | null;
    clubaid: number | null;
    clubbid: number | null;
    tshirtsize: string | null;
    spqtaapprovedby: number | null;
    spqtaapproveddt: Date | string | null;
    bo4_old: number | null;
    totscore_old: number | null;
    separated: string | null;
    chkflats: string | null;
    applevel: string | null;
    otp: string | null;
    fadhaarcardno: string | null;
    madhaarcardno: string | null;
    gadhaarcardno: string | null;
    backdoorflag: number | null;
    residentOfBengal: string | null;
    authToken: string | null;
    handicaptype: string | null;
    sigpath: string | null;
    dobcert: string | null;
    migrationcert: string | null;
    castcert: string | null;
    equivalencecert: string | null;
    disabilitycert: string | null;
    spectacles: string | null;
    spectaclesnote: string | null;
    illness: string | null;
    illnessnote: string | null;
    allergy: string | null;
    allergynote: string | null;
    surgery: string | null;
    surgerynote: string | null;
    otherhealthcondition: string | null;
    otherhealthconditionnote: string | null;
    adminlogin: number | null;
    masterpass: string | null;
    resismartphone: string | null;
    resilaptop: string | null;
    resiinternet: string | null;
    boardResultStatus: string | null;
    parentstaff: string | null;
    parentstaffname: string | null;
    parentstaffdeptid: number | null;
    familyalumni: string | null;
    familyalumniname: string | null;
    familyalumnirelation: string | null;
    familyalumnibatch: number | null;
    familyalumnicourseid: number | null;
    day: number | null;
    month: number | null;
    year: number | null;
    freeshipfathermobno: string | null;
    freeshipfatheroccupation: number | null;
    freeshipemployer: string | null;
    freeshipprevinstfees: string | null;
    schoolno: string | null;
    centerno: string | null;
    admintcardid: string | null;
    registrationno: string | null;
    indexno1: string | null;
    indexno2: string | null;
    boardroll1: string | null;
    boardroll2: string | null;
    photoidfather: string | null;
    photoidmother: string | null;
    photoidstudent: string | null;
    marksheetnotreceived: boolean | 0 | 1;
    migrationnotreceived: boolean | 0 | 1;
    nccQuota: string | null;
    infectedcovid19: string | null;
    vaccinated: string | null;
    vaccinename: string | null;
    othvaccinename: string | null;
    donatedblood: string | null;
    donatingblood: string | null;
    alternativeemail: string | null;
    relatedto: string | null;
    admapprovedby: number | null;
    admapprovedt: Date | string | null;
    verifytype: string | null;
    verifyremarks: string | null;
    stdheight: string | null;
    famexstudent: string | null;
    famexstdrelation: string | null;
    famexstdname: string | null;
    famexstdcourse: string | null;
    famexstdyear: number | null;
    whatsappno: string | null;
    othernationality: string | null;
    newDistrictId: number | null;
    othernewDistrict: string | null;
    resiDistrictId: number | null;
    otherresiDistrict: string | null;
    aadhaarnotuploaded: boolean | 0 | 1;
    masterpasssuper: string | null;
    newpostofficeid: number | null;
    othernewpostoffice: string | null;
    resipostofficeid: number | null;
    otherresipostoffice: string | null;
    newpolicestationid: number | null;
    othernewpolicestation: string | null;
    resipolicestationid: number | null;
    otherresipolicestation: string | null;
    prevcourseid: number | null;
    prevcollegeid: number | null;
    quotatype: string | null;
    prevcourseother: string | null;
    prevcollegeother: string | null;
}

export interface OldAdmSubjectDetails {
    readonly id: number;
    index_col: number | null;
    parent_id: number | null;
    subjectId: number | null;
    theoryFullMarks: number | null;
    practicalFullMarks: number | null;
    theoryPassMarks: number | null;
    practicalPassMarks: number | null;
    theoryMarksobtained: number | null;
    practicalMarksobtained: number | null;
    aggregate: number | null;
    totalMarks: number | null;
    marksObtained: number | null;
    totalpassmks: number | null;
    gradeid: number | null;
    levelid: number | null;
    status: string | null;
}



export interface OldBoardSubjectMapping {
    id: number | null;
    boardid: number | null;
}

export interface OldBoardSubjectMappingSub {
    readonly id: number;
    index_col: number | null;
    parent_id: number | null;
    subjectid: number;
    thfull: number | null;
    thpass: number | null;
    pracfull: number | null;
    pracpass: number | null;
}

export interface OldBoardSubjectName {
    readonly id: number;
    paperName: string;
    code: string | null;
}

export interface OldBoardResultStatus {
    id: number;
    name: string;
    spcltype: string;
    pos: number;
    flag: boolean;
}

export interface OldAdmissionStats {
    course: string;
    afternoon: number;
    day: number;
    evening: number;
    morning: number;
    total: number;
}

export interface OldStudentAcademicDetails {
    readonly id: number;
    index_col: number | null;
    parent_id: number | null;
    degreeId: number | null;
    boardId: number | null;
    year: number | null;
    percentageOfMarks: number | null;
    division: string | null;
    rank: string | null;
    institute: string | null;
    otherbrd: string | null;
    regno: string | null;
    examroll: string | null;
    examno: string | null;
    degreecourseId: number | null;
    rollno: string | null;
    prevregno: string | null;
}

export interface OldStudentSubjectDetails {
    readonly id: number;
    index_col: number |  null;
    parent_id: number |  null;
    subjectId: number |  null;
    marksObtained: number |  null;
    totalMarks: number |  null;
    othermarks: string | null;
}