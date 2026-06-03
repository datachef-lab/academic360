import { StudentDto } from "@academic/db/dtos/user";
import { User } from "@academic/db/schemas";

export type PayloadType = StudentDto | null;

export interface UserType extends User {
  payload: PayloadType;
}
