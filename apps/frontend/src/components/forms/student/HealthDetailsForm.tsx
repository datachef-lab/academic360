import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Droplet, Ruler, Scale, AlertTriangle, Stethoscope, Eye } from "lucide-react";
import { Health } from "@/types/user/health";



interface HealthDetailsFormProps {
  onSubmit: (data: Health) => void;
  initialData?: Partial<Health>;
}

export default function HealthDetailsForm({ onSubmit, initialData = {} }: HealthDetailsFormProps) {
  const [formData, setFormData] = useState<Health>({
    studentId: initialData.studentId || 0,
    bloodGroup: initialData.bloodGroup || null,
    eyePowerLeft: initialData.eyePowerLeft || null,
    eyePowerRight: initialData.eyePowerRight || null,
    height: initialData.height || null,
    width: initialData.width || null,
    pastMedicalHistory: initialData.pastMedicalHistory || null,
    pastSurgicalHistory: initialData.pastSurgicalHistory || null,
    drugAllergy: initialData.drugAllergy || null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Health) => {
    const value = e.target.value ? parseFloat(e.target.value) : null;
    setFormData({ ...formData, [field]: value });
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: keyof Health) => {
    const value = e.target.value || null;
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div

      className="space-y-6 bg-white rounded-xl shadow-sm p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="bloodGroup" className="flex items-center gap-2 text-gray-700">
            <Droplet className="w-4 h-4" />
            Blood Group
          </Label>
          <div className="relative">
            <Select
              value={formData.bloodGroup?.type || ""}
              onValueChange={(value) => setFormData({ 
                ...formData, 
                bloodGroup: value ? { 
                  type: value,
                  disabled: false,
                  sequence: null,
                  createdAt: new Date(),
                  updatedAt: new Date()
                } : null 
              })}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
            <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="eyePowerLeft" className="flex items-center gap-2 text-gray-700">
            <Eye className="w-4 h-4" />
            Left Eye Power
          </Label>
          <div className="relative">
            <Input
              id="eyePowerLeft"
              value={formData.eyePowerLeft || ""}
              onChange={(e) => handleNumberInputChange(e, "eyePowerLeft")}
              placeholder="Enter left eye power"
              type="number"
              step="0.25"
              className="pl-10"
            />
            <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="eyePowerRight" className="flex items-center gap-2 text-gray-700">
            <Eye className="w-4 h-4" />
            Right Eye Power
          </Label>
          <div className="relative">
            <Input
              id="eyePowerRight"
              value={formData.eyePowerRight || ""}
              onChange={(e) => handleNumberInputChange(e, "eyePowerRight")}
              placeholder="Enter right eye power"
              type="number"
              step="0.25"
              className="pl-10"
            />
            <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="height" className="flex items-center gap-2 text-gray-700">
            <Ruler className="w-4 h-4" />
            Height (cm)
          </Label>
          <div className="relative">
            <Input
              id="height"
              value={formData.height || ""}
              onChange={(e) => handleNumberInputChange(e, "height")}
              placeholder="Enter height"
              type="number"
              className="pl-10"
            />
            <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="width" className="flex items-center gap-2 text-gray-700">
            <Scale className="w-4 h-4" />
            Weight (kg)
          </Label>
          <div className="relative">
            <Input
              id="width"
              value={formData.width || ""}
              onChange={(e) => handleNumberInputChange(e, "width")}
              placeholder="Enter weight"
              type="number"
              className="pl-10"
            />
            <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pastMedicalHistory" className="flex items-center gap-2 text-gray-700">
            <Stethoscope className="w-4 h-4" />
            Past Medical History
          </Label>
          <div className="relative">
            <Textarea
              id="pastMedicalHistory"
              value={formData.pastMedicalHistory || ""}
              onChange={(e) => handleTextareaChange(e, "pastMedicalHistory")}
              placeholder="Enter past medical history"
              className="pl-10"
            />
            <Stethoscope className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pastSurgicalHistory" className="flex items-center gap-2 text-gray-700">
            <Stethoscope className="w-4 h-4" />
            Past Surgical History
          </Label>
          <div className="relative">
            <Textarea
              id="pastSurgicalHistory"
              value={formData.pastSurgicalHistory || ""}
              onChange={(e) => handleTextareaChange(e, "pastSurgicalHistory")}
              placeholder="Enter past surgical history"
              className="pl-10"
            />
            <Stethoscope className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="drugAllergy" className="flex items-center gap-2 text-gray-700">
            <AlertTriangle className="w-4 h-4" />
            Drug Allergies
          </Label>
          <div className="relative">
            <Textarea
              id="drugAllergy"
              value={formData.drugAllergy || ""}
              onChange={(e) => handleTextareaChange(e, "drugAllergy")}
              placeholder="Enter drug allergies"
              className="pl-10"
            />
            <AlertTriangle className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
        onClick={handleSubmit}
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSubmitting ? (
            <>
              <CheckCircle2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Submit
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 