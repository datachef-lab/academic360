import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// You may need to create a simple file upload input for the modal

interface AddMaterialModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: AddMaterialFormData) => void;
  subject: {
    subject: string;
    type: string;
    paper: string;
  };
}

export interface AddMaterialFormData {
  materialType: "link" | "file";
  title: string;
  url?: string;
  file?: File | null;
}

const AddMaterialModal: React.FC<AddMaterialModalProps> = ({ open, onClose, onSave, subject }) => {
  const [materialType, setMaterialType] = useState<"link" | "file">("file");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);

  const isLink = materialType === "link";
  const isFile = materialType === "file";

  const isTitleValid = title.trim().length > 0;
  const isUrlValid = isLink ? /^https?:\/\/.+/.test(url) : true;
  const isFileValid = isFile ? !!file : true;
  const isFormValid = isTitleValid && (isLink ? isUrlValid : isFileValid);

  const handleSave = () => {
    setTouched(true);
    if (!isFormValid) return;
    onSave({ materialType, title, url: isLink ? url : undefined, file: isFile ? file : undefined });
    setTitle("");
    setUrl("");
    setFile(null);
    setTouched(false);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add Material</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Badge variant="outline" className="font-semibold">{subject.subject}</Badge>
          <Badge variant="default">{subject.type}</Badge>
          <span className="text-gray-500">{subject.paper}</span>
        </div>
        <div className="mb-4">
          <div className="font-medium mb-2">Material Type <span className="text-red-500">*</span></div>
          <RadioGroup
            className="flex gap-6"
            value={materialType}
            onValueChange={(val: string) => setMaterialType(val as "link" | "file")}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="link" /> Link
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="file" /> File Upload
            </label>
          </RadioGroup>
        </div>
        <div className="mb-4">
          <div className="font-medium mb-2">Material Title <span className="text-red-500">*</span></div>
          <Input
            placeholder="Enter material title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={touched && !isTitleValid ? "border-red-500" : ""}
          />
          {touched && !isTitleValid && <div className="text-xs text-red-500 mt-1">Title is required</div>}
        </div>
        {isLink && (
          <div className="mb-4">
            <div className="font-medium mb-2">URL <span className="text-red-500">*</span></div>
            <Input
              placeholder="https://example.com/resource"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className={touched && !isUrlValid ? "border-red-500" : ""}
            />
            {touched && !isUrlValid && <div className="text-xs text-red-500 mt-1">Enter a valid URL</div>}
          </div>
        )}
        {isFile && (
          <div className="mb-4">
            <div className="font-medium mb-2">File Upload <span className="text-red-500">*</span></div>
            <label className="block border-2 border-dashed border-violet-300 rounded-xl p-8 text-center cursor-pointer hover:bg-violet-50 transition">
              <input
                type="file"
                accept=".pdf,.docx,.ppt,.xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl text-violet-400">📄</span>
                <span className="font-medium">Drag and drop or click to upload</span>
                <span className="text-xs text-gray-500">PDF, DOCX, PPT, XLSX files up to 10MB</span>
                {file && <span className="text-xs text-green-600 mt-2">{file.name}</span>}
              </div>
            </label>
            {touched && !isFileValid && <div className="text-xs text-red-500 mt-1">File is required</div>}
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={!isFormValid} className="bg-violet-400 text-white hover:bg-violet-500" type="button">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaterialModal; 