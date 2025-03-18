

// import React, { useState } from 'react';
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { UserIcon, Mail } from 'lucide-react';
// import { Category } from '@/types/resources/category';
// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { UpdateCategory } from '@/services/student-apis';

// interface EditUserBoardUniversity {
//   type:string;
//     data:Category;
//   onClose:()=>void;
// }

// const EditCategoryModal: React.FC<EditUserBoardUniversity> = ({ type,data, onClose }) => {
//     const queryClient = useQueryClient();  
//   const [formData, setFormData] = useState<Category>({
//      name: data.name || "",
//      code: data.code || "",
//      documentRequired:data.documentRequired,
//      createdAt: new Date(),
//      updatedAt: new Date()
//     });


//     const updateData=useMutation({
//       mutationFn:(formData:Category)=>{
//         if(data.id!==undefined){
//           return UpdateCategory(formData,data.id);
//         }
//         throw new Error(`${type} ID is undefined`);
//       },
//       onSuccess: () => {
//         queryClient.invalidateQueries({ queryKey: ["getCategory"]});
//         onClose();
//       }
//     })
//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//       const { name, value } = e.target;
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     };
  


//       const handleSubmit = () => {
//         console.log("Updated User Data:", formData);
//         updateData.mutate(formData);
//         onClose();
//       };

//   return (
//     <>
//        <Dialog open onOpenChange={onClose}>
//        <DialogContent className="w-[90vw] max-w-[900px] p-6  rounded-lg">
//         <div className="flex  items-center justify-between">
//         <DialogHeader className=''>
//           <DialogTitle className="text-2xl pl-4 font-semibold">Edit {type}</DialogTitle>
//           <DialogDescription className="pl-4">
//             Modify user details and save changes.
//           </DialogDescription>
//         </DialogHeader>
       
//         </div> 
        

      
//         <div className="grid grid-cols-2 gap-8 p-4">
         
//           <div className="flex flex-col space-y-2">
//             <Label htmlFor="name" className="pl-1">Name</Label>
//             <div className="relative ">
//             <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><UserIcon size={20}></UserIcon></span>
           
//             <Input name="name" 
           
//             value={formData.name} 
//             onChange={handleChange} 
//             className="w-full border border-gray-400 rounded-md pl-10 pr-3 py-2" />
//             </div>
//           </div>

         
//           <div className="flex flex-col space-y-2">
//             <Label htmlFor="code" className="pl-1">Code</Label>
//             <div className="relative ">
//             <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><Mail size={20}></Mail></span>
           
//             <Input name="code"   value={formData.code ||''} onChange={handleChange} className="w-full border border-gray-400 rounded-md pl-10 pr-3 py-2" />
//             </div>
//           </div>

//           <div className="flex flex-col space-y-2">
//             <Label htmlFor="documentRequired" className="pl-1">Document Required</Label>
//             <div className="relative ">
//             <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><Mail size={20}></Mail></span>
           
//             <Input name="documentRequired"   value={formData.documentRequired ? 'true' : 'false'} onChange={handleChange} className="w-full border border-gray-400 rounded-md pl-10 pr-3 py-2" />
//             </div>
//           </div>

//           </div>
//         <DialogFooter className="flex justify-end space-x-4 pt-4">
//           <Button variant="outline" onClick={onClose} className=" px-4 py-2">
//             Cancel
//           </Button>
//           <Button onClick={handleSubmit} className=" px-4 py-2 ">
//             Save
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//     </>
//   );
// };

// export default EditCategoryModal;

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
import { Category } from '@/types/resources/category';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateCategory } from '@/services/student-apis';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface EditUserBoardUniversity {
  type: string;
  data: Category;
  onClose: () => void;
}

const EditCategoryModal: React.FC<EditUserBoardUniversity> = ({ type, data, onClose }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Category>({
    name: data.name || "",
    code: data.code || "",
    documentRequired: data.documentRequired,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const updateData = useMutation({
    mutationFn: (formData: Category) => {
      if (data.id !== undefined) {
        return UpdateCategory(formData, data.id);
      }
      throw new Error(`${type} ID is undefined`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getCategory"] });
      onClose();
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value === "true",
    }));
  };

  const handleSubmit = () => {
    console.log("Updated User Data:", formData);
    updateData.mutate(formData);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[900px] p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <DialogHeader>
            <DialogTitle className="text-2xl pl-4 font-semibold">Edit {type}</DialogTitle>
            <DialogDescription className="pl-4">
              Modify user details and save changes.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid grid-cols-2 gap-8 p-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="name" className="pl-1">Name</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><UserIcon size={20} /></span>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded-md pl-10 pr-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="code" className="pl-1">Code</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><Mail size={20} /></span>
              <Input
                name="code"
                value={formData.code || ''}
                onChange={handleChange}
                className="w-full border border-gray-400 rounded-md pl-10 pr-3 py-2"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="documentRequired" className="pl-1">Document Required</Label>
            <Select
              onValueChange={(value) => handleSelectChange("documentRequired", value)}
              defaultValue={formData.documentRequired ? "true" : "false"}
            >
              <SelectTrigger className="border border-gray-400 rounded-md px-3 py-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex justify-end space-x-4 pt-4">
          <Button variant="outline" onClick={onClose} className="px-4 py-2">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="px-4 py-2">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryModal;
