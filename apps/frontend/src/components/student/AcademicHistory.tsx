import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { z } from "zod";
import { User, School, GraduationCap, Calendar, FileText, BookOpen, ClipboardList, MessageSquare } from "lucide-react";

const studentSchema = z.object({
  studentId: z.number().min(1, "Student ID is required"),
  lastInstitutionId: z.number().optional(),
  lastBoardUniversityId: z.number().optional(),
  studiedUpToClass: z.number().optional(),
  passedYear: z.number().optional(),
  specializationId: z.number().optional(),
  lastResultId: z.number().optional(),
  remarks: z.string().max(255, "Remarks must be under 255 characters").optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

const formElement = [
  { name: "studentId", label: "Student ID", type: "number", icon: <User className="text-gray-500  dark:text-white w-5 h-5" /> },
  { name: "lastInstitutionId", label: "Last Institution ID", type: "number", icon: <School className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "lastBoardUniversityId", label: "Last Board University ID", type: "number", icon: <GraduationCap className="text-gray-500  dark:text-white w-5 h-5" /> },
  { name: "studiedUpToClass", label: "Studied Up To Class", type: "number", icon: <BookOpen className="text-gray-500  dark:text-white w-5 h-5" /> },
  { name: "passedYear", label: "Passed Year", type: "number", icon: <Calendar className="text-gray-500 w-5 h-5  dark:text-white" /> },
  { name: "specializationId", label: "Specialization ID", type: "number", icon: <ClipboardList className="text-gray-500  dark:text-white w-5 h-5" /> },
  { name: "lastResultId", label: "Last Result ID", type: "number", icon: <FileText className="text-gray-500 w-5  dark:text-white h-5" /> },
  { name: "remarks", label: "Remarks", type: "text", icon: <MessageSquare className="text-gray-500 w-5  dark:text-white h-5" /> },
];

const AcademicHistory = () => {
  const [formData, setFormData] = useState<StudentFormData>({
    studentId: 0,
    lastInstitutionId: undefined,
    lastBoardUniversityId: undefined,
    studiedUpToClass: undefined,
    passedYear: undefined,
    specializationId: undefined,
    lastResultId: undefined,
    remarks: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "remarks" ? value : value ? Number(value) : undefined,
    }));
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const parsed = studentSchema.safeParse(formData);

    if (!parsed.success) {
      const formattedErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        formattedErrors[err.path[0]] = err.message;
      });
      console.log("error msg**", formattedErrors);
      setErrors(formattedErrors);
    } else {
      console.log("Form Data Submitted:", parsed.data);
      setErrors({});
    }
  };

  return (
    <div className=" shadow-md border py-10  w-full flex items-center justify-center px-5">

      <div className="  max-w-[90%] w-full grid grid-cols-2  gap-7">
        {formElement.map(({ name, label, type, icon }) => (
          <div key={name} className="flex  flex-col mr-8 ">
            <div className="relative  p-1">
              {errors[name] ? (<span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span>) : null}
              <label htmlFor={name} className="text-md  text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
            </div>
            <div className="relative ">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              <Input
                id={name}
                name={name}
                type={type}
                value={formData[name as keyof StudentFormData] || ""}
                placeholder={label}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 ${errors[name] ? 'border-red-500' : ''}`}
              
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

export default AcademicHistory;
