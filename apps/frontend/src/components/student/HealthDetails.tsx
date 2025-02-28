import { useEffect, useState } from "react";
import { Diameter, Eye, Syringe } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { bloodGroup } from "@/services/blood-group";
import { BloodGroup } from "@/types/resources/blood-group";

export default function HealthDetails() {
  const [bloodGroups, setBloodGroups] = useState<BloodGroup[]>([]);

  useEffect(() => {
    async function fetchBloodGroups() {
      try {
        const response = await bloodGroup();
        console.log("Blood group is coming...", response);
        if (response.payload && response.payload.content) {
          setBloodGroups(response.payload.content);
        }
      } catch (error) {
        console.log("Error fetching Language...", error);
      }
    }

    fetchBloodGroups();
  }, []);

  return (
    <div>
      <div className="w-full">
        <form className="bg-transparent border-none shadow-none m-0 p-0 max-w-none grid grid-cols-2 gap-4">
          {/* Blood Group */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Blood Group Type
            </Label>
            <select className="w-full p-2 border rounded-md">
              <option value="">Select blood group</option>
              {bloodGroups.map((group, index) => (
                <option key={index} value={group.type}>
                  {group.type}
                </option>
              ))}
            </select>
          </div>

          {/* Eye Power Left */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Eye Power Left
            </Label>
            <Input type="number" placeholder="Enter eye power left" />
          </div>

          {/* Eye Power Right */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Eye Power Right
            </Label>
            <Input type="number" placeholder="Enter eye power right" />
          </div>

          {/* Height */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Diameter className="w-5 h-5 text-blue-600" />
              Height
            </Label>
            <Input type="number" placeholder="Enter height" />
          </div>

          {/* Width */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Diameter className="w-5 h-5 text-blue-600" />
              Width
            </Label>
            <Input type="number" placeholder="Enter width" />
          </div>

          {/* Past Medical History */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Past Medical History
            </Label>
            <Input type="text" placeholder="Enter past medical history" />
          </div>

          {/* Past Surgical History */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Past Surgical History
            </Label>
            <Input type="text" placeholder="Enter past surgical history" />
          </div>

          {/* Drug Allergy */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Drug Allergy
            </Label>
            <Input type="text" placeholder="Enter drug allergy" />
          </div>
        </form>

        <div className="flex flex-col justify-center items-center">
          <Button className="mt-6 bg-blue-600 text-white py-3 rounded-lg shadow-md hover:bg-blue-700 transition">
            Submit
          </Button>
        </div>
      </div>
    </div>
  );
}
