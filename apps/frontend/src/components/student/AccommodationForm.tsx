import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { z } from "zod";
import { User, Home, MapPin, Calendar } from "lucide-react";
import { Accommodation } from "@/types/user/accommodation";

const studentAccommodationSchema = z.object({
  studentId: z.number().min(1, "Student ID is required"),
  placeOfStay: z.string().min(1, "Place of Stay is required"),
  addressId: z.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});



const formElements = [
  { name: "studentId", label: "Student ID", type: "number", icon: <User className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "placeOfStay", label: "Place of Stay", type: "text", icon: <Home className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "address", label: "Address ", type: "string", icon: <MapPin className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "startDate", label: "Start Date", type: "date", icon: <Calendar className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "endDate", label: "End Date", type: "date", icon: <Calendar className="text-gray-500 dark:text-white w-5 h-5" /> },
];

const AccommodationForm = () => {
  const [formData, setFormData] = useState<Accommodation>({
    studentId: 0,
    placeOfStay: null,
    address: null,
    startDate: new Date(),
    endDate: new Date(),
    
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "placeOfStay" ? value : name.includes("Date") ? value : Number(value),
    }));
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const parsed = studentAccommodationSchema.safeParse(formData);

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
      <div className="max-w-[90%] w-full grid grid-cols-2 gap-7">
        {formElements.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col mr-8">
            <div className="relative  p-1">
              {errors[name] ? (<span className="text-red-600 absolute left-[-2px] top-[-2px]">*</span>) : null}
              <label htmlFor={name} className="text-md  text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
            </div>
            <div className={`relative`}>
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              <Input
                id={name}
                name={name}
                type={type}
                value={type === "date" ? (formData[name as keyof Accommodation] as Date)?.toISOString().split("T")[0] : formData[name as keyof Accommodation]?.toString() || ""}
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

export default AccommodationForm;
