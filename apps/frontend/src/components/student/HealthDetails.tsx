import { Diameter, Eye, Syringe } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export default function HealthDetails() {
  return (
    <div>
      <div className="w-full">
        <form className="bg-transparent border-none shadow-none m-0 p-0 w-full">
          {/* blood Group  */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Blood Group Type
            </Label>
            <Input type="text" placeholder="Enter blood group" />
          </div>
          {/* eyePowerLeft  */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Eye Power Left
            </Label>
            <Input type="text" placeholder="Enter eye power left" />
          </div>
          {/* eyePowerRight  */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Eye power Right
            </Label>
            <Input type="text" placeholder="Enter eye power right" />
          </div>
          {/* height */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Diameter className="w-5 h-5 text-blue-600" />
              Height
            </Label>
            <Input type="text" placeholder="Enter height" />
          </div>
          {/* width */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Diameter className="w-5 h-5 text-blue-600" />
              width
            </Label>
            <Input type="text" placeholder="Enter width" />
          </div>
          {/* pastMedicalHistory */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Past Medical History
            </Label>
            <Input type="text" placeholder="Enter past medical history" />
          </div>
          {/* pastSurgicalHistory */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Past Surgical History
            </Label>
            <Input type="text" placeholder="Enter past surgical history" />
          </div>
          {/* drugAllergy */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Drug Allergy
            </Label>
            <Input type="text" placeholder="Enter drug allergy" />
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
