import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Home, MapPin, Calendar, Globe, Phone, User, Map, Building2, Landmark, Mailbox } from "lucide-react";
import { Accommodation } from "@/types/user/accommodation";
// import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { getAccommodation } from "@/services/academic";
import { Address } from "@/types/resources/address";
import { IoIosArrowDown } from "react-icons/io";
import {
  DropdownMenu,
  DropdownMenuContent,
  // DropdownMenuItem,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  // DropdownMenuLabel,
  // DropdownMenuSeparator,
  // DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuRadioGroup } from "@radix-ui/react-dropdown-menu";
import { PlaceOfStay } from "@/types/enums";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
// import { updateAccommodation } from "@/services/student-apis";
import { useQuery } from "@tanstack/react-query";


const formElements = [
  {
    name: "startDate",
    label: "Start Date",
    type: "date",
    icon: <Calendar className="text-gray-500 dark:text-white w-5 h-5" />,
  },
  {
    name: "endDate",
    label: "End Date",
    type: "date",
    icon: <Calendar className="text-gray-500 dark:text-white w-5 h-5" />,
  },
];

const addressFields = [
  { name: "id", label: "ID", type: "text", icon: <User className="text-gray-500 dark:text-white w-5 h-5" /> },
  {
    name: "country",
    label: "Country",
    type: "text",
    icon: <Globe className="text-gray-500 dark:text-white w-5 h-5" />,
  },
  {
    name: "state",
    label: "State",
    type: "text",
    icon: <Map className="text-gray-500 dark:text-white w-5 h-5" />,
  },
  {
    name: "city",
    label: "City",
    type: "text",
    icon: <Building2 className="text-gray-500 dark:text-white w-5 h-5" />,
  },
  {
    name: "addressLine",
    label: "Address Line",
    type: "text",
    icon: <MapPin className="text-gray-500 dark:text-white w-5 h-5" />,
  },
  {
    name: "landmark",
    label: "Landmark",
    type: "text",
    icon: <Landmark className="text-gray-500 dark:text-white w-5 h-5" />,
  },

  { name: "phone", label: "Phone", type: "tel", icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" /> },
  {
    name: "pincode",
    label: "Pincode",
    type: "text",
    icon: <Mailbox className="text-gray-500 dark:text-white w-5 h-5" />,
  },
];

const placeOptions: PlaceOfStay[] = ["OWN", "HOSTEL", "FAMILY_FRIENDS", "PAYING_GUEST", "RELATIVES"];
type localityType = "RURAL" | "URBAN";

const locality: localityType[] = ["RURAL", "URBAN"];

const AccommodationForm = () => {
  const [selectedPlace, setSelectedPlace] = useState<PlaceOfStay>("OWN");
  const [selectLocality, setSelectLocality] = useState<string>("RURAL");
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
  const id = Number(location.pathname.split("/").pop());

  // const saveData = useMutation({
  //   mutationFn: (formData:Accommodation)=>(updateAccommodation(formData,id)),
  //   onSuccess: (data) => {
  //     console.log("Data saved:", data);
  //   },
  // });
  const { data } = useQuery({
    queryKey: ["accommodation", id],
    queryFn: () => getAccommodation(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.payload) {
      const addressData = data.payload.address || {};
      setFormData((prev) => ({
        ...prev,
        ...data.payload,
        startDate: new Date(data.payload.startDate), // Convert to Date
        endDate: new Date(data.payload.endDate), // Convert to Date
        addressData: {
          ...prev.addressData,
          ...addressData,
        },
      }));
      setSelectedPlace(data.payload.placeOfStay || "Select");
      setSelectLocality(data.payload.address?.localityType || "Select");
    }
  }, [data]);
  

  const handleSelect = (value: string, type: "place" | "locality") => {
    if (type === "place") {
      setSelectedPlace(value as PlaceOfStay);
      setFormData((prev) => ({ ...prev, placeOfStay: value as PlaceOfStay }));
    } else {
      setSelectLocality(value as localityType);
      setFormData((prev) => ({
        ...prev,
        addressData: { ...prev.addressData, localityType: value as localityType },
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "date") {
      setFormData((prev) => ({
        ...prev,
        [name]: new Date(value),
      }));
    } else if (name in formData.addressData) {
      setFormData((prev) => ({
        ...prev,
        addressData: {
          ...prev.addressData,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    }
  };
  

  

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("Final formData before saving:", formData);
    console.log("formData",JSON.stringify(formData,null,2));
    // saveData.mutate(formData);
  };

  return (
    <div className="shadow-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md py-10 w-full flex items-center justify-center px-5">
     
    <div className="max-w-[90%] w-full grid grid-cols-1 gap-7">
      <div className="flex font-semibold font-sans text-3xl items-center justify-center">
    <h1>Accommodation</h1>
    </div>
     <div className="w-full grid grid-cols-2 mt-5 gap-7 px-7">
            <div className="flex flex-col">
              <label className="text-lg text-gray-700 dark:text-white mb-1 font-medium">Place of Stay</label>
              <DropdownMenu>
                <DropdownMenuTrigger className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    <Home className="text-gray-500 dark:text-gray-300 w-5 h-5" />
                  </span>
                  <Button variant="outline" className="w-full font-normal pl-10 justify-between rounded-lg">
                    {selectedPlace.replace("_", " ")}
                    <IoIosArrowDown className="text-gray-500 dark:text-gray-300 w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="">
                  <DropdownMenuRadioGroup value={selectedPlace} onValueChange={(value) => handleSelect(value, "place")}>
                    {placeOptions.map((place) => (
                      <DropdownMenuRadioItem key={place} value={place} >
                        {place.replace("_", " ")}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
  
            {formElements.map(({ name, label, type, icon }) => (
              <div key={name} className="flex flex-col">
                <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
                  <Input
  id={name}
  name={name}
  type={type}
  value={type === "date" && formData[name as keyof Accommodation] instanceof Date
    ? (formData[name as keyof Accommodation] as Date).toISOString().split("T")[0]
    : formData[name as keyof Accommodation] as string || ""}
  onChange={handleChange}
  className="w-full pl-10 py-2 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-blue-500"
/>

                </div>
              </div>
            ))}
            </div>
        
  
        {/* Address Section */}
        <Accordion type="multiple" className="w-full space-y-5">
        <AccordionItem value="address" className="border rounded-md shadow-sm px-8">
          <AccordionTrigger className="text-lg font-semibold ">
            Address
          </AccordionTrigger>
          <AccordionContent className="grid grid-cols-2 gap-8 pt-4">
            {addressFields.map(({ name, label, type, icon }) => (
              <div key={name} className="flex flex-col">
                <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
                  <Input
                    id={name}
                    name={name}
                    type={type}
                    value={formData.addressData[name as keyof Address] || ""}
                    onChange={handleChange}
                    className="w-full pl-10 py-2 rounded-lg border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
  
            {/* Locality Type Dropdown */}
            <div className="flex flex-col">
              <label className="text-md text-gray-700 dark:text-white mb-1 font-medium">Locality Type</label>
              <DropdownMenu>
                <DropdownMenuTrigger className="relative">
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2">
                    <Home className="text-gray-500 dark:text-gray-300 w-5 h-5" />
                  </span>
                  <Button variant="outline" className="w-full font-normal pl-10 justify-between rounded-lg">
                    {selectLocality.replace("_", " ")}
                    <IoIosArrowDown className="text-gray-500 dark:text-gray-300 w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-700 shadow-lg rounded-lg">
                  <DropdownMenuRadioGroup value={selectLocality} onValueChange={(value) => handleSelect(value, "locality")}>
                    {locality.map((place) => (
                      <DropdownMenuRadioItem key={place} value={place} >
                        {place.replace("_", " ")}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
  
      {/* Submit Button */}
      <Button
        type="submit"
        onClick={handleSubmit}
        className="w-auto text-white font-bold py-3 rounded-md bg-blue-600 hover:bg-blue-700 transition-all"
      >
        Submit
      </Button>
    </div>
  </div>
  

  );
};

export default AccommodationForm;
