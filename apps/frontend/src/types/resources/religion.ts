export interface Religion {
    readonly id?: number;
    name: string;
    sequence: number;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}