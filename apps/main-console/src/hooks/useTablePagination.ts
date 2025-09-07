import { useState, useMemo } from "react";

interface UseTablePaginationProps<T> {
    data: T[];
    searchFields: (keyof T)[];
    initialItemsPerPage?: number;
}

export function useTablePagination<T>({
    data,
    searchFields,
    initialItemsPerPage = 10,
}: UseTablePaginationProps<T>) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

    // Filter data based on search term
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;

        return data.filter((item) =>
            searchFields.some((field) => {
                const value = item[field];
                return value &&
                    value.toString().toLowerCase().includes(searchTerm.toLowerCase());
            })
        );
    }, [data, searchFields, searchTerm]);

    // Pagination calculations
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Reset to first page when search changes
    const handleSearchChange = (newSearchTerm: string) => {
        setSearchTerm(newSearchTerm);
        setCurrentPage(1);
    };

    // Reset to first page when items per page changes
    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    // Reset to first page when filters change
    const resetToFirstPage = () => {
        setCurrentPage(1);
    };

    return {
        // Data
        filteredData,
        paginatedData,

        // Search
        searchTerm,
        setSearchTerm: handleSearchChange,

        // Pagination
        currentPage,
        setCurrentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        setItemsPerPage: handleItemsPerPageChange,
        startIndex,
        endIndex,

        // Utilities
        resetToFirstPage,
    };
}
