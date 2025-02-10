import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";

// Define the validation schema
const personalDetailsSchema = z.object({
  aadhaarCardNumber: z.string().min(12, "Aadhaar must be 12 digits").max(16),
  email: z.string().email("Invalid email"),
  alternativeEmail: z.string().optional(),
  dateOfBirth: z.date(),
  gender: z.enum(["MALE", "FEMALE", "TRANSGENDER"]),
  disability: z.enum(["VISUAL", "HEARING_IMPAIRMENT", "VISUAL_IMPAIRMENT", "ORTHOPEDIC", "OTHER"]).optional(),
});

export default function PersonalDetails() {
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

  return (
    <div className="">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-transparent border-none shadow-none m-0 p-">
        {/* Aadhaar Card */}
        <div>
          <Label>Aadhaar Card Number</Label>
          <Input type="text" {...register("aadhaarCardNumber")} placeholder="Enter Aadhaar Number" />
          {errors.aadhaarCardNumber?.message && <p className="text-red-500 text-sm">{errors.aadhaarCardNumber.message.toString()}</p>}
        </div>

        {/* Email */}
        <div>
          <Label>Email</Label>
          <Input type="email" {...register("email")} placeholder="Enter Email" />
          {errors.email?.message && <p className="text-red-500 text-sm">{errors.email.message.toString()}</p>}
        </div>

        {/* Alternative Email */}
        <div>
          <Label>Alternative Email</Label>
          <Input type="email" {...register("alternativeEmail")} placeholder="Enter Alternative Email" />
        </div>

        {/* Date of Birth */}
        <div>
          <Label>Date of Birth</Label>
          <Calendar mode="single" selected={new Date()} onSelect={(date) => setValue("dateOfBirth", date!)} />
          {errors.dateOfBirth && <p className="text-red-500 text-sm">{errors.dateOfBirth.message?.toString()}</p>}
        </div>

        {/* Gender Selection */}
        <div>
          <Label>Gender</Label>
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
        <div>
          <Label>Disability</Label>
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
        <Button type="submit" className="w-full bg-blue-600 text-white">
          Submit
        </Button>
      </form>
    </div>
  );
}
