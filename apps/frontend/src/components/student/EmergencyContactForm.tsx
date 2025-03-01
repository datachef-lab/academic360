// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { useState } from "react";
// import { z } from "zod";
// import { User, Users, Mail, Phone, Briefcase, Home } from "lucide-react";

// const guardianSchema = z.object({
//   studentId: z.number().min(1, "Student ID is required"),
//   personName: z.string().min(1, "Name is required"),
//   relationToStudent: z.string().min(1, "Relation is required"),
//   email: z.string().email("Invalid email format"),
//   phone: z.string().min(10, "Phone number is required"),
//   officePhone: z.string().optional(),
//   residentialPhone: z.string().optional(),
// });

// type GuardianFormData = z.infer<typeof guardianSchema>;

// const formElements = [
//   { name: "studentId", label: "Student ID", type: "number", icon: <User className="text-gray-500 w-5 h-5" /> },
//   { name: "personName", label: "Guardian's Name", type: "text", icon: <Users className="text-gray-500 w-5 h-5" /> },
//   { name: "relationToStudent", label: "Relation to Student", type: "text", icon: <Users className="text-gray-500 w-5 h-5" /> },
//   { name: "email", label: "Email", type: "email", icon: <Mail className="text-gray-500 w-5 h-5" /> },
//   { name: "phone", label: "Phone", type: "tel", icon: <Phone className="text-gray-500 w-5 h-5" /> },
//   { name: "officePhone", label: "Office Phone", type: "tel", icon: <Briefcase className="text-gray-500 w-5 h-5" /> },
//   { name: "residentialPhone", label: "Residential Phone", type: "tel", icon: <Home className="text-gray-500 w-5 h-5" /> },
// ];

// const EmergencyContact = () => {
//   const [formData, setFormData] = useState<GuardianFormData>({
//     studentId: 0,
//     personName: "",
//     relationToStudent: "",
//     email: "",
//     phone: "",
//     officePhone: "",
//     residentialPhone: "",
//   });

//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]:name==="studentId"?Number(value):value,
//     }));
//     setErrors((prevErrors) => {
//       const newErrors = { ...prevErrors };
//       delete newErrors[name];
//       return newErrors;
//     });
//   };

//   const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     const parsed = guardianSchema.safeParse(formData);

//     if (!parsed.success) {
//       const formattedErrors: Record<string, string> = {};
//       parsed.error.errors.forEach((err) => {
//         formattedErrors[err.path[0]] = err.message;
//       });
//       console.log("error msg**", formattedErrors);
//       setErrors(formattedErrors);
//     } else {
//       console.log("Form Data Submitted:", parsed.data);
//       setErrors({});
//     }
//   };

//   return (
//     <div className="shadow-md border py-10 w-full flex items-center justify-center px-5">
//       <div className="max-w-[80%] w-full grid grid-cols-2 gap-6">
//         {formElements.map(({ name, label, type, icon }) => (
//           <div key={name} className="flex flex-col mr-8">
//             <div className="relative  p-1">
//             {errors[name] ? (<span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span>): null}
//             <label htmlFor={name} className="text-md  text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
//             </div>
//             <div className="relative">
//               <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
//               <Input
//                 id={name}
//                 name={name}
//                 type={type}
//                 value={formData[name as keyof GuardianFormData] || ""}
//                 placeholder={label}
//                 onChange={handleChange}
//                 className={`w-full pl-10 pr-3 py-2 ${errors[name] ? 'border-red-500' : ''}`}
//               />
//             </div>
//             {/* {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>} */}
//           </div>
//         ))}
//         <div className="col-span-2">
//           <Button type="submit" onClick={handleSubmit} className="w-auto text-white font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700">
//             Submit
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EmergencyContact;
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {  Users, Mail, Phone, Briefcase, Home } from "lucide-react";
import { EmergencyContact } from "@/types/user/emergency-contact";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {  getEmergencyContact } from "@/services/academic";



const formElements = [
  
  { name: "personName", label: "Guardian's Name", type: "text", icon: <Users className="text-gray-500 w-5 h-5" /> },
  { name: "relationToStudent", label: "Relation to Student", type: "text", icon: <Users className="text-gray-500 w-5 h-5" /> },
  { name: "email", label: "Email", type: "email", icon: <Mail className="text-gray-500 w-5 h-5" /> },
  { name: "phone", label: "Phone", type: "tel", icon: <Phone className="text-gray-500 w-5 h-5" /> },
  { name: "officePhone", label: "Office Phone", type: "tel", icon: <Briefcase className="text-gray-500 w-5 h-5" /> },
  { name: "residentialPhone", label: "Residential Phone", type: "tel", icon: <Home className="text-gray-500 w-5 h-5" /> },
];

const EmergencyContactForm = () => {
  const [formData, setFormData] = useState<EmergencyContact>({
    studentId: 0,
    personName: "",
    relationToStudent: "",
    email: "",
    phone: "",
    officePhone: "",
    residentialPhone: "",
  });

  
  const location = useLocation();
  const studentId  = location.pathname.split("/").pop();

const id=Number(studentId);

const { data } = useQuery({
  queryKey: ["academicIdentifier", id],
  queryFn: () => getEmergencyContact(id),
  enabled: !!id, 
});

useEffect(() => {
  if (data?.payload) {
    console.log("Fetched Data:", data.payload);
    setFormData((prev) => ({
      ...prev,
      ...data.payload, // ✅ Merge API response with form state
    }));
  }
}, [data]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentId) newErrors.studentId = "Student ID is required";
    if (!formData.personName) newErrors.personName = "Name is required";
    if (!formData.relationToStudent) newErrors.relationToStudent = "Relation is required";
    if (!formData.email || !formData.email.includes("@")) newErrors.email = "Invalid email format";
    if (!formData.phone || formData.phone.length < 10) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "studentId" ? Number(value) : value,
    }));
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Form Data Submitted:", formData);
      setErrors({});
    }
  };

  return (
    <div className="shadow-md border py-10 w-full flex items-center justify-center px-5">
      <div className="max-w-[80%] w-full grid grid-cols-2 gap-6">
        {formElements.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col mr-8">
            <div className="relative p-1">
              {errors[name] ? <span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span> : null}
              <label htmlFor={name} className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              <Input
                id={name}
                name={name}
                type={type}
                 value={type === "date" ? (formData[name as keyof EmergencyContact] as Date)?.toISOString().split("T")[0] : formData[name as keyof EmergencyContact] as string || ""}
                placeholder={label}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 ${errors[name] ? "border-red-500" : ""}`}
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

export default EmergencyContactForm;
