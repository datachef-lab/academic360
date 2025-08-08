export type User = {
    readonly id?: number;
    name: string;
    email: string;
    phone: string;
    password: string;
    whatsappNumber: string | undefined;
    image: string | null;
    type: 'ADMIN' | 'STUDENT' | 'FACULTY' | 'STAFF' | 'PARENTS';
    disabled: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;
}