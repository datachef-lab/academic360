import { useState } from "react";
import { Button } from "@/components/ui/button";

import { UploadCloud } from "lucide-react";

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (file) {
      console.log("Uploading:", file);
      // TODO: Implement API call for file upload
    }
  };

  return (
    <div className="border-dashed border-2 border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-gray-100 transition">
      <label className="cursor-pointer">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <UploadCloud className="mx-auto text-gray-500" size={36} />
        <p className="text-gray-600 mt-2">Click or Drag to Upload Excel File</p>
      </label>
      {file && <p className="mt-2 text-sm text-green-600">{file.name}</p>}
      <Button onClick={handleUpload} className="mt-4" disabled={!file}>
        Upload
      </Button>
    </div>
  );
}
