export interface IssuedBookDetails {
    // Book Details
    mainTitle: string;
    subTitle: string | null;
    alternateTitle: string | null;
    isbn: string;
    edition: string;
    editionYear: string;
    bookVolume: string | null;
    bookPart: string | null;
    libMasterName: string;
    subjectGroupId: number;
    subjectgroupName: string;
    generalSubject: string;
    languageName: string;
    callNo: string;
    publisherName: string;
    publisherAddress: string;

    // Issued Details
    borrowingTypeId: number;
    borrowingTypeName: string;
    issueDate: string;
    returnDate: string;
    actualRetDate: string | null;
    isReturn: boolean;
    fine: number;
    reIssue: boolean;
    isForceIssue: boolean;

    // Copy Details
    copyId: number;
    copyTypeId: number;
    issueType: string;
    statusId: number;
    statusName: string;
    rackId: number | null;
    rackName: string | null;
    selfId: number | null;
    shelfName: string | null;
    encloserTypeId: number | null;
    enclosetypeName: string | null;
    noOfEncloser: number | null;
    noOfPages: number | null;
    priceINR: number | null;
    bindingTypeName: string | null;
    departmentId: number | null;
    department: string | null;
}

export interface LibraryVisit {
    readonly id: number;
    libMasterId: number;
    libMasterName: string;
    entrydt: string | Date | null;
    entrytime: string | Date;
    exittime: string | null;
}
