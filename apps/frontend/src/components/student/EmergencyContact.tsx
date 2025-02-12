import { Briefcase, Home, Mail, Phone, User } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function EmergencyContact() {
  return (
    <div>
      <div className="w-full">
        <form className="bg-transparent border-none shadow-none m-0 p-0 w-full">
          {/* personName */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Guardian Name
            </Label>
            <Input type="text" placeholder="Enter Guardian Name" />
          </div>
          {/* relationToStudent */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Relation to Student
            </Label>
            <Input type="text" placeholder="Enter Relation to Student" />
          </div>
          {/* email */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Email
            </Label>
            <Input type="text" placeholder="Enter Email" />
          </div>
          {/* phone */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              Phone
            </Label>
            <Input type="text" placeholder="Enter Phone Number" />
          </div>
          {/* officePhone */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Office Phone
            </Label>
            <Input type="text" placeholder="Enter Office Phone Number" />
          </div>
          {/* residentialPhone */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              Residential Phone
            </Label>
            <Input type="text" placeholder="Enter Residential Phone Number" />
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
