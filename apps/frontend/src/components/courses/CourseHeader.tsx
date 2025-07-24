import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Course } from '@/types/course-design/course';
import { Degree } from '@/types/resources/degree';

// Define ProgrammeOption locally
type ProgrammeOption = { id: number; degreeProgramme: string; degreeId: number };

interface CourseHeaderProps {
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  newCourse: Course;
  degreeOptions: Degree[];
  programmeOptions: ProgrammeOption[];
  selectedDegreeId: number;
  isSubmitting: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleAddCourse: () => void;
  isEditMode?: boolean;
  onCancel?: () => void;
}

const CourseHeader: React.FC<CourseHeaderProps> = ({
  isAddDialogOpen,
  setIsAddDialogOpen,
  newCourse,
  degreeOptions,
  // programmeOptions,
  selectedDegreeId,
  isSubmitting,
  handleInputChange,
  handleSelectChange,
  handleAddCourse,
  isEditMode = false,
  onCancel,
}) => {
  // Filter programmes based on selected degree
  // const filteredProgrammes = programmeOptions.filter(
  //   (programme) => selectedDegreeId === 0 || programme.degreeId === selectedDegreeId
  // );

  return (
    <CardHeader className="bg-white border-b border-purple-100">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-purple-900">Courses</h2>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-purple-700 text-white hover:bg-purple-800"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Course
        </Button>
      </div>

      {/* Add/Edit Course Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-purple-900">
              {isEditMode ? 'Edit Course' : 'Add New Course'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Course Name*
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter course name"
                className="col-span-3"
                value={newCourse.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shortName" className="text-right">
                Short Name
              </Label>
              <Input
                id="shortName"
                name="shortName"
                placeholder="Enter short name"
                className="col-span-3"
                value={newCourse.shortName || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codePrefix" className="text-right">
                Code Prefix
              </Label>
              <Input
                id="codePrefix"
                name="codePrefix"
                placeholder="Enter code prefix"
                className="col-span-3"
                value={newCourse.codePrefix || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="universityCode" className="text-right">
                University Code
              </Label>
              <Input
                id="universityCode"
                name="universityCode"
                placeholder="Enter university code"
                className="col-span-3"
                value={newCourse.universityCode || ''}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="degree" className="text-right">
                Degree*
              </Label>
              <Select 
                onValueChange={(value) => handleSelectChange('degree', value)}
                value={newCourse.degree && newCourse.degree.id ? newCourse.degree.id.toString() : ''}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>
                <SelectContent>
                  {degreeOptions.map((degree) => (
                    <SelectItem key={degree.id} value={degree.id!.toString()}>
                      {degree.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="programme" className="text-right">
                Programme*
              </Label>
              <Select 
                onValueChange={(value) => handleSelectChange('programmeType', value)}
                value={newCourse.programmeType || ''}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={selectedDegreeId === 0 ? "Select degree first" : "Select programme"} />
                </SelectTrigger>
                <SelectContent>
                  {["HONOURS", "GENERAL"].map((programme) => (
                    <SelectItem key={programme} value={programme}>
                      {programme}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              type="button"
              variant="outline"
              onClick={onCancel}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={() => { 
                console.log('handleAddCourse called from dialog');
                handleAddCourse();
              }}
              disabled={isSubmitting}
              className="bg-purple-700 text-white hover:bg-purple-800"
            >
              {isSubmitting 
                ? (isEditMode ? 'Updating...' : 'Adding...') 
                : (isEditMode ? 'Update Course' : 'Add Course')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardHeader>
  );
};

export default CourseHeader; 