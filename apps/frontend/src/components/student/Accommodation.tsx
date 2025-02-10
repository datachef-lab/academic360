import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { z } from "zod";
import { User, Home, MapPin, Calendar } from "lucide-react";

const studentAccommodationSchema = z.object({
  studentId: z.number().min(1, "Student ID is required"),
  placeOfStay: z.string().min(1, "Place of Stay is required"),
  addressId: z.number().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type StudentAccommodationFormData = z.infer<typeof studentAccommodationSchema>;

const formElements = [
  { name: "studentId", label: "Student ID", type: "number", icon: <User className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "placeOfStay", label: "Place of Stay", type: "text", icon: <Home className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "addressId", label: "Address ID", type: "number", icon: <MapPin className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "startDate", label: "Start Date", type: "date", icon: <Calendar className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "endDate", label: "End Date", type: "date", icon: <Calendar className="text-gray-500 dark:text-white w-5 h-5" /> },
];

const Accommodation = () => {
  const [formData, setFormData] = useState<StudentAccommodationFormData>({
    studentId: 0,
    placeOfStay: "",
    addressId: undefined,
    startDate: "",
    endDate: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "placeOfStay" ? value : name.includes("Date") ? value : Number(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const parsed = studentAccommodationSchema.safeParse(formData);

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
      <div className="max-w-[90%] w-full grid grid-cols-2 gap-7">
        {formElements.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col mr-8">
            <label htmlFor={name} className="text-md dark:text-white mb-1 font-medium text-gray-700">{label}</label>
            <div className={`relative`}>
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              <Input
                id={name}
                name={name}
                type={type}
                value={formData[name as keyof StudentAccommodationFormData] || ""}
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

export default Accommodation;
