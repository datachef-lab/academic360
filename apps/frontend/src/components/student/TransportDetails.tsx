import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { z } from "zod";
import { User, Bus, MapPin, Hash, Clock } from "lucide-react";

// Define Zod schema for validation
const transportAllocationSchema = z.object({
  studentId: z.number().min(1, "Student ID is required"),
  transportId: z.number().min(1, "Transport ID is required"),
  pickupPointId: z.number().min(1, "Pickup Point ID is required"),
  seatNumber: z.string().min(1, "Seat Number is required"),
  pickupTime: z.string().min(1, "Pickup Time is required"),
  dropOffTime: z.string().min(1, "Drop-off Time is required"),
});

// Infer TypeScript type from schema
type TransportAllocationFormData = z.infer<typeof transportAllocationSchema>;

// Define form elements with labels, types, and icons
const formElements = [
  { name: "studentId", label: "Student ID", type: "number", icon: <User className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "transportId", label: "Transport ID", type: "number", icon: <Bus className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "pickupPointId", label: "Pickup Point ID", type: "number", icon: <MapPin className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "seatNumber", label: "Seat Number", type: "text", icon: <Hash className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "pickupTime", label: "Pickup Time", type: "time", icon: <Clock className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "dropOffTime", label: "Drop-off Time", type: "time", icon: <Clock className="text-gray-500 dark:text-white w-5 h-5" /> },
];

const TransportDetails = () => {
  // State to hold form data
  const [formData, setFormData] = useState<TransportAllocationFormData>({
    studentId: 0,
    transportId: 0,
    pickupPointId: 0,
    seatNumber: "",
    pickupTime: "",
    dropOffTime: "",
  });

  // State to hold form validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "seatNumber" ? value : name.includes("Time") ? value : Number(value),
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const parsed = transportAllocationSchema.safeParse(formData);

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
      <div className="max-w-[80%] w-full grid grid-cols-2 gap-7">
        {formElements.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col mr-8">
            <label htmlFor={name} className="text-md dark:text-white mb-1 font-medium text-gray-700">{label}</label>
            <div className="relative">
              {type !== "time" ? <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span> : null}
              
              <Input
                id={name}
                name={name}
                type={type}
                value={formData[name as keyof TransportAllocationFormData] || ""}
                placeholder={label}
                onChange={handleChange}
                className={`w-full ${type !== "time" ? "pl-10" : ""} pr-3 py-2`}
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

export default TransportDetails;
