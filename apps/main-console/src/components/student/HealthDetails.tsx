import { useEffect, useState, type FC } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HealthDto } from "@repo/db/dtos/user";
import { BloodGroupDto } from "@repo/db/dtos/resources";
import { getHealthDetailByStudentId, createHealthDetail, updateHealthDetail } from "@/services/health-details.service";
import { getAllBloodGroups } from "@/services/blood-group.service";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, CheckCircle } from "lucide-react";

export interface HealthDetailsProps {
  healthId?: number;
  initialData?: HealthDto | null;
}

const defaultHealth: Partial<HealthDto> = {
  bloodGroup: null,
  eyePowerLeft: null,
  eyePowerRight: null,
  height: null,
  weight: null,
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
      result[key] = typeof value === "object" && value !== null ? stripDates(value) : value;
    }
    return result as T;
  }
  return obj;
}

const HealthDetails: FC<HealthDetailsProps> = ({ healthId, initialData = null }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<HealthDto>>({
    ...defaultHealth,
  });
  const [bloodGroupOptions, setBloodGroupOptions] = useState<BloodGroupDto[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch health details
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["healthDetails", healthId],
    queryFn: async () => {
      if (!healthId) return null;
      const res = await getHealthDetailByStudentId(healthId); // backward compat if route still expects /:id
      return res.payload;
    },
    enabled: !!healthId,
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
    const source = data ?? initialData;
    if (source && bloodGroupOptions.length > 0) {
      const matchedBloodGroup = bloodGroupOptions.find((bg) => bg.id === source.bloodGroup?.id);
      setFormData({
        ...source,
        bloodGroup: matchedBloodGroup ?? null,
      });
    }
  }, [data, initialData, bloodGroupOptions]);

  // Save handler
  const mutation = useMutation({
    mutationFn: async (payload: Partial<HealthDto>) => {
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
      queryClient.invalidateQueries({ queryKey: ["user-profile"], exact: false });
    },
    onError: () => {
      toast.error("Failed to update health details.");
    },
  });

  const handleChange = (field: keyof HealthDto, value: string | number | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof HealthDto, value: string) => {
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

  return (
    <Card className="max-w-8xl mx-auto my-8">
      <CardHeader className="relative pb-0">
        <div className="absolute left-6 top-0 h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
        <CardTitle className="pl-6 pt-3 text-xl font-semibold text-gray-800">Health Details</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 [&_label]:text-xs [&_label]:text-gray-600">
          {/* Blood Group */}
          <div>
            <Label>Blood Group</Label>
            <Select
              value={formData.bloodGroup?.id ? String(formData.bloodGroup.id) : ""}
              onValueChange={(value) => {
                const selected = bloodGroupOptions.find((bg) => String(bg.id) === value);
                setFormData((prev) => ({
                  ...prev,
                  bloodGroup: selected ?? null,
                }));
              }}
            >
              <SelectTrigger className="w-full h-10 text-sm">
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
          <div className="space-y-4 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Eye Power</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Left Eye Power</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={formData.eyePowerLeft || ""}
                  onChange={(e) => handleNumberChange("eyePowerLeft", e.target.value)}
                  placeholder="Left Eye Power"
                />
              </div>

              <div>
                <Label>Right Eye Power</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={formData.eyePowerRight || ""}
                  onChange={(e) => handleNumberChange("eyePowerRight", e.target.value)}
                  placeholder="Right Eye Power"
                />
              </div>
            </div>
          </div>

          {/* Physical Measurements Section */}
          <div className="space-y-4 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Physical Measurements</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Height (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.height || ""}
                  onChange={(e) => handleNumberChange("height", e.target.value)}
                  placeholder="Height in cm"
                />
              </div>

              <div>
                <Label>Weight (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight || ""}
                  onChange={(e) => handleNumberChange("weight", e.target.value)}
                  placeholder="Weight in kg"
                />
              </div>
            </div>
          </div>

          {/* Medical History Section */}
          <div className="space-y-4 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">Medical History</h3>

            <div>
              <Label>Past Medical History</Label>
              <Textarea
                value={formData.pastMedicalHistory || ""}
                onChange={(e) => handleChange("pastMedicalHistory", e.target.value)}
                placeholder="Enter past medical history..."
                rows={3}
              />
            </div>

            <div>
              <Label>Past Surgical History</Label>
              <Textarea
                value={formData.pastSurgicalHistory || ""}
                onChange={(e) => handleChange("pastSurgicalHistory", e.target.value)}
                placeholder="Enter past surgical history..."
                rows={3}
              />
            </div>

            <div>
              <Label>Drug Allergies</Label>
              <Textarea
                value={formData.drugAllergy || ""}
                onChange={(e) => handleChange("drugAllergy", e.target.value)}
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
      </form>
    </Card>
  );
};

export default HealthDetails;
