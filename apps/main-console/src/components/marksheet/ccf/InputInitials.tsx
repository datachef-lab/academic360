import { Marksheet } from "@/types/academics/marksheet";
import { Plus } from "lucide-react";

interface InputInitialsProps {
  marksheet: Marksheet | null | undefined;
//   onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
//   onAddRow: () => void;
}

export default function InputInitials({ marksheet }: InputInitialsProps) {
  return (
    <div className="my-2 mt-12 p-2">
      <div className="flex items-center justify-between mb-2">
        <label className="flex items-center gap-2">
          <span className="font-semibold">Name:</span>
          <input
            type="text"
            name="name"
            className="border border-gray-300 p-2 rounded w-80"
            value={marksheet?.name}
            // onChange={onChange}
          />
        </label>
        <div className="flex w-full items-center justify-end gap-5">
          <label className="flex items-center gap-2">
            <span className="font-semibold">Registration No.:</span>
            <input
              type="text"
              name="registrationNo"
              className="border border-gray-300 p-2 rounded w-40"
              value={marksheet?.academicIdentifier?.registrationNumber || ""}
              //   onChange={onChange}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="font-semibold">Roll No.:</span>
            <input
              type="text"
              name="rollNo"
              className="border border-gray-300 p-2 rounded w-40"
              value={marksheet?.academicIdentifier?.rollNumber || ""}
            />
          </label>
          <div className="pointer shadow-md p-2 rounded-md border">
            <Plus size={18} />
          </div>
        </div>
      </div>
    </div>
  );
}
