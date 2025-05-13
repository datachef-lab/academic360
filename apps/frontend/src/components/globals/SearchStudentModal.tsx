import { useRef, useState, useEffect, useCallback } from "react";
import bhawanipurImg from "@/assets/bhawanipurImg.jpg";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, UserRoundSearch, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSearchedStudents } from "@/services/student";
import { useQuery } from "@tanstack/react-query";
import useDebounce from "../Hooks/useDebounce";
import { Student } from "@/types/user/student";
import { StudentSearchColumn } from "../tables/users/StudentSearchColumn";
import { DataTableStudent } from "./DataTableStudent";

interface SearchStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchStudentModal({ open, onOpenChange }: SearchStudentModalProps) {
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
    queryKey: ["SearchStudent", debouncePagination],
    queryFn: () =>
      getSearchedStudents(
        debouncePagination.pageIndex + 1,
        debouncePagination.pageSize,
        searchQuery
      ),
    enabled: false,
  });

  // Handle search
  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const { data } = await getSearchStudent();
      setSearchResults(data?.payload.content);
    } catch (error) {
      console.warn(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewStudent = useCallback((studentId: number) => {
    isNavigatingRef.current = true;
    onOpenChange(false);
    setTimeout(() => {
      navigate(`/home/search-students/${studentId}`);
      isNavigatingRef.current = false;
    }, 100); 
  }, [navigate, onOpenChange]);

  
  const handleModalClose = useCallback((open: boolean) => {
    if (!open && !isNavigatingRef.current) {
      resetState();
    }
    onOpenChange(open);
  }, [onOpenChange, resetState]);

  return (
    <Dialog open={open} onOpenChange={handleModalClose}>
      <DialogContent className="sm:max-w-[900px] md:max-w-[1000px] h-[90vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border-0 shadow-2xl">
        <div className="fixed inset-0 w-full h-full ">
          <img 
            src={bhawanipurImg}
            alt="Background" 
            className="w-full h-full object-cover opacity-90  blur-[3px]"
          />
          <div className="absolute inset-0 bg-purple-900/75 backdrop-blur-[1px]"></div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="relative bg-white/15 backdrop-blur-2xl px-8 py-6 rounded-t-2xl border-b border-purple-300/40 shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
        >
          <DialogHeader className="pb-2">
            <DialogTitle className="text-4xl font-bold flex items-center gap-3 text-white drop-shadow-lg">
              <UserRoundSearch className="h-8 w-8" />
              Search Student
            </DialogTitle>
            <p className="text-base text-purple-100 font-medium mt-3 tracking-wide">
              Search for students by name, ID, or roll number
            </p>
          </DialogHeader>
        </motion.div>

        <div className="relative flex-1 overflow-hidden">
          <div className="h-full flex flex-col p-8 gap-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div className="relative md:col-span-3">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-300 h-5 w-5" />
                <Input
                  placeholder="Search by name, ID, or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-white/30  border-purple-300/40 text-white placeholder:text-purple-200/70 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/30 focus:ring-opacity-50 transition-all duration-200 rounded-xl text-base"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                className="h-12 bg-purple-600 hover:bg-purple-600  text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/25 rounded-xl text-lg font-medium"
              >
                {isSearching ? 
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 
                  <Search className="h-5 w-5 mr-2" />
                }
                Search
              </Button>
            </motion.div>

            <div className="flex-1 min-h-0 bg-white/20 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
              <div className="bg-purple-900/50 p-5 text-sm font-medium text-white border-b border-purple-300/20">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Search Results ({(searchResults ?? []).length} students)
                </span>
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                  {isSearching ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center bg-transparent"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-2xl animate-pulse"></div>
                        <Loader2 className="h-14 w-14 animate-spin text-purple-300 relative z-10" />
                      </div>
                      <p className="text-center text-base text-purple-100 mt-6 font-medium">Searching for students...</p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
