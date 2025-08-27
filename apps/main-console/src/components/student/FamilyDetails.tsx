import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getFamilyDetailByStudentId,
  createFamilyDetail,
  updateFamilyDetail,
} from "@/services/family-details.service";
import { getAllAnnualIncomes } from "@/services/annual-income.service";
import { Family } from "@/types/user/family";
import { ParentType } from "@/types/enums";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
// import { Spinner } from "../ui/spinner";
import { Occupation } from "@/types/resources/occupation.types";
import { getAllOccupations } from "@/services/occupations.service";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  import { AnnualIncome } from "@/types/resources/annual-income.types";
  import { Save, CheckCircle } from "lucide-react";
// import { AnnualIncome } from "@/types/resources/annual-income";
// import { Qualification } from "@/types/resources/qualification";

// Helper function to safely access object properties
// const getPersonProperty = (obj: any, property: string): string => {
//   if (obj && typeof obj === "object" && property in obj && typeof obj[property] === "string") {
//     return obj[property];
//   }
//   return "";
// };

// // Helper function to safely access nested object properties
// const getNestedProperty = (obj: any, nestedKey: string, property: string): string => {
//   if (
//     obj &&
//     typeof obj === "object" &&
//     nestedKey in obj &&
//     obj[nestedKey] &&
//     typeof obj[nestedKey] === "object" &&
//     property in obj[nestedKey] &&
//     typeof obj[nestedKey][property] === "string"
//   ) {
//     return obj[nestedKey][property];
//   }
//   return "";
// };

// const defaultFamilyDetails: Parent = {
//   studentId: 0,
//   parentType: "BOTH",
//   fatherDetails: {
//     name: null,
//     email: null,
//     phone: null,
//     aadhaarCardNumber: null,
//     image: null,
//     officePhone: null,
//     qualification: null,
//     occupation: null,
//     officeAddress: null,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   motherDetails: {
//     name: null,
//     email: null,
//     phone: null,
//     aadhaarCardNumber: null,
//     image: null,
//     officePhone: null,
//     qualification: null,
//     occupation: null,
//     officeAddress: null,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   guardianDetails: {
//     name: null,
//     email: null,
//     phone: null,
//     aadhaarCardNumber: null,
//     image: null,
//     officePhone: null,
//     qualification: null,
//     occupation: null,
//     officeAddress: null,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   annualIncome: {
//     range: "",
//     disabled: false,
//     sequence: null,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   },
//   createdAt: new Date(),
//   updatedAt: new Date(),
// };

// const parentTypes = [
//   { value: "BOTH", label: "Both Parents" },
//   { value: "FATHER_ONLY", label: "Father Only" },
//   { value: "MOTHER_ONLY", label: "Mother Only" },
// ];

// // Form elements configuration for reuse
// const fatherFormElements = [
//   {
//     name: "name",
//     label: "Father's Name",
//     type: "text",
//     icon: <User className="text-gray-500 dark:text-white w-5 h-5" />,
//     field: "fatherDetails",
//   },
//   {
//     name: "email",
//     label: "Email",
//     type: "email",
//     icon: <Mail className="text-gray-500 dark:text-white w-5 h-5" />,
//     field: "fatherDetails",
//   },
//   {
//     name: "phone",
//     label: "Phone",
//     type: "text",
//     icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" />,
//     field: "fatherDetails",
//   },
//   {
//     name: "officePhone",
//     label: "Office Phone",
//     type: "text",
//     icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" />,
//     field: "fatherDetails",
//   },
//   {
//     name: "aadhaarCardNumber",
//     label: "Aadhaar Number",
//     type: "text",
//     icon: <IdCard className="text-gray-500 dark:text-white w-5 h-5" />,
//     field: "fatherDetails",
//   },
// ];

// const motherFormElements = [
//   {
//     name: "name",
//     label: "Mother's Name",
//     type: "text",
//     icon: <User className="text-gray-500 dark:text-white w-5 h-5" />,
//     field: "motherDetails",
//   },
//   {
//     name: "email",
//     label: "Email",
//     type: "email",
//     icon: <Mail className="text-gray-500 dark:text-white w-5 h-5" />,
//     field: "motherDetails",
//   },
//   {
//     name: "phone",
//     label: "Phone",
//     type: "text",
//     icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" />,
//     field: "motherDetails",
//   },
//   {
//     name: "officePhone",
//     label: "Office Phone",
//     type: "text",
//     icon: <Phone className="text-gray-500 dark:text-white w-5 h-5" />,
//     field: "motherDetails",
//   },
//   {
//     name: "aadhaarCardNumber",
//     label: "Aadhaar Number",
//     type: "text",
//     icon: <IdCard className="text-gray-500 dark:text-white w-5 h-5" />,
//     field: "motherDetails",
//   },
// ];




interface FamilyDetailsProps {
  studentId: number;
}

const defaultFamily: Partial<Family> = {
  studentId: 0,
  parentType: null,
  fatherDetails: null,
  motherDetails: null,
  guardianDetails: null,
  annualIncome: null,
};

