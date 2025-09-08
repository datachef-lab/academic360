import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { PersonalDetails as PersonalDetailsType } from "@/types/user/personal-details";
import {
  CalendarIcon,
  Globe,
  IdCard,
  Mail,
  User,
  Save,
  Sparkles,
  BookOpen,
  CheckCircle,
  PenLine,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  getPersonalDetailByStudentId,
  updatePersonalDetailByStudentId,
  createPersonalDetail,
} from "@/services/personal-details.service";
import { getAllReligions } from "@/services/religion.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Religion } from "@/types/user/religion";
import { Category } from "@/types/user/category";
import { getAllCategories } from "@/services/categories.service";
import { getAllNationalities } from "@/services/nationalities.service";
import { Nationality } from "@/types/user/nationality";
import { Gender, Disability, LocalityType } from "@/types/enums";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { updateAddress } from "@/services/address.service";
import type { Address } from "@/types/user/address";

// Personal Details component with religion and category dropdowns

const getAddressProperty = <K extends keyof Address>(obj: Address | null | undefined, prop: K): string => {
  if (obj && typeof obj === "object" && prop in obj && obj[prop] !== null && obj[prop] !== undefined) {
    return String(obj[prop]);
  }
  return "";
};

const formElements = [
  {
    name: "aadhaarCardNumber",
    label: "Aadhaar Number",
    type: "text",
    icon: <IdCard className="text-gray-500 dark:text-white w-5 h-5" />,
  },
  { name: "email", label: "Email", type: "email", icon: <Mail className="text-gray-500 dark:text-white w-5 h-5" /> },
  {
    name: "alternativeEmail",
    label: "Alternative Email",
    type: "email",
    icon: <Mail className="text-gray-500 dark:text-white w-5 h-5" />,
  },
];

// Remove old genderOptions and add new arrays for gender and disability
const genderOptions: { value: Gender; label: string }[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "TRANSGENDER", label: "Transgender" },
];

const disabilityOptions: { value: Disability; label: string }[] = [
  { value: "VISUAL", label: "Visual" },
  { value: "HEARING_IMPAIRMENT", label: "Hearing Impairment" },
  { value: "VISUAL_IMPAIRMENT", label: "Visual Impairment" },
  { value: "ORTHOPEDIC", label: "Orthopedic" },
  { value: "OTHER", label: "Other" },
];

const localityOptions: { value: LocalityType; label: string }[] = [
  { value: "URBAN", label: "Urban" },
  { value: "RURAL", label: "Rural" },
];

const defaultPersonalDetails: PersonalDetailsType = {
  studentId: 0,
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
  disability: "OTHER",
  createdAt: new Date(),
  updatedAt: new Date(),
};

interface PersonalDetailProps {
  studentId: number;
}

