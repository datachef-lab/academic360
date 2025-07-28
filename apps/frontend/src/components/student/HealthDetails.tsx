import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getHealthDetailByStudentId,
  createHealthDetail,
  updateHealthDetail,
} from "@/services/health-details.service";
import { getAllBloodGroups } from "@/services/blood-group.service";
import { Health } from "@/types/user/health";
import { BloodGroup } from "@/types/resources/blood-group.types";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, CheckCircle } from "lucide-react";

interface HealthDetailsProps {
  studentId: number;
}

const defaultHealth: Partial<Health> = {
  studentId: 0,
  bloodGroup: null,
  eyePowerLeft: null,
  eyePowerRight: null,
  height: null,
  width: null,
  pastMedicalHistory: null,
  pastSurgicalHistory: null,
  drugAllergy: null,
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

export default function HealthDetails({ studentId }: HealthDetailsProps) {
  const [formData, setFormData] = useState<Partial<Health>>({
    ...defaultHealth,
    studentId,
  });
  const [bloodGroupOptions, setBloodGroupOptions] = useState<BloodGroup[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch health details
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["healthDetails", studentId],
    queryFn: async () => {
      const res = await getHealthDetailByStudentId(studentId);
      return res.payload;
    },
    enabled: !!studentId,
  });

  // Load Blood Group options
  useEffect(() => {
    getAllBloodGroups()
      .then((bloodGroups) => setBloodGroupOptions(bloodGroups ?? []))
      .catch((err) => {
        console.error("Failed to fetch blood groups:", err);
        setBloodGroupOptions([]);
      });
  }, []);

  // When both health data and blood groups are loaded
  useEffect(() => {
    if (data && bloodGroupOptions.length > 0) {
      const matchedBloodGroup = bloodGroupOptions.find(
        (bg) => bg.id === data.bloodGroup?.id
      );
      setFormData({
        ...data,
        bloodGroup: matchedBloodGroup ?? null,
      });
    }
  }, [data, bloodGroupOptions]);

  // Save handler
  const mutation = useMutation({
    mutationFn: async (payload: Partial<Health>) => {
      const cleanedPayload = stripDates(payload);
      const { id, ...rest } = cleanedPayload;
      if (id) {
        return await updateHealthDetail(id, rest);
      } else {
        return await createHealthDetail(rest);
      }
    },
    onSuccess: () => {
      toast.success("Health details updated!");
      refetch();
    },
    onError: () => {
      toast.error("Failed to update health details.");
    },
  });

  const handleChange = (field: keyof Health, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof Health, value: string) => {
    const stringValue = value === "" ? null : value;
    setFormData((prev) => ({ ...prev, [field]: stringValue }));
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
  if (isError) return <div>Error loading health details.</div>;

  return (
    <Card className="max-w-8xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Health Details</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Blood Group */}
          <div>
            <Label>Blood Group</Label>
            <Select
              value={
                formData.bloodGroup?.id
                  ? String(formData.bloodGroup.id)
                  : ""
              }
              onValueChange={(value) => {
                const selected = bloodGroupOptions.find(
                  (bg) => String(bg.id) === value
                );
                setFormData((prev) => ({
                  ...prev,
                  bloodGroup: selected ?? null,
                }));
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Blood Group" />
              </SelectTrigger>
              <SelectContent>
                {bloodGroupOptions.map((bg) => (
                  <SelectItem key={bg.id} value={String(bg.id)}>
                    {bg.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Eye Power Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Eye Power</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Left Eye Power</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={formData.eyePowerLeft || ""}
                  onChange={(e) =>
                    handleNumberChange("eyePowerLeft", e.target.value)
                  }
                  placeholder="Left Eye Power"
                />
              </div>

              <div>
                <Label>Right Eye Power</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={formData.eyePowerRight || ""}
                  onChange={(e) =>
                    handleNumberChange("eyePowerRight", e.target.value)
                  }
                  placeholder="Right Eye Power"
                />
              </div>
            </div>
          </div>

          {/* Physical Measurements Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Physical Measurements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.height || ""}
                  onChange={(e) =>
                    handleNumberChange("height", e.target.value)
                  }
                  placeholder="Height in cm"
                />
              </div>

              <div>
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.width || ""}
                  onChange={(e) =>
                    handleNumberChange("width", e.target.value)
                  }
                  placeholder="Weight in kg"
                />
              </div>
            </div>
          </div>

          {/* Medical History Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Medical History</h3>
            
            <div>
              <Label>Past Medical History</Label>
              <Textarea
                value={formData.pastMedicalHistory || ""}
                onChange={(e) =>
                  handleChange("pastMedicalHistory", e.target.value)
                }
                placeholder="Enter past medical history..."
                rows={3}
              />
            </div>

            <div>
              <Label>Past Surgical History</Label>
              <Textarea
                value={formData.pastSurgicalHistory || ""}
                onChange={(e) =>
                  handleChange("pastSurgicalHistory", e.target.value)
                }
                placeholder="Enter past surgical history..."
                rows={3}
              />
            </div>

            <div>
              <Label>Drug Allergies</Label>
              <Textarea
                value={formData.drugAllergy || ""}
                onChange={(e) =>
                  handleChange("drugAllergy", e.target.value)
                }
                placeholder="Enter any drug allergies..."
                rows={3}
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
