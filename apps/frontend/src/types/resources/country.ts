export interface Country {
    readonly id?: number;
    name: string;
    sequence: number | null;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}