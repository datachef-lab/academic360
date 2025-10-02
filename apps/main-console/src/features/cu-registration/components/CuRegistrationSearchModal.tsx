import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, UserRoundSearch, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSearchedStudents } from "@/services/student";
import { useQuery } from "@tanstack/react-query";
import useDebounce from "@/components/Hooks/useDebounce";
import { Student } from "@/types/user/student";
import { StudentSearchColumn } from "@/components/tables/users/StudentSearchColumn";
import { DataTableStudent } from "@/components/globals/DataTableStudent";

interface CuRegistrationSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CuRegistrationSearchModal({ open, onOpenChange }: CuRegistrationSearchModalProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[] | undefined>();
  const [isSearching, setIsSearching] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const debouncePagination = useDebounce(pagination, 400);
  const lastPageCountRef = useRef(0);
  const isNavigatingRef = useRef(false);

  const resetState = useCallback(() => {
    setSearchQuery("");
    setSearchResults(undefined);
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, []);

  useEffect(() => {
    if (!open && !isNavigatingRef.current) {
      resetState();
    }
  }, [open, resetState]);

  const { refetch: getSearchStudent, isLoading } = useQuery({
    queryKey: ["CuRegistrationSearchStudent", debouncePagination],
    queryFn: () => getSearchedStudents(searchQuery, debouncePagination.pageIndex + 1, debouncePagination.pageSize),
    enabled: false,
  });

  // Handle search
  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const { data } = await getSearchStudent();
      setSearchResults(data?.content as unknown as Student[]);
    } catch (error) {
      console.warn(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewStudent = useCallback(
    (studentId: number) => {
      isNavigatingRef.current = true;
      onOpenChange(false);
      setTimeout(() => {
        navigate(`/dashboard/cu-registration/${studentId}`);
        isNavigatingRef.current = false;
      }, 100);
    },
    [navigate, onOpenChange],
  );

  const handleModalClose = useCallback(
    (open: boolean) => {
      if (!open && !isNavigatingRef.current) {
        resetState();
      }
      onOpenChange(open);
    },
    [onOpenChange, resetState],
  );

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Students for CU Registration
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col p-6 bg-gradient-to-br from-purple-50 to-blue-50">
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by UID, Roll Number, or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg border-2 border-purple-200 focus:border-purple-400 rounded-xl"
                />
                <Button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isLoading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 hover:bg-purple-700 rounded-lg px-4"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                {!searchQuery.trim() ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center bg-transparent"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl"></div>
                      <Users className="h-20 w-20 mb-4 text-purple-200 relative z-10" />
                    </div>
                    <p className="text-center text-2xl text-white font-semibold">Search for Students</p>
                    <p className="text-center text-base text-purple-100 mt-2">
                      Enter UID, Roll Number, or Name to find students
                    </p>
                  </motion.div>
                ) : isSearching ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center bg-transparent"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl"></div>
                      <Loader2 className="h-20 w-20 mb-4 text-purple-200 relative z-10 animate-spin" />
                    </div>
                    <p className="text-center text-2xl text-white font-semibold">Searching...</p>
                    <p className="text-center text-base text-purple-100 mt-2">
                      Finding students matching your criteria
                    </p>
                  </motion.div>
                ) : (searchResults ?? []).length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center bg-transparent"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl"></div>
                      <UserRoundSearch className="h-20 w-20 mb-4 text-purple-200 relative z-10" />
                    </div>
                    <p className="text-center text-2xl text-white font-semibold">No students found</p>
                    <p className="text-center text-base text-purple-100 mt-2">Try adjusting your search criteria</p>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full"
                  >
                    <DataTableStudent
                      isLoading={isLoading}
                      columns={StudentSearchColumn}
                      data={searchResults || []}
                      pageCount={lastPageCountRef.current}
                      pagination={pagination}
                      onPaginationChange={setPagination}
                      onViewStudent={handleViewStudent}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
