import { useQuery, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
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
  list: (filters?: Record<string, unknown>) => [...feeGroupPromotionMappingKeys.lists(), filters] as const,
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<NewFeeGroupPromotionMapping> }) => {
      const response = await updateFeeGroupPromotionMapping(id, data);
      return response.payload;
    },
    /**
     * Optimistic update for super-fast UI:
     * - Immediately patches the affected mapping in all cached lists
     * - Rolls back if the request fails
     * - Still keeps server as source of truth via onSuccess
     */
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches so we don't overwrite our optimistic update
      await queryClient.cancelQueries({
        queryKey: feeGroupPromotionMappingKeys.lists(),
      });

      // Take a snapshot of current cached lists so we can roll back on error
      const listKey = feeGroupPromotionMappingKeys.lists() as QueryKey;
      const previousLists = queryClient.getQueriesData(listKey) as [QueryKey, unknown][];

      // Helper: strip undefined fields so we don't overwrite existing values with undefined
      const cleanPatch: Record<string, unknown> = { ...data };
      Object.keys(cleanPatch).forEach((key) => {
        if (cleanPatch[key] === undefined) {
          delete cleanPatch[key];
        }
      });

      // Optimistically update all list queries containing this mapping
      previousLists.forEach(([queryKey, oldValue]) => {
        if (!Array.isArray(oldValue)) return;
        queryClient.setQueryData(
          queryKey,
          oldValue.map((m: any) => (m?.id === id ? { ...m, ...cleanPatch } : m)),
        );
      });

      return { previousLists };
    },
    onError: (error: Error, _variables, context) => {
      console.error("Error updating fee group promotion mapping:", error);

      // Roll back to previous cached values if we have them
      if (context?.previousLists) {
        context.previousLists.forEach(([prevKey, oldValue]) => {
          queryClient.setQueryData(prevKey, oldValue);
        });
      }

      toast.error("Failed to update fee group promotion mapping");
    },
    onSuccess: (data, variables) => {
      // Merge server response into caches (keeps any recalculated fields like amountToPay)
      if (data) {
        // Update all list queries
        queryClient.setQueriesData(
          { queryKey: feeGroupPromotionMappingKeys.lists(), exact: false },
          (oldValue: unknown) => {
            if (!Array.isArray(oldValue)) return oldValue;

            // Clean server payload to avoid overriding with undefined
            const cleanServer: Record<string, unknown> = { ...data };
            Object.keys(cleanServer).forEach((key) => {
              if (cleanServer[key] === undefined) {
                delete cleanServer[key];
              }
            });

            return oldValue.map((m: any) => (m?.id === variables.id ? { ...m, ...cleanServer } : m));
          },
        );

        // Update the detail cache for this mapping as well
        queryClient.setQueryData(feeGroupPromotionMappingKeys.detail(variables.id), (old: any) => ({
          ...old,
          ...data,
        }));
      }

      toast.success("Fee group promotion mapping updated successfully");
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
