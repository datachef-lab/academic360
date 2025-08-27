import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SingleParentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectParentType: (parentType: 'father' | 'mother') => void;
}

const SingleParentModal: React.FC<SingleParentModalProps> = ({ isOpen, onClose, onSelectParentType }) => {

  const handleSelectParent = (parentType: 'father' | 'mother') => {
    onSelectParentType(parentType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg font-semibold">Important Information Regarding Single Parent Status</DialogTitle>
        </DialogHeader>
        <DialogDescription className="mt-3">
          <p className="text-xs sm:text-sm text-gray-700 mb-4">
            Please select Single Parent as 'Yes' only in case of separation
            between the parents. In case of the demise of parent(s), the student
            needs to Select 'No' & mention the demised parent's name as per
            Class XII Board Admit Card or Marksheet by selecting 'Late' in Sr.
            No. 25 &/or 27, as applicable.
          </p>
          <p className="text-xs sm:text-sm text-gray-700 font-semibold mb-4">Which parent's details will you be providing?</p>
        </DialogDescription>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
          <Button 
            variant="outline" 
            onClick={() => handleSelectParent('father')}
            className="w-full sm:w-auto text-sm"
          >
            Father's Details
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleSelectParent('mother')}
            className="w-full sm:w-auto text-sm"
          >
            Mother's Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SingleParentModal; 