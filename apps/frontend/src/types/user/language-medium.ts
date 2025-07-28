export interface LanguageMedium {
    id: number;
    name: string;
    sequence?: number | null;
    disabled: boolean;
    createdAt: string; // ISO date string
    updatedAt: string; // ISO date string
  }