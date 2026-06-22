export interface Class {
  readonly id?: number;
  name: string;
  type: "YEAR" | "SEMESTER";
  shortName: string | null;
  sequence?: number;
  isActive?: boolean | null;
  createdAt?: Date;
  updatedAt?: Date;
}
