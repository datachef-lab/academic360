// import { FormEvent, useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { io, Socket } from "socket.io-client";
// import { Input } from "../ui/input";
// import { uploadFile } from "@/services/marksheet-apis";
// import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
// import * as XLSX from "xlsx";

// const socket: Socket = io(import.meta.env.VITE_APP_BACKEND_URL as string, {
//   path: "/socket.io/",
// });

// const expectedHeaders = [
//   "registration_no",
//   "stream",
//   "course",
//   "semester",
//   "name",
//   "sgpa",
//   "remarks",
//   "full_marks",
//   "year1",
//   "year2",
//   "ngp",
//   "credit",
//   "tgp",
//   "subjectName",
//   "paperCode",
//   "internal_year",
//   "full_marks_internal",
//   "internal_marks",
//   "internal_credit",
//   "internal_credit_obtained",
//   "practical_year",
//   "full_marks_practical",
//   "practical_marks",
//   "practical_credit",
//   "practical_credit_obtained",
//   "theory_year",
//   "full_marks_theory",
//   "theory_marks",
//   "theory_credit",
//   "theory_credit_obtained",
//   "viva_year",
//   "full_marks_viva",
//   "viva_marks",
//   "viva_credit",
//   "viva_credit_obtained",
//   "project_year",
//   "full_marks_project",
//   "project_marks",
//   "project_credit",
//   "project_credit_obtained",
//   "total",
//   "status",
//   "grade",
//   "roll_no",
//   "uid",
//   "framework",
//   "specialization",
//   "shift",
//   "section",
//   "cgpa",
//   "classification",
// ];

// export default function FileUpload() {
//   const [file, setFile] = useState<File | null>(null);
//   const [isValidFile, setIsValidFile] = useState(false);
//   const [progress, setProgress] = useState<string>("Idle");
//   const [progressStage, setProgressStage] = useState<string>("");
//   const setProcessedData = useState<unknown[]>([])[1];
//   const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

//   useEffect(() => {
//     socket.on("progress", (data: { stage: string; message: string; data?: unknown[] }) => {
//       console.log("Progress update received:", data); // Log every updat
//       setProgress(data.message);
//       setProgressStage(data.stage);
//       setIsDrawerOpen(true);

//       if (data.stage === "completed") {
//         console.log("here");
//         setProcessedData(data.data || []);
//       }
//     });

//     return () => {
//       socket.off("progress");
//     };
//   }, [setProcessedData]);

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const uploadedFile = e.target.files?.[0];
//     setFile(uploadedFile || null);
//     setIsValidFile(false);

//     if (!uploadedFile) return;

//     const data = await uploadedFile.arrayBuffer();
//     const workbook = XLSX.read(data, { type: "array" });
//     const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
//     const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];

//     const headers = sheetData[0]?.map((h) => h?.toString().trim());

//     const allHeadersPresent = expectedHeaders.every((h) => headers.includes(h));
//     setIsValidFile(allHeadersPresent);
//   };

//   const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("file", file);
//     if (socket.id) {
//       formData.append("socketId", socket.id);
//     }

//     try {
//       setProgress("Uploading...");
//       setIsDrawerOpen(true);
//       await uploadFile(formData);
//     } catch (error) {
//       console.error("Upload failed:", error);
//     }
//   };

//   return (
//     <>
//       <form onSubmit={handleUpload} className="bg-transparent flex gap-3 border-none shadow-none max-w-none p-0">
//         <div className="flex">
//           <Input
//             type="file"
//             onChange={(e) => (e.target.files && e.target.files[0] ? setFile(e.target.files[0] as File) : setFile(null))}
//           />
//         </div>
//         <Button variant="destructive" type="submit" disabled={!isValidFile}>
//           Upload
//         </Button>
//       </form>

