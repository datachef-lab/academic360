import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Globe, IdCard, Languages, Mail, Podcast, User } from "lucide-react";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import { nationality } from "@/services/nationality";
import { Nationality } from "@/types/resources/nationality";
import { languages } from "@/services/language-medium";
import { LanguageMedium } from "@/types/resources/language-medium";
import { religion } from "@/services/religion";
import { Religion } from "@/types/resources/religion";

// Define the validation schema
const personalDetailsSchema = z.object({
  aadhaarCardNumber: z.string().min(12, "Aadhaar must be 12 digits").max(16),
  email: z.string().email("Invalid email"),
  alternativeEmail: z.string().optional(),
  dateOfBirth: z.date(),
  nationality: z.string().optional(),
  motherTongue: z.string().optional(),
  religion: z.string().optional(),
  residentialAddress: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "TRANSGENDER"]),
  disability: z.enum(["VISUAL", "HEARING_IMPAIRMENT", "VISUAL_IMPAIRMENT", "ORTHOPEDIC", "OTHER"]).optional(),
});

export default function PersonalDetail() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(personalDetailsSchema),
  });

  const onSubmit = (data: unknown) => {
    console.log("Form Data: ", data);
  };

  const [nationalities, setNationalities] = useState<Nationality[]>([]);
  const [language, setLanguage] = useState<LanguageMedium[]>([]);
  const [religions, setReligions] = useState<Religion[]>([]);

  useEffect(() => {
    // nationality
    async function getAllNationality() {
      try {
        const response = await nationality();
        console.log("Nationality is coming...", response)
        if (response.payload && response.payload.content) {
          setNationalities(response.payload.content);
        }
      } catch (error) {
        console.log("Error fetching nationality...", error);
      }
    }
    getAllNationality();

    // languages
    async function getAllLanguages() {
      try {
        const response = await languages();
        console.log("Languages is coming...", response);
        if (response.payload && response.payload.content) {
          setLanguage(response.payload.content);
        }
      } catch (error) {
        console.log("Error fetching Language...", error);
      }
    }
    getAllLanguages();

    // religion
    async function getAllReligions() {
      try {
        const response = await religion();
        console.log("Languages is coming...", response);
        if (response.payload && response.payload.content) {
          setReligions(response.payload.content);
        }
      } catch (error) {
        console.log("Error fetching Language...", error);
      }
    }
    getAllReligions()

  }, []);
  return (
    <div className="w-full max-w-none flex flex-col justify-center items-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-transparent border-none shadow-none m-0 p-0 max-w-none grid grid-cols-2 gap-4"
      >
        {/* Aadhaar Card */}
        <div className="mt-4 ">
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
          <div className="relative">
            <Input type="date" name="dateOfBirth" className="w-full p-2 border rounded-md" />
          </div>
          {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth.message?.toString()}</p>}
        </div>

        {/* Nationality */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Nationality
          </Label>
          <Select onValueChange={(value) => setValue("nationality", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Nationality" />
            </SelectTrigger>
            <SelectContent>
              {nationalities.map((nationality) => (
                <SelectItem key={nationality.id} value={nationality.name}>
                  {nationality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.nationality && <p className="text-red-500 text-sm">{errors.nationality.message?.toString()}</p>}
        </div>

        {/* Mother Tongue */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-blue-600" />
            Mother Tounge
          </Label>
          <Select onValueChange={(value) => setValue("language", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Mother Tounge" />
            </SelectTrigger>
            <SelectContent>
              {language.map((language) => (
                <SelectItem key={language.id} value={language.name}>
                  {language.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.language && <p className="text-red-500 text-sm">{errors.language.message?.toString()}</p>}
        </div>

        {/* Religion */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Podcast className="w-5 h-5 text-blue-600" />
            Religion
          </Label>
          <Select onValueChange={(value) => setValue("religion", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Religion" />
            </SelectTrigger>
            <SelectContent>
              {religions.map((religion) => (
                <SelectItem key={religion.id} value={religion.name}>
                  {religion.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.religion && <p className="text-red-500 text-sm">{errors.religion.message?.toString()}</p>}
        </div>

        {/* Residential Address */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            Residential Address
          </Label>
          <Input type="text" {...register("residentialAddress")} placeholder="Enter Residential Address" />
        </div>

        {/* Gender Selection */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Gender
          </Label>
          <Select onValueChange={(value) => setValue("gender", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="TRANSGENDER">Transgender</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && <p className="text-red-500 text-sm">{errors.gender.message?.toString()}</p>}
        </div>

        {/* Disability Selection */}
        <div className="mt-4">
          <Label className=" flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Disability
          </Label>
          <Select onValueChange={(value) => setValue("disability", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Disability (if any)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VISUAL">Visual</SelectItem>
              <SelectItem value="HEARING_IMPAIRMENT">Hearing Impairment</SelectItem>
              <SelectItem value="VISUAL_IMPAIRMENT">Visual Impairment</SelectItem>
              <SelectItem value="ORTHOPEDIC">Orthopedic</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full bg-blue-600 text-white mt-4">
          Submit
        </Button>
      </form>
    </div>
  );
}
