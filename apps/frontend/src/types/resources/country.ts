export interface Country {
    readonly id?: number;
    name: string;
    sequence: number;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}