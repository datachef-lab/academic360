import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, User, FileText, Clock, CheckCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSearchedStudents } from "@/services/student";
import { StudentSearchItem } from "@/services/student";

interface CuRegistrationSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProcessControls?: () => void;
}

export function CuRegistrationSearch({ isOpen, onClose, onOpenProcessControls }: CuRegistrationSearchProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StudentSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await getSearchedStudents(searchQuery.trim(), 1, 10);
          setSearchResults(response.content || []);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const totalItems = searchQuery.trim() ? searchResults.length : 4; // 4 navigation items

    switch (e.key) {
      case "Escape":
        onClose();
        break;
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (searchQuery.trim() && searchResults.length > 0 && selectedIndex < searchResults.length) {
          const student = searchResults[selectedIndex];
          if (student) {
            handleStudentSelect(student);
          }
        } else if (!searchQuery.trim()) {
          handleActionSelect(selectedIndex);
        }
        break;
    }
  };

  const handleStudentSelect = (student: StudentSearchItem) => {
    navigate(`/dashboard/cu-registration/${student.uid || student.id}`);
    onClose();
  };

  const handleActionSelect = (index: number) => {
    const actions = [
      () => {
        onClose();
        onOpenProcessControls?.();
      },
      () => {
        onClose();
        // Navigate to registration reports
        console.log("Open Registration Reports");
      },
      () => {
        // Focus on search input for student search
        if (inputRef.current) {
          inputRef.current.focus();
        }
      },
      () => {
        onClose();
        // Navigate to registration timeline
        console.log("Open Registration Timeline");
      },
    ];

    if (actions[index]) {
      actions[index]();
    }
  };

  const cuRegistrationActions = [
    {
      icon: CheckCircle,
      title: "Process Controls",
      description: "Configure subject selection and registration processes",
      bgColor: "bg-emerald-50",
      iconBgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      icon: FileText,
      title: "Registration Reports",
      description: "View CU registration statistics and reports",
      bgColor: "bg-blue-50",
      iconBgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: User,
      title: "Student Search",
      description: "Search for students by UID, name, or roll number",
      bgColor: "bg-purple-50",
      iconBgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      icon: Clock,
      title: "Registration Timeline",
      description: "View registration deadlines and schedules",
      bgColor: "bg-orange-50",
      iconBgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-slate-600" />
            <Input
              ref={inputRef}
              placeholder="Search commands or type a student UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 shadow-none text-lg placeholder:text-slate-400 focus-visible:ring-0"
            />
          </div>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {searchQuery.trim() ? (
            <div className="p-2">
              <div className="px-4 py-2 text-sm font-medium text-slate-600 border-b">Students</div>
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
                  <span className="ml-2 text-slate-500">Searching...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((student, index) => (
                    <div
                      key={student.uid || student.id}
                      className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedIndex === index
                          ? "bg-blue-50 border-2 border-blue-200 shadow-sm"
                          : "hover:bg-blue-50 hover:shadow-sm"
                      }`}
                      onClick={() => handleStudentSelect(student)}
                    >
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-blue-100">
                          <User className="h-5 w-5 text-blue-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{student.name || "Unknown Student"}</div>
                        <div className="text-sm text-slate-500">UID: {student.uid || student.id}</div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        <FileText className="h-3 w-3 mr-1" />
                        View
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500">
                  <User className="h-12 w-12 mb-2 text-slate-300" />
                  <div className="text-lg font-medium">No students found</div>
                  <div className="text-sm">Try a different search term</div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2">
              <div className="px-4 py-2 text-sm font-medium text-slate-600 border-b">CU Registration Actions</div>
              <div className="space-y-1">
                {cuRegistrationActions.map((item, index) => (
                  <div
                    key={item.title}
                    className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedIndex === index
                        ? `${item.bgColor} border-2 border-slate-200 shadow-sm`
                        : `hover:${item.bgColor} hover:shadow-sm`
                    }`}
                    onClick={() => handleActionSelect(index)}
                  >
                    <div className={`w-10 h-10 ${item.iconBgColor} rounded-lg flex items-center justify-center mr-3`}>
                      <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{item.title}</div>
                      <div className="text-sm text-slate-500">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
