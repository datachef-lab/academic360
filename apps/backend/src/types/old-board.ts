export interface OldBoard {
    readonly id?: number;
    boardName: string;
    baseBoard: boolean | null,
    degreeid: number;
    passmrks: number | null;
    code: string | null;
}