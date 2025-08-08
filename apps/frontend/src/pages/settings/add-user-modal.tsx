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
  import { addUser } from "@/services/user";
  import { User } from "@/types/user/user";
  
  type AddUserModalProps = {
    onAdd?: (data: User) => void; // optional if unused
  };
  
  export function AddUserModal({ onAdd }: AddUserModalProps) {
    const [formData, setFormData] = useState<User>({
      name: "",
      email: "",
      password: "",
      phone: "",
      disabled: false,
      whatsappNumber: "",
      image: "",
      type: "FACULTY",
    });
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };
  
    const handleAdd = async () => {
      try {
        const res = await addUser(formData);
        onAdd?.(res.payload); // call only if defined
  
        setFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          disabled: false,
          whatsappNumber: "",
          image: "",
          type: "STUDENT",
        });
      } catch (error) {
        console.error("Failed to add user", error);
      }
    };
  
    const fields: (keyof User)[] = ["name", "email", "password", "phone", "whatsappNumber"];
  
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
            {fields.map((field) => (
              <Input
                key={field}
                name={field}
                placeholder={field}
                value={formData[field] as string}
                onChange={handleChange}
              />
            ))}
            <select name="type" value={formData.type} onChange={handleChange} className="p-2 border rounded-md">
              {["ADMIN", "FACULTY", "STAFF", "STUDENT", "PARENTS"].map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleAdd}>Submit</Button>
        </DialogContent>
      </Dialog>
    );
  }
  