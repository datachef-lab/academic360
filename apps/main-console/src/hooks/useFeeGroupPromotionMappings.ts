import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getAllFeeGroupPromotionMappings,
  createFeeGroupPromotionMapping,
  updateFeeGroupPromotionMapping,
  deleteFeeGroupPromotionMapping,
  bulkUploadFeeGroupPromotionMappings,
  NewFeeGroupPromotionMapping,
} from "@/services/fees-api";

// Query key factory
export const feeGroupPromotionMappingKeys = {
  all: ["fee-group-promotion-mappings"] as const,
  lists: () => [...feeGroupPromotionMappingKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...feeGroupPromotionMappingKeys.lists(), filters] as const,
  details: () => [...feeGroupPromotionMappingKeys.all, "detail"] as const,
  detail: (id: number) => [...feeGroupPromotionMappingKeys.details(), id] as const,
};

/**
 * Hook to fetch all fee group promotion mappings
 */
export const useFeeGroupPromotionMappings = () => {
  return useQuery({
    queryKey: feeGroupPromotionMappingKeys.lists(),
    queryFn: async () => {
      const response = await getAllFeeGroupPromotionMappings();
      return response.payload || [];
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes (React Query v4)
  });
};

/**
 * Hook to create a new fee group promotion mapping
 */
export const useCreateFeeGroupPromotionMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: NewFeeGroupPromotionMapping) => {
      const response = await createFeeGroupPromotionMapping(data);
      return response.payload;
    },
    onSuccess: () => {
      // Invalidate and refetch mappings list
      queryClient.invalidateQueries({
        queryKey: feeGroupPromotionMappingKeys.lists(),
      });
      toast.success("Fee group promotion mapping created successfully");
    },
    onError: (error: Error) => {
      console.error("Error creating fee group promotion mapping:", error);
      toast.error("Failed to create fee group promotion mapping");
    },
  });
};

/**
 * Hook to update a fee group promotion mapping
 */
export const useUpdateFeeGroupPromotionMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewFeeGroupPromotionMapping> }) => {
      const response = await updateFeeGroupPromotionMapping(id, data);
      return response.payload;
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch mappings list
      queryClient.invalidateQueries({
        queryKey: feeGroupPromotionMappingKeys.lists(),
      });
      // Also invalidate the specific detail if needed
      queryClient.invalidateQueries({
        queryKey: feeGroupPromotionMappingKeys.detail(variables.id),
      });
      toast.success("Fee group promotion mapping updated successfully");
    },
    onError: (error: Error) => {
      console.error("Error updating fee group promotion mapping:", error);
      toast.error("Failed to update fee group promotion mapping");
    },
  });
};

/**
 * Hook to delete a fee group promotion mapping
 */
export const useDeleteFeeGroupPromotionMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await deleteFeeGroupPromotionMapping(id);
      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch mappings list
      queryClient.invalidateQueries({
        queryKey: feeGroupPromotionMappingKeys.lists(),
      });
      toast.success("Fee group promotion mapping deleted successfully");
    },
    onError: (error: Error) => {
      console.error("Error deleting fee group promotion mapping:", error);
      toast.error("Failed to delete fee group promotion mapping");
    },
  });
};

/**
 * Hook to bulk upload fee group promotion mappings
 */
export const useBulkUploadFeeGroupPromotionMappings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const response = await bulkUploadFeeGroupPromotionMappings(file);
      return response.payload;
    },
    onSuccess: () => {
      // Invalidate and refetch mappings list
      queryClient.invalidateQueries({
        queryKey: feeGroupPromotionMappingKeys.lists(),
      });
    },
    onError: (error: Error) => {
      console.error("Error bulk uploading fee group promotion mappings:", error);
      toast.error("Failed to bulk upload fee group promotion mappings");
    },
  });
};
