import { BindingT, BookCirculationT, BookT, BorrowingTypeT, CopyDetailsT, EnclosureT, EntryModeT, JournalT, LibraryArticleT, LibraryDocumentTypeT, LibraryEntryExitT, LibraryPeriodT, PublisherT, RackT, SeriesT, ShelfT, StatusT } from "@/schemas/models/library";
import { SubjectGroupingMainDto } from "../course-design";
import { AddressDto, PersonDto } from "../user";
import { LanguageMediumT, PaymentT, UserT } from "@/schemas";

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
    reissues: BookCirculationDto[];
    borrowingType: BorrowingTypeT | null;
    fineWaivedBy: UserT | null;
    payment: PaymentT | null;
    issuedFrom: UserT;
    returnedToFrom: UserT | null;
}

export interface LibraryEntryExitDto extends Omit<LibraryEntryExitT, "userId"> {
    user: UserT;
}