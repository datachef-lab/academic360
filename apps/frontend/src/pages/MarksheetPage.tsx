import { useParams } from "react-router-dom";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import MarksheetCCF from "../components/marksheet/ccf";
import { getFile, getScanMarksheets } from "@/services/document-apis";

export default function MarksheetPage() {
  const { framework, rollNumber } = useParams();
  const [existingFiles, setExistingFiles] = useState<{ year: number; filePath: string }[]>([]);

  useQuery({
    queryKey: [`documents-${rollNumber}`],
    queryFn: async () => {
      const response = await getScanMarksheets({
        framework: framework as "CCF" | "CBSE",
        stream: "BCOM",
        rollNumber: rollNumber as string,
        semester: 1,
      });

      console.log("existing files", response.payload);
      setExistingFiles(response.payload || []);
      return response.payload;
    },
  });

  return (
    <div className="w-full h-[92vh] flex">
      <ResizablePanelGroup direction="horizontal" className="w-full h-full">
        {/* Left Panel - Marksheet */}
        <ResizablePanel className=" p-4 shadow-md rounded-md">
          <MarksheetCCF />
        </ResizablePanel>
        <ResizableHandle className="bg-red-500 mx-2" />

        {/* Right Panel - Tabs for Years */}
        <ResizablePanel className="">
          {existingFiles.length > 0 ? (
            <Tabs defaultValue={existingFiles[0].year.toString()} className="w-full">
              {/* Tabs List - Scrollable for better UX */}
              <TabsList className="w-full flex justify-start gap-2 border-b">
                {existingFiles.map((file) => (
                  <TabsTrigger key={file.year} value={file.year.toString()}>
                    {file.year}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tabs Content - Show file preview */}
              {existingFiles.map((file) => (
                <TabsContent key={file.year} value={file.year.toString()} className="w-full">
                  {file.filePath && <FilePreview filePath={file.filePath} />}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <p className="text-gray-500 text-center text-lg mt-10">No marksheets found</p>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

// Separate component for file preview
// Separate component for file preview
function FilePreview({ filePath }: { filePath: string }) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: [`file-${filePath}`],
    queryFn: async () => {
      const response = await getFile(filePath);
      return response;
    },
    enabled: !!filePath, // Prevents unnecessary calls if filePath is empty
  });

  useEffect(() => {
    if (data) {
      const blob = new Blob([data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setFileUrl(url);
    }
  }, [data]);

  if (isLoading) return <p className="text-gray-500">Loading file...</p>;
  if (isError || !data) return <p className="text-red-500">Failed to load file</p>;

  return (
    <div className="h-full">
      {fileUrl ? (
        <iframe src={fileUrl} width="100%" height="700px" className="border rounded-md"></iframe>
      ) : (
        <p className="text-gray-500">Unable to preview file</p>
      )}
      <p className="mt-4">
        <a href={fileUrl as string} download="marksheet.pdf" className="text-blue-500 hover:underline">
          Download File
        </a>
      </p>
    </div>
  );
}
