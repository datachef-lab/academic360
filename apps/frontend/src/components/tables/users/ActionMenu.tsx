import { User } from '@/types/user/user';
import React, { useState } from 'react';
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import EditUserModal from "../../settings/EditModal/EditUserModal";

interface Props {
  // Define your props here
  user:User,
}

const ComponentName: React.FC<Props> = ({  user}) => {
    const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  return (
     <div>
         <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user?.id?.toString() || "")}>
                      Copy payment ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>View customer</DropdownMenuItem>
                    <DropdownMenuItem onClick={()=>setIsEditOpen(true)} >Edit</DropdownMenuItem>
                    <DropdownMenuItem>View payment details</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {isEditOpen && <EditUserModal user={user} onClose={() => setIsEditOpen(false)} />}
 </div>
  );
};

export default ComponentName;