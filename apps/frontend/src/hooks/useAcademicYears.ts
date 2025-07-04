import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllAcademicYears, getAcademicYearById, createAcademicYear, updateAcademicYearById, deleteAcademicYearById } from '@/services/academic-year-api';
import { AcademicYear } from '@/types/fees';
import { toast } from 'sonner';
import { getAllShifts } from '../services/academic';
import { useState, useEffect } from 'react';
import { Shift } from '@/types/academics/shift';

// Hook for fetching all academic years
export const useAcademicYears = () => {
    return useQuery({
        queryKey: ['academic-years'],
        queryFn: async () => {
            const response = await getAllAcademicYears();
            return response.payload || [];
        },
    });
};

// Hook for fetching a single academic year by ID
export const useAcademicYearById = (id: number) => {
    return useQuery({
        queryKey: ['academic-year', id],
        queryFn: async () => {
            const response = await getAcademicYearById(id);
            return response.payload;
        },
        enabled: !!id,
    });
};

// Hook for creating academic year
export const useCreateAcademicYear = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (academicYear: Omit<AcademicYear, 'id' | 'createdAt' | 'updatedAt'>) => {
            const response = await createAcademicYear(academicYear);
            return response.payload;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] });
            toast.success('Academic year created successfully');
        },
        onError: (error) => {
            console.error('Error creating academic year:', error);
            toast.error('Failed to create academic year');
        },
    });
};

// Hook for updating academic year
export const useUpdateAcademicYear = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, academicYear }: { id: number; academicYear: Partial<AcademicYear> }) => {
            const response = await updateAcademicYearById(id, academicYear);
            return response.payload;
        },
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] });
            queryClient.invalidateQueries({ queryKey: ['academic-year', id] });
            toast.success('Academic year updated successfully');
        },
        onError: (error) => {
            console.error('Error updating academic year:', error);
            toast.error('Failed to update academic year');
        },
    });
};

// Hook for deleting academic year
export const useDeleteAcademicYear = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const response = await deleteAcademicYearById(id);
            return response.payload;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] });
            toast.success('Academic year deleted successfully');
        },
        onError: (error) => {
            console.error('Error deleting academic year:', error);
            toast.error('Failed to delete academic year');
        },
    });
};

export function useShifts() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        getAllShifts()
            .then(data => {
                setShifts(data as Shift[]);
                setLoading(false);
            })
            .catch(err => {
                setError(err);
                setLoading(false);
            });
    }, []);

    return { shifts, loading, error };
} 