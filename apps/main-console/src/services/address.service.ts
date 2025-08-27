import { ApiResonse } from "@/types/api-response";
import { Address } from "@/types/user/address";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/address";

export async function getAllAddresses(): Promise<ApiResonse<Address[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all addresses");
  }
}

export async function getAddressById(id: number): Promise<ApiResonse<Address | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch address with id ${id}`);
  }
}

export async function createAddress(payload: Partial<Address>): Promise<ApiResonse<Address>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create address");
  }
}

export async function updateAddress(id: number, payload: Partial<Address>): Promise<ApiResonse<Address>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update address with id ${id}`);
  }
}

export async function deleteAddress(id: number): Promise<ApiResonse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete address with id ${id}`);
  }
}