// Utility to remove createdAt and updatedAt from object and nested
function stripDates<T>(obj: T): T {
  if (Array.isArray(obj)) {
    // Recursively strip dates from array elements
    return obj.map(stripDates) as T;
  } else if (obj && typeof obj === "object") {
    const result = {} as { [K in keyof T]: T[K] };
    for (const key in obj) {
      if (key === "createdAt" || key === "updatedAt") continue;
      const value = obj[key];
      result[key] = (typeof value === "object" && value !== null)
        ? stripDates(value)
        : value;
    }
    return result as T;
  }
  return obj;
}

export default function FamilyDetails({ studentId }: FamilyDetailsProps) {
  const [formData, setFormData] = useState<Partial<Family>>({
    ...defaultFamily,
    studentId,
  });
  const  setOccupations = useState<Occupation[]>([])[1];
  // const [qualifications, setQualifications] = useState<Qualification[]>([]);
  // const [annualIncomes, setAnnualIncomes] = useState<AnnualIncome[]>([]);

  useEffect(() => {
    getAllOccupations().then((data) => setOccupations(data));
  }, [setOccupations]);
  const [annualIncomeOptions, setAnnualIncomeOptions] = useState<AnnualIncome[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch family details
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["familyDetails", studentId],
    queryFn: async () => {
      const res = await getFamilyDetailByStudentId(studentId);
      return res.payload;
    },
    enabled: !!studentId,
  });

  // Load Annual Income options
  useEffect(() => {
    getAllAnnualIncomes()
      .then((incomes) => setAnnualIncomeOptions(incomes ?? []))
      .catch((err) => {
        console.error("Failed to fetch annual incomes:", err);
        setAnnualIncomeOptions([]);
      });
  }, []);

  // When both family data and annual incomes are loaded
  useEffect(() => {
    if (data && annualIncomeOptions.length > 0) {
      const matchedIncome = annualIncomeOptions.find(
        (ai) => ai.id === data.annualIncome?.id
      );
      setFormData({
        ...data,
        annualIncome: matchedIncome ?? null,
      });
    }
  }, [data, annualIncomeOptions]);

  // Save handler
  const mutation = useMutation({
    mutationFn: async (payload: Partial<Family>) => {
      const cleanedPayload = stripDates(payload);
      const { id, ...rest } = cleanedPayload;
      if (id) {
        return await updateFamilyDetail(id, rest);
      } else {
        return await createFamilyDetail(rest);
      }
    },
    onSuccess: () => {
      toast.success("Family details updated!");
      refetch();
    },
    onError: () => {
      toast.error("Failed to update family details.");
    },
  });

  const handleChange = (field: keyof Family, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePersonChange = <T extends keyof Family>(
    personType: T,
    field: string,
    value: string | number | null | object
  ) => {
    setFormData((prev) => {
      const current = prev[personType];
      const base = (current && typeof current === 'object') ? current : {};
      return {
        ...prev,
        [personType]: { ...base, [field]: value },
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(false);
    mutation.mutate(formData, {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading family details.</div>;

  return (
    <Card className="max-w-8xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Family Details</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Parent Type */}
          <div className="space-y-4 border rounded-lg p-4">
            <Label>Parent Type</Label>
            <Select
              value={formData.parentType || ""}
              onValueChange={(value) =>
                handleChange("parentType", value as ParentType)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Parent Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BOTH">Both</SelectItem>
                <SelectItem value="FATHER_ONLY">Father Only</SelectItem>
                <SelectItem value="MOTHER_ONLY">Mother Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Annual Income */}
          <div className="space-y-4 border rounded-lg p-4">
            <Label>Annual Income</Label>
            <Select
              value={
                formData.annualIncome?.id
                  ? String(formData.annualIncome.id)
                  : ""
              }
              onValueChange={(value) => {
                const selected = annualIncomeOptions.find(
                  (ai) => String(ai.id) === value
                );
                setFormData((prev) => ({
                  ...prev,
                  annualIncome: selected ?? null,
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Annual Income" />
              </SelectTrigger>
              <SelectContent>
                {annualIncomeOptions.map((ai) => (
                  <SelectItem key={ai.id} value={String(ai.id)}>
                    {ai.range}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Father's Details Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Father's Details</h3>
            
            <div>
              <Label>Father's Name</Label>
              <Input
                value={formData.fatherDetails?.name || ""}
                onChange={(e) =>
                  handlePersonChange("fatherDetails", "name", e.target.value)
                }
                placeholder="Father's Name"
              />
            </div>

            <div>
              <Label>Father's Email</Label>
              <Input
                type="email"
                value={formData.fatherDetails?.email || ""}
                onChange={(e) =>
                  handlePersonChange("fatherDetails", "email", e.target.value)
                }
                placeholder="Father's Email"
              />
            </div>

            <div>
              <Label>Father's Phone</Label>
              <Input
                value={formData.fatherDetails?.phone || ""}
                onChange={(e) =>
                  handlePersonChange("fatherDetails", "phone", e.target.value)
                }
                placeholder="Father's Phone"
              />
            </div>

            <div>
              <Label>Father's Aadhaar Card Number</Label>
              <Input
                value={formData.fatherDetails?.aadhaarCardNumber || ""}
                onChange={(e) =>
                  handlePersonChange("fatherDetails", "aadhaarCardNumber", e.target.value)
                }
                placeholder="Father's Aadhaar Card Number"
              />
            </div>

            <div>
              <Label>Father's Office Phone</Label>
              <Input
                value={formData.fatherDetails?.officePhone || ""}
                onChange={(e) =>
                  handlePersonChange("fatherDetails", "officePhone", e.target.value)
                }
                placeholder="Father's Office Phone"
              />
            </div>

            <div>
              <Label>Father's Occupation</Label>
              <Input
                value={formData.fatherDetails?.occupation?.name || ""}
                onChange={(e) =>
                  handlePersonChange("fatherDetails", "occupation", {
                    ...formData.fatherDetails?.occupation,
                    name: e.target.value,
                  })
                }
                placeholder="Father's Occupation"
              />
            </div>
          </div>

          {/* Mother's Details Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Mother's Details</h3>
            
            <div>
              <Label>Mother's Name</Label>
              <Input
                value={formData.motherDetails?.name || ""}
                onChange={(e) =>
                  handlePersonChange("motherDetails", "name", e.target.value)
                }
                placeholder="Mother's Name"
              />
            </div>

            <div>
              <Label>Mother's Email</Label>
              <Input
                type="email"
                value={formData.motherDetails?.email || ""}
                onChange={(e) =>
                  handlePersonChange("motherDetails", "email", e.target.value)
                }
                placeholder="Mother's Email"
              />
            </div>

            <div>
              <Label>Mother's Phone</Label>
              <Input
                value={formData.motherDetails?.phone || ""}
                onChange={(e) =>
                  handlePersonChange("motherDetails", "phone", e.target.value)
                }
                placeholder="Mother's Phone"
              />
            </div>

            <div>
              <Label>Mother's Aadhaar Card Number</Label>
              <Input
                value={formData.motherDetails?.aadhaarCardNumber || ""}
                onChange={(e) =>
                  handlePersonChange("motherDetails", "aadhaarCardNumber", e.target.value)
                }
                placeholder="Mother's Aadhaar Card Number"
              />
            </div>

            <div>
              <Label>Mother's Office Phone</Label>
              <Input
                value={formData.motherDetails?.officePhone || ""}
                onChange={(e) =>
                  handlePersonChange("motherDetails", "officePhone", e.target.value)
                }
                placeholder="Mother's Office Phone"
              />
            </div>

            <div>
              <Label>Mother's Occupation</Label>
              <Input
                value={formData.motherDetails?.occupation?.name || ""}
                onChange={(e) =>
                  handlePersonChange("motherDetails", "occupation", {
                    ...formData.motherDetails?.occupation,
                    name: e.target.value,
                  })
                }
                placeholder="Mother's Occupation"
              />
            </div>
          </div>

          {/* Guardian's Details Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Guardian's Details</h3>
            
            <div>
              <Label>Guardian's Name</Label>
              <Input
                value={formData.guardianDetails?.name || ""}
                onChange={(e) =>
                  handlePersonChange("guardianDetails", "name", e.target.value)
                }
                placeholder="Guardian's Name"
              />
            </div>

            <div>
              <Label>Guardian's Email</Label>
              <Input
                type="email"
                value={formData.guardianDetails?.email || ""}
                onChange={(e) =>
                  handlePersonChange("guardianDetails", "email", e.target.value)
                }
                placeholder="Guardian's Email"
              />
            </div>

            <div>
              <Label>Guardian's Phone</Label>
              <Input
                value={formData.guardianDetails?.phone || ""}
                onChange={(e) =>
                  handlePersonChange("guardianDetails", "phone", e.target.value)
                }
                placeholder="Guardian's Phone"
              />
            </div>

            <div>
              <Label>Guardian's Aadhaar Card Number</Label>
              <Input
                value={formData.guardianDetails?.aadhaarCardNumber || ""}
                onChange={(e) =>
                  handlePersonChange("guardianDetails", "aadhaarCardNumber", e.target.value)
                }
                placeholder="Guardian's Aadhaar Card Number"
              />
            </div>

            <div>
              <Label>Guardian's Office Phone</Label>
              <Input
                value={formData.guardianDetails?.officePhone || ""}
                onChange={(e) =>
                  handlePersonChange("guardianDetails", "officePhone", e.target.value)
                }
                placeholder="Guardian's Office Phone"
              />
            </div>

            <div>
              <Label>Guardian's Occupation</Label>
              <Input
                value={formData.guardianDetails?.occupation?.name || ""}
                onChange={(e) =>
                  handlePersonChange("guardianDetails", "occupation", {
                    ...formData.guardianDetails?.occupation,
                    name: e.target.value,
                  })
                }
                placeholder="Guardian's Occupation"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-center gap-2">
          <Button
            type="submit"
            className="w-full sm:w-auto text-white font-medium sm:font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700 text-sm sm:text-base flex items-center justify-center gap-2 transition-all"
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
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
      </form>
    </Card>
  );
}
