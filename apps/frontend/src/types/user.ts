export type User = {
    readonly id?: number;
    name: string;
    email: string;
    phone: string;
    whatsappNumber: string | undefined;
    image: string | undefined;
    type: "ADMIN" | "TEACHER" | "STUDENT";
    disabled: boolean;
    createdAt: Date | undefined;
    updatedAt: Date | undefined;
}