export interface CourseDetails {
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

export interface Shift {
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

export interface FreeshipMain {
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

export interface SubjectType {
    readonly id: number;
    subjectTypeName: string | null;
    rptpos: number | null;
    shortname: string | null;
}

export interface Subject {
    id: number;
    subjectName: string | null;
    subjectTypeId: number;
    univcode: string | null;
    ifgroup: boolean | 1 | 0;
}