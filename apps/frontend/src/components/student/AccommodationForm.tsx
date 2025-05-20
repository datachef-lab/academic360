

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Home, MapPin, Calendar, Globe, Phone, Map, Building2, Landmark, Mailbox, Save, CheckCircle, PenLine } from "lucide-react";
import { Accommodation } from "@/types/user/accommodation";
import { useMutation } from "@tanstack/react-query";
import { IoIosArrowDown } from "react-icons/io";
import { useLocation } from "react-router-dom";
import {  createAccommodation, updateAccommodation } from "@/services/student-apis";
import { PlaceOfStay } from "@/types/enums";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useFetch } from "@/hooks/useFetch";
import { Address } from "@/types/resources/address";
import { getAccommodation } from "@/services/academic";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";


const formElements = [
  { name: "startDate", label: "Start Date", type: "date", icon: <Calendar className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "endDate", label: "End Date", type: "date", icon: <Calendar className="text-gray-500 dark:text-white w-5 h-5" /> },
];

const addressFields = [
  { name: "country", label: "Country", type: "text", icon: <Globe className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "state", label: "State", type: "text", icon: <Map className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "city", label: "City", type: "text", icon: <Building2 className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "addressLine", label: "Address Line", type: "text", icon: <MapPin className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "landmark", label: "Landmark", type: "text", icon: <Landmark className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "phone", label: "Phone", type: "tel", icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" /> },
  { name: "pincode", label: "Pincode", type: "text", icon: <Mailbox className="text-gray-500 dark:text-white w-5 h-5" /> },
];

const placeOptions: PlaceOfStay[] = ["OWN", "HOSTEL", "FAMILY_FRIENDS", "PAYING_GUEST", "RELATIVES"];
// const localityOptions: LocalityType[] = ["RURAL", "URBAN"];
type localityType = "RURAL" | "URBAN";

const locality: localityType[] = ["RURAL", "URBAN"];

const defaultAccommodation: Accommodation & { address: Address } = {
  studentId: 0,
  placeOfStay: "HOSTEL",
  startDate: new Date(),
  endDate: new Date(),
  address: {
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
};

const AccommodationForm = () => {
  const location = useLocation();
  const studentId = Number(location.pathname.split("/").pop());
  const [selectedPlace, setSelectedPlace] = useState<PlaceOfStay>("HOSTEL");
  const [selectedLocality, setSelectedLocality] = useState<localityType>("RURAL");
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: accommodationData, loading, refetch } = useFetch<Accommodation & { address: Address }>({
    getFn: () => getAccommodation(studentId),
    postFn: (data) => createAccommodation(data),
    default: defaultAccommodation
  });

  const [formData, setFormData] = useState<Accommodation & { address: Address }>(defaultAccommodation);

  useEffect(() => {
    if (accommodationData) {
      setFormData({
        ...accommodationData,
        address: {
          ...defaultAccommodation.address, // Use default values for address
          ...accommodationData.address,   // Override with fetched data if available
        },
      });
      setSelectedPlace(accommodationData.placeOfStay || "HOSTEL");
      setSelectedLocality(accommodationData.address?.localityType || "RURAL");
    }
  }, [accommodationData]);

  const updateMutation = useMutation({
    mutationFn: (formData: Accommodation) => 
      accommodationData?.id 
        ? updateAccommodation(formData, studentId)
        : createAccommodation(formData),
    onSuccess: () => {
      toast.success("Your data has been successfully updated.", {
        icon: <PenLine />,
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to save data. Please try again.");
      console.error("Error saving accommodation:", error);
    }
  });

  const handlePlaceSelect = (value: PlaceOfStay) => {
    setSelectedPlace(value);
    setFormData(prev => ({
      ...prev,
      placeOfStay: value,
    }));
  };

  const handleLocalitySelect = (value: localityType) => {
    setSelectedLocality(value);
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        localityType: value,
      },
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (name in formData.address) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [name]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "date" ? new Date(value) : value,
      }));
    }
  };

  useEffect(() => {
    if (updateMutation.isSuccess) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 800);
      return () => clearTimeout(timer);
    }
  }, [updateMutation.isSuccess]);

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (loading) return;
    updateMutation.mutate(formData);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-12  py-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm">
    {/* Heading */}
    <div className="flex justify-center mb-8">
      <h1 className="text-3xl font-semibold font-sans text-center">Accommodation</h1>
    </div>
  
    {/* Form Section */}
    <div className="grid  grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Place of Stay */}
      <div className="flex flex-col">
        <label className="text-lg text-gray-700 dark:text-white font-medium mb-2">Place of Stay</label>
        <DropdownMenu>
          <DropdownMenuTrigger className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Home className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </span>
            <Button variant="outline" className="w-full pl-10 pr-4 py-2 font-normal rounded-lg flex justify-between items-center">
              {selectedPlace.replace("_", " ")}
              <IoIosArrowDown className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white dark:bg-gray-800 rounded-md shadow-lg">
            <DropdownMenuRadioGroup value={selectedPlace} onValueChange={(value) => handlePlaceSelect(value as PlaceOfStay)}>
              {placeOptions.map((place) => (
                <DropdownMenuRadioItem key={place} value={place}>
                  {place.replace("_", " ")}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
  
      {/* Dynamic Form Fields */}
      {formElements.map(({ name, label, type, icon }) => (
        <div key={name} className="flex flex-col">
          <label className="text-lg text-gray-700 dark:text-white font-medium mb-2">{label}</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {icon}
            </span>
            <Input
              id={name}
              name={name}
              type={type}
              value={
                type === "date" && formData[name as keyof Accommodation] instanceof Date
                  ? (formData[name as keyof Accommodation] as Date).toISOString().split("T")[0]
                  : (formData[name as keyof Accommodation] as string) || ""
              }
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      ))}
    </div>
  
    {/* Address Accordion */}
    <div className="mt-10 ">
      <Accordion type="multiple" className="space-y-5">
        <AccordionItem value="address" className="border rounded-md shadow-sm px-8">
          <AccordionTrigger className="text-lg font-semibold py-4">Address</AccordionTrigger>
          <AccordionContent className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            {addressFields.map(({ name, label, type, icon }) => (
              <div key={name} className="flex flex-col">
                <label className="text-lg text-gray-700 dark:text-white font-medium mb-2">{label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    {icon}
                  </span>
                  <Input
                    id={name}
                    name={name}
                    type={type}
                    value={formData.address[name as keyof Address] || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
  
            {/* Locality Type Dropdown */}
            <div className="flex flex-col">
              <label className="text-lg text-gray-700 dark:text-white font-medium mb-2">Locality Type</label>
              <DropdownMenu>
                <DropdownMenuTrigger className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Home className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                  </span>
                  <Button variant="outline" className="w-full pl-10 pr-4 py-2 font-normal rounded-lg flex justify-between items-center">
                    {selectedLocality.replace("_", " ")}
                    <IoIosArrowDown className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white dark:bg-gray-800 rounded-md shadow-lg">
                  <DropdownMenuRadioGroup value={selectedLocality} onValueChange={(value) => handleLocalitySelect(value as localityType)}>
                    {locality.map((place) => (
                      <DropdownMenuRadioItem key={place} value={place}>
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
    </div>
  
    {/* Submit Button */}
    <div className="mt-10 flex justify-center">
      <Button
        type="submit"
        onClick={handleSubmit}
        className="w-full md:w-auto text-white font-bold bg-blue-600 hover:bg-blue-700 py-3 px-8 rounded-lg flex items-center justify-center gap-3 text-base transition-all disabled:opacity-50"
        disabled={updateMutation.isLoading}
      >
        {updateMutation.isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : showSuccess ? (
          <>
            <CheckCircle className="w-5 h-5 animate-pulse" />
            Saved
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Submit
          </>
        )}
      </Button>
    </div>
  </div>
  
  );
};

export default AccommodationForm;