import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getAcademicHistoryByStudentId,
  createAcademicHistory,
  updateAcademicHistory,
} from "@/services/academic-history.service";
import { AcademicHistory } from "@/types/user/academic-history";
import { Institution } from "@/types/resources/institution.types";
import { BoardUniversity } from "@/types/resources/board-university.types";
import { Specialization } from "@/types/resources/specialization";
import { getAllInstitutions } from "@/services/institution.service";
import { getAllBoardUniversities } from "@/services/board-university.service";
import { getAllSpecializations } from "@/services/specialization.service";
import { getAllBoardResultStatuses } from "@/services/board-result-status.service";
import { BoardResultStatus } from "@/types/resources/board-result-status.types";
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

interface AcademicHistoryFormProps {
  studentId: number;
}

const defaultAcademicHistory: Partial<AcademicHistory> = {
  studentId: 0,
  lastInstitution: null,
  lastBoardUniversity: null,
  specialization: null,
  lastResult: null,
  studiedUpToClass: null,
  passedYear: null,
  remarks: null,
};

// Utility to remove createdAt and updatedAt from object and nested
function stripDates<T>(obj: T): T {
  if (Array.isArray(obj)) {
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

export default function AcademicHistoryForm({ studentId }: AcademicHistoryFormProps) {
  const [formData, setFormData] = useState<Partial<AcademicHistory>>({
    ...defaultAcademicHistory,
    studentId,
  });
  const [institutionOptions, setInstitutionOptions] = useState<Institution[]>([]);
  const [boardUniversityOptions, setBoardUniversityOptions] = useState<BoardUniversity[]>([]);
  const [specializationOptions, setSpecializationOptions] = useState<Specialization[]>([]);
  const [resultStatusOptions, setResultStatusOptions] = useState<BoardResultStatus[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch academic history details
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["academicHistory", studentId],
    queryFn: async () => {
      const res = await getAcademicHistoryByStudentId(studentId);
      return res.payload;
    },
    enabled: !!studentId,
  });

  // Load Institution options
  useEffect(() => {
    getAllInstitutions()
      .then((institutions) => setInstitutionOptions(institutions ?? []))
      .catch((err) => {
        console.error("Failed to fetch institutions:", err);
        setInstitutionOptions([]);
      });
  }, []);

  // Load Board/University options
  useEffect(() => {
    getAllBoardUniversities()
      .then((boardUniversities) => setBoardUniversityOptions(boardUniversities ?? []))
      .catch((err) => {
        console.error("Failed to fetch board universities:", err);
        setBoardUniversityOptions([]);
      });
  }, []);

  // Load Specialization options
  useEffect(() => {
    getAllSpecializations()
      .then((specializations) => setSpecializationOptions(specializations ?? []))
      .catch((err) => {
        console.error("Failed to fetch specializations:", err);
        setSpecializationOptions([]);
      });
  }, []);

  // Load Board Result Status options
  useEffect(() => {
    getAllBoardResultStatuses()
      .then((statuses) => setResultStatusOptions(statuses ?? []))
      .catch(() => setResultStatusOptions([]));
  }, []);

  // When academic history data is loaded
  useEffect(() => {
    if (data) {
      console.log("Academic history data loaded:", data);
      setFormData({
        ...data,
      });
    }
  }, [data]);

  // Save handler
  const mutation = useMutation({
    mutationFn: async (payload: Partial<AcademicHistory>) => {
      const cleanedPayload = stripDates(payload);
      const { id, ...rest } = cleanedPayload;
      if (id) {
        return await updateAcademicHistory(id, rest);
      } else {
        return await createAcademicHistory(rest);
      }
    },
    onSuccess: () => {
      toast.success("Academic history updated!");
      refetch();
    },
    onError: () => {
      toast.error("Failed to update academic history.");
    },
  });

  const handleChange = (field: keyof AcademicHistory, value: string | number | null | object) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof AcademicHistory, value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    setFormData((prev) => ({ ...prev, [field]: numValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccess(false);
    console.log("Submitting form data:", formData);
    mutation.mutate(formData, {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      },
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading academic history details.</div>;

  return (
    <Card className="max-w-8xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Academic History</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Institution Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Previous Institution</h3>
            
            <div>
              <Label>Last Institution</Label>
              <Select
                value={
                  formData.lastInstitution?.id
                    ? String(formData.lastInstitution.id)
                    : ""
                }
                onValueChange={(value) => {
                  const selected = institutionOptions.find(
                    (inst) => String(inst.id) === value
                  );
                  setFormData((prev) => ({
                    ...prev,
                    lastInstitution: selected ?? null,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutionOptions.map((inst) => (
                    <SelectItem key={inst.id} value={String(inst.id)}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Board/University</Label>
              <Select
                value={
                  formData.lastBoardUniversity?.id
                    ? String(formData.lastBoardUniversity.id)
                    : ""
                }
                onValueChange={(value) => {
                  const selected = boardUniversityOptions.find(
                    (bu) => String(bu.id) === value
                  );
                  setFormData((prev) => ({
                    ...prev,
                    lastBoardUniversity: selected ?? null,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Board/University" />
                </SelectTrigger>
                <SelectContent>
                  {boardUniversityOptions.map((bu) => (
                    <SelectItem key={bu.id} value={String(bu.id)}>
                      {bu.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Specialization</Label>
              <Select
                value={
                  formData.specialization?.id
                    ? String(formData.specialization.id)
                    : ""
                }
                onValueChange={(value) => {
                  const selected = specializationOptions.find(
                    (spec) => String(spec.id) === value
                  );
                  setFormData((prev) => ({
                    ...prev,
                    specialization: selected ?? null,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Specialization" />
                </SelectTrigger>
                <SelectContent>
                  {specializationOptions.map((spec) => (
                    <SelectItem key={spec.id} value={String(spec.id)}>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Academic Details Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Academic Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Studied Up To Class</Label>
                <Input
                  type="number"
                  value={formData.studiedUpToClass || ""}
                  onChange={(e) =>
                    handleNumberChange("studiedUpToClass", e.target.value)
                  }
                  placeholder="e.g., 12"
                />
              </div>

              <div>
                <Label>Passed Year</Label>
                <Input
                  type="number"
                  value={formData.passedYear || ""}
                  onChange={(e) =>
                    handleNumberChange("passedYear", e.target.value)
                  }
                  placeholder="e.g., 2023"
                />
              </div>
            </div>

            <div>
              <Label>Board Result Status</Label>
              <Select
                value={formData.lastResult?.id ? String(formData.lastResult.id) : ""}
                onValueChange={(value) => {
                  const selected = resultStatusOptions.find((rs) => String(rs.id) === value);
                  setFormData((prev) => ({
                    ...prev,
                    lastResult: selected ?? null,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Result" />
                </SelectTrigger>
                <SelectContent>
                  {resultStatusOptions.map((rs) => (
                    <SelectItem key={rs.id} value={String(rs.id)}>
                      {rs.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            
    <div>
              <Label>Remarks</Label>
              <Textarea
                value={formData.remarks || ""}
                onChange={(e) =>
                  handleChange("remarks", e.target.value)
                }
                placeholder="Enter any additional remarks or notes..."
                rows={4}
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
