import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, GraduationCap, Search } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import SubjectSelectionForm from "../components/SubjectSelectionForm";
import CuRegistrationForm from "../components/CuRegistrationForm";
import { fetchStudentByUid } from "@/services/student";
import { StudentDto } from "@repo/db/dtos/user";

export default function CuRegStudentPage() {
  const { uid } = useParams<{ uid: string }>();
  const [activeTab, setActiveTab] = useState("subject-selection");
  const [studentData, setStudentData] = useState<StudentDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchUid, setSearchUid] = useState(uid || "");
  const [isSearching, setIsSearching] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);

  const handleSearch = useCallback(async (uid: string) => {
    if (!uid.trim() || uid.length !== 10 || !/^\d{10}$/.test(uid)) {
      return; // Only search for valid 10-digit UIDs
    }

    setIsSearching(true);
    setError(null);
    setStudentData(null);

    try {
      const data = await fetchStudentByUid(uid.trim());
      setStudentData(data);
      setError(null);
      setIsFormLoading(true); // Set form loading when student is found
    } catch (err) {
      console.error("Failed to fetch student by UID:", err);
      setError("Student not found. Please check the UID and try again.");
      setStudentData(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (uid) {
      setSearchUid(uid);
      handleSearch(uid);
    }
  }, [uid, handleSearch]);

  // Auto-search when UID changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchUid && searchUid.length === 10 && /^\d{10}$/.test(searchUid)) {
        handleSearch(searchUid);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchUid, handleSearch]);

  // Auto-hide form loading after 10 seconds
  useEffect(() => {
    if (isFormLoading) {
      const timer = setTimeout(() => {
        setIsFormLoading(false);
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timer);
    }
  }, [isFormLoading]);

  return (
    <div className="p-6 space-y-6">
      {/* Student Search Form */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-blue-600" />
            Student UID
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Input
                id="student-uid"
                type="text"
                placeholder="Enter 10-digit student UID (e.g., 0804250001)"
                value={searchUid}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ""); // Only allow digits
                  if (value.length <= 10) {
                    setSearchUid(value);
                  }
                }}
                disabled={isSearching}
                className="mt-1 h-10"
                maxLength={10}
              />
              {isSearching && (
                <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Searching for student...
                </div>
              )}
            </div>

            {error && !studentData && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs - Only show when student is found */}
      {studentData && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-start mb-6">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <TabsTrigger value="subject-selection" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Subject Selection
              </TabsTrigger>
              <TabsTrigger value="cu-registration" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                CU Registration
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Subject Selection Tab */}
          <TabsContent value="subject-selection" className="space-y-6">
            {isSearching ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading subject selection data...</p>
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
            {isSearching || isFormLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading CU registration data...</p>
                  <p className="text-slate-500 text-sm mt-2">
                    {isSearching ? "Searching for student..." : "Loading form data and documents..."}
                  </p>
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
      )}
    </div>
  );
}
