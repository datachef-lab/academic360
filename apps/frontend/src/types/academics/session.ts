export interface Session {
    readonly id?: number;
    name: string;
    from: Date;
    to: Date;
    isCurrentSession: boolean;
    codePrefix: string;
    sequence: number;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}