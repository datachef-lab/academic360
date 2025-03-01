import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Home, MapPin, Calendar, Globe, Phone, User } from "lucide-react";
import { Accommodation } from "@/types/user/accommodation";
import { saveAccommodation } from "@/services/stream";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { getAccommodation } from "@/services/academic";
import { Address } from "@/types/resources/address";

const formElements = [
  { name: "placeOfStay", label: "Place of Stay", type: "text", icon: <Home className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "startDate", label: "Start Date", type: "date", icon: <Calendar className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "endDate", label: "End Date", type: "date", icon: <Calendar className="text-gray-500 dark:text-white w-5 h-5" /> },
];

const addressFields = [
  { name: "id", label: "ID", type: "text", icon: <User className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "country", label: "Country", type: "text", icon: <Globe className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "state", label: "State", type: "text", icon: <Globe className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "city", label: "City", type: "text", icon: <Globe className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "addressLine", label: "Address Line", type: "text", icon: <MapPin className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "landmark", label: "Landmark", type: "text", icon: <MapPin className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "localityType", label: "Locality (Rural/Urban)", type: "text", icon: <Home className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "phone", label: "Phone", type: "tel", icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "pincode", label: "Pincode", type: "text", icon: <MapPin className="text-gray-500 dark:text-white w-5 h-5" /> },
];

const AccommodationForm = () => {
  const [formData, setFormData] = useState<Accommodation & { addressData: Address }>({
    studentId: 0,
    placeOfStay: "HOSTEL",
    address: null,
    startDate: new Date(),
    endDate: new Date(),
    addressData: {
      id: 0,
      country: "",
      state: "",
      city: "",
      addressLine: "",
      landmark: "",
      localityType: "RURAL",
      phone: "",
      pincode: "",
    },
  });

  const location = useLocation();
  const studentId = location.pathname.split("/").pop();
  const id = Number(studentId);

  const { data } = useQuery({
    queryKey: ["accommodation", id],
    queryFn: () => getAccommodation(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.payload) {
      console.log("Fetched data:", data.payload);
      const addressData = data.payload.address || {};
      setFormData((prev) => ({
        ...prev,
        ...data.payload,
        addressData: {
          ...prev.addressData,
          ...addressData,
        },
      }));
    }
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "studentId" ? Number(value) : value || "",
    }));
  };

  const saveData = useMutation({
    mutationFn: saveAccommodation,
    onSuccess: (formData) => {
      console.log("Data saved:", formData);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    saveData.mutate(formData);
  };

  return (
    <div className="shadow-md border py-10 w-full flex items-center justify-center px-5">
      <div className="max-w-[90%] w-full grid grid-cols-2 gap-7">
        {formElements.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col mr-8">
            <label htmlFor={name} className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              <Input id={name} name={name} type={type} value={formData[name as keyof Accommodation] as string || ""} onChange={handleChange} className="w-full pl-10 pr-3 py-2" />
            </div>
          </div>
        ))}

        {addressFields.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col mr-8">
            <label htmlFor={name} className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              <Input id={name} name={name} type={type} value={formData.addressData[name as keyof Address] as string || ""} onChange={handleChange} className="w-full pl-10 pr-3 py-2" />
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
