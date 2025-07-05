import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { SubjectMetadata, SubjectType } from '@/types/academics/subject-metadata';
import { Degree } from '@/types/resources/degree';


interface SubjectFormProps {
  newSubject: SubjectMetadata;
  selectedDegreeId: number;
  subjectTypeOptions: SubjectType[];
  degreeOptions: Degree[];
  filteredProgrammes: string[];
  isSubmitting: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleCheckboxChange: (checked: boolean) => void;
  handleAddSubject: () => Promise<void>;
  closeDialog: () => void;
  isEditMode?: boolean;
}

const SubjectForm: React.FC<SubjectFormProps> = ({
  newSubject,
  selectedDegreeId,
  subjectTypeOptions,
  degreeOptions,
  filteredProgrammes,
  isSubmitting,
  handleInputChange,
  handleSelectChange,
  handleCheckboxChange,
  handleAddSubject,
  closeDialog,
  isEditMode = false,
}) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-purple-900">
            Subject Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            name="name"
            value={newSubject.name}
            onChange={handleInputChange}
            placeholder="Enter subject name"
            className="border-purple-300 focus:border-purple-700 focus:ring-purple-700"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="irpCode" className="text-purple-900">
            Subject Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="irpCode"
            name="irpCode"
            value={newSubject.irpCode ?? ""}
            onChange={handleInputChange}
            placeholder="Enter subject code"
            className="border-purple-300 focus:border-purple-700 focus:ring-purple-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subjectTypeId" className="text-purple-900">
            Subject Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={newSubject.subjectType ? newSubject.subjectType.id!.toString() : ""}
            onValueChange={(value) => handleSelectChange("subjectTypeId", value)}
          >
            <SelectTrigger id="subjectTypeId" className="border-purple-300 focus:ring-purple-700">
              <SelectValue placeholder="Select subject type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-purple-300">
              {subjectTypeOptions.length > 0 ? (
                subjectTypeOptions.map((type) => (
                  <SelectItem key={type.id} value={type.id!.toString()}>
                    {type.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-options" disabled>
                  No subject types available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="credit" className="text-purple-900">
            Credit <span className="text-red-500">*</span>
          </Label>
          <Input
            id="credit"
            name="credit"
            type="number"
            value={newSubject.credit || ""}
            onChange={handleInputChange}
            placeholder="Enter credit value"
            min={0}
            className="border-purple-300 focus:border-purple-700 focus:ring-purple-700"
          />
        </div>
      </div>

      <Separator className="bg-purple-200" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="degreeId" className="text-purple-900">
            Degree <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedDegreeId ? selectedDegreeId.toString() : ""}
            onValueChange={(value) => handleSelectChange("degreeId", value)}
          >
            <SelectTrigger id="degreeId" className="border-purple-300 focus:ring-purple-700">
              <SelectValue placeholder="Select degree" />
            </SelectTrigger>
            <SelectContent className="bg-white border-purple-300">
              {degreeOptions.length > 0 ? (
                degreeOptions.map((degree) => (
                  <SelectItem key={degree.id} value={degree.id!.toString()}>
                    {degree.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-options" disabled>
                  No degrees available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="streamId" className="text-purple-900">
            Programme <span className="text-red-500">*</span>
          </Label>
          <Select
            value={newSubject.degree ? newSubject.degree.id!.toString() : ""}
            onValueChange={(value) => handleSelectChange("streamId", value)}
            disabled={!selectedDegreeId || filteredProgrammes.length === 0}
          >
            <SelectTrigger id="streamId" className="border-purple-300 focus:ring-purple-700 disabled:opacity-50">
              <SelectValue
                placeholder={
                  !selectedDegreeId
                    ? "Select a degree first"
                    : filteredProgrammes.length === 0
                      ? "No programmes for selected degree"
                      : "Select programme"
                }
              />
            </SelectTrigger>
            <SelectContent className="bg-white border-purple-300">
              {
                ["HONOURS", "GENERAL"].map((programme) => (
                  <SelectItem key={programme} value={programme}>
                    {programme}
                  </SelectItem>
                ))
               }
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="semester" className="text-purple-900">
            Semester <span className="text-red-500">*</span>
          </Label>
          <Select
            value={newSubject.class ? newSubject.class.id!.toString() : ''}
            onValueChange={(value) => handleSelectChange("semester", value)}
          >
            <SelectTrigger id="semester" className="border-purple-300 focus:ring-purple-700">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent className="bg-white border-purple-300">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <SelectItem key={sem} value={sem.toString()}>
                  Semester {sem}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullMarks" className="text-purple-900">
            Full Marks <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullMarks"
            name="fullMarks"
            type="number"
            value={newSubject.fullMarks || ""}
            onChange={handleInputChange}
            placeholder="Enter full marks"
            min={0}
            className="border-purple-300 focus:border-purple-700 focus:ring-purple-700"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="marksheetCode" className="text-purple-900">Marksheet Code</Label>
        <Input
          id="marksheetCode"
          name="marksheetCode"
          value={newSubject.marksheetCode ?? ''}
          onChange={handleInputChange}
          placeholder="Enter marksheet code"
          className="border-purple-300 focus:border-purple-700 focus:ring-purple-700"
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="isOptional" 
          checked={newSubject.isOptional} 
          onCheckedChange={handleCheckboxChange}
          className="border-purple-400 text-purple-700 focus:ring-purple-500"
        />
        <Label htmlFor="isOptional" className="text-purple-900">Optional Subject</Label>
      </div>

      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={closeDialog}
          className="border-purple-300 text-purple-800 hover:bg-purple-100 hover:text-purple-900"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleAddSubject} 
          className="bg-purple-700 hover:bg-purple-800 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            isEditMode ? 'Update Subject' : 'Add Subject'
          )}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default SubjectForm; 