export interface Category {
    id: number;
    name: string;
    documentRequired: boolean;
    code: string;
    sequence?: number | null;
    disabled: boolean;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
  }