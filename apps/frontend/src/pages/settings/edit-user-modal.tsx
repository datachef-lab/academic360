"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/hooks/UserAvatar";
import { User } from "@/types/user/user";
import { FaEdit } from "react-icons/fa";
import { UpdateUser } from "@/services/student-apis";
import { Switch } from "@/components/ui/switch";

interface Props {
  onUpdate: (user: User) => void;
  user: User;
}

export default function EditUserModal({ onUpdate, user }: Props) {
  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState<User>({
    name: user.name,
    email: user.email,
    password: user.password ?? "", // Added
    type: user.type,
    disabled: user.disabled,
    image: user.image ?? "",
    phone: user.phone ?? "",
    whatsappNumber: user.whatsappNumber ?? "",
    id: user.id, // if required
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: user.name,
        email: user.email,
        password: user.password ?? "",
        type: user.type,
        disabled: user.disabled,
        image: user.image ?? "",
        phone: user.phone ?? "",
        whatsappNumber: user.whatsappNumber ?? "",
        id: user.id,
      });
    }
  }, [open, user]);

  const handleUpdate = async () => {
    try {
      const updatedUser: User = {
        ...user,
        ...formData,
        updatedAt: new Date(),
      };

      await UpdateUser(updatedUser, user.id!);
      onUpdate(updatedUser);
      setOpen(false);
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <FaEdit />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            <UserAvatar user={{ ...user, id: String(user.id) }} className="w-20 h-20" />

            <div className="w-full space-y-3">
              {/* Name */}
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email */}
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

              {/* Phone */}
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* WhatsApp */}
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  placeholder="Enter WhatsApp Number"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                />
              </div>

              {/* Type Dropdown */}
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="border rounded-md p-2"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as User["type"] })}
                >
                  {["ADMIN", "FACULTY", "STAFF", "STUDENT", "PARENTS"].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Disabled Toggle */}
              <div className="flex items-center justify-between pt-2">
                <Label htmlFor="disabled">Disabled</Label>
                <Switch
                  id="disabled"
                  checked={formData.disabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, disabled: checked })}
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
