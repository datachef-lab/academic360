import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState,useEffect } from "react";

import {
  Settings, Barcode, Layers, ClipboardCheck, FileText, Fingerprint, 
  Hash, IdCard, ListOrdered, LayoutGrid, Landmark, BadgeCheck, ShieldCheck, 

} from "lucide-react";
import { useLocation } from "react-router-dom";
import { academicIdentifier } from "@/types/user/academic-identifier";
import { useMutation, useQuery } from "@tanstack/react-query";
import { saveAcademicIdentifier } from "@/services/stream";
import { getAcademicIdentifier } from "@/services/academic";
// import { Stream } from "@/types/academics/stream";
// import { useQuery } from "@tanstack/react-query";



const formElement = [
  
  { name: "frameworkType", label: "Framework Type", type: "text", icon: <Settings className="w-5 h-5 text-gray-500" /> },
  { name: "rfid", label: "RFID", type: "text", icon: <Barcode className="w-5 h-5 text-gray-500" /> },
  { name: "stream", label: "Stream", type: "text", icon: <Layers className="w-5 h-5 text-gray-500" /> },
  { name: "degreeProgramme", label: "Degree Programme", type: "text", icon: <ClipboardCheck className="w-5 h-5 text-gray-500" /> },
  { name: "cuFormNumber", label: "CU Form Number", type: "text", icon: <FileText className="w-5 h-5 text-gray-500" /> },
  { name: "uid", label: "UID", type: "text", icon: <Fingerprint className="w-5 h-5 text-gray-500" /> },
  { name: "oldUid", label: "Old UID", type: "text", icon: <Hash className="w-5 h-5 text-gray-500" /> },
  { name: "registrationNumber", label: "Registration Number", type: "text", icon: <IdCard className="w-5 h-5 text-gray-500" /> },
  { name: "rollNumber", label: "Roll Number", type: "text", icon: <ListOrdered className="w-5 h-5 text-gray-500" /> },
  { name: "section", label: "Section", type: "text", icon: <LayoutGrid className="w-5 h-5 text-gray-500" /> },
  { name: "classRollNumber", label: "Class Roll Number", type: "text", icon: <Landmark className="w-5 h-5 text-gray-500" /> },
  { name: "apaarId", label: "APAAR ID", type: "text", icon: <BadgeCheck className="w-5 h-5 text-gray-500" /> },
  { name: "abcId", label: "ABC ID", type: "text", icon: <ShieldCheck className="w-5 h-5 text-gray-500" /> },
  { name: "apprid", label: "Appr ID", type: "text", icon: <ShieldCheck className="w-5 h-5 text-gray-500" /> },
  
];

const AcademicIdentifierForm = () => {

  const location = useLocation();
  const studentId  = location.pathname.split("/").pop();

const id=Number(studentId);

const { data } = useQuery({
  queryKey: ["academicIdentifier", id],
  queryFn: () => getAcademicIdentifier(id),
  enabled: !!id,
});

useEffect(() => {
  if (data?.payload) {
    console.log("Fetched Data:", data.payload);
    setFormData((prev) => ({
      ...prev,
      ...data.payload, // ✅ Merge API response with form state
    }));
  }
}, [data]);
  




  const [formData, setFormData] = useState<academicIdentifier>({
    studentId: 0,
    frameworkType: null,
    rfid: "",
    stream: null,
    degreeProgramme: null,
    cuFormNumber: "",
    uid: "",
    oldUid: "",
    registrationNumber: "",
    rollNumber: "",
    section: "",
    classRollNumber: "",
    apaarId: "",
    abcId: "",
    apprid: "",
    checkRepeat: false,
  });



  const saveData=useMutation({
    mutationFn:saveAcademicIdentifier,
    onSuccess: (formData) => {
      console.log("data saved:", formData);
    }
  })
  
  // const [streamValue, setStreamValue] = useState<Stream>();
  // const { data: streams = [] } = useQuery<Stream[]>({
  //   queryKey: ["streams"],
  //   queryFn: getAllStreams,
  // });
  //   const { data } = useQuery<academicIdentifier>({
  //   queryKey: ["streams"],
  //   queryFn: 
  // });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "studentId" ? Number(value) : value || null,
    }));

  
  };

  // const studentId = searchParams.get("studentId"); // Get studentId from URL query parameters
  // const numericStudentId = studentId ? Number(studentId) : 0; // Convert to number safely
  // console.log("studentId2***",id);
  // const handleSelect=(e:React.ChangeEvent<HTMLSelectElement>)=>{
  //   // setStreamValue(e.target.value);
  //   // const selectedStream = streams?.find((stream) => stream.name === e.target.value) || null;
  //   // setFormData((prev)=>({
  //   //   ...prev,
  //   //   stream: selectedStream
  //   // }))
  //   // console.log("Selected Stream:", selectedStream);
  // }
  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
    saveData.mutate(formData);
 
  };
 

  return (
    <div className="shadow-md border py-10 w-full flex items-center justify-center px-5">
      <div className="max-w-[90%] w-full grid grid-cols-2 gap-6">
        {formElement.map(({ name, label, type, icon }) => (
          <div key={name} className="flex flex-col mr-8">
            <div className="relative p-1">
             
              <label htmlFor={name} className="text-md text-gray-700 dark:text-white mb-1 font-medium">
                {label}
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">{icon}</span>
              
                <Input
                  id={name}
                  name={name}
                  type={type}
                  value={(formData[name as keyof academicIdentifier] as string) || ""}
                  placeholder={label}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 `}
                />
             
            </div>
          </div>
        ))}
        {/* <select onChange={handleSelect}>
        <option value="">-- Choose Stream --</option>
        {streams?.map((index)=>(
          <option key={index.id} value={index.name}>{index.name}</option>
        ))}


        </select> */}
        <div className="col-span-2">
          <Button type="submit" onClick={handleSubmit} className="w-auto text-white font-bold py-2 px-4 rounded bg-blue-600 hover:bg-blue-700">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AcademicIdentifierForm;
