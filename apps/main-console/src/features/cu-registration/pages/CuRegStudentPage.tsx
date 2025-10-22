import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import SubjectSelectionForm from "../components/SubjectSelectionForm";
import CuRegistrationForm from "../components/CuRegistrationForm";
import { fetchStudentByUid } from "@/services/student";
import { StudentDto } from "@repo/db/dtos/user";

export default function CuRegStudentPage() {
  const { uid } = useParams<{ uid: string }>();
  const [activeTab, setActiveTab] = useState("subject-selection");
  const [studentData, setStudentData] = useState<StudentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!uid) {
        setError("Student UID is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await fetchStudentByUid(uid);
        setStudentData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch student by UID:", err);
        setError("Failed to load student data. Please try again.");
        setStudentData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [uid]);

  return (
    <div className="p-6 space-y-6">
      {/* Student Information Card */}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="subject-selection" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subject Selection
          </TabsTrigger>
          <TabsTrigger value="cu-registration" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            CU Registration
          </TabsTrigger>
        </TabsList>

        {/* Subject Selection Tab */}
        <TabsContent value="subject-selection" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading subject selection data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-red-600 mb-4">Error: {error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </div>
          ) : studentData ? (
            <SubjectSelectionForm uid={studentData.uid} />
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-slate-600">No student data available</p>
            </div>
          )}
        </TabsContent>

        {/* CU Registration Tab */}
        <TabsContent value="cu-registration" className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading CU registration data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-red-600 mb-4">Error: {error}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </div>
          ) : studentData?.id ? (
            <CuRegistrationForm studentId={studentData.id} studentData={studentData} />
          ) : (
            <div className="flex items-center justify-center p-8">
              <p className="text-slate-600">No student data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
