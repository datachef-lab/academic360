export interface Document {
    readonly id?: number;
    name: string;
    description: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}