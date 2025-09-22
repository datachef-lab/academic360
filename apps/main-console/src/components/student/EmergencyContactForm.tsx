import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmergencyContactById,
  createEmergencyContact,
  updateEmergencyContact,
} from "@/services/emergency-contact.service";
import { EmergencyContactT as EmergencyContact } from "@repo/db/schemas/models";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Save, CheckCircle } from "lucide-react";

interface EmergencyContactFormProps {
  emergencyId?: number;
  initialData?: EmergencyContact | null;
}

const defaultEmergencyContact: Partial<EmergencyContact> = {
  personName: null,
  havingRelationAs: null,
  email: null,
  phone: null,
  officePhone: null,
  residentialPhone: null,
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

export default function EmergencyContactForm({ emergencyId, initialData = null }: EmergencyContactFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<EmergencyContact>>({
    ...defaultEmergencyContact,
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Fetch emergency contact details
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["emergencyContact", emergencyId],
    queryFn: async () => {
      if (!emergencyId) return null;
      const res = await getEmergencyContactById(emergencyId);
      return res.payload;
    },
    enabled: !!emergencyId,
  });

  // When emergency contact data is loaded
  useEffect(() => {
    if (data || initialData) {
      setFormData({
        ...(data ?? initialData ?? {}),
      });
    }
  }, [data, initialData]);

  // Save handler
  const mutation = useMutation({
    mutationFn: async (payload: Partial<EmergencyContact>) => {
      const cleanedPayload = stripDates(payload);
      const { id, ...rest } = cleanedPayload;
      if (id) {
        return await updateEmergencyContact(id, rest);
      } else {
        return await createEmergencyContact(rest);
      }
    },
    onSuccess: () => {
      toast.success("Emergency contact updated!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["user-profile"], exact: false });
    },
    onError: () => {
      toast.error("Failed to update emergency contact.");
    },
  });

  const handleChange = (field: keyof EmergencyContact, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
  if (isError) return <div>Error loading emergency contact details.</div>;

  return (
    <Card className="max-w-8xl mx-auto my-8">
      <CardHeader className="relative pb-0">
        <div className="absolute left-6 top-0 h-1 w-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full" />
        <CardTitle className="pl-6 pt-3 text-xl font-semibold text-gray-800">Emergency Contact Details</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 [&_label]:text-xs [&_label]:text-gray-600">
          {/* Person Name */}
          <div>
            <Label>Person Name</Label>
            <Input
              value={formData.personName || ""}
              onChange={(e) => handleChange("personName", e.target.value)}
              placeholder="Enter person name"
            />
          </div>

          {/* Relation to Student */}
          <div>
            <Label>Relation to Student</Label>
            <Input
              value={formData.havingRelationAs || ""}
              onChange={(e) => handleChange("havingRelationAs", e.target.value)}
              placeholder="e.g., Father, Mother, Guardian, Brother, Sister"
            />
          </div>

          {/* Email */}
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          {/* Phone Numbers Section */}
          <div className="space-y-4 border rounded-lg p-4">
            <h3 className="text-lg font-semibold">Contact Numbers</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Primary Phone</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="Primary phone number"
                />
              </div>

              <div>
                <Label>Office Phone</Label>
                <Input
                  value={formData.officePhone || ""}
                  onChange={(e) => handleChange("officePhone", e.target.value)}
                  placeholder="Office phone number"
                />
              </div>
            </div>

            <div>
              <Label>Residential Phone</Label>
              <Input
                value={formData.residentialPhone || ""}
                onChange={(e) => handleChange("residentialPhone", e.target.value)}
                placeholder="Residential phone number"
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
}
