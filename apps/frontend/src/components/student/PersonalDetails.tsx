import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Globe, IdCard, Languages, Mail, Podcast, User } from "lucide-react";
import { Home } from "lucide-react";
import { useEffect } from "react";
import { fetchPersonalDetailsByStudentId } from "@/services/personal-details";
import { useParams } from "react-router-dom";

// Define the validation schema
const personalDetailsSchema = z.object({
  aadhaarCardNumber: z.string().min(12, "Aadhaar must be 12 digits").max(16),
  email: z.string().email("Invalid email"),
  alternativeEmail: z.string().optional(),
  dateOfBirth: z.date(),
  nationalityId: z.number().optional(),
  otherNationalityId: z.number().optional(),
  religionId: z.number().optional(),
  categoryId: z.number().optional(),
  motherTongueId: z.number().optional(),
  gender: z.enum(["MALE", "FEMALE", "TRANSGENDER"]),
  mailingAddressId: z.number().optional(),
  residentialAddressId: z.number().optional(),
  disability: z.enum(["VISUAL", "HEARING_IMPAIRMENT", "VISUAL_IMPAIRMENT", "ORTHOPEDIC", "OTHER"]).optional(),
  disabilityCodeId: z.number().optional(),
});

export default function PersonalDetail() {
  const { studentId } = useParams<{ studentId: string }>();
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

  useEffect(() => {
    async function loadPersonalDetails() {
      if (!studentId) return;

      try {
        const response = await fetchPersonalDetailsByStudentId(+studentId);
        console.log("Personal details fetched:", response);

        if (response.payload) {
          // Set all fields from the API response
          setValue("aadhaarCardNumber", response.payload.aadhaarCardNumber);
          setValue("email", response.payload.email);
          setValue("alternativeEmail", response.payload.alternativeEmail || "");
          setValue("dateOfBirth", new Date(response.payload.dateOfBirth).toISOString().split("T")[0]);
          setValue("nationalityId", response.payload.nationalityId);
          setValue("otherNationalityId", response.payload.otherNationalityId || "");
          setValue("religionId", response.payload.religionId);
          setValue("categoryId", response.payload.categoryId || "");
          setValue("motherTongueId", response.payload.motherTongueId || "");
          setValue("gender", response.payload.gender);
          setValue("mailingAddressId", response.payload.mailingAddressId || "");
          setValue("residentialAddressId", response.payload.residentialAddressId || "");
          setValue("disability", response.payload.disability || "");
          setValue("disabilityCodeId", response.payload.disabilityCodeId || "");
        }
      } catch (error) {
        console.log("Error fetching personal details:", error);
      }
    }
    loadPersonalDetails();
  }, [studentId, setValue]);

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
          <Input type="date" {...register("dateOfBirth")} placeholder="Enter Date of Birth" />
          {errors.dateOfBirth?.message && (
            <p className="text-red-500 text-sm">{errors.dateOfBirth.message.toString()}</p>
          )}
        </div>

        {/* Nationality ID */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Nationality ID
          </Label>
          <Input type="number" {...register("nationalityId")} placeholder="Enter Nationality ID" />
        </div>

        {/* Other Nationality ID */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Other Nationality ID
          </Label>
          <Input type="number" {...register("otherNationalityId")} placeholder="Enter Other Nationality ID" />
        </div>

        {/* Religion ID */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Podcast className="w-5 h-5 text-blue-600" />
            Religion ID
          </Label>
          <Input type="number" {...register("religionId")} placeholder="Enter Religion ID" />
        </div>

        {/* Category ID */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Podcast className="w-5 h-5 text-blue-600" />
            Category ID
          </Label>
          <Input type="number" {...register("categoryId")} placeholder="Enter Category ID" />
        </div>

        {/* Mother Tongue ID */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Languages className="w-5 h-5 text-blue-600" />
            Mother Tongue ID
          </Label>
          <Input type="number" {...register("motherTongueId")} placeholder="Enter Mother Tongue ID" />
        </div>

        {/* Gender */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Gender
          </Label>
          <Input type="text" {...register("gender")} placeholder="Enter Gender" />
        </div>

        {/* Mailing Address ID */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-gray-500" />
            Mailing Address ID
          </Label>
          <Input type="number" {...register("mailingAddressId")} placeholder="Enter Mailing Address ID" />
        </div>

        {/* Residential Address ID */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            Residential Address ID
          </Label>
          <Input type="number" {...register("residentialAddressId")} placeholder="Enter Residential Address ID" />
        </div>

        {/* Disability */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Disability
          </Label>
          <Input type="text" {...register("disability")} placeholder="Enter Disability" />
        </div>

        {/* Disability Code ID */}
        <div className="mt-4">
          <Label className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Disability Code ID
          </Label>
          <Input type="number" {...register("disabilityCodeId")} placeholder="Enter Disability Code ID" />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full bg-blue-600 text-white mt-4">
          Submit
        </Button>
      </form>
    </div>
  );
}
