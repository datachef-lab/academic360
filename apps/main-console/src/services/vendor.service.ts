import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type LibraryVendorRow = {
  id: number;
  legacyVendorId: number | null;

  name: string;
  code: string | null;

  email: string;
  phone: string;
  website: string | null;

  personOfContact: string | null;
  personOfContactEmail: string | null;
  personOfContactPhone: string | null;

  pan: string;

  createdAt: string;
  updatedAt: string;
};

export type LibraryVendorListPayload = {
  rows: LibraryVendorRow[];
  total: number;
  page: number;
  limit: number;
};

export type vendorParams = {
  page: number;
  limit: number;
  search?: string;
};

export type VendorBody = {
  legacyVendorId: number | null;
  name: string;
  email: string;
  phone: string;
  pan: string;

  code?: string | null;
  website?: string | null;

  personOfContact?: string | null;
  personOfContactEmail?: string | null;
  personOfContactPhone?: string | null;
};

export const BASE_URL = "/api/library/vendors";

export async function getAllVendors(
  params?: vendorParams,
): Promise<ApiResponse<LibraryVendorListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryVendorListPayload>>(
    "/api/library/vendors/query",
    { params },
  );
  return res.data;
}

export const getVendorById = async (id: number): Promise<ApiResponse<LibraryVendorRow>> => {
  const res = await axiosInstance.get<ApiResponse<LibraryVendorRow>>(`${BASE_URL}/${id}`);
  return res.data;
};

export async function createVendor(body: VendorBody): Promise<ApiResponse<LibraryVendorRow>> {
  const res = await axiosInstance.post<ApiResponse<LibraryVendorRow>>(BASE_URL, body);
  return res.data;
}

export async function updateVendor(
  id: number,
  body: Partial<LibraryVendorRow>,
): Promise<ApiResponse<LibraryVendorRow>> {
  const res = await axiosInstance.put<ApiResponse<LibraryVendorRow>>(`${BASE_URL}/${id}`, body);
  return res.data;
}

export async function deleteVendor(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
  return res.data;
}

export const useVendorsData = (params?: vendorParams) => {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ["vendors", params],
    queryFn: () => getAllVendors(params),
    placeholderData: (previousData) => previousData,
  });
  return { data, isLoading, isFetching, isError, error, refetch };
};

export const useVendorById = (id: number) => {
  return useQuery({
    queryKey: ["vendors", id],
    queryFn: () => getVendorById(id),
    enabled: !!id,
  });
};

export const useCreateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: VendorBody) => createVendor(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
};

export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: VendorBody }) => updateVendor(id, body),
    onSuccess: (_data, { id }) => {
      // Invalidate list and the specific vendor's detail cache
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendors", id] });
    },
  });
};

export const useDeleteVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
};
