import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { UserPlus } from "lucide-react";

type UserFormData = {
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  image: string;
  type: "ADMIN" | "TEACHER" | "STUDENT";
};

type AddUserModalProps = {
  onAdd: (data: UserFormData) => void;
};

export function AddUserModal({ onAdd }: AddUserModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    image: "",
    type: "STUDENT",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAdd = () => {
    onAdd(formData);
    setFormData({
      name: "",
      email: "",
      phone: "",
      whatsappNumber: "",
      image: "",
      type: "STUDENT",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="ml-auto flex items-center gap-2">
          <UserPlus size={18} />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>Fill in the user details.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {["name", "email", "phone", "whatsappNumber", "image"].map((field) => (
            <Input
              key={field}
              placeholder={field}
              name={field}
              value={(formData as any)[field]}
              onChange={handleChange}
            />
          ))}
          <select name="type" value={formData.type} onChange={handleChange} className="p-2 border rounded-md">
            <option value="ADMIN">ADMIN</option>
            <option value="TEACHER">TEACHER</option>
            <option value="STUDENT">STUDENT</option>
          </select>
        </div>
        <Button onClick={handleAdd}>Submit</Button>
      </DialogContent>
    </Dialog>
  );
}
