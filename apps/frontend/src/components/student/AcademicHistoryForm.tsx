
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { School, GraduationCap, Calendar, FileText, BookOpen, MessageSquare, ChevronDown, Book, PenLine, CheckCircle, Save, User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AcademicHistory } from "@/types/user/academic-history";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { getAcademicHistory, getAllSpecialization } from "@/services/academic";
import { createAcademicHistory, updateAcademicHistory } from "@/services/student-apis";
import { ResultStatus } from "@/types/enums";
import { Specialization } from "@/types/resources/specialization";
import { toast } from "sonner";
import { useFetch } from "@/hooks/useFetch";

const resultOptions: ResultStatus[] = ["PASS", "FAIL"];

const formElement = [
  { name: "id", label: "ID", type: "text", icon: <User className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "lastInstitution", label: "Last Institution", type: "text", icon: <School className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "lastBoardUniversity", label: "Last Board University", type: "text", icon: <GraduationCap className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "studiedUpToClass", label: "Studied Up To Class", type: "text", icon: <BookOpen className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "passedYear", label: "Passed Year", type: "text", icon: <Calendar className="text-gray-500 w-5 h-5 dark:text-white" /> }, 
  { name: "remarks", label: "Remarks", type: "text", icon: <MessageSquare className="text-gray-500 w-5 dark:text-white h-5" /> },
];

const AcademicHistoryForm = () => {
  const location = useLocation();
  const studentId = location.pathname.split("/").pop();
  const id = Number(studentId);
  const [selected, setSelected] = useState<ResultStatus>("PASS");
  const [updateID, setUpdateID] = useState<number>();
  const [selectedSpecialization, setSelectedSpecialization] = useState<{ id: number; name: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const defaultAcademicHistory: AcademicHistory = {
    studentId: id,
    lastInstitution: null,
    lastBoardUniversity: null,
    specialization: null,
    studiedUpToClass: null,
    passedYear: null,
    lastResult: null,
    remarks: "",
  };

  const { data: academicData, loading, refetch } = useFetch<AcademicHistory>({
    getFn: () => getAcademicHistory(id),
    postFn: (data) => createAcademicHistory(data),
    default: defaultAcademicHistory
  });

  const [formData, setFormData] = useState<AcademicHistory>(defaultAcademicHistory);

  const { data: specialization } = useQuery({
    queryKey: ["specialization"],
    queryFn: getAllSpecialization,
  });

  const SpecializationMemo = useMemo(() => {
    if (!specialization) return [];
    const specializationMap = new Map();
    specialization.forEach((item: Specialization) => {
      if (item) specializationMap.set(item.id, { id: item.id, name: item.name });
    });
    return [...specializationMap.values()];
  }, [specialization]);

  useEffect(() => {
    if (academicData) {
      setFormData({
        ...academicData,
        lastInstitution: academicData.lastInstitution || null,
        lastBoardUniversity: academicData.lastBoardUniversity || null,
        specialization: academicData.specialization || null,
      });
      setUpdateID(academicData.id);

      if (academicData.specialization?.id) {
        setSelectedSpecialization({
          id: academicData.specialization.id,
          name: academicData.specialization.name || ""
        });
      }

      if (academicData.lastResult) {
        setSelected(academicData.lastResult);
      }
    }
  }, [academicData]);

  const updateData = useMutation({
    mutationFn: (formData: AcademicHistory) => updateAcademicHistory(updateID as number, formData),
    onSuccess: () => {
      toast.success("Your data has been successfully updated.", {
        icon: <PenLine />,
      });
      refetch();
    },
  });

  const handleStreamSelect = (option: { id: number; name: string }) => {
    setSelectedSpecialization(option);
    setFormData(prev => ({
      ...prev,
      specialization: { ...(prev.specialization || {}), ...option } as Specialization,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ["studiedUpToClass", "passedYear"].includes(name) 
        ? value === "" ? "" : Number(value) 
        : value,
    }));
  };

  const handleDropdownChange = (value: string) => {
    setSelected(value as ResultStatus);
    setFormData(prev => ({
      ...prev,
      lastResult: value as ResultStatus,
    }));
  };

  useEffect(() => {
    if (updateData.isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 800);
      return () => clearTimeout(timer);
    }
  }, [updateData.isSuccess]);

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (loading) return;
    updateData.mutate(formData);
  };

 
  return (
    <div className="shadow-md border rounded-xl py-6 md:py-10 bg-white  md:px-8 w-full flex items-center justify-center px-4 sm:px-5">
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-10">
        {formElement.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col">
            <div className="relative p-1">
              <label className="text-sm sm:text-md text-gray-700 dark:text-white mb-1 font-medium">
                {label}
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {icon}
              </span>
              <Input
                id={name}
                name={name}
                type={type}
                value={formData[name as keyof AcademicHistory] as string || ""}
                placeholder={label}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 rounded-lg text-sm sm:text-base"
              />
            </div>
          </div>
        ))}

        <div className="flex flex-col">
          <label className="text-sm sm:text-md text-gray-700 dark:text-white mb-1 font-medium">
            Result Status
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
                <FileText className="text-gray-500 dark:text-gray-300 w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <Button variant="outline" className="w-full font-normal pl-8 sm:pl-10 justify-between rounded-lg text-sm sm:text-base">
                <span>{formData.lastResult || "Select Result"}</span>
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-gray-700 shadow-lg rounded-lg w-full min-w-[200px]">
              <DropdownMenuRadioGroup value={selected} onValueChange={handleDropdownChange}>
                {resultOptions.map((option) => (
                  <DropdownMenuRadioItem 
                    key={option} 
                    value={option}
                    className="text-sm sm:text-base"
                  >
                    {option}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col">
          <label className="text-sm sm:text-md text-gray-700 dark:text-white mb-1 font-medium">
            Specialization
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger className="relative">
              <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
                <Book className="text-gray-500 dark:text-gray-300 w-4 h-4 sm:w-5 sm:h-5" />
              </span>
              <Button 
                className="border border-gray-400 w-full pl-8 sm:pl-10 flex items-center justify-between text-sm sm:text-base" 
                variant="outline"
              >
                {selectedSpecialization ? selectedSpecialization.name : "Select Specialization"} 
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-[200px]">
              {SpecializationMemo.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => handleStreamSelect(option)}
                  className="text-sm sm:text-base"
                >
                  {option.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="col-span-1 sm:col-span-2 mt-2">
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            className="w-full sm:w-auto text-white font-medium sm:font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
            disabled={ updateData.isLoading }
          >
            { updateData.isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : showSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                Submit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AcademicHistoryForm;