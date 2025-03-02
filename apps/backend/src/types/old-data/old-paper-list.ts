export interface OldPaperList {
    readonly id?: number;
    index_col: number | null;
    parent_id: number;
    paperName: string;
    paperShortName: string;
    isPractical: boolean;
    paperCreditPoint: number | null;
    paperType: string | null;
    displayName: string | null;
}