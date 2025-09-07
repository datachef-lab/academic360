import { StudentDto } from "@repo/db/dtos/user";
import { User } from "@repo/db/schemas";

export type PayloadType = StudentDto | null;

export interface UserType extends User {
  payload: PayloadType;
}
