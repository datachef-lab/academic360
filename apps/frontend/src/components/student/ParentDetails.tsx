import { IdCard, Mail, Phone, User, Image, Briefcase, GraduationCap, Home, BadgeIndianRupee, Syringe } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { annualIncome } from "@/services/annual-income";
import { AnnualIncome } from "@/types/resources/annual-income";

export default function ParentDetails() {
  const [parentType, setParentType] = useState("BOTH"); // Default to "BOTH"
  const [income, setIncome] = useState<AnnualIncome[]>([]);
  useEffect(() => {
    async function getAnnualIncome() {
      try {
        const response = await annualIncome();
        console.log("Annual Income is coming...", response);
        if (response.payload && response.payload.content) {
          setIncome(response.payload.content);
        }
      } catch (error) {
        console.log("Error fetching Language...", error);
      }
    }
    getAnnualIncome();
  }, []);

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
                      <Input type="text" placeholder="Enter Father's Name" />
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
                      <Input type="text" placeholder="Enter Qualification" />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        Occupation
                      </Label>
                      <Input type="text" placeholder="Enter Occupation" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="flex items-center gap-2">
                      <Syringe className="w-5 h-5 text-blue-600" />
                      Anuual Income
                    </Label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="">Select Annual Income</option>
                      {income.map((income, index) => (
                        <option key={index} value={income.range}>
                          {income.range}
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
                      <Input type="text" placeholder="Enter Mother's Name" />
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
                      <Input type="text" placeholder="Enter Qualification" />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        Occupation
                      </Label>
                      <Input type="text" placeholder="Enter Occupation" />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="flex items-center gap-2">
                      <BadgeIndianRupee className="w-5 h-5 text-blue-600" />
                      Annual Income
                    </Label>
                    <Input type="number" placeholder="Enter Annual Income" />
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
                    <Input type="text" placeholder="Enter Qualification" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Occupation
                    </Label>
                    <Input type="text" placeholder="Enter Occupation" />
                  </div>
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
