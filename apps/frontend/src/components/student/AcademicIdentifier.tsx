import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { z } from "zod";
import {
  User,
  Settings,
  Barcode,
  Layers,
  ClipboardCheck,
  FileText,
  Fingerprint,
  Hash,
  IdCard,
  ListOrdered,
  LayoutGrid,
  Landmark,
  BadgeCheck,
  ShieldCheck,
} from "lucide-react";

const studentSchema = z.object({
  studentId: z.number().min(1, "Student ID is required"),
  frameworkType: z.string().optional(),
  rfid: z.string().max(255).optional(),
  streamId: z.number().optional(),
  course: z.string().optional(),
  cuFormNumber: z.string().max(255).optional(),
  uid: z.string().max(255).optional(),
  oldUid: z.string().max(255).optional(),
  registrationNumber: z.string().max(255).optional(),
  rollNumber: z.string().max(255).optional(),
  section: z.string().max(255).optional(),
  classRollNumber: z.string().max(255).optional(),
  apaarId: z.string().max(255).optional(),
  abcId: z.string().max(255).optional(),
  apprid: z.string().max(255).optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

const formElement = [
  { name: "studentId", label: "Student ID", type: "number", icon: <User className="w-5 h-5 text-gray-500" /> },
  { name: "frameworkType", label: "Framework Type", type: "text", icon: <Settings className="w-5 h-5 text-gray-500" /> },
  { name: "rfid", label: "RFID", type: "text", icon: <Barcode className="w-5 h-5 text-gray-500" /> },
  { name: "streamId", label: "Stream ID", type: "number", icon: <Layers className="w-5 h-5 text-gray-500" /> },
  { name: "course", label: "Course", type: "text", icon: <ClipboardCheck className="w-5 h-5 text-gray-500" /> },
  { name: "cuFormNumber", label: "CU Form Number", type: "text", icon: <FileText className="w-5 h-5 text-gray-500" /> },
  { name: "uid", label: "UID", type: "text", icon: <Fingerprint className="w-5 h-5 text-gray-500" /> },
  { name: "oldUid", label: "Old UID", type: "text", icon: <Hash className="w-5 h-5 text-gray-500" /> },
  { name: "registrationNumber", label: "Registration Number", type: "text", icon: <IdCard className="w-5 h-5 text-gray-500" /> },
  { name: "rollNumber", label: "Roll Number", type: "text", icon: <ListOrdered className="w-5 h-5 text-gray-500" /> },
  { name: "section", label: "Section", type: "text", icon: <LayoutGrid className="w-5 h-5 text-gray-500" /> },
  { name: "classRollNumber", label: "Class Roll Number", type: "text", icon: <Landmark className="w-5 h-5 text-gray-500" /> },
  { name: "apaarId", label: "APAAR ID", type: "text", icon: <BadgeCheck className="w-5 h-5 text-gray-500" /> },
  { name: "abcId", label: "ABC ID", type: "text", icon: <ShieldCheck className="w-5 h-5 text-gray-500" /> },
  { name: "apprid", label: "Appr ID", type: "text", icon: <ShieldCheck className="w-5 h-5 text-gray-500" /> },
];

const AcademicIdentifier = () => {
  const [formData, setFormData] = useState<StudentFormData>({
    studentId: 0,
    frameworkType: "",
    rfid: "",
    streamId: undefined,
    course: "",
    cuFormNumber: "",
    uid: "",
    oldUid: "",
    registrationNumber: "",
    rollNumber: "",
    section: "",
    classRollNumber: "",
    apaarId: "",
    abcId: "",
    apprid: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const parsed = studentSchema.safeParse(formData);

    if (!parsed.success) {
      const formattedErrors: Record<string, string> = {};
      parsed.error.errors.forEach((err) => {
        formattedErrors[err.path[0]] = err.message;
      });
      setErrors(formattedErrors);
    } else {
      console.log("Form Data Submitted:", parsed.data);
      setErrors({});
    }
  };

  return (
    <div className="shadow-md border py-10 w-full flex items-center justify-center px-5">
      <div className="max-w-[90%] w-full grid grid-cols-2 gap-6">
        {formElement.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col mr-8">
            <label htmlFor={name} className="text-md dark:text-white mb-1 font-medium text-gray-700">
              {label}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              <Input
                id={name}
                name={name}
                type={type}
                value={formData[name as keyof StudentFormData] || ""}
                placeholder={label}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2"
              />
            </div>
            {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
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

export default AcademicIdentifier;
