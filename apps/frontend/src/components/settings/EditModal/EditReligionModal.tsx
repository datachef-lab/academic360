

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserIcon, Mail } from 'lucide-react';
import { Religion } from '@/types/resources/religion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateReligion } from '@/services/student-apis';

interface EditReligion {
    type:string;
    data:Religion;
  onClose:()=>void;
}

const EditReligionModal: React.FC<EditReligion> = ({ type,data, onClose }) => {
    const queryClient = useQueryClient(); 
  const [formData, setFormData] = useState<Religion>({
    name: data.name || "",
    sequence: data.sequence || 0,
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
    
    });

    const updateData=useMutation({
      mutationFn:(formData:Religion)=>{
        if(data.id!==undefined){
          return UpdateReligion(formData, data.id);
        }
        throw new Error(`${type} ID is undefined`);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getReligion"]});
        onClose();
      },
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };
  


      const handleSubmit = () => {
        console.log("Updated User Data:", formData);
        updateData.mutate(formData);
        onClose();
      };

  return (
    <>
       <Dialog open onOpenChange={onClose}>
       <DialogContent className="w-[90vw] max-w-[900px] p-6  rounded-lg">
        <div className="flex  items-center justify-between">
        <DialogHeader className=''>
          <DialogTitle className="text-2xl pl-4 font-semibold">Edit {type}</DialogTitle>
          <DialogDescription className="pl-4">
            Modify user details and save changes.
          </DialogDescription>
        </DialogHeader>
       
        </div> 
        

      
        <div className="grid grid-cols-2 gap-8 p-4">
         
          <div className="flex flex-col space-y-2">
            <Label htmlFor="name" className="pl-1">Name</Label>
            <div className="relative ">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><UserIcon size={20}></UserIcon></span>
           
            <Input name="name" 
           
            value={formData.name} 
            onChange={handleChange} 
            className="w-full border border-gray-400 rounded-md pl-10 pr-3 py-2" />
            </div>
          </div>

         
          <div className="flex flex-col space-y-2">
            <Label htmlFor="sequence" className="pl-1">Sequence</Label>
            <div className="relative ">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><Mail size={20}></Mail></span>
           
            <Input name="sequence"   value={formData.sequence ||''} onChange={handleChange} className="w-full border border-gray-400 rounded-md pl-10 pr-3 py-2" />
            </div>
          </div>

        

          </div>
        <DialogFooter className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" onClick={onClose} className=" px-4 py-2">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className=" px-4 py-2 ">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default EditReligionModal;