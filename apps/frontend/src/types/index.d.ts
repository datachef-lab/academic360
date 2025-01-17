export type User = {
    readonly id?: number;
    name: string;
    email: string;
    phone: string;
    image: string | null;
    type: "ADMIN" | "TEACHER" | "STUDENT";
    disabled: boolean;
}