import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

import {  School, GraduationCap, Calendar, FileText, BookOpen, ClipboardList, MessageSquare, ChevronDown, Book } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AcademicHistory } from "@/types/user/academic-history";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { getAcademicHistory, getAllSpecialization } from "@/services/academic";
import { createAcademicHistory, updateAcademicHistory } from "@/services/student-apis";
import { ResultStatus } from "@/types/enums";
import axios from "axios";
import { Specialization } from "@/types/resources/specialization";

const resultOptions:ResultStatus[] = ["PASS", "FAIL"];


const formElement = [
  
  { name: "id", label: "ID", type: "text", icon: <School className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "lastInstitution", label: "Last Institution", type: "text", icon: <School className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "lastBoardUniversity", label: "Last Board University", type: "text", icon: <GraduationCap className="text-gray-500  dark:text-white w-5 h-5" /> },
  { name: "studiedUpToClass", label: "Studied Up To Class", type: "text", icon: <BookOpen className="text-gray-500  dark:text-white w-5 h-5" /> },
  { name: "passedYear", label: "Passed Year", type: "text", icon: <Calendar className="text-gray-500 w-5 h-5  dark:text-white" /> }, { name: "specialization", label: "Specialization", type: "text", icon: <ClipboardList className="text-gray-500  dark:text-white w-5 h-5" /> },
  { name: "remarks", label: "Remarks", type: "text", icon: <MessageSquare className="text-gray-500 w-5  dark:text-white h-5" /> },
];

const AcademicHistoryForm = () => {
  const location = useLocation();
  const studentId = location.pathname.split("/").pop();
  const id = Number(studentId);
  const [selected,setSelected]=useState<ResultStatus>("PASS");
  const [isNew, setIsNew] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState<{ id: number; name: string } | null>(null);
  const [formData, setFormData] = useState<AcademicHistory>({
    studentId: 0,
    lastInstitution: null,
    lastBoardUniversity: null,
    specialization: null,
    studiedUpToClass: null,
    passedYear: null,
    lastResult: null,
    remarks: "",
  });

const { data:specialization } = useQuery({
    queryKey: ["specialization"],
    queryFn: getAllSpecialization,
  });
  const SpecializationMemo = useMemo(() => {
    if (!specialization) {
      //// console.warn("No streamData received from API");
      return [];
    }

    const specializationMap = new Map();
    specialization.forEach((item: Specialization) => {
      if (item) {
        specializationMap.set(item.id, { id: item.id, name: item.name });
      }
    });
    const specializationNames = [...specializationMap.values()];
    // // console.log("Distinct Degree Names:", degreeNames);
    return specializationNames;
  }, [specialization]);

  const { data ,error,isError} = useQuery({
    queryKey: ["AcademicHistory", id],
    queryFn: () => getAcademicHistory(id),
    enabled: !!id,
    retry: false,
  });



const createData = useMutation({
  mutationFn: (formData: AcademicHistory) =>createAcademicHistory(formData),
  onSuccess: (data) => {
    console.log("Data saved:", data);
    alert("Data saved successfully");
  },
});


  useEffect(() => {
   
    if (isError && axios.isAxiosError(error) && error.response?.status === 404) {
      alert("No academic history found - initializing new record");
      // console.log("error code ***1+*",error.response?.status);
      setIsNew(true);
      setFormData({
        studentId: id,
        lastInstitution: null,
        lastBoardUniversity: null,
        specialization: null,
        studiedUpToClass: null,
        passedYear: null,
        lastResult: null,
        remarks: "",
      });
     
    }
    else if(data?.payload) {
      console.log(JSON.stringify(data.payload,null,2));
      // // console.log("**1",data.payload?.lastInstitution?.name);
      // // console.log("**I",data.payload?.lastBoardUniversity?.name);
     setFormData((prev) => ({
        ...prev, 
        lastInstitution: data.payload.lastInstitution?.name || "",
        lastBoardUniversity: data.payload.lastBoardUniversity?.name || "",
        specialization: data.payload.specialization?.name || "",
        ...data.payload,
      }));
   
    }
    else{
      console.log("error on fetching ",error);
      
    }
    
   
   
  }, [data, error, isError, id]);

  
    
    
  const updateData = useMutation({
    mutationFn: (formData: AcademicHistory) => updateAcademicHistory(id,formData),
    onSuccess: (data) => {
      console.log("Data saved:", data);
      alert("Data saved successfully");
    },
  
  });
const handleStreamSelect = (option: { id: number; name: string }) => {
  // console.log("option selected",option);
  setSelectedSpecialization(option);
  setFormData(prev => ({
    ...prev,
    specialization: { ...(prev.specialization || {}), option } as Specialization, 
  }));
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    setFormData((prev) => ({
      ...prev,
      [name]: ["studiedUpToClass", "passedYear"].includes(name) 
        ? value === "" ? "" : Number(value) 
        : value,
    }));
  };
  

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if(isNew){
      // console.log("Creating new academic history:", formData);
      // console.log("No academic history found - creating new record");
      createData.mutate(formData);
    }
    else{
      console.log("Updating academic history:", formData);
      updateData.mutate(formData);
    }
  };

const handleDropdownChange=(value: string)=>{
    setSelected(value as ResultStatus);
    setFormData((prev) => ({
      ...prev,
      lastResult: value as ResultStatus,
    }));
  }

  return (
    <div className=" shadow-md border py-10  w-full flex items-center justify-center px-5">

      <div className="  max-w-[90%] w-full grid grid-cols-2  gap-7">
        {formElement.map(({ name, label, type, icon }) => (
          <div key={name} className="flex  flex-col mr-8 ">
            <div className="relative  p-1">

              <label htmlFor={name} className="text-md  text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
            </div>
            <div className="relative ">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              <Input
                id={name}
                name={name}
                type={type}
                value={formData[name as keyof AcademicHistory]  as string|| ""}
                placeholder={label}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 `}
              
              />
            </div>
           </div>
        ))}
            <div className="flex flex-col">
          <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Result Status</label>
          <DropdownMenu>
            <DropdownMenuTrigger className="relative">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    <FileText className="text-gray-500 dark:text-gray-300 w-5 h-5" />
                  </span>
         
              <Button variant="outline" className="w-full font-normal pl-10 justify-between rounded-lg">
                <span>{formData.lastResult || "Select Result"}</span>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-gray-700 shadow-lg rounded-lg w-full">
              <DropdownMenuRadioGroup value={selected} onValueChange={handleDropdownChange}>
                {resultOptions.map((option) => (
                  <DropdownMenuRadioItem key={option} value={option}>
                    {option}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
         <div className=" flex pr-8 w-full flex-col">
              <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Specialization</label>
                 
              <DropdownMenu>
                    <DropdownMenuTrigger className="relative" >
                       <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
                                      <Book className="text-gray-500 dark:text-gray-300 w-5 h-5" />
                                        </span>
                      <Button className="border border-gray-400 w-full pl-10 flex items-center justify-between " variant="outline">
                      {selectedSpecialization ? selectedSpecialization.name : "Select Stream"} <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {SpecializationMemo.map((option) => (
                        <DropdownMenuItem
                          key={option.id}
                          onClick={() => {
                            //// console.log("Selected Stream:", option.name);
                            handleStreamSelect(option);
                          }}
                        >
                          {option.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>

        <div className="col-span-2">
          <Button type="submit" onClick={handleSubmit} className="w-auto text-white font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700">
           {isNew?"Create":"Update"} 
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AcademicHistoryForm;