export default function PersonalDetail({ studentId }: PersonalDetailProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [religions] = useState<Religion[]>([]);
  const [categories] = useState<Category[]>([]);
  const [nationalities] = useState<Nationality[]>([]);
  const [formData, setFormData] = useState<PersonalDetailsType>({
    ...defaultPersonalDetails,
    studentId,
  });

  // Fetch religions and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [religionsData, categoriesData, nationalitiesData] = await Promise.all([
          getAllReligions(),
          getAllCategories(),
          getAllNationalities(),
        ]);
        console.log("Fetched religions:", religionsData);
        console.log("Fetched categories:", categoriesData);
        console.log("Fetched nationalities:", nationalitiesData);
        // setReligions(religionsData);
        // setCategories(categoriesData);
        // setNationalities(nationalitiesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  // Use React Query to fetch personal details
  const {
    data: personalDetails,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["personalDetails", studentId],
    queryFn: async () => {
      const response = await getPersonalDetailByStudentId(String(studentId));
      return response.payload;
    },
    enabled: studentId > 0,
    retry: 1,
    staleTime: 300000, // 5 minutes
  });

  // Update form data when personal details are loaded
  useEffect(() => {
    if (personalDetails) {
      console.log("Personal details data loaded:", personalDetails);
      console.log("Current nationality in data:", personalDetails.nationality);
      setFormData(personalDetails);
    }
  }, [personalDetails]);

  const updateMutation = useMutation({
    mutationFn: async (formData: PersonalDetailsType) => {
      // Remove relation objects from the payload
      const {
        category,
        mailingAddress,
        residentialAddress,
        nationality,
        religion,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        createdAt: _createdAt, // Exclude from payload
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        updatedAt: _updatedAt, // Exclude from payload
        ...rest
      } = formData;

      // Update mailing and residential addresses if present
      const addressUpdatePromises: Promise<unknown>[] = [];
      if (mailingAddress && mailingAddress.id) {
        const {
          id: _id,
          createdAt: _mailingCreatedAt,
          updatedAt: _mailingUpdatedAt,
          ...mailingPayload
        } = mailingAddress as Address;
        void _id;
        void _mailingCreatedAt;
        void _mailingUpdatedAt;
        addressUpdatePromises.push(updateAddress(mailingAddress.id, mailingPayload));
      }
      if (residentialAddress && residentialAddress.id) {
        const {
          id: _residentialId,
          createdAt: _residentialCreatedAt,
          updatedAt: _residentialUpdatedAt,
          ...residentialPayload
        } = residentialAddress as Address;
        void _residentialId;
        void _residentialCreatedAt;
        void _residentialUpdatedAt;
        addressUpdatePromises.push(updateAddress(residentialAddress.id, residentialPayload));
      }
      if (addressUpdatePromises.length > 0) {
        await Promise.all(addressUpdatePromises);
      }

      const payload = {
        ...rest,
        categoryId: category?.id ?? null,
        mailingAddressId: mailingAddress?.id ?? null,
        residentialAddressId: residentialAddress?.id ?? null,
        nationalityId: nationality?.id ?? null,
        religionId: religion?.id ?? null,
        // Only send primitive fields and relation IDs
      };
      // Log the payload to ensure only IDs are sent for relations
      console.log("Payload being sent:", payload);
      if (formData.id) {
        return updatePersonalDetailByStudentId(String(studentId), payload);
      } else {
        return createPersonalDetail(payload);
      }
    },
    onSuccess: (data) => {
      // Log the personal details id from the response
      if (data && data.payload && data.payload.id) {
        console.log("Personal Details ID:", data.payload.id);
      }
      toast.success("Personal details have been successfully updated.", {
        icon: <PenLine />,
      });
      setShowSuccess(true);
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to save personal details. Please try again.");
      console.error("Error saving personal details:", error);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (formData.email && !formData.email.includes("@")) {
      newErrors.email = "Invalid email format";
    }

    // Alternative email validation (only if provided)
    if (formData.alternativeEmail && !formData.alternativeEmail.includes("@")) {
      newErrors.alternativeEmail = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
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
    if (!formData.studentId || formData.studentId <= 0) {
      toast.error("Invalid student ID. Cannot update personal details.");
      return;
    }
    if (isLoading || !validateForm()) return;
    console.log("Submitting form data:", formData);
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner className="w-8 h-8 text-blue-500" />
        <span className="ml-2">Loading personal details...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center h-40 text-red-500">
        <p>Error loading personal details</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Card className="max-w-8xl mx-auto my-8 shadow-xl border bg-white">
      <CardHeader>
        <CardTitle>Personal Details</CardTitle>
        <CardDescription>Fill in your personal information as per your official documents.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {formElements.map(({ name, label, type, icon }) => (
            <div key={name} className="flex flex-col gap-2">
              <Label htmlFor={name}>{label}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
                <Input
                  id={name}
                  name={name}
                  type={type}
                  value={(formData[name as keyof PersonalDetailsType] as string) || ""}
                  placeholder={label}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 rounded-lg py-2 ${errors[name] ? "border-red-500" : ""}`}
                />
              </div>
              {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
            </div>
          ))}

          {/* Date of Birth Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <CalendarIcon className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={
                  formData.dateOfBirth
                    ? typeof formData.dateOfBirth === "string"
                      ? formData.dateOfBirth
                      : formData.dateOfBirth instanceof Date
                        ? formData.dateOfBirth.toISOString().split("T")[0]
                        : ""
                    : ""
                }
                onChange={handleChange}
                className="w-full pl-10 pr-3 rounded-lg py-2"
              />
            </div>
          </div>

          {/* Gender Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="gender">Gender</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <User className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              <Select
                value={formData.gender || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, gender: value as Gender }) as PersonalDetailsType)
                }
              >
                <SelectTrigger className="w-full pl-10 pr-3 rounded-lg py-2">
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Religion Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="religion">Religion</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                <BookOpen className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              {religions && religions.length > 0 ? (
                <Select
                  value={formData.religion?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const selectedReligion = religions.find((r) => r.id.toString() === value);
                    setFormData(
                      (prev) =>
                        ({
                          ...prev,
                          religion: selectedReligion || null,
                        }) as PersonalDetailsType,
                    );
                  }}
                >
                  <SelectTrigger className="w-full pl-10 pr-3 rounded-lg py-2">
                    <SelectValue placeholder="Select religion" />
                  </SelectTrigger>
                  <SelectContent>
                    {religions.map((religion) => (
                      <SelectItem key={religion.id} value={religion.id.toString()}>
                        {religion.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-full pl-10 pr-3 rounded-lg py-2 border bg-gray-50 text-gray-500">
                  Loading religions...
                </div>
              )}
            </div>
          </div>

          {/* Category Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Category</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                <BookOpen className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              {categories && categories.length > 0 ? (
                <Select
                  value={formData.category?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const selectedCategory = categories.find((c) => c.id.toString() === value);
                    setFormData(
                      (prev) =>
                        ({
                          ...prev,
                          category: selectedCategory || null,
                        }) as PersonalDetailsType,
                    );
                  }}
                >
                  <SelectTrigger className="w-full pl-10 pr-3 rounded-lg py-2">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-full pl-10 pr-3 rounded-lg py-2 border bg-gray-50 text-gray-500">
                  Loading categories...
                </div>
              )}
            </div>
          </div>

          {/* Nationality Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="nationality">Nationality</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                <Globe className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              {nationalities && nationalities.length > 0 ? (
                <Select
                  value={formData.nationality?.id?.toString() || ""}
                  onValueChange={(value) => {
                    const selectedNationality = nationalities.find((n) => n.id.toString() === value);
                    setFormData(
                      (prev) =>
                        ({
                          ...prev,
                          nationality: selectedNationality || null,
                        }) as PersonalDetailsType,
                    );
                  }}
                >
                  <SelectTrigger className="w-full pl-10 pr-3 rounded-lg py-2">
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalities.map((nationality) => (
                      <SelectItem key={nationality.id} value={nationality.id.toString()}>
                        {nationality.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="w-full pl-10 pr-3 rounded-lg py-2 border bg-gray-50 text-gray-500">
                  Loading nationalities...
                </div>
              )}
            </div>
          </div>

          {/* Disability Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="disability">Disability</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <Sparkles className="text-gray-500 dark:text-white w-5 h-5" />
              </span>
              <Select
                value={formData.disability || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, disability: value as Disability }) as PersonalDetailsType)
                }
              >
                <SelectTrigger className="w-full pl-10 pr-3 rounded-lg py-2">
                  <SelectValue placeholder="Select Disability" />
                </SelectTrigger>
                <SelectContent>
                  {disabilityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="rounded-lg p-6 mb-8">
          <CardTitle className="text-lg mb-4">Residential Address</CardTitle>
          {formData.residentialAddress ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address fields with Label and Input/Select */}
              <div className="flex flex-col gap-2">
                <Label>Address Line</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                  </span>
                  <Input
                    value={getAddressProperty(formData.residentialAddress, "addressLine")}
                    onChange={(e) => {
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            residentialAddress: {
                              ...prev.residentialAddress,
                              addressLine: e.target.value,
                            },
                          }) as PersonalDetailsType,
                      );
                    }}
                    className="w-full pl-10 pr-3 rounded-lg py-2"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Pincode</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                  </span>
                  <Input
                    value={getAddressProperty(formData.residentialAddress, "pincode")}
                    onChange={(e) => {
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            residentialAddress: {
                              ...prev.residentialAddress,
                              pincode: e.target.value,
                            },
                          }) as PersonalDetailsType,
                      );
                    }}
                    className="w-full pl-10 pr-3 rounded-lg py-2"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Landmark</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                  </span>
                  <Input
                    value={getAddressProperty(formData.residentialAddress, "landmark") || ""}
                    onChange={(e) => {
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            residentialAddress: {
                              ...prev.residentialAddress,
                              landmark: e.target.value,
                            },
                          }) as PersonalDetailsType,
                      );
                    }}
                    placeholder="Enter landmark"
                    className="w-full pl-10 pr-3 rounded-lg py-2"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Phone</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Phone className="text-gray-500 dark:text-white w-5 h-5" />
                  </span>
                  <Input
                    value={getAddressProperty(formData.residentialAddress, "phone") || ""}
                    onChange={(e) => {
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            residentialAddress: {
                              ...prev.residentialAddress,
                              phone: e.target.value,
                            },
                          }) as PersonalDetailsType,
                      );
                    }}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-3 rounded-lg py-2"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Locality Type</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                  </span>
                  <Select
                    value={getAddressProperty(formData.residentialAddress, "localityType") || ""}
                    onValueChange={(value) => {
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            residentialAddress: {
                              ...prev.residentialAddress,
                              localityType: value as LocalityType,
                            },
                          }) as PersonalDetailsType,
                      );
                    }}
                  >
                    <SelectTrigger className="w-full pl-10 pr-3 rounded-lg py-2">
                      <SelectValue placeholder="Select Locality Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {localityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No residential address provided</p>
          )}
        </div>

        <div className="rounded-lg p-6 mb-8">
          <CardTitle className="text-lg mb-4">Mailing Address</CardTitle>
          {formData.mailingAddress ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label>Address Line</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                  </span>
                  <Input
                    value={getAddressProperty(formData.mailingAddress, "addressLine")}
                    onChange={(e) => {
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            mailingAddress: {
                              ...prev.mailingAddress,
                              addressLine: e.target.value,
                            },
                          }) as PersonalDetailsType,
                      );
                    }}
                    className="w-full pl-10 pr-3 rounded-lg py-2"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Pincode</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                  </span>
                  <Input
                    value={getAddressProperty(formData.mailingAddress, "pincode")}
                    onChange={(e) => {
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            mailingAddress: {
                              ...prev.mailingAddress,
                              pincode: e.target.value,
                            },
                          }) as PersonalDetailsType,
                      );
                    }}
                    className="w-full pl-10 pr-3 rounded-lg py-2"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Landmark</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                  </span>
                  <Input
                    value={getAddressProperty(formData.mailingAddress, "landmark") || ""}
                    onChange={(e) => {
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            mailingAddress: {
                              ...prev.mailingAddress,
                              landmark: e.target.value,
                            },
                          }) as PersonalDetailsType,
                      );
                    }}
                    placeholder="Enter landmark"
                    className="w-full pl-10 pr-3 rounded-lg py-2"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Phone</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Phone className="text-gray-500 dark:text-white w-5 h-5" />
                  </span>
                  <Input
                    value={getAddressProperty(formData.mailingAddress, "phone") || ""}
                    onChange={(e) => {
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            mailingAddress: {
                              ...prev.mailingAddress,
                              phone: e.target.value,
                            },
                          }) as PersonalDetailsType,
                      );
                    }}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-3 rounded-lg py-2"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Locality Type</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <MapPin className="text-gray-500 dark:text-white w-5 h-5" />
                  </span>
                  <Select
                    value={getAddressProperty(formData.mailingAddress, "localityType") || ""}
                    onValueChange={(value) => {
                      setFormData(
                        (prev) =>
                          ({
                            ...prev,
                            mailingAddress: {
                              ...prev.mailingAddress,
                              localityType: value as LocalityType,
                            },
                          }) as PersonalDetailsType,
                      );
                    }}
                  >
                    <SelectTrigger className="w-full pl-10 pr-3 rounded-lg py-2">
                      <SelectValue placeholder="Select Locality Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {localityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No mailing address provided</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2">
        <Button
          type="submit"
          onClick={handleSubmit}
          className="w-full sm:w-auto text-white font-medium sm:font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
          disabled={updateMutation.isLoading}
        >
          {updateMutation.isLoading ? (
            <>
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : showSuccess ? (
            <>
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              Save Changes
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
