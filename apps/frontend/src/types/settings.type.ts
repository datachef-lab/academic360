export interface Settings {
    readonly id?: number;
    variant: "GENERAL" | "API_CONFIG";
    type: "NUMBER" | "TEXT" | "FILE" | "EMAIL";
    name: string;
    value: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}