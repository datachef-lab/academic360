export interface City {
  id: number;
  stateId: number;
  name: string;
  documentRequired: boolean;
  code: string;
  sequence: number | null;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}
