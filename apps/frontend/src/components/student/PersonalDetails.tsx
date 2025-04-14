import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Globe, IdCard, Languages, Mail, Podcast, User } from "lucide-react";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import {
  category,
  fetchAddressById,
  fetchPersonalDetailsByStudentId,
  languages,
  nationality,
  religion,
} from "@/services/personal-details";
import { useParams } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Nationality } from "@/types/resources/nationality";
import { Religion } from "@/types/resources/religion";
import { Category } from "@/types/resources/category";
import { LanguageMedium } from "@/types/resources/language-medium";
import { PersonalDetails } from "@/types/user/personal-details";
import { Address } from "@/types/resources/address";

// Define the validation schema
const personalDetailsSchema = z.object({
  aadhaarCardNumber: z.string().min(12, "Aadhaar must be 12 digits").max(16),
  email: z.string().email("Invalid email"),
  alternativeEmail: z.string().optional(),
  dateOfBirth: z.date(),
  nationality: z.string().optional(),
  otherNationality: z.string().optional(),
  religion: z.string().optional(),
  category: z.string().optional(),
  motherTongue: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "TRANSGENDER"]),
  addressLine: z.string().optional(),
  landmark: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  localityType: z.string().optional(),
  disability: z.enum(["VISUAL", "HEARING_IMPAIRMENT", "VISUAL_IMPAIRMENT", "ORTHOPEDIC", "OTHER"]).optional(),
  disabilityCode: z.string().optional(),
});

