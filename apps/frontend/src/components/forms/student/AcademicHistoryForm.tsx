import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, School, Calendar, Award, Edit3 } from "lucide-react";
import { AcademicHistory } from "@/types/user/academic-history";


interface AcademicHistoryFormProps {
  onSubmit: (data: AcademicHistory) => void;
  initialData?: Partial<AcademicHistory>;
}

export default function AcademicHistoryForm({ onSubmit, initialData = {} }: AcademicHistoryFormProps) {
  const [formData, setFormData] = useState<Partial<AcademicHistory>>({
    studentId: initialData.studentId || 0,
    lastInstitution: initialData.lastInstitution || null,
    lastBoardUniversity: initialData.lastBoardUniversity || null,
    specialization: initialData.specialization || null,
    lastResult: initialData.lastResult || null,
    studiedUpToClass: initialData.studiedUpToClass || null,
    passedYear: initialData.passedYear || null,
    remarks: initialData.remarks || null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
    ...prev,
    [name]: ["studiedUpToClass", "passedYear"].includes(name)
    ? value === "" ? "" : Number(value)
    : value,
    }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form data
      // if (!formData.studentId || !formData.studiedUpToClass || !formData.passedYear) {
      //   throw new Error("Please fill in all required fields");
      // }

      await onSubmit(formData as AcademicHistory);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 bg-white rounded-xl shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="studentId" className="flex items-center gap-2 text-gray-700">
            <School className="w-4 h-4" />
            Student ID *
          </Label>
          <Input
            id="studentId"
            name="studentId"
            value={formData.studentId || ""}
            onChange={(e) => handleChange(e)}
            placeholder="Enter student ID"
            type="number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastInstitution" className="flex items-center gap-2 text-gray-700">
            <School className="w-4 h-4" />
            Last Institution
          </Label>
          <Input
            id="lastInstitution"
            name="lastInstitution"
            value={formData.lastInstitution ? String(formData.lastInstitution) : ""}
            onChange={(e) => handleChange(e)}
            placeholder="Enter last institution name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastBoardUniversity" className="flex items-center gap-2 text-gray-700">
            <School className="w-4 h-4" />
            Last Board/University
          </Label>
          <Input
            id="lastBoardUniversity"
            name="lastBoardUniversity"
            value={String(formData.lastBoardUniversity) || ""}
            onChange={(e) => handleChange(e)}
            placeholder="Enter board/university"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialization" className="flex items-center gap-2 text-gray-700">
            <School className="w-4 h-4" />
            Specialization
          </Label>
          <Input
            id="specialization"
            name="specialization"
            value={formData.specialization ? String(formData.specialization) : ""}
            onChange={(e) => handleChange(e)}
            placeholder="Enter specialization"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastResult" className="flex items-center gap-2 text-gray-700">
            <Award className="w-4 h-4" />
            Last Result
          </Label>
          <Select
            value={formData.lastResult || ""}
            onValueChange={(value) => handleChange({ target: { name: "lastResult", value } } as React.ChangeEvent<HTMLInputElement>)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select result status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PASS">Pass</SelectItem>
              <SelectItem value="FAIL">Fail</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="studiedUpToClass" className="flex items-center gap-2 text-gray-700">
            <School className="w-4 h-4" />
            Studied Up To Class *
          </Label>
          <Input
            id="studiedUpToClass"
            name="studiedUpToClass"
            value={formData.studiedUpToClass || ""}
            onChange={(e) => handleChange(e)}
            placeholder="Enter class"
            type="number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="passedYear" className="flex items-center gap-2 text-gray-700">
            <Calendar className="w-4 h-4" />
            Year of Passing *
          </Label>
          <Input
            id="passedYear"
            name="passedYear"
            value={formData.passedYear || ""}
            onChange={(e) => handleChange(e)}
            placeholder="Enter year of passing"
            type="number"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="remarks" className="flex items-center gap-2 text-gray-700">
            <Edit3 className="w-4 h-4" />
            Remarks
          </Label>
          <Input
            id="remarks"
            name="remarks"
            value={formData.remarks || ""}
            onChange={(e) => handleChange(e)}
            placeholder="Enter remarks"
          />
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