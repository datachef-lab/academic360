export interface Nationality {
    id: number;
    name: string;
    code?: number | null;
    sequence?: number | null;
    disabled: boolean;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
  }