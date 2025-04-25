import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Globe, IdCard, Mail, User, Save, Sparkles, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { useFetch } from "@/hooks/useFetch";
import { addPersonalDetails, findPersonalDetailsByStudentId } from "@/services/personal-details-api";
import { PersonalDetails } from "@/types/user/personal-details";
import { useEffect } from "react";

// Define the validation schema
const personalDetailsSchema = z.object({
  aadhaarCardNumber: z.string().nullable(),
  email: z.string().email("Invalid email").nullable(),
  alternativeEmail: z.string().nullable().optional(),
  dateOfBirth: z.date().nullable(),
  nationality: z.any().nullable().optional(),
  motherTongue: z.any().nullable().optional(),
  religion: z.any().nullable().optional(),
  residentialAddress: z.any().nullable().optional(),
  mailingAddress: z.any().nullable().optional(),
  category: z.any().nullable().optional(),
  gender: z.enum(["MALE", "FEMALE", "TRANSGENDER"]).nullable(),
  disability: z.enum(["VISUAL", "HEARING_IMPAIRMENT", "VISUAL_IMPAIRMENT", "ORTHOPEDIC", "OTHER"]).nullable(),
});

type FormValues = z.infer<typeof personalDetailsSchema>;

interface PersonalDetailProps {
  studentId: number;
}

export default function PersonalDetail({ studentId }: PersonalDetailProps) {
  const { data, loading, refetch } = useFetch<PersonalDetails>({
    getFn: async () => (await findPersonalDetailsByStudentId(studentId)).payload,
    postFn: async (personalDetails: PersonalDetails) => {
      const result = await addPersonalDetails(personalDetails);
      return result.payload as PersonalDetails;
    },
    default: {
      aadhaarCardNumber: null,
      alternativeEmail: null,
      dateOfBirth: null,
      nationality: null,
      motherTongue: null,
      religion: null,
      residentialAddress: null,
      mailingAddress: null,
      category: null,
      gender: null,
      disability: "OTHER",
      email: null,
      studentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as PersonalDetails,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(personalDetailsSchema),
    defaultValues: {
      aadhaarCardNumber: null,
      email: null,
      alternativeEmail: null,
      dateOfBirth: null,
      nationality: null,
      motherTongue: null,
      religion: null,
      residentialAddress: null,
      mailingAddress: null,
      category: null,
      gender: null,
      disability: null,
    },
  });

  // Update form when data is loaded
  useEffect(() => {
    if (data) {
      reset({
        aadhaarCardNumber: data.aadhaarCardNumber,
        email: data.email,
        alternativeEmail: data.alternativeEmail || "",
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        nationality: data.nationality,
        motherTongue: data.motherTongue,
        religion: data.religion,
        residentialAddress: data.residentialAddress,
        mailingAddress: data.mailingAddress,
        category: data.category,
        gender: data.gender,
        disability: data.disability,
      });
    }
  }, [data, reset]);

  const dateOfBirth = watch("dateOfBirth");
  const residentialAddress = watch("residentialAddress");
  const mailingAddress = watch("mailingAddress");
  const nationality = watch("nationality");
  const religion = watch("religion");
  const category = watch("category");
  const aadhaarCardNumber = watch("aadhaarCardNumber");

  const onSubmit = (formData: FormValues) => {
    console.log("Form Data: ", formData);
    if (data) {
      // Update the data and refetch
      const updatedData = {
        ...data,
        ...formData,
        disability: formData.disability || "OTHER",
      };

      addPersonalDetails(updatedData as PersonalDetails)
        .then(() => refetch())
        .catch((err) => console.error("Error updating personal details:", err));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6">
        <CardContent className="mt-6 space-y-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* PERSONAL DETAILS */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-1">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <IdCard />
                    Aadhaar Number
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <IdCard className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input className="pl-10 bg-white dark:bg-gray-950" value={aadhaarCardNumber || ""} readOnly />
                  </div>
                </div>

                <InputWithIcon
                  label="Date of Birth"
                  icon={<CalendarIcon />}
                  value={dateOfBirth ? format(dateOfBirth, "PPP") : ""}
                  readOnly
                />
                <InputWithIcon label="Gender" icon={<User />} value={watch("gender") || ""} readOnly />
                <InputWithIcon label="Religion" icon={<BookOpen />} value={religion?.name || ""} readOnly />
                <InputWithIcon label="Category" icon={<BookOpen />} value={category?.name || ""} readOnly />
                <InputWithIcon label="Nationality" icon={<Globe />} value={nationality?.name || ""} readOnly />
              </div>
            </section>

            {/* CONTACT DETAILS */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-1">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputWithIcon label="Email" icon={<Mail />} {...register("email")} />
                <InputWithIcon label="Alternative Email" icon={<Mail />} {...register("alternativeEmail")} />
              </div>

              {/* Residential Address */}
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">Residential Address</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                  <p className="mb-2">{residentialAddress?.addressLine}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <span className="font-medium">Locality:</span> {residentialAddress?.localityType}
                    </p>
                    <p>
                      <span className="font-medium">Pincode:</span> {residentialAddress?.pincode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mailing Address */}
              <div className="mt-4">
                <h4 className="text-md font-medium mb-2">Mailing Address</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                  <p className="mb-2">{mailingAddress?.addressLine}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>
                      <span className="font-medium">Locality:</span> {mailingAddress?.localityType}
                    </p>
                    <p>
                      <span className="font-medium">Pincode:</span> {mailingAddress?.pincode}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* DISABILITY INFO */}
            <section className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-1">Other</h3>
              <InputWithIcon label="Disability" icon={<Sparkles />} value={watch("disability") || "None"} readOnly />
            </section>

            <Button type="submit" className="mt-4" disabled={!isDirty}>
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

interface InputWithIconProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
}

const InputWithIcon = ({ label, icon, ...props }: InputWithIconProps) => (
  <div className="space-y-1">
    <Label className="flex items-center gap-2">
      {icon}
      {label}
    </Label>
    <div className="relative">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</div>
      <Input className="pl-10 bg-white dark:bg-gray-950" {...props} />
    </div>
  </div>
);
