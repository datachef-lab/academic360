import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, School, MapPin, Calendar, Award, BookOpen, Activity, Star } from "lucide-react";
import { AcademicHistory } from "@/types/student";

interface AcademicHistoryFormProps {
  onSubmit: (data: AcademicHistory) => void;
  initialData?: Partial<AcademicHistory>;
}

export default function AcademicHistoryForm({ onSubmit, initialData = {} }: AcademicHistoryFormProps) {
  const [formData, setFormData] = useState({
    previousSchool: initialData.previousSchool || "",
    previousSchoolAddress: initialData.previousSchoolAddress || "",
    previousSchoolBoard: initialData.previousSchoolBoard || "",
    previousSchoolYear: initialData.previousSchoolYear || "",
    previousSchoolGrade: initialData.previousSchoolGrade || "",
    previousSchoolSubjects: initialData.previousSchoolSubjects || "",
    previousSchoolActivities: initialData.previousSchoolActivities || "",
    previousSchoolAwards: initialData.previousSchoolAwards || "",
    previousSchoolReasonForLeaving: initialData.previousSchoolReasonForLeaving || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      if (!formData.previousSchool || !formData.previousSchoolYear) {
        throw new Error("Please fill in all required fields");
      }

      await onSubmit(formData as AcademicHistory);
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
        <div className="space-y-2">
          <Label htmlFor="previousSchool" className="flex items-center gap-2 text-gray-700">
            <School className="w-4 h-4" />
            Previous School *
          </Label>
          <div className="relative">
            <Input
              id="previousSchool"
              value={formData.previousSchool}
              onChange={(e) => setFormData({ ...formData, previousSchool: e.target.value })}
              placeholder="Enter previous school name"
              required
              className="pl-10"
            />
            <School className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousSchoolAddress" className="flex items-center gap-2 text-gray-700">
            <MapPin className="w-4 h-4" />
            School Address
          </Label>
          <div className="relative">
            <Input
              id="previousSchoolAddress"
              value={formData.previousSchoolAddress}
              onChange={(e) => setFormData({ ...formData, previousSchoolAddress: e.target.value })}
              placeholder="Enter school address"
              className="pl-10"
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousSchoolBoard" className="flex items-center gap-2 text-gray-700">
            <School className="w-4 h-4" />
            School Board
          </Label>
          <div className="relative">
            <Select
              value={formData.previousSchoolBoard}
              onValueChange={(value) => setFormData({ ...formData, previousSchoolBoard: value })}
            >
              <SelectTrigger className="pl-10">
                <SelectValue placeholder="Select board" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CBSE">CBSE</SelectItem>
                <SelectItem value="ICSE">ICSE</SelectItem>
                <SelectItem value="State Board">State Board</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <School className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousSchoolYear" className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            Year of Passing *
          </Label>
          <div className="relative">
            <Input
              id="previousSchoolYear"
              value={formData.previousSchoolYear}
              onChange={(e) => setFormData({ ...formData, previousSchoolYear: e.target.value })}
              placeholder="Enter year of passing"
              type="number"
              required
              className="pl-10"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousSchoolGrade" className="flex items-center gap-2 text-gray-700">
            <Award className="w-4 h-4" />
            Final Grade/Percentage
          </Label>
          <div className="relative">
            <Input
              id="previousSchoolGrade"
              value={formData.previousSchoolGrade}
              onChange={(e) => setFormData({ ...formData, previousSchoolGrade: e.target.value })}
              placeholder="Enter final grade/percentage"
              className="pl-10"
            />
            <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousSchoolSubjects" className="flex items-center gap-2 text-gray-700">
            <BookOpen className="w-4 h-4" />
            Main Subjects
          </Label>
          <div className="relative">
            <Input
              id="previousSchoolSubjects"
              value={formData.previousSchoolSubjects}
              onChange={(e) => setFormData({ ...formData, previousSchoolSubjects: e.target.value })}
              placeholder="Enter main subjects"
              className="pl-10"
            />
            <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousSchoolActivities" className="flex items-center gap-2 text-gray-700">
            <Activity className="w-4 h-4" />
            Extracurricular Activities
          </Label>
          <div className="relative">
            <Input
              id="previousSchoolActivities"
              value={formData.previousSchoolActivities}
              onChange={(e) => setFormData({ ...formData, previousSchoolActivities: e.target.value })}
              placeholder="Enter extracurricular activities"
              className="pl-10"
            />
            <Activity className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousSchoolAwards" className="flex items-center gap-2 text-gray-700">
            <Star className="w-4 h-4" />
            Awards/Achievements
          </Label>
          <div className="relative">
            <Input
              id="previousSchoolAwards"
              value={formData.previousSchoolAwards}
              onChange={(e) => setFormData({ ...formData, previousSchoolAwards: e.target.value })}
              placeholder="Enter awards/achievements"
              className="pl-10"
            />
            <Star className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="previousSchoolReasonForLeaving" className="flex items-center gap-2 text-gray-700">
            <School className="w-4 h-4" />
            Reason for Leaving
          </Label>
          <div className="relative">
            <Input
              id="previousSchoolReasonForLeaving"
              value={formData.previousSchoolReasonForLeaving}
              onChange={(e) => setFormData({ ...formData, previousSchoolReasonForLeaving: e.target.value })}
              placeholder="Enter reason for leaving"
              className="pl-10"
            />
            <School className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          type="submit"
          onClick={handleSubmit}
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