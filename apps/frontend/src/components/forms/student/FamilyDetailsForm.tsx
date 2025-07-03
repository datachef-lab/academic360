import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, User, Briefcase, Phone, Mail, DollarSign } from "lucide-react";
import { Parent } from "@/types/user/parent";
import { Occupation } from "@/types/resources/occupation";
import { AnnualIncome } from "@/types/resources/annual-income";
import { ParentType } from "@/types/enums";
import { Person } from "@/types/user/person";

interface FamilyDetailsFormProps {
  onSubmit: (data: Parent) => void;
  initialData?:  Partial<Parent>;

}

const createPerson = (data: Partial<Person>): Person => ({
  name: data.name || null,
  email: data.email || null,
  phone: data.phone || null,
  aadhaarCardNumber: null,
  image: null,
  officePhone: null,
  occupation: data.occupation || null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const createAnnualIncome = (range: string): AnnualIncome => ({
  range,
  disabled: false,
  sequence: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

export default function FamilyDetailsForm({ onSubmit, initialData = {} }: FamilyDetailsFormProps) {
  const [parentFormData, setParentFormData] = useState<Partial<Parent>>({
    parentType: "BOTH" as ParentType,
    fatherDetails: createPerson(initialData.fatherDetails || {}),
    motherDetails: createPerson(initialData.motherDetails || {}),
    annualIncome: initialData.annualIncome || null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(parentFormData as Parent);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const createOccupation = (name: string): Occupation => ({
    name,
    disabled: false,
    sequence: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return (
    <div className="space-y-6 bg-white rounded-xl shadow-sm p-6">
      {/* Parents Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Parents Information</h2>
        
        {/* Father's Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fatherName" className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              Father's Name *
            </Label>
            <div className="relative">
              <Input
                id="fatherName"
                value={parentFormData.fatherDetails?.name || ""}
                onChange={(e) => setParentFormData({
                  ...parentFormData,
                  fatherDetails: createPerson({ ...parentFormData.fatherDetails, name: e.target.value || null })
                })}
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
              Father's Occupation
            </Label>
            <div className="relative">
              <Input
                id="fatherOccupation"
                value={parentFormData.fatherDetails?.occupation?.name || ""}
                onChange={(e) => setParentFormData({
                  ...parentFormData,
                  fatherDetails: createPerson({ ...parentFormData.fatherDetails, occupation: createOccupation(e.target.value) })
                })}
                placeholder="Enter occupation"
                className="pl-10"
              />
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fatherContact" className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4" />
              Father's Contact
            </Label>
            <div className="relative">
              <Input
                id="fatherContact"
                value={parentFormData.fatherDetails?.phone || ""}
                onChange={(e) => setParentFormData({
                  ...parentFormData,
                  fatherDetails: createPerson({ ...parentFormData.fatherDetails, phone: e.target.value || null })
                })}
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
              Father's Email
            </Label>
            <div className="relative">
              <Input
                id="fatherEmail"
                value={parentFormData.fatherDetails?.email || ""}
                onChange={(e) => setParentFormData({
                  ...parentFormData,
                  fatherDetails: createPerson({ ...parentFormData.fatherDetails, email: e.target.value || null })
                })}
                placeholder="Enter email"
                type="email"
                className="pl-10"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Mother's Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="motherName" className="flex items-center gap-2 text-gray-700">
              <User className="w-4 h-4" />
              Mother's Name *
            </Label>
            <div className="relative">
              <Input
                id="motherName"
                value={parentFormData.motherDetails?.name || ""}
                onChange={(e) => setParentFormData({
                  ...parentFormData,
                  motherDetails: createPerson({ ...parentFormData.motherDetails, name: e.target.value || null })
                })}
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
              Mother's Occupation
            </Label>
            <div className="relative">
              <Input
                id="motherOccupation"
                value={parentFormData.motherDetails?.occupation?.name || ""}
                onChange={(e) => setParentFormData({
                  ...parentFormData,
                  motherDetails: createPerson({ ...parentFormData.motherDetails, occupation: createOccupation(e.target.value) })
                })}
                placeholder="Enter occupation"
                className="pl-10"
              />
              <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motherContact" className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4" />
              Mother's Contact
            </Label>
            <div className="relative">
              <Input
                id="motherContact"
                value={parentFormData.motherDetails?.phone || ""}
                onChange={(e) => setParentFormData({
                  ...parentFormData,
                  motherDetails: createPerson({ ...parentFormData.motherDetails, phone: e.target.value || null })
                })}
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
              Mother's Email
            </Label>
            <div className="relative">
              <Input
                id="motherEmail"
                value={parentFormData.motherDetails?.email || ""}
                onChange={(e) => setParentFormData({
                  ...parentFormData,
                  motherDetails: createPerson({ ...parentFormData.motherDetails, email: e.target.value || null })
                })}
                placeholder="Enter email"
                type="email"
                className="pl-10"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Family Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="annualIncome" className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-4 h-4" />
              Annual Income
            </Label>
            <div className="relative">
              <Input
                id="annualIncome"
                value={parentFormData.annualIncome?.range || ""}
                onChange={(e) => setParentFormData({
                  ...parentFormData,
                  annualIncome: createAnnualIncome(e.target.value)
                })}
                placeholder="Enter annual income range"
                className="pl-10"
              />
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          onClick={handleSubmit}
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