import { UserType } from "../user/user.js";

export interface MarksheetLog {
  item: string;
  source: string;
  file: string | null;
  createdByUser: UserType;
  updatedByUser: UserType;
  createdAt: Date;
  updatedAt: Date;
}
