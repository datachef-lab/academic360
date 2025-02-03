export interface Document {
    readonly id?: number;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}