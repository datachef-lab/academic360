export interface AddressDto {
  id: number;
  addressLine: string | null;
  landmark: string | null;
  otherCity: string | null;
  otherState: string | null;
  otherCountry: string | null;
  country?: any | null;
  state?: any | null;
  city?: any | null;
  district?: any | null;
}

const API_BASE_URL = "http://localhost:8080/api/address";

export const addressService = {
  async getAll(): Promise<AddressDto[]> {
    const res = await fetch(API_BASE_URL, { headers: { "Content-Type": "application/json" } });
    if (!res.ok) throw new Error(`Failed to fetch addresses (${res.status})`);
    const json: any = await res.json();
    return (json?.data ?? json?.payload) || [];
  },
};

import { ApiResponse } from "@/types/api-response";
import { Address } from "@/types/user/address";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/address";

export async function getAllAddresses(): Promise<ApiResponse<Address[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all addresses");
  }
}

export async function getAddressById(id: number): Promise<ApiResponse<Address | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch address with id ${id}`);
  }
}

export async function createAddress(payload: Partial<Address>): Promise<ApiResponse<Address>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create address");
  }
}

export async function updateAddress(id: number, payload: Partial<Address>): Promise<ApiResponse<Address>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update address with id ${id}`);
  }
}

// District API
export interface DistrictOption {
  id: number;
  name: string;
}
export async function getDistrictsByState(stateId: number): Promise<DistrictOption[]> {
  const res = await axiosInstance.get(`/api/districts`, { params: { stateId } });
  const data = res.data?.payload ?? res.data?.data ?? [];
  return data as DistrictOption[];
}

export async function deleteAddress(id: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete address with id ${id}`);
  }
}
