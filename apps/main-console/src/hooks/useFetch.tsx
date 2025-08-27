import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

// Generic useFetch hook that works with React Query v4
export function useFetch<T>({
  getFn,
  postFn,
  default: defaultValue,
}: {
  getFn: () => Promise<T | null>;
  postFn?: (data: T) => Promise<T>;
  default: T;
}) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Use React Query v4 syntax with proper type handling
  const query = useQuery<T | null>(
    ["fetchData"], // Query key
    getFn, // Query function
    {
      onSuccess: (fetchedData) => {
        if (fetchedData !== null) {
          setData(fetchedData);
        }
        setLoading(false);
      },
      onError: (err: unknown) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      },
      enabled: !!getFn,
      refetchOnWindowFocus: false,
    },
  );

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFn();
      if (result !== null) {
        setData(result);
      }
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [getFn]);

  const updateData = async (newData: T) => {
    if (!postFn) {
      throw new Error("postFn is required for updateData");
    }

    setLoading(true);
    try {
      const result = await postFn(newData);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    if (!query.isLoading && !query.data && !query.error) {
      refetch();
    }
  }, [query.isLoading, query.data, query.error, refetch]);

  return {
    data,
    loading: loading || query.isLoading,
    error: error || query.error,
    refetch,
    updateData,
  };
}
