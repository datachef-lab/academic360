export interface Document {
    readonly id?: number;
    name: string;
    description: string | null;
    sequence: number;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}