"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/hooks/UserAvatar";
import { User } from "@/types/user/user";
import { Pencil } from "lucide-react";
import { FaEdit } from "react-icons/fa";

interface Props {
  onUpdate: (user: User) => void;
  user: User;
}

export default function EditUserModal({ onUpdate, user }: Props) {
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: user.name,
        email: user.email,
      });
    }
  }, [open, user]);

  const handleUpdate = () => {
    const updatedUser: User = {
      ...user,
      name: formData.name,
      email: formData.email,
      updatedAt: new Date(),
    };
    onUpdate(updatedUser);
    setOpen(false);
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FaEdit />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department User</DialogTitle>
            <DialogDescription>Update name and email for this user</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            <UserAvatar user={{ ...user, id: String(user.id) }} className="w-20 h-20" />

            <div className="w-full space-y-3">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="grid w-full items-center gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="flex justify-end pt-4 gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate}>Update</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
