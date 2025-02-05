export interface State {
    readonly id?: number;
    country: string | null;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}