export default function PersonalDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [religions, setReligions] = useState<Religion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [languageMediums, setLanguageMediums] = useState<LanguageMedium[]>([]);
  const [personalDetailsData, setPersonalDetailsData] = useState<PersonalDetails | null>(null);
  const [addressData, setAddressData] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReligionLoading, setIsReligionLoading] = useState(true);
  const [isCategoryLoading, setIsCategoryLoading] = useState(true);
  const [isLanguageLoading, setIsLanguageLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(personalDetailsSchema),
  });

  const nationalityValue = useWatch({
    control,
    name: "nationality",
  });

  const otherNationalityValue = useWatch({
    control,
    name: "otherNationality",
  });

  const religionValue = useWatch({
    control,
    name: "religion",
  });

  const categoryValue = useWatch({
    control,
    name: "category",
  });

  const motherTongueValue = useWatch({
    control,
    name: "motherTongue",
  });

  const onSubmit = (data: unknown) => {
    console.log("Form Data: ", data);
  };

  // Fetch nationalities
  useEffect(() => {
    async function fetchNationalities() {
      try {
        const response = await nationality();
        console.log("Nationalities response:", response);
        if (response.payload && response.payload.content && Array.isArray(response.payload.content)) {
          setNationalities(response.payload.content);
          console.log("Nationalities set:", response.payload.content);
        } else {
          console.log("Nationalities payload is not an array or is empty:", response.payload);
        }
      } catch (error) {
        console.error("Error fetching nationalities:", error);
        if (error && typeof error === 'object' && 'response' in error) {
          const errorObj = error as { response?: { data?: unknown, status?: number } };
          console.error("Error response:", errorObj.response?.data);
          console.error("Error status:", errorObj.response?.status);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchNationalities();
  }, []);

  // Fetch religions
  useEffect(() => {
    async function fetchReligions() {
      try {
        const response = await religion();
        console.log("Religions response:", response);
        if (response.payload && response.payload.content && Array.isArray(response.payload.content)) {
          setReligions(response.payload.content);
          console.log("Religions set:", response.payload.content);
        } else {
          console.log("Religions payload is not an array or is empty:", response.payload);
        }
      } catch (error) {
        console.error("Error fetching religions:", error);
        if (error && typeof error === 'object' && 'response' in error) {
          const errorObj = error as { response?: { data?: unknown, status?: number } };
          console.error("Error response:", errorObj.response?.data);
          console.error("Error status:", errorObj.response?.status);
        }
      } finally {
        setIsReligionLoading(false);
      }
    }
    fetchReligions();
  }, []);

  useEffect(() => {
    async function getAllAddress() {
      try {
        if (!studentId) return;
        const response = await fetchAddressById(+studentId);
        console.log("Address response is coming......:", response);
        if (response.payload) {
          setAddressData(response.payload);
        }
      } catch (error) {
        console.log("Error fetching address......:", error);
      }
    }
    getAllAddress();
  }, [studentId]);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await category();
        console.log("Categories response:", response);
        if (response.payload && response.payload.content && Array.isArray(response.payload.content)) {
          setCategories(response.payload.content);
          console.log("Categories set:", response.payload.content);
        } else {
          console.log("Categories payload is not an array or is empty:", response.payload);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        if (error && typeof error === 'object' && 'response' in error) {
          const errorObj = error as { response?: { data?: unknown, status?: number } };
          console.error("Error response:", errorObj.response?.data);
          console.error("Error status:", errorObj.response?.status);
        }
      } finally {
        setIsCategoryLoading(false);
      }
    }
    fetchCategories();
  }, []);

  // Fetch languages
  useEffect(() => {
    async function fetchLanguages() {
      try {
        const response = await languages();
        console.log("Languages response:", response);
        if (response.payload && response.payload.content && Array.isArray(response.payload.content)) {
          setLanguageMediums(response.payload.content);
          console.log("Languages set:", response.payload.content);
        } else {
          console.log("Languages payload is not an array or is empty:", response.payload);
        }
      } catch (error) {
        console.error("Error fetching languages:", error);
        if (error && typeof error === 'object' && 'response' in error) {
          const errorObj = error as { response?: { data?: unknown, status?: number } };
          console.error("Error response:", errorObj.response?.data);
          console.error("Error status:", errorObj.response?.status);
        }
      } finally {
        setIsLanguageLoading(false);
      }
    }
    fetchLanguages();
  }, []);

  useEffect(() => {
    async function loadPersonalDetails() {
      if (!studentId) return;

      try {
        const response = await fetchPersonalDetailsByStudentId(+studentId);
        console.log("Personal details fetched:", response);

        if (response.payload) {
          // Store the data, we'll set form values after nationalities load
          setPersonalDetailsData(response.payload);
        }
      } catch (error) {
        console.log("Error fetching personal details:", error);
      }
    }
    loadPersonalDetails();
  }, [studentId]);

  // Set form values after all data is loaded
  useEffect(() => {
    if (personalDetailsData && !isLoading && !isReligionLoading && !isCategoryLoading && !isLanguageLoading) {
      // Set all fields from the stored data
      setValue("aadhaarCardNumber", personalDetailsData.aadhaarCardNumber);
      setValue("email", personalDetailsData.email);
      setValue("alternativeEmail", personalDetailsData.alternativeEmail || "");

      // Properly handle date of birth
      if (personalDetailsData.dateOfBirth) {
        try {
          // Parse the date string from API
          const dateObj = new Date(personalDetailsData.dateOfBirth);
          setValue("dateOfBirth", dateObj);

          // Format date for the input field (YYYY-MM-DD)
          const formattedDate = dateObj.toISOString().split("T")[0];
          const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
          if (dateInput) {
            dateInput.value = formattedDate;
          }
        } catch (error) {
          console.error("Error parsing date:", error);
        }
      }

      setValue("nationality", personalDetailsData.nationality?.id?.toString() || "");
      setValue("otherNationality", personalDetailsData.otherNationality?.id?.toString() || "");
      setValue("religion", personalDetailsData.religion?.id?.toString() || "");
      setValue("category", personalDetailsData.category?.id?.toString() || "");
      setValue("motherTongue", personalDetailsData.motherTongue?.id?.toString() || "");
      setValue("gender", personalDetailsData.gender);
      if (addressData) {
        setValue("addressLine", addressData.addressLine || "");
        setValue("landmark", addressData.landmark || "");
        setValue("pincode", addressData.pincode || "");
        setValue("phone", addressData.phone || "");
        setValue("localityType", addressData.locality || "");
      }
    }
  }, [personalDetailsData, addressData, isLoading, isReligionLoading, isCategoryLoading, isLanguageLoading, setValue]);

  return (
    <div className="w-full max-w-none flex flex-col justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-transparent border-none shadow-none m-0 p-0 max-w-none grid grid-cols-2 gap-4"
      >
        {/* Aadhaar Card */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <IdCard className="w-5 h-5 text-blue-600" />
            Aadhaar Card Number
          </Label>
          <Input type="text" {...register("aadhaarCardNumber")} placeholder="Enter Aadhaar Number" />
          {errors.aadhaarCardNumber?.message && (
            <p className="text-red-500 text-sm">{errors.aadhaarCardNumber.message.toString()}</p>
          )}
        </div>

        {/* Email */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-500" />
            Email
          </Label>
          <Input type="email" {...register("email")} placeholder="Enter Email" />
          {errors.email?.message && <p className="text-red-500 text-sm">{errors.email.message.toString()}</p>}
        </div>

        {/* Alternative Email */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-500" />
            Alternative Email
          </Label>
          <Input type="email" {...register("alternativeEmail")} placeholder="Enter Alternative Email" />
        </div>

        {/* Date of Birth */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            Date of Birth
          </Label>
          <Input
            type="date"
            {...register("dateOfBirth")}
            placeholder="Enter Date of Birth"
            className="w-full p-2 border rounded-md"
          />
          {errors.dateOfBirth?.message && (
            <p className="text-red-500 text-sm">{errors.dateOfBirth.message.toString()}</p>
          )}
        </div>

        {/* Nationality Select */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Nationality
          </Label>
          <Select onValueChange={(value) => setValue("nationality", value)} value={nationalityValue} defaultValue="">
            <SelectTrigger>
              <SelectValue placeholder="Select Nationality" />
            </SelectTrigger>
            <SelectContent>
              {nationalities.length > 0 ? (
                nationalities
                  .filter((nat) => nat.id !== undefined && nat.id !== null)
                  .map((nat) => (
                    <SelectItem key={nat.id as number} value={(nat.id as number).toString()}>
                      {nat.name}
                    </SelectItem>
                  ))
              ) : (
                <div className="px-2 py-1 text-sm text-gray-500">No nationalities found</div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Other Nationality Select */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Other Nationality
          </Label>
          <Select
            onValueChange={(value) => setValue("otherNationality", value)}
            value={otherNationalityValue}
            defaultValue=""
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Other Nationality" />
            </SelectTrigger>
            <SelectContent>
              {nationalities.length > 0 ? (
                nationalities
                  .filter((nat) => nat.id !== undefined && nat.id !== null)
                  .map((nat) => (
                    <SelectItem key={`other-${nat.id as number}`} value={(nat.id as number).toString()}>
                      {nat.name}
                    </SelectItem>
                  ))
              ) : (
                <div className="px-2 py-1 text-sm text-gray-500">No nationalities found</div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Religion Select */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Podcast className="w-5 h-5 text-blue-600" />
            Religion
          </Label>
          <Select onValueChange={(value) => setValue("religion", value)} value={religionValue} defaultValue="">
            <SelectTrigger>
              <SelectValue placeholder="Select Religion" />
            </SelectTrigger>
            <SelectContent>
              {religions.length > 0 ? (
                religions
                  .filter((rel) => rel.id !== undefined && rel.id !== null)
                  .map((rel) => (
                    <SelectItem key={rel.id as number} value={(rel.id as number).toString()}>
                      {rel.name}
                    </SelectItem>
                  ))
              ) : (
                <div className="px-2 py-1 text-sm text-gray-500">No religions found</div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Category Select */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Podcast className="w-5 h-5 text-blue-600" />
            Category
          </Label>
          <Select onValueChange={(value) => setValue("category", value)} value={categoryValue} defaultValue="">
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.length > 0 ? (
                categories
                  .filter((cat) => cat.id !== undefined && cat.id !== null)
                  .map((cat) => (
                    <SelectItem key={cat.id as number} value={(cat.id as number).toString()}>
                      {cat.name}
                    </SelectItem>
                  ))
              ) : (
                <div className="px-2 py-1 text-sm text-gray-500">No categories found</div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Mother Tongue Select */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-blue-600" />
            Mother Tongue
          </Label>
          <Select onValueChange={(value) => setValue("motherTongue", value)} value={motherTongueValue} defaultValue="">
            <SelectTrigger>
              <SelectValue placeholder="Select Mother Tongue" />
            </SelectTrigger>
            <SelectContent>
              {languageMediums.length > 0 ? (
                languageMediums
                  .filter((lang) => lang.id !== undefined && lang.id !== null)
                  .map((lang) => (
                    <SelectItem key={lang.id as number} value={(lang.id as number).toString()}>
                      {lang.name}
                    </SelectItem>
                  ))
              ) : (
                <div className="px-2 py-1 text-sm text-gray-500">No languages found</div>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Gender */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Gender
          </Label>
          <Input type="text" {...register("gender")} placeholder="Enter Gender" />
        </div>

        {/* Residential Address Section */}
        <div className="col-span-2 mt-6 mb-2">
          <h3 className="text-lg font-medium">Residential Address</h3>
        </div>

        {/* Address Line */}
        <div className="mt-2">
          <Label className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            Address Line
          </Label>
          <Input type="text" {...register("addressLine")} placeholder="Enter Address Line" />
        </div>

        {/* Landmark */}
        <div className="mt-2">
          <Label className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            Landmark
          </Label>
          <Input type="text" {...register("landmark")} placeholder="Enter Landmark" />
        </div>

        {/* Pincode */}
        <div className="mt-2">
          <Label className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            Pincode
          </Label>
          <Input type="text" {...register("pincode")} placeholder="Enter Pincode" />
        </div>

        {/* Phone */}
        <div className="mt-2">
          <Label className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            Phone
          </Label>
          <Input type="text" {...register("phone")} placeholder="Enter Phone" />
        </div>

        {/* Locality Type */}
        <div className="mt-2">
          <Label className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            Locality Type
          </Label>
          <Select
            onValueChange={(value) => setValue("localityType", value)}
            value={useWatch({ control, name: "localityType" })}
            defaultValue=""
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Locality Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="URBAN">Urban</SelectItem>
              <SelectItem value="RURAL">Rural</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col items-center justify-center col-span-2 mt-4">
        <Button type="submit" className=" bg-blue-600 text-white mt-4">
          Submit
        </Button>
        </div>
      </form>
    </div>
  );
}
