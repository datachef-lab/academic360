export interface DbSession {
    id: number;
    sessionName: string;
    fromDate: Date;
    toDate: Date;
    iscurrentsession: boolean;
    codeprefix: string;
}