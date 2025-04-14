import { useEffect, useState } from "react";
import { Diameter, Eye, Syringe } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { bloodGroup } from "@/services/blood-group";
import { BloodGroup } from "@/types/resources/blood-group";
import { fetchHealthDetailsByStudentId } from "@/services/health";
import { useParams } from "react-router-dom";
import { Health } from "@/types/user/health";

export default function HealthDetails() {
  const [bloodGroups, setBloodGroups] = useState<BloodGroup[]>([]);
  const [healthDetails, setHealthDetails] = useState<Health | null>(null);
  const { studentId } = useParams<{ studentId: string }>();

  useEffect(() => {
    async function fetchBloodGroups() {
      try {
        const response = await bloodGroup();
        console.log("Blood group is coming...", response);
        if (response.payload && response.payload.content) {
          setBloodGroups(response.payload.content);
        }
      } catch (error) {
        console.log("Error fetching Blood Groups...", error);
      }
    }

    async function fetchHealthDetails() {
      try {
        if (!studentId) return;
        const response = await fetchHealthDetailsByStudentId(+studentId);
        console.log("Health Details is coming...", response);
        if (response.payload) {
          setHealthDetails(response.payload);
        }
      } catch (error) {
        console.log("Error fetching Health Details....", error);
      }
    }

    fetchHealthDetails();
    fetchBloodGroups();
  }, [studentId]);

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
            <select 
              className="w-full p-2 border rounded-md"
              value={healthDetails?.bloodGroup?.id || ""}
              onChange={(e) => {
                const selectedGroup = bloodGroups.find(group => group.id === Number(e.target.value));
                setHealthDetails(prev => prev ? {...prev, bloodGroup: selectedGroup || null} : null);
              }}
            >
              <option value="">Select blood group</option>
              {bloodGroups.map((group) => (
                <option key={group.id} value={group.id}>
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
            <Input 
              type="number" 
              placeholder="Enter eye power left"
              value={healthDetails?.eyePowerLeft || ""}
              onChange={(e) => setHealthDetails(prev => prev ? {...prev, eyePowerLeft: Number(e.target.value)} : null)}
            />
          </div>

          {/* Eye Power Right */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Eye Power Right
            </Label>
            <Input 
              type="number" 
              placeholder="Enter eye power right"
              value={healthDetails?.eyePowerRight || ""}
              onChange={(e) => setHealthDetails(prev => prev ? {...prev, eyePowerRight: Number(e.target.value)} : null)}
            />
          </div>

          {/* Height */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Diameter className="w-5 h-5 text-blue-600" />
              Height
            </Label>
            <Input 
              type="number" 
              placeholder="Enter height"
              value={healthDetails?.height || ""}
              onChange={(e) => setHealthDetails(prev => prev ? {...prev, height: Number(e.target.value)} : null)}
            />
          </div>

          {/* Width */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Diameter className="w-5 h-5 text-blue-600" />
              Width
            </Label>
            <Input 
              type="number" 
              placeholder="Enter width"
              value={healthDetails?.width || ""}
              onChange={(e) => setHealthDetails(prev => prev ? {...prev, width: Number(e.target.value)} : null)}
            />
          </div>

          {/* Past Medical History */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Past Medical History
            </Label>
            <Input 
              type="text" 
              placeholder="Enter past medical history"
              value={healthDetails?.pastMedicalHistory || ""}
              onChange={(e) => setHealthDetails(prev => prev ? {...prev, pastMedicalHistory: e.target.value} : null)}
            />
          </div>

          {/* Past Surgical History */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Past Surgical History
            </Label>
            <Input 
              type="text" 
              placeholder="Enter past surgical history"
              value={healthDetails?.pastSurgicalHistory || ""}
              onChange={(e) => setHealthDetails(prev => prev ? {...prev, pastSurgicalHistory: e.target.value} : null)}
            />
          </div>

          {/* Drug Allergy */}
          <div className="mt-4">
            <Label className="flex items-center gap-2">
              <Syringe className="w-5 h-5 text-blue-600" />
              Drug Allergy
            </Label>
            <Input 
              type="text" 
              placeholder="Enter drug allergy"
              value={healthDetails?.drugAllergy || ""}
              onChange={(e) => setHealthDetails(prev => prev ? {...prev, drugAllergy: e.target.value} : null)}
            />
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
