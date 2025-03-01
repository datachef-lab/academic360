import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

import {  School, GraduationCap, Calendar, FileText, BookOpen, ClipboardList, MessageSquare } from "lucide-react";
import { AcademicHistory } from "@/types/user/academic-history";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { getAcademicHistory } from "@/services/academic";



const formElement = [
  
  { name: "lastInstitution", label: "Last Institution", type: "number", icon: <School className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "lastBoardUniversity", label: "Last Board University", type: "number", icon: <GraduationCap className="text-gray-500  dark:text-white w-5 h-5" /> },
  { name: "studiedUpToClass", label: "Studied Up To Class", type: "number", icon: <BookOpen className="text-gray-500  dark:text-white w-5 h-5" /> },
  { name: "passedYear", label: "Passed Year", type: "number", icon: <Calendar className="text-gray-500 w-5 h-5  dark:text-white" /> },
  { name: "specialization", label: "Specialization", type: "number", icon: <ClipboardList className="text-gray-500  dark:text-white w-5 h-5" /> },
  { name: "lastResult", label: "Last Result", type: "number", icon: <FileText className="text-gray-500 w-5  dark:text-white h-5" /> },
  { name: "remarks", label: "Remarks", type: "text", icon: <MessageSquare className="text-gray-500 w-5  dark:text-white h-5" /> },
];

const AcademicHistoryForm = () => {
  const [formData, setFormData] = useState<AcademicHistory>({
    studentId: 0,
    lastInstitution: null,
    lastBoardUniversity: null,
    studiedUpToClass: null,
    passedYear: null,
    specialization: null,
    lastResult: null,
    remarks: "",
  });

  const location = useLocation();
  const studentId = location.pathname.split("/").pop();
  const id = Number(studentId);

  const { data } = useQuery({
    queryKey: ["accommodation", id],
    queryFn: () => getAcademicHistory(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.payload) {
      console.log("**",data.payload);
      console.log("**1",data.payload);
     setFormData((prev) => ({
        ...prev,
        ...data.payload,
      }));
   
    }
  }, [data]);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "remarks" ? value : value ? Number(value) : undefined,
    }));

  };

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
  
  };

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
        <div className="col-span-2">
          <Button type="submit" onClick={handleSubmit} className="w-auto text-white font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AcademicHistoryForm;
