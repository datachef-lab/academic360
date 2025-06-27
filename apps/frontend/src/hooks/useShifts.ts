import useSWR from 'swr';
import { getAllShifts } from '@/services/academic';
import { Shift } from '@/types/resources/shift';

const fetcher = async (): Promise<Shift[]> => {
    const res = await getAllShifts();
    console.log("Shifts API response:", res);
    return res;
};

export function useShifts() {
  const { data, error, isLoading } = useSWR<Shift[]>('api/v1/academics/shifts', fetcher);

  console.log("Shifts data:", data);
  console.log("Shifts error:", error);

  return {
    shifts: data || [],
    loading: isLoading,
    error: error,
  };
} 