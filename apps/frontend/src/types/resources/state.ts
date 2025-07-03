export interface State {
    readonly id?: number;
    country: string | null;
    name: string;
    sequence: number;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}