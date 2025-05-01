import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, User, Briefcase, Phone, Mail, Home, DollarSign } from "lucide-react";
import { ParentDetails } from "@/types/student";

interface ParentDetailsFormProps {
  onSubmit: (data: ParentDetails) => void;
  initialData?: Partial<ParentDetails>;
}

export default function ParentDetailsForm({ onSubmit, initialData = {} }: ParentDetailsFormProps) {
  const [formData, setFormData] = useState<ParentDetails>({
    fatherName: initialData.fatherName || "",
    fatherOccupation: initialData.fatherOccupation || "",
    fatherContact: initialData.fatherContact || "",
    fatherEmail: initialData.fatherEmail || "",
    motherName: initialData.motherName || "",
    motherOccupation: initialData.motherOccupation || "",
    motherContact: initialData.motherContact || "",
    motherEmail: initialData.motherEmail || "",
    annualIncome: initialData.annualIncome || "",
    address: initialData.address || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.fatherName || !formData.motherName) {
        throw new Error("Please fill in all required fields");
      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
   
    
      className="space-y-6 bg-white rounded-xl shadow-sm p-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Father's Details */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Father's Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="fatherName" className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4" />
                Father's Name *
              </Label>
              <div className="relative">
                <Input
                  id="fatherName"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="Enter father's name"
                  required
                  className="pl-10"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherOccupation" className="flex items-center gap-2 text-gray-700">
                <Briefcase className="w-4 h-4" />
                Occupation
              </Label>
              <div className="relative">
                <Input
                  id="fatherOccupation"
                  value={formData.fatherOccupation}
                  onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                  placeholder="Enter occupation"
                  className="pl-10"
                />
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherContact" className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                Contact Number
              </Label>
              <div className="relative">
                <Input
                  id="fatherContact"
                  value={formData.fatherContact}
                  onChange={(e) => setFormData({ ...formData, fatherContact: e.target.value })}
                  placeholder="Enter contact number"
                  type="tel"
                  className="pl-10"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fatherEmail" className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <div className="relative">
                <Input
                  id="fatherEmail"
                  value={formData.fatherEmail}
                  onChange={(e) => setFormData({ ...formData, fatherEmail: e.target.value })}
                  placeholder="Enter email"
                  type="email"
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Mother's Details */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Mother's Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="motherName" className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4" />
                Mother's Name *
              </Label>
              <div className="relative">
                <Input
                  id="motherName"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  placeholder="Enter mother's name"
                  required
                  className="pl-10"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motherOccupation" className="flex items-center gap-2 text-gray-700">
                <Briefcase className="w-4 h-4" />
                Occupation
              </Label>
              <div className="relative">
                <Input
                  id="motherOccupation"
                  value={formData.motherOccupation}
                  onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                  placeholder="Enter occupation"
                  className="pl-10"
                />
                <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motherContact" className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4" />
                Contact Number
              </Label>
              <div className="relative">
                <Input
                  id="motherContact"
                  value={formData.motherContact}
                  onChange={(e) => setFormData({ ...formData, motherContact: e.target.value })}
                  placeholder="Enter contact number"
                  type="tel"
                  className="pl-10"
                />
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motherEmail" className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <div className="relative">
                <Input
                  id="motherEmail"
                  value={formData.motherEmail}
                  onChange={(e) => setFormData({ ...formData, motherEmail: e.target.value })}
                  placeholder="Enter email"
                  type="email"
                  className="pl-10"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Family Details */}
        <div className="col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Home className="w-5 h-5" />
            Family Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="annualIncome" className="flex items-center gap-2 text-gray-700">
                <DollarSign className="w-4 h-4" />
                Annual Income
              </Label>
              <div className="relative">
                <Input
                  id="annualIncome"
                  value={formData.annualIncome}
                  onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                  placeholder="Enter annual income"
                  type="number"
                  className="pl-10"
                />
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2 text-gray-700">
                <Home className="w-4 h-4" />
                Address
              </Label>
              <div className="relative">
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  className="pl-10"
                />
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
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