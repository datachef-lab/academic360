import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState,useEffect,  } from "react";
// import {
//   DropdownMenu,
//   DropdownMenuTrigger,
//   DropdownMenuContent,
//   DropdownMenuItem,
// } from "@/components/ui/dropdown-menu";
import {
  Settings, Barcode, FileText, Fingerprint, 
  Hash, IdCard, ListOrdered, LayoutGrid, Landmark, BadgeCheck, ShieldCheck,
  

} from "lucide-react";
import { useLocation } from "react-router-dom";
import { AcademicIdentifier } from "@/types/user/academic-identifier";
import { useMutation, useQuery } from "@tanstack/react-query";
import { saveAcademicIdentifier } from "@/services/stream";
import { getAcademicIdentifier } from "@/services/academic";
import { createAcademicIdentifier } from "@/services/student-apis";
import axios from "axios";



const formElement = [
  
  { name: "frameworkType", label: "Framework Type", type: "text", icon: <Settings className="w-5 h-5 text-gray-500" /> },
  { name: "rfid", label: "RFID", type: "text", icon: <Barcode className="w-5 h-5 text-gray-500" /> },
 
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

const [isNew,setIsNew]=useState(false);
const [formData, setFormData] = useState<AcademicIdentifier>({
  studentId: 0,
  frameworkType: null,
  rfid: "",
  course: null,
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




const { data ,isError,error} = useQuery({
  queryKey: ["AcademicIdentifier", id],
  queryFn: () => getAcademicIdentifier(id),
  enabled: !!id,
  retry: false,
});



  useEffect(() => {
   
    if (isError && axios.isAxiosError(error) && error.response?.status === 404) {
      alert("No academic history found - initializing new record");
      console.log("error code ***1+*",error.response?.status);
      setIsNew(true);
      setFormData({
        studentId: 0,
        frameworkType: null,
        rfid: "",
        course: null,
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
     
    }
    else if(data?.payload) {
      // console.log(JSON.stringify(data.payload,null,2));
      setFormData((prev) => ({
        ...prev,
        ...data.payload, 
      }));
   
    }
    else{
      console.log("error on fetching ",error);
      
    }
    
   
   
  }, [data, error, isError, id]);



  const updateData=useMutation({
    mutationFn:saveAcademicIdentifier,
    onSuccess: (formData) => {
      console.log("data saved:", formData);
    }
  })
  
  const createData = useMutation({
    mutationFn: (formData: AcademicIdentifier) =>createAcademicIdentifier(formData),
    onSuccess: (data) => {
      console.log("Data saved:", data);
      console.log("Data saved successfully");
    },
  });


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : name === "studentId" ? Number(value) : value || null,
    }));

  
  };

  const handleSubmit = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault();
   
    if(isNew){
      console.log("Creating new academic history:", formData);
      console.log("No academic history found - creating new record");
      createData.mutate(formData);
    }
    else{
      console.log("Updating academic history:", formData);
      updateData.mutate(formData);
    }
 
  };
 

  return (
    <div className="shadow-md border py-10 w-full flex bg-white items-center justify-center px-5">
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
                  value={(formData[name as keyof AcademicIdentifier] as string) || ""}
                  placeholder={label}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-3 py-2 `}
                />
             
            </div>
          </div>
        ))}
      
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
