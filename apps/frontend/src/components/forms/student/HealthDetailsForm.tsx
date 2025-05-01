import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Droplet, Ruler, Scale, AlertTriangle, Stethoscope, Phone, Shield, Calendar, User } from "lucide-react";
import { HealthDetails } from "@/types/student";

interface HealthDetailsFormProps {
  onSubmit: (data: HealthDetails) => void;
  initialData?: Partial<HealthDetails>;
}

export default function HealthDetailsForm({ onSubmit, initialData = {} }: HealthDetailsFormProps) {
  const [formData, setFormData] = useState<HealthDetails>({
    bloodGroup: initialData.bloodGroup || "",
    height: initialData.height || "",
    weight: initialData.weight || "",
    allergies: initialData.allergies || "",
    medicalConditions: initialData.medicalConditions || "",
    medications: initialData.medications || "",
    emergencyContact: initialData.emergencyContact || "",
    insuranceProvider: initialData.insuranceProvider || "",
    insurancePolicyNumber: initialData.insurancePolicyNumber || "",
    lastCheckupDate: initialData.lastCheckupDate || "",
    doctorName: initialData.doctorName || "",
    doctorContact: initialData.doctorContact || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.bloodGroup) {
        throw new Error("Please fill in all required fields");
      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: keyof HealthDetails) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  return (
    <div

      className="space-y-6 bg-white rounded-xl shadow-sm p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="bloodGroup" className="flex items-center gap-2 text-gray-700">
            <Droplet className="w-4 h-4" />
            Blood Group *
          </Label>
          <div className="relative">
            <Select
              value={formData.bloodGroup}
              onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
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
          <Label htmlFor="height" className="flex items-center gap-2 text-gray-700">
            <Ruler className="w-4 h-4" />
            Height (cm)
          </Label>
          <div className="relative">
            <Input
              id="height"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              placeholder="Enter height"
              type="number"
              className="pl-10"
            />
            <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight" className="flex items-center gap-2 text-gray-700">
            <Scale className="w-4 h-4" />
            Weight (kg)
          </Label>
          <div className="relative">
            <Input
              id="weight"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="Enter weight"
              type="number"
              className="pl-10"
            />
            <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="allergies" className="flex items-center gap-2 text-gray-700">
            <AlertTriangle className="w-4 h-4" />
            Allergies
          </Label>
          <div className="relative">
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => handleTextareaChange(e, "allergies")}
              placeholder="Enter any allergies"
              className="pl-10"
            />
            <AlertTriangle className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="medicalConditions" className="flex items-center gap-2 text-gray-700">
            <Stethoscope className="w-4 h-4" />
            Medical Conditions
          </Label>
          <div className="relative">
            <Textarea
              id="medicalConditions"
              value={formData.medicalConditions}
              onChange={(e) => handleTextareaChange(e, "medicalConditions")}
              placeholder="Enter any medical conditions"
              className="pl-10"
            />
            <Stethoscope className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="medications" className="flex items-center gap-2 text-gray-700">
            <Stethoscope className="w-4 h-4" />
            Current Medications
          </Label>
          <div className="relative">
            <Textarea
              id="medications"
              value={formData.medications}
              onChange={(e) => handleTextareaChange(e, "medications")}
              placeholder="Enter current medications"
              className="pl-10"
            />
            <Stethoscope className="absolute left-3 top-4 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyContact" className="flex items-center gap-2 text-gray-700">
            <Phone className="w-4 h-4" />
            Emergency Contact
          </Label>
          <div className="relative">
            <Input
              id="emergencyContact"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              placeholder="Enter emergency contact number"
              type="tel"
              className="pl-10"
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="insuranceProvider" className="flex items-center gap-2 text-gray-700">
            <Shield className="w-4 h-4" />
            Insurance Provider
          </Label>
          <div className="relative">
            <Input
              id="insuranceProvider"
              value={formData.insuranceProvider}
              onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
              placeholder="Enter insurance provider"
              className="pl-10"
            />
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="insurancePolicyNumber" className="flex items-center gap-2 text-gray-700">
            <Shield className="w-4 h-4" />
            Insurance Policy Number
          </Label>
          <div className="relative">
            <Input
              id="insurancePolicyNumber"
              value={formData.insurancePolicyNumber}
              onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
              placeholder="Enter insurance policy number"
              className="pl-10"
            />
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastCheckupDate" className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            Last Checkup Date
          </Label>
          <div className="relative">
            <Input
              id="lastCheckupDate"
              value={formData.lastCheckupDate}
              onChange={(e) => setFormData({ ...formData, lastCheckupDate: e.target.value })}
              type="date"
              className="pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doctorName" className="flex items-center gap-2 text-gray-700">
            <User className="w-4 h-4" />
            Doctor's Name
          </Label>
          <div className="relative">
            <Input
              id="doctorName"
              value={formData.doctorName}
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              placeholder="Enter doctor's name"
              className="pl-10"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="doctorContact" className="flex items-center gap-2 text-gray-700">
            <Phone className="w-4 h-4" />
            Doctor's Contact
          </Label>
          <div className="relative">
            <Input
              id="doctorContact"
              value={formData.doctorContact}
              onChange={(e) => setFormData({ ...formData, doctorContact: e.target.value })}
              placeholder="Enter doctor's contact number"
              type="tel"
              className="pl-10"
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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