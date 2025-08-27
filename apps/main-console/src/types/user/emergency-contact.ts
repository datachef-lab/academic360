export interface EmergencyContact {
    readonly id?: number;
    studentId: number,
    personName: string | null,
    relationToStudent: string | null,
    email: string | null,
    phone: string | null,
    officePhone: string | null,
    residentialPhone: string | null,
    createdAt?: Date;
    updatedAt?: Date;
}