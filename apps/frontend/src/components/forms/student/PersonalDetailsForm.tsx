import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/DatePicker";
import { CheckCircle2, User, Calendar, Globe, Church, Tag } from "lucide-react";
import { PersonalDetails } from "@/types/student";
import { FaTransgender, FaWheelchair } from "react-icons/fa";

interface PersonalDetailsFormProps {
  onSubmit: (data: PersonalDetails) => void;
  initialData?: Partial<PersonalDetails>;
}

export default function PersonalDetailsForm({ onSubmit, initialData = {} }: PersonalDetailsFormProps) {
  const [formData, setFormData] = useState<PersonalDetails>({
    name: initialData.name || "",
    dateOfBirth: initialData.dateOfBirth || "",
    gender: initialData.gender || "",
    nationality: initialData.nationality || "",
    religion: initialData.religion || "",
    category: initialData.category || "",
    handicapped: initialData.handicapped || "No",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.name || !formData.dateOfBirth || !formData.gender) {
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2 text-gray-700">
            <User className="w-4 h-4" />
            Full Name *
          </Label>
          <div className="relative">
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              required
              className="pl-10"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth" className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            Date of Birth *
          </Label>
          <div className="relative">
            <DatePicker
              value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined}
              onSelect={(date) => setFormData({ ...formData, dateOfBirth: date?.toISOString() || "" })}
              className="w-full pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender" className="flex items-center gap-2 text-gray-700">
            <FaTransgender className="w-4 h-4" />
            Gender *
          </Label>
          <div className="relative">
            <Select
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FaTransgender className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationality" className="flex items-center gap-2 text-gray-700">
            <Globe className="w-4 h-4" />
            Nationality
          </Label>
          <div className="relative">
            <Input
              id="nationality"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              placeholder="Enter nationality"
              className="pl-10"
            />
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="religion" className="flex items-center gap-2 text-gray-700">
            <Church className="w-4 h-4" />
            Religion
          </Label>
          <div className="relative">
            <Select
              value={formData.religion}
              onValueChange={(value) => setFormData({ ...formData, religion: value })}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select religion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hindu">Hindu</SelectItem>
                <SelectItem value="Muslim">Muslim</SelectItem>
                <SelectItem value="Christian">Christian</SelectItem>
                <SelectItem value="Sikh">Sikh</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Church className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="flex items-center gap-2 text-gray-700">
            <Tag className="w-4 h-4" />
            Category
          </Label>
          <div className="relative">
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="OBC">OBC</SelectItem>
                <SelectItem value="SC">SC</SelectItem>
                <SelectItem value="ST">ST</SelectItem>
              </SelectContent>
            </Select>
            <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="handicapped" className="flex items-center gap-2 text-gray-700">
            <FaWheelchair className="w-4 h-4" />
            Handicapped
          </Label>
          <div className="relative">
            <Select
              value={formData.handicapped}
              onValueChange={(value) => setFormData({ ...formData, handicapped: value })}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="No">No</SelectItem>
              </SelectContent>
            </Select>
            <FaWheelchair className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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