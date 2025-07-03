import React from 'react';
import { Plus } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import SubjectForm from './SubjectForm';
import { NewSubject, ProgrammeOption } from '../types/subject-types';

interface SubjectTypeOption {
  id: number;
  marksheetName: string;
}

interface DegreeOption {
  id: number;
  name: string;
}

interface SubjectHeaderProps {
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (isOpen: boolean) => void;
  newSubject: NewSubject;
  selectedDegreeId: number;
  subjectTypeOptions: SubjectTypeOption[];
  degreeOptions: DegreeOption[];
  filteredProgrammes: ProgrammeOption[];
  isSubmitting: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  handleCheckboxChange: (checked: boolean) => void;
  handleAddSubject: () => Promise<void>;
  isEditMode?: boolean;
  onCancel?: () => void;
}

const SubjectHeader: React.FC<SubjectHeaderProps> = ({
  isAddDialogOpen,
  setIsAddDialogOpen,
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
  isEditMode = false,
  onCancel,
}) => {
  return (
    <CardHeader className="bg-white border-b border-purple-100">
      <div className="flex items-center justify-between">
        <CardTitle className="text-2xl font-bold text-purple-900">Subjects</CardTitle>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-purple-700 text-white hover:bg-purple-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Subject
        </Button>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-white p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-purple-900">
              {isEditMode ? 'Edit Subject' : 'Add New Subject'}
            </DialogTitle>
          </DialogHeader>
          <SubjectForm
            newSubject={newSubject}
            selectedDegreeId={selectedDegreeId}
            subjectTypeOptions={subjectTypeOptions}
            degreeOptions={degreeOptions}
            filteredProgrammes={filteredProgrammes}
            isSubmitting={isSubmitting}
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            handleCheckboxChange={handleCheckboxChange}
            handleAddSubject={handleAddSubject}
            closeDialog={() => {
              if (onCancel) {
                onCancel();
              } else {
                setIsAddDialogOpen(false);
              }
            }}
            isEditMode={isEditMode}
          />
        </DialogContent>
      </Dialog>
    </CardHeader>
  );
};

export default SubjectHeader; 