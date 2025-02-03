export interface Religion {
    readonly id?: number;
    name: string;
    sequence: number | null;
    createdAt: Date;
    updatedAt: Date;
}