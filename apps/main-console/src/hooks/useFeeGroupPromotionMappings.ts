import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { FeeGroupPromotionMappingDto } from "@repo/db/dtos/fees";
import {
  getAllFeeGroupPromotionMappings,
  createFeeGroupPromotionMapping,
  updateFeeGroupPromotionMapping,
  deleteFeeGroupPromotionMapping,
  bulkUploadFeeGroupPromotionMappings,
  NewFeeGroupPromotionMapping,
} from "@/services/fees-api";

// Query key factory - v2 busts cache after limit fix (was returning 10 instead of limit)
export const feeGroupPromotionMappingKeys = {
  all: ["fee-group-promotion-mappings", "v2"] as const,
  lists: () => [...feeGroupPromotionMappingKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...feeGroupPromotionMappingKeys.lists(), filters] as const,
  details: () => [...feeGroupPromotionMappingKeys.all, "detail"] as const,
  detail: (id: number) => [...feeGroupPromotionMappingKeys.details(), id] as const,
};

/**
 * Hook to fetch all fee group promotion mappings
 * @param limit - Max number of rows to fetch (default 10000)
 * @param enabled - If false, query won't run (e.g. until filters are applied)
 */
export const useFeeGroupPromotionMappings = (limit: number = 10000, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...feeGroupPromotionMappingKeys.lists(), { limit, enabled }],
    queryFn: async () => {
      const response = await getAllFeeGroupPromotionMappings(limit);
      return response.payload || [];
    },
    enabled,
    staleTime: 0, // Always refetch to ensure we get full dataset (limit may have changed)
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<NewFeeGroupPromotionMapping>;
    }) => {
      const response = await updateFeeGroupPromotionMapping(id, data);
      return response.payload;
    },
    onSuccess: (data, variables) => {
      // PUT returns modelToDto — it does not include list-only fields (totalPayableAmount, paymentStatus, …)
      // that getAllFeeGroupPromotionMappings computes. A plain { ...m, ...dto } merge leaves stale amounts
      // until refetch finishes, which feels like a "late" table update.
      if (data && typeof (data as FeeGroupPromotionMappingDto).id === "number") {
        const dto = data as FeeGroupPromotionMappingDto;
        queryClient.setQueriesData<FeeGroupPromotionMappingDto[]>(
          { queryKey: feeGroupPromotionMappingKeys.lists() },
          (old) => {
            if (!old?.length) return old;
            return old.map((m) => {
              if (m.id !== dto.id) return m;
              return {
                ...m,
                ...dto,
                paymentStatus: m.paymentStatus,
                amountToPay: m.amountToPay,
                totalPayableAmount: m.totalPayableAmount,
                saveBlockedForEdit: m.saveBlockedForEdit,
              };
            });
          },
        );
      }
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
