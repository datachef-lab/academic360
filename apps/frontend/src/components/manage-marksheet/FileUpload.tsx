import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { io, Socket } from "socket.io-client";
import { Input } from "../ui/input";
import { uploadFile } from "@/services/marksheet-apis";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";

const socket: Socket = io(import.meta.env.VITE_APP_BACKEND_URL as string, {
  path: "/socket.io/",
});

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<string>("Idle");
  const [progressStage, setProgressStage] = useState<string>("");
  const setProcessedData = useState<unknown[]>([])[1];
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    socket.on("progress", (data: { stage: string; message: string; data?: unknown[] }) => {
      console.log("Progress update received:", data); // Log every updat
      setProgress(data.message);
      setProgressStage(data.stage);
      setIsDrawerOpen(true);

      if (data.stage === "completed") {
        console.log("here");
        setProcessedData(data.data || []);
      }
    });

    return () => {
      socket.off("progress");
    };
  }, []);

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    if (socket.id) {
      formData.append("socketId", socket.id);
    }

    try {
      setProgress("Uploading...");
      setIsDrawerOpen(true);
      await uploadFile(formData);
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return (
    <>
      <form onSubmit={handleUpload} className="bg-transparent flex gap-3 border-none shadow-none max-w-none p-0">
        <div className="flex">
          <Input
            type="file"
            onChange={(e) => (e.target.files && e.target.files[0] ? setFile(e.target.files[0] as File) : setFile(null))}
          />
        </div>
        <Button variant="destructive">Upload</Button>
      </form>

      <Drawer
        open={isDrawerOpen}
        onClose={() => {
          if (progressStage === "completed") setIsDrawerOpen(false);
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>File Upload Progress</DrawerTitle>
            <DrawerDescription className="flex gap-2">
              <p>[{progressStage}]:</p>
              <p>{progress}</p>
            </DrawerDescription>
          </DrawerHeader>
          {/* {progressStage && progressStage !== "completed" && (
            <Progress value={progressStage === "scanning" ? 33 : progressStage === "reading" ? 66 : 100} />
          )} */}
          {/* {processedData.length > 0 && (
            <div className="mt-4">
              <h2>Processed Data:</h2>
              <pre>{JSON.stringify(processedData, null, 2)}</pre>
            </div>
          )} */}
        </DrawerContent>
      </Drawer>
    </>
  );
}
