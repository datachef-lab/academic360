export interface Board {
    readonly id?: number;
    boardName: string;
    baseBoard: boolean | null,
    degreeid: number;
    passmrks: number | null;
    code: string | null;
}