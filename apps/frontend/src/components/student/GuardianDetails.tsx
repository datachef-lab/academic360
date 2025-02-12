import { Briefcase, GraduationCap, Home, IdCard, Image, Mail, Phone, User } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function GuardianDetails() {
  return (
    <div>
      <div className="w-full">
        <form className="bg-transparent border-none shadow-none m-0 p-0 w-full">
          {/* Guardian Name */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Guardian Name
            </Label>
            <Input type="text" placeholder="Enter Father's Name" />
          </div>
          {/* Guardian email */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Email
            </Label>
            <Input type="email" placeholder="Enter Email" />
          </div>
          {/* Guardian phone */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Phone
            </Label>
            <Input type="text" placeholder="Enter Phone Number" />
          </div>
          {/* Aadhar card number */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <IdCard className="w-5 h-5 text-blue-600" />
              Aadhaar Number
            </Label>
            <Input type="text" placeholder="Enter Aadhaar Number" />
          </div>
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-600" />
              Upload Image
            </Label>
            <Input type="file" />
          </div>
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Qualification
            </Label>
            <Input type="text" placeholder="Enter Qualification" />
          </div>
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Occupation
            </Label>
            <Input type="text" placeholder="Enter Occupation" />
          </div>
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              Office Address
            </Label>
            <Input type="text" placeholder="Enter Office Address" />
          </div>
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Office Phone
            </Label>
            <Input type="number" placeholder="Enter Office Phone" />
          </div>
          <div className="flex flex-col justify-center items-center">
            <Button className=" mt-6 bg-blue-600 text-white py-3 rounded-lg shadow-md hover:bg-blue-700 transition">
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
