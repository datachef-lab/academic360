import { useState } from "react";
import axios from "axios";
import { ProgressBar } from "./Progress";

export const Uploader = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file) {
        formData.append("files", file);
      }
    }

    try {
      await axios.post("/api/bulk-upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
      });
    } catch (error) {
      console.error("Error uploading files:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Bulk Uploader</h2>
      <input type="file" multiple onChange={handleFileChange} className="mb-4" />
      <button
        onClick={handleUpload}
        disabled={!files || uploading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
      {uploading && <ProgressBar progress={progress} />}
    </div>
  );
};
