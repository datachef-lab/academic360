const API_URL = "/api/affiliation-types";

export interface AffiliationType {
  id: string;
  name: string;
  description?: string | null;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AffiliationTypeData {
  name: string;
  description?: string | null;
  code: string;
  isActive: boolean;
}

export const getAllAffiliationTypes = async (): Promise<AffiliationType[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch affiliation types");
  }
  return response.json();
};

export const getAffiliationTypeById = async (id: string): Promise<AffiliationType> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch affiliation type with id ${id}`);
  }
  return response.json();
};

export const createAffiliationType = async (data: AffiliationTypeData): Promise<AffiliationType> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create affiliation type");
  }
  return response.json();
};

export const updateAffiliationType = async (id: string, data: Partial<AffiliationTypeData>): Promise<AffiliationType> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update affiliation type with id ${id}`);
  }
  return response.json();
};

export const deleteAffiliationType = async (id: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete affiliation type with id ${id}`);
  }
  return response.json();
};
