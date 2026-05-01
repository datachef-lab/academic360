import { BindingT, BookCirculationT, BookT, BorrowingTypeT, CopyDetailsT, EnclosureT, EntryModeT, JournalT, LibraryArticleT, LibraryDocumentTypeT, LibraryEntryExitT, LibraryPeriodT, PublisherT, RackT, SeriesT, ShelfT, StatusT } from "@/schemas/models/library";
import { SubjectGroupingMainDto } from "../course-design";
import { AddressDto, PersonDto } from "../user";
import { LanguageMediumT, PaymentT, UserT } from "@/schemas";
import { BookReissueT } from "@/schemas/models/library/book-reissue.model";

export interface PublisherDto extends PublisherT {
    address: AddressDto | null;
}

export interface JournalDto extends Omit<JournalT, 
    "subjectGroupId"
    | "entryModeId"
    | "publisherId"
    | "languageId"
    | "bindingId"
    | "periodId"
> {
    subjectGroup: SubjectGroupingMainDto | null;
    entryMode: EntryModeT | null;
    publisher: PublisherDto | null;
    language: LanguageMediumT | null;
    bindingType: BindingT | null;
    period: LibraryPeriodT | null;
}

export interface LibraryDocumentTypeDto extends Omit<LibraryDocumentTypeT, "libraryArticleId"> {
    libraryArticle: LibraryArticleT;
}

export interface BookDto extends Omit<BookT,
    "libraryDocumentTypeId"
    | "subjectGroupId"
    | "languageId"
    | "seriesId"
    | "publisherId"
    | "journalId"
    | "enclosureId"
    | "createdById"
    | "updatedById"
> {
    documentType: LibraryDocumentTypeDto | null;
    subjectGroup: SubjectGroupingMainDto | null;
    language: LanguageMediumT | null;
    series: SeriesT | null;
    publisher: PublisherDto | null;
    journal: JournalDto | null;
    enclosure: EnclosureT | null;
    createdBy: UserT;
    updatedBy: UserT;
}

export interface CopyDetailsDto extends Omit<CopyDetailsT, 
    "bookId"
    | "statusId"
    | "enntryModeId"
    | "rackId"
    | "shelfId"
    | "enclosureId"
    | "bindingTypeId"
    | "donorPersonId"
    | "createdById"
    | "updatedById"
> {
    book: BookDto;
    status: StatusT | null;
    entryMode: EntryModeT | null;
    rack: RackT | null;
    shelf: ShelfT | null;
    enclosure: EnclosureT | null;
    bindingType: BindingT | null;
    DonorPerson: PersonDto | null;
    createdBy: UserT;
    updatedBy: UserT;
}

export interface BookCirculationDto extends Omit<BookCirculationT, 
    "reIssuedFromParentId" 
    | "copyDetailsId" 
    | "userId"
    | "borrowingTypeId"
    | "fineWaivedById"
    | "paymentId"
    | "issuedFromId"
    | "returnedToId"
> {
    copyDetails: CopyDetailsDto;
    user: UserT;
    reissues: BookReissueT[];
    borrowingType: BorrowingTypeT | null;
    fineWaivedBy: UserT | null;
    payment: PaymentT | null;
    issuedFrom: UserT;
    returnedToFrom: UserT | null;
}

export interface LibraryEntryExitDto extends Omit<LibraryEntryExitT, "userId"> {
    user: UserT;
}

export interface OldLanguage {
    readonly id: number;
    languageName: string;
}

export interface OldSeries {
    readonly id: number;
    seriesName: string;
}

export interface OldPublisher {
    readonly id: number;
    publisherName: string;
    publisherCode: number;
    address: string | null;
}

export interface OldEnclosure {
    readonly id: number;
    enclosetypeName: string;
}

export interface OldEntryMode {
    readonly id: number;
    entrymodeName: string;
}

export interface OldJournalType {
    readonly id: number;
    journalType: string;
}

export interface OldJournalMaster {
    readonly id: number;
    title: string;
    journalTypeId: number;
    entryModeId: number;
    publisherId: number;
    languageId: number;
    bindingTypeId: number;
    periodId: number;
    subjectGroupId: number;
    spcificSubjectId: number;
    issnNo: string | null;
    sizeIncm: string | null;
}

export interface OldStatus {
    readonly id: number;
    statusName: string;
    issue: boolean | null;
    issueTo: string | number;
    chkreturn: boolean | null;
    chkremove: boolean | null;
}

export interface OldRack {
    readonly id: number;
    rackName: string;
}

export interface OldShelf {
    readonly id: number;
    shelfName: string;
}

export interface OldBindingType {
    readonly id: number;
    bindingTypeName: string;
}

export interface OldPeriod {
    readonly id: number;
    periodName: string;
}

export interface OldLibraryArticle {
    readonly id: number;
    latypeName: string;
    isDocTypeExist: boolean | 0 | 1;
    isUniqueAccessNo: boolean | 0 | 1;
    isJournal: boolean | 0 | 1;
    isImprint: boolean | 0 | 1;
    isCopyDeatil: boolean | 0 | 1;
    isAuthor: boolean | 0 | 1;
    isKeyword: boolean | 0 | 1;
    isRemarks: boolean | 0 | 1;
    isCallNo: boolean | 0 | 1;
    isEnclosure: boolean | 0 | 1;
    isVoucher: boolean | 0 | 1;
    isAnalytical: boolean | 0 | 1;
    isCallNoAuto: boolean | 0 | 1;
    isCallNoCompulsory: boolean | 0 | 1;
    isPublisher: boolean | 0 | 1;
    isNote: boolean | 0 | 1;
    codeno: string;
}

export interface OldBorrowingType {
    readonly id: number;
    borrowingtypeName: string;
    searchGuideline: boolean | 0 | 1;
    pos: number | null;
}

export interface OldDocumentTypeList {
    readonly id: number;
    parent_id: number;
    documentName: string;
}

export interface OldBookEntry {
    readonly id: number;
    libraryArticleId: number;
    documentTypeId: number;
    mainTitle: string;
    subTitle: string | null;
    alternateTitle: string | null;
    languageId: number | null;
    isbn: string | null;
    issueDate: string | Date | null;
    edition: string | null;
    editionYear: string | null;
    bookVolume: string | null;
    bookPart: string | null;
    seriesId: number | null;
    pubNameId: number | null;
    pubYear: string | null;
    keyword: string | null;
    remarks: string | null;
    subjectGroupId: number | null;
    spcificSubjectId: string | null;
    callNo: string | null;
    journalTypeId: number | null;
    journalId: number | null;
    issueNo: string | null;
    uniqueAccess: boolean | 0 | 1;
    encloserParentId: number | null;
    modifiedById: number | null;
    modifedDate: string | Date | null;
    note: string | null;
    issueDate1: Date | string | null;
    issueDate2: Date | string | null;
    monthFromat1: number | string | null;
    monthFromat2: number | string | null;
    entryDate: Date | string | null;
    frontCover: string | null;
    backCover: string | null;
    softCopy: string | null;
    frequency: number | string | null;
    refNo: string | null;


}

export interface OldCopyDetails {
    readonly id: number | null;
    index_col: number | null;
    parent_id: number | null;
    accessNo: number | null;
    copyTypeId: string | null;
    issueType: string | null;
    statusId: number | null;
    entityModeId: number | null;
    rackId: number | null;
    selfId: number | null;
    voucherNo: string | null;
    encloserTypeId: number | null;
    noOfEncloser: number | null;
    noOfPages: string | null;
    oldAccessNo: number | null;
    priceINR: number | null;
    currencyId: number | null;
    priceForeign: number | null;
    bindingId: number | null;
    pubId: number | null;
    departmentId: number | null;
    entrydate: string | Date | null;
    isbn: string | null;
    bookVolume: string | null;
    bookPart: string | null;
    bookPartInfo: string | null;
    volInfo: string | null;
    remark: string | null;
    pubYear: string | null;
    setprice: string | null;
    purchaseprice: number | null;
    vendorid: number | null;
    donorid: number | null;
    prefixid: string | null;
    suffixid: number | null;
    pdfpath: string | null;
    booksize: string | null;
    billdate: string | Date | null;
    chknewarv: boolean | 0 | 1;
    srlsubject: number | null;
    createdById: number | null;
    discount: string | null | null;
    modifiedById: number | null;
    creationDate: string | Date | null;
    modifiedDate: string | Date | null;
    shippingcharge: string | null;
}


export interface OldLibraryEntryExit {
    readonly id: number;
    usrtype: "Student" | "Staff" | "Teacher";
    usrid: number;
    entrydt: string | Date | null;
    entrytime: string | null;
    exittime: string | null;
    libmasterid: number | null;
    dtfg: number | null;
}


export interface OldIssueReturn {
    id: number | null;
    userId: number | null;
    userTypeId: "Student" | "Teacher" | "Staff";
    libraryMasterId: number | null;
    bookId: number | null;
    libArticleId: number | null;
    borrowingTypeId: number | null;
    issueDate: string | null | Date;
    returnDate: string | null | Date;
    actualRetDate: string | null | Date;
    remarks: string | null;
    isReturn: boolean | 0 | 1;
    fine: number | null;
    reIssue: boolean | 0 | 1;
    isForceIssue: boolean | 0 | 1;
    copyId: number | null;
    finepaid: number | null;
    finewaived: number | null;
    fineremarks: string | null;
    fineDate: string | null | Date;
    dtfg: number | null;
    issuerid: number | null;
    returnerid: number | null;
}

export interface OldSubjectGroup {
    readonly id: number;
    subjectgroupName: string;
}