export interface BloodGroup {
    readonly id?: number;
    type: string;
    sequence: number  | null;
    disabled?: boolean;
    createdAt: Date;
    updatedAt: Date;
}