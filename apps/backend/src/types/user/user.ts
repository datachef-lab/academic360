import { Student } from "@/features/user/models/student.model.js"
import { User } from "@/features/user/models/user.model.js"

export type PayloadType = Student | null;

export interface UserType extends User {
    payload: PayloadType,
}