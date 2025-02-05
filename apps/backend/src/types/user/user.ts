import { Student } from "@/features/user/models/student.model.ts"
import { User } from "@/features/user/models/user.model.ts"

export type PayloadType = Student | undefined;

export interface UserType extends User {
    payload: PayloadType,
}