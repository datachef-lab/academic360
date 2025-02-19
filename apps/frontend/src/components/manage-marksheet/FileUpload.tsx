import { useState } from "react";
import { Button } from "@/components/ui/button";

import { Input } from "../ui/input";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (file) {
      console.log("Uploading:", file);
      // TODO: Implement API call for file upload
    }
  };

  return (
    <form className="bg-transparent flex gap-3 border-none shadow-none max-w-none p-0">
      <div className="flex ">
        <Input type="file" />
      </div>
      <Button variant="destructive">Upload</Button>
    </form>
  );
}
