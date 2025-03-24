
import { User } from '@/types/user/user';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserIcon, Mail, Phone, MessageCircle  } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { UpdateUser } from '@/services/student-apis';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EditUserProps {
  user: User;
  onClose: () => void;
 
}
const USER_TYPES=["STUDENT","TEACHER","ADMIN"];
const EditUserModal: React.FC<EditUserProps> = ({ user, onClose }) => {
  const  activeSetting={label:"users"}
  const pagination= { pageIndex: 0, pageSize: 10 };
  const queryClient = useQueryClient();  
  const [formData, setFormData] = useState<User>({
    name:user.name||"",
    email:user.email|| "",
    phone:user.phone || "",
    whatsappNumber: user.whatsappNumber ||  "",
    type: user.type ,
    image: user.image || "",
    disabled: user.disabled || false,
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date(),
    });

     const updateData=useMutation({
          mutationFn:(formData:User)=>{
            if(user.id!==undefined){
              return UpdateUser(formData, user.id);
            }
            throw new Error(`User ID is undefined`);
          },
          onSuccess: async () => {
            await queryClient.invalidateQueries({
              queryKey: [activeSetting.label, { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }],
            });
          },

        })
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
      };

      const handleToggleDisable = () => {
    setFormData((prev) => ({
      ...prev,
      disabled: !prev.disabled
    }));
  };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value
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
          <DialogTitle className="text-2xl pl-4 font-semibold">Edit User</DialogTitle>
          <DialogDescription className="pl-4">
            Modify user details and save changes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex  mr-2 gap-3 items-center justify-between px-4 py-2">
          <Label className="text-md">Disable User</Label>
          <Switch checked={formData.disabled} onCheckedChange={handleToggleDisable} />
        </div>

        </div>
        

      
        <div className="grid grid-cols-2 gap-8 p-4">
         
          <div className="flex flex-col space-y-2">
            <Label htmlFor="name" className="pl-1">Name</Label>
            <div className="relative ">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><UserIcon size={20}></UserIcon></span>
           
            <Input name="name" 
            disabled={formData.disabled}
            value={formData.name} 
            onChange={handleChange} 
            className="w-full border border-gray-400 rounded-md pl-10 pr-3 py-2" />
            </div>
          </div>

         
          <div className="flex flex-col space-y-2">
            <Label htmlFor="email" className="pl-1">Email</Label>
            <div className="relative ">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><Mail size={20}></Mail></span>
           
            <Input name="email" disabled={formData.disabled}  value={formData.email} onChange={handleChange} className="w-full border border-gray-400 rounded-md pl-10 pr-3 py-2" />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="phone" className="pl-1">Phone</Label>
            <div className="relative ">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><Phone size={20}></Phone></span>
            <Input name="phone" disabled={formData.disabled}  value={formData.phone} onChange={handleChange}  className={`w-full border border-gray-400 rounded-md pl-10 pr-3 py-2 `} />
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="whatsappNumber" className="pl-1">WhatsApp</Label>
            <div className="relative ">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2"><MessageCircle size={20}></MessageCircle></span>
            <Input name="whatsappNumber" disabled={formData.disabled} value={formData.whatsappNumber} onChange={handleChange}  className={`w-full  border border-gray-400 rounded-md pl-10 pr-3 py-2 `} />
            </div>
          </div>

          <div className="flex flex-col space-y-2 col-span-1">
            <Label htmlFor="type" className="pl-1">Type</Label>
            <Select disabled={formData.disabled}  onValueChange={(value) => handleSelectChange("type", value)} defaultValue={formData.type}>
              <SelectTrigger className=" border border-gray-400 rounded-md px-3 py-2">
                <SelectValue   />
              </SelectTrigger>
              <SelectContent>
                {USER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

export default EditUserModal;