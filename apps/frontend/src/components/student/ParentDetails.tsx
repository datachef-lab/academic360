import {
  IdCard,
  Mail,
  Phone,
  User,
  Image,
  Briefcase,
  GraduationCap,
  Home,
  BadgeIndianRupee,
  Syringe,
} from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { annualIncome } from "@/services/annual-income";
import { AnnualIncome } from "@/types/resources/annual-income";
import { fetchAllOccupations, fetchAllQualifications, fetchPersonByStudentId } from "@/services/personal-details";
import { useParams } from "react-router-dom";
import { Qualification } from "@/types/resources/qualification";
import { Occupation } from "@/types/resources/occupation";
import { Person } from "@/types/user/person";
import { ApiResonse } from "@/types/api-response";
import { fetchAllPersonByStudentId } from "@/services/health";
// import { ApiResponse } from "@/types/api-response";

interface PersonResponse {
  httpStatusCode: number;
  payload: Person;
  httpStatus: string;
  message: string;
}

interface AnnualIncomeResponse {
  httpStatusCode: number;
  payload: {
    content: AnnualIncome[];
    page: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  };
  httpStatus: string;
  message: string;
}

export default function ParentDetails() {
  const [parentType, setParentType] = useState("BOTH"); // Default to "BOTH"
  const [income, setIncome] = useState<AnnualIncome[]>([]);
  const [occupations, setOccupations] = useState<Occupation[]>([]);
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [personData, setPersonData] = useState<Person | null>(null);
  const { studentId } = useParams<{ studentId: string }>();

  // Combined useEffect for all data fetching
  useEffect(() => {
    // Get All AnnualIncomes
    async function getAnnualIncome() {
      try {
        const response = (await annualIncome()) as unknown as AnnualIncomeResponse;
        console.log("Annual Income is coming...", response);
        if (response.payload && response.payload.content) {
          setIncome(response.payload.content);
        }
      } catch (error) {
        console.log("Error fetching Language...", error);
      }
    }

    // Get All PersonsById
    async function getAllPersons() {
      if (!studentId) return;
      try {
        const response = (await fetchPersonByStudentId(+studentId)) as unknown as PersonResponse;
        console.log("Persons is coming...", response);
        if (response.payload) {
          setPersonData(response.payload);
        }
      } catch (error) {
        console.log("Error fetching persons...", error);
      }
    }

    // Get All Occupations
    async function getAllOccupations() {
      try {
        const response = (await fetchAllOccupations()) as unknown as ApiResonse<{ content: Occupation[] }>;
        console.log("Occupation is coming...", response);
        if (response.payload && response.payload.content) {
          setOccupations(response.payload.content);
        }
      } catch (error) {
        console.log("Error fetching Occupations...", error);
      }
    }

    // Get All Qualifications
    async function getAllQualifications() {
      try {
        const response = (await fetchAllQualifications()) as unknown as ApiResonse<{ content: Qualification[] }>;
        console.log("Qualifications is coming...", response);
        if (response.payload && response.payload.content) {
          setQualifications(response.payload.content);
        }
      } catch (error) {
        console.log("Error fetching Qualfications...", error);
      }
    }

    
      async function fetchAllPersons() {
        if (!studentId) return;
        try {
          const response = await fetchAllPersonByStudentId(+studentId);
          console.log("Guardian Details is coming.....",response)
        } catch (error) {
          console.log("Error fetching guardian....",error)
        }
      }
      fetchAllPersons();
    getAnnualIncome();
    getAllPersons();
    getAllOccupations();
    getAllQualifications();
  }, [studentId]);

  return (
    <div className="flex justify-center items-center w-full p-6">
      <Card className="w-full bg-white rounded-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Family Details</h2>

          {/* Parent Type Selection */}
          <div className="mb-6">
            <Label className="block text-lg font-semibold mb-2">Select Parent Type</Label>
            <Select onValueChange={(value) => setParentType(value)} defaultValue={parentType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Parent Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FATHER_ONLY">Father Only</SelectItem>
                <SelectItem value="MOTHER_ONLY">Mother Only</SelectItem>
                <SelectItem value="BOTH">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Accordion type="multiple" className="w-full">
            {/* Father Details Section */}
            {(parentType === "FATHER_ONLY" || parentType === "BOTH") && (
              <AccordionItem value="father">
                <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                  Father's Details
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Name
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter Father's Name"
                        value={personData?.name || ""}
                        onChange={(e) => setPersonData((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="Enter Email"
                        value={personData?.email || ""}
                        onChange={(e) => setPersonData((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-blue-600" />
                        Phone
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter Phone Number"
                        value={personData?.phone || ""}
                        onChange={(e) => setPersonData((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <IdCard className="w-5 h-5 text-blue-600" />
                        Aadhaar Number
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter Aadhaar Number"
                        value={personData?.aadhaarCardNumber || ""}
                        onChange={(e) =>
                          setPersonData((prev) => (prev ? { ...prev, aadhaarCardNumber: e.target.value } : null))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        Qualification
                      </Label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="">Select Qualification</option>
                        {qualifications.map((qualification) => (
                          <option key={qualification.id} value={qualification.id}>
                            {qualification.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        Occupation
                      </Label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="">Select Occupation</option>
                        {occupations.map((occupation) => (
                          <option key={occupation.id} value={occupation.id}>
                            {occupation.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="flex items-center gap-2">
                      <Syringe className="w-5 h-5 text-blue-600" />
                      Anuual Income
                    </Label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="">Select Annual Income</option>
                      {income.map((incomeItem) => (
                        <option key={incomeItem.id} value={incomeItem.id}>
                          {incomeItem.range}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <Label className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-blue-600" />
                      Office Address
                    </Label>
                    <Input type="text" placeholder="Enter Office Address" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-blue-600" />
                        Office Phone
                      </Label>
                      <Input
                        type="text"
                        placeholder="Enter Office Phone"
                        value={personData?.officePhone || ""}
                        onChange={(e) =>
                          setPersonData((prev) => (prev ? { ...prev, officePhone: e.target.value } : null))
                        }
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Image className="w-5 h-5 text-blue-600" />
                        Upload Image
                      </Label>
                      <Input type="file" />
                      {personData?.image && (
                        <div className="mt-2">
                          <img
                            src={personData.image}
                            alt="Profile"
                            className="max-w-[100px] max-h-[100px] rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Mother Details Section */}
            {(parentType === "MOTHER_ONLY" || parentType === "BOTH") && (
              <AccordionItem value="mother">
                <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                  Mother's Details
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Name
                      </Label>
                      <Input 
                        type="text" 
                        placeholder="Enter Mother's Name" 
                        value={personData?.name || ""}
                        onChange={(e) => setPersonData((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        Email
                      </Label>
                      <Input 
                        type="email" 
                        placeholder="Enter Email" 
                        value={personData?.email || ""}
                        onChange={(e) => setPersonData((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-blue-600" />
                        Phone
                      </Label>
                      <Input 
                        type="text" 
                        placeholder="Enter Phone Number" 
                        value={personData?.phone || ""}
                        onChange={(e) => setPersonData((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <IdCard className="w-5 h-5 text-blue-600" />
                        Aadhaar Number
                      </Label>
                      <Input 
                        type="text" 
                        placeholder="Enter Aadhaar Number" 
                        value={personData?.aadhaarCardNumber || ""}
                        onChange={(e) => setPersonData((prev) => (prev ? { ...prev, aadhaarCardNumber: e.target.value } : null))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-blue-600" />
                        Qualification
                      </Label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="">Select Qualification</option>
                        {qualifications.map((qualification) => (
                          <option key={qualification.id} value={qualification.id}>
                            {qualification.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        Occupation
                      </Label>
                      <select className="w-full p-2 border rounded-md">
                        <option value="">Select Occupation</option>
                        {occupations.map((occupation) => (
                          <option key={occupation.id} value={occupation.id}>
                            {occupation.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="flex items-center gap-2">
                      <BadgeIndianRupee className="w-5 h-5 text-blue-600" />
                      Annual Income
                    </Label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="">Select Annual Income</option>
                      {income.map((incomeItem) => (
                        <option key={incomeItem.id} value={incomeItem.id}>
                          {incomeItem.range}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-4">
                    <Label className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-blue-600" />
                      Office Address
                    </Label>
                    <Input type="text" placeholder="Enter Office Address" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <Phone className="w-5 h-5 text-blue-600" />
                        Office Phone
                      </Label>
                      <Input 
                        type="text" 
                        placeholder="Enter Office Phone" 
                        value={personData?.officePhone || ""}
                        onChange={(e) => setPersonData((prev) => (prev ? { ...prev, officePhone: e.target.value } : null))}
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Image className="w-5 h-5 text-blue-600" />
                        Upload Image
                      </Label>
                      <Input type="file" />
                      {personData?.image && (
                        <div className="mt-2">
                          <img
                            src={personData.image}
                            alt="Profile"
                            className="max-w-[100px] max-h-[100px] rounded-md"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Guardian Details Section */}
            <AccordionItem value="guardian">
              <AccordionTrigger className="text-lg font-semibold flex items-center gap-2">
                Guardian's Details
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Name
                    </Label>
                    <Input type="text" placeholder="Enter Guardian's Name" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      Email
                    </Label>
                    <Input type="email" placeholder="Enter Email" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-blue-600" />
                      Phone
                    </Label>
                    <Input type="text" placeholder="Enter Phone Number" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <IdCard className="w-5 h-5 text-blue-600" />
                      Aadhaar Number
                    </Label>
                    <Input type="text" placeholder="Enter Aadhaar Number" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-blue-600" />
                      Qualification
                    </Label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="">Select Qualification</option>
                      {qualifications.map((qualification) => (
                        <option key={qualification.id} value={qualification.id}>
                          {qualification.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Occupation
                    </Label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="">Select Occupation</option>
                      {occupations.map((occupation) => (
                        <option key={occupation.id} value={occupation.id}>
                          {occupation.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="flex items-center gap-2">
                    <BadgeIndianRupee className="w-5 h-5 text-blue-600" />
                    Annual Income
                  </Label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="">Select Annual Income</option>
                    {income.map((incomeItem) => (
                      <option key={incomeItem.id} value={incomeItem.id}>
                        {incomeItem.range}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4">
                  <Label className="flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-600" />
                    Office Address
                  </Label>
                  <Input type="text" placeholder="Enter Office Address" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-blue-600" />
                      Office Phone
                    </Label>
                    <Input type="text" placeholder="Enter Office Phone" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Image className="w-5 h-5 text-blue-600" />
                      Upload Image
                    </Label>
                    <Input type="file" />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex flex-col justify-center items-center">
            <Button className="mt-6 bg-blue-600 text-white py-3 rounded-lg shadow-md hover:bg-blue-700 transition">
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