//       <Drawer
//         open={isDrawerOpen}
//         onClose={() => {
//           if (progressStage === "completed") setIsDrawerOpen(false);
//         }}
//       >
//         <DrawerContent>
//           <DrawerHeader>
//             <DrawerTitle>File Upload Progress</DrawerTitle>
//             <DrawerDescription className="flex gap-2">
//               <p>[{progressStage}]:</p>
//               <p>{progress}</p>
//             </DrawerDescription>
//           </DrawerHeader>
//           {/* {progressStage && progressStage !== "completed" && (
//             <Progress value={progressStage === "scanning" ? 33 : progressStage === "reading" ? 66 : 100} />
//           )} */}
//           {/* {processedData.length > 0 && (
//             <div className="mt-4">
//               <h2>Processed Data:</h2>
//               <pre>{JSON.stringify(processedData, null, 2)}</pre>
//             </div>
//           )} */}
//         </DrawerContent>
//       </Drawer>
//     </>
//   );
// }

import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { io, Socket } from "socket.io-client";
import { Input } from "../ui/input";
import { uploadFile } from "@/services/marksheet-apis";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import * as XLSX from "xlsx";

const socket: Socket = io(import.meta.env.VITE_APP_BACKEND_URL as string, {
  path: "/socket.io/",
});

const expectedHeaders = [
  "registration_no",
  "stream",
  "course",
  "semester",
  "name",
  "sgpa",
  "remarks",
  "full_marks",
  "year1",
  "year2",
  "ngp",
  "credit",
  "tgp",
  "subjectName",
  "paperCode",
  "internal_year",
  "full_marks_internal",
  "internal_marks",
  "internal_credit",
  "internal_credit_obtained",
  "practical_year",
  "full_marks_practical",
  "practical_marks",
  "practical_credit",
  "practical_credit_obtained",
  "theory_year",
  "full_marks_theory",
  "theory_marks",
  "theory_credit",
  "theory_credit_obtained",
  "viva_year",
  "full_marks_viva",
  "viva_marks",
  "viva_credit",
  "viva_credit_obtained",
  "project_year",
  "full_marks_project",
  "project_marks",
  "project_credit",
  "project_credit_obtained",
  "total",
  "status",
  "grade",
  "roll_no",
  "uid",
  "framework",
  "specialization",
  "shift",
  "section",
  "cgpa",
  "classification",
];

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isValidFile, setIsValidFile] = useState(false);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("Idle");
  const [progressStage, setProgressStage] = useState<string>("");
  const setProcessedData = useState<unknown[]>([])[1];
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    socket.on("progress", (data: { stage: string; message: string; data?: unknown[] }) => {
      console.log("Progress update received:", data);
      setProgress(data.message);
      setProgressStage(data.stage);
      setIsDrawerOpen(true);

      if (data.stage === "completed") {
        setProcessedData(data.data || []);
      }
    });

    return () => {
      socket.off("progress");
    };
  }, [setProcessedData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    setFile(uploadedFile || null);
    setIsValidFile(false);
    setHeaderError(null);

    if (!uploadedFile) return;

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error("No sheets found in workbook");
      const firstSheet = workbook.Sheets[firstSheetName];
      if (!firstSheet) throw new Error("Sheet not found in workbook");
      const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
      console.log(sheetData);
      const headers = sheetData[0]?.map((h) => h?.toString().trim()) || [];

      const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h));
      if (missingHeaders.length > 0) {
        setHeaderError(`Missing headers: ${missingHeaders.join(", ")}`);
        setIsValidFile(false);
      } else {
        setHeaderError(null);
        setIsValidFile(true);
      }
    } catch (err) {
      console.error("Error reading file:", err);
      setHeaderError("Failed to parse the Excel file. Please try a valid file.");
    }
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !isValidFile) return;

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
      <form onSubmit={handleUpload} className="bg-transparent flex gap-3 border-none shadow-none max-w-none p-0 ">
        <div className="flex">
          <Input type="file" onChange={handleFileChange} />
        </div>
        {headerError && <p className="text-red-500 text-sm">{headerError}</p>}
        <Button variant="destructive" type="submit" disabled={!isValidFile}>
          Upload
        </Button>
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
        </DrawerContent>
      </Drawer>
    </>
  );
}
