import { IdCard, Mail, Phone, User, Image, Briefcase, GraduationCap, Home, BadgeIndianRupee } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export default function ParentDetails() {
  return (
    <div className="flex justify-center items-center w-full p-6">
      <Card className="w-full bg-white rounded-lg">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">Parent Details</h2>

          <Accordion type="single" collapsible className="w-full">
            {/* Father Details Section */}
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

            {/* Mother Details Section */}
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
          </Accordion>

          <div className="flex flex-col justify-center items-center">
            <Button className=" mt-6 bg-blue-600 text-white py-3 rounded-lg shadow-md hover:bg-blue-700 transition">
              Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
