import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { z } from "zod";
import { User, Users, Mail, Phone, Briefcase, Home } from "lucide-react";

const guardianSchema = z.object({
  studentId: z.number().min(1, "Student ID is required"),
  personName: z.string().min(1, "Name is required"),
  relationToStudent: z.string().min(1, "Relation is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Phone number is required"),
  officePhone: z.string().optional(),
  residentialPhone: z.string().optional(),
});

type GuardianFormData = z.infer<typeof guardianSchema>;

const formElements = [
  { name: "studentId", label: "Student ID", type: "number", icon: <User className="text-gray-500 w-5 h-5" /> },
  { name: "personName", label: "Guardian's Name", type: "text", icon: <Users className="text-gray-500 w-5 h-5" /> },
  { name: "relationToStudent", label: "Relation to Student", type: "text", icon: <Users className="text-gray-500 w-5 h-5" /> },
  { name: "email", label: "Email", type: "email", icon: <Mail className="text-gray-500 w-5 h-5" /> },
  { name: "phone", label: "Phone", type: "tel", icon: <Phone className="text-gray-500 w-5 h-5" /> },
  { name: "officePhone", label: "Office Phone", type: "tel", icon: <Briefcase className="text-gray-500 w-5 h-5" /> },
  { name: "residentialPhone", label: "Residential Phone", type: "tel", icon: <Home className="text-gray-500 w-5 h-5" /> },
];

const EmergencyContact = () => {
  const [formData, setFormData] = useState<GuardianFormData>({
    studentId: 0,
    personName: "",
    relationToStudent: "",
    email: "",
    phone: "",
    officePhone: "",
    residentialPhone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:name==="studentId"?Number(value):value,
    }));
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const parsed = guardianSchema.safeParse(formData);

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
    <div className="shadow-md border py-10 w-full flex items-center justify-center px-5">
      <div className="max-w-[80%] w-full grid grid-cols-2 gap-6">
        {formElements.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col mr-8">
            <div className="relative  p-1">
            {errors[name] ? (<span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span>): null}
            <label htmlFor={name} className="text-md  text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              <Input
                id={name}
                name={name}
                type={type}
                value={formData[name as keyof GuardianFormData] || ""}
                placeholder={label}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 ${errors[name] ? 'border-red-500' : ''}`}
              />
            </div>
            {/* {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>} */}
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

export default EmergencyContact;
