import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, User, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";
import axiosInstance from "@/utils/api";

interface CuRegistrationData {
  id: number;
  studentName: string;
  studentUid: string;
  programCourseName: string;
  cuRegistrationApplicationNumber: string;
  status: string;
  physicalRegistrationDone: boolean;
  createdAt: string;
  isMAOrMCOM?: boolean;
}

export default function PhysicalCURegMarkingPage() {
  const [studentUid, setStudentUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [cuRegistrationData, setCuRegistrationData] = useState<CuRegistrationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [markingPhysical, setMarkingPhysical] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!studentUid.trim()) {
      setError("Please enter a student UID");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setCuRegistrationData([]);

    try {
      const response = await axiosInstance.get(
        `/api/admissions/cu-registration-correction-requests/student-uid/${studentUid.trim()}`,
      );

      console.log("API Response:", response.data);

      if (response.data.httpStatus === "SUCCESS" && response.data.payload) {
        // Transform the API response to match our interface
        const transformedData: CuRegistrationData[] = response.data.payload.map((record: unknown) => {
          const rec = record as {
            id: number;
            student?: {
              uid?: string;
              user?: { name?: string };
              programCourseName?: string;
            };
            cuRegistrationApplicationNumber?: string;
            status?: string;
            physicalRegistrationDone?: boolean;
            createdAt?: string;
          };

          // Check if program course is MA or MCOM (case insensitive)
          const programCourseName = rec.student?.programCourseName || "Unknown";
          const normalizedProgramName = programCourseName
            .normalize("NFKD")
            .replace(/[^A-Za-z]/g, "")
            .toUpperCase();

          const isMAOrMCOM = normalizedProgramName.startsWith("MA") || normalizedProgramName.startsWith("MCOM");

          return {
            id: rec.id,
            studentName: rec.student?.user?.name || "Unknown",
            studentUid: rec.student?.uid || "",
            programCourseName: isMAOrMCOM ? "CU Registration Process Not Applicable" : programCourseName,
            cuRegistrationApplicationNumber: rec.cuRegistrationApplicationNumber || "N/A",
            status: rec.status || "",
            physicalRegistrationDone: rec.physicalRegistrationDone || false,
            createdAt: rec.createdAt || "",
            isMAOrMCOM, // Add this flag for UI logic
          };
        });

        setCuRegistrationData(transformedData);
        setSuccess(`Found ${transformedData.length} CU registration record(s)`);
      } else {
        setError("No CU registration data found for this student UID");
      }
    } catch (err: unknown) {
      console.error("Error fetching CU registration data:", err);
      setError("Failed to fetch CU registration data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPhysicalDone = async (correctionRequestId: number) => {
    setMarkingPhysical(correctionRequestId);
    setError(null);
    setSuccess(null);

    try {
      const response = await axiosInstance.patch(
        `/api/admissions/cu-registration-correction-requests/${correctionRequestId}/mark-physical-done`,
      );

      if (response.data.httpStatus === "SUCCESS") {
        setSuccess("Physical registration marked as done successfully!");

        // Update local state immediately to prevent blinking
        setCuRegistrationData((prevData) =>
          prevData.map((record) =>
            record.id === correctionRequestId
              ? { ...record, physicalRegistrationDone: true, status: "PHYSICAL_REGISTRATION_DONE" }
              : record,
          ),
        );
      } else {
        setError("Failed to mark physical registration as done");
      }
    } catch (err: unknown) {
      console.error("Error marking physical registration:", err);

      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
        setError(`Failed to mark physical registration: ${axiosError.response?.data?.message || "Server error"}`);
      } else {
        setError("Failed to mark physical registration as done. Please try again.");
      }
    } finally {
      setMarkingPhysical(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Physical CU Registration Marking</h1>
          <p className="text-gray-600 mt-2">Mark physical registration completion for students</p>
        </div>

        {/* Search Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Student
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="studentUid">Student UID</Label>
                <Input
                  id="studentUid"
                  type="text"
                  placeholder="Enter student UID (e.g., 0804250001)"
                  value={studentUid}
                  onChange={(e) => setStudentUid(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  disabled={loading || !studentUid.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6" variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {cuRegistrationData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                CU Registration Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cuRegistrationData.map((record) => (
                  <div
                    key={record.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{record.studentName}</h3>
                          <Badge variant="outline">{record.studentUid}</Badge>
                          <Badge
                            variant={
                              record.isMAOrMCOM
                                ? "secondary"
                                : record.physicalRegistrationDone
                                  ? "default"
                                  : "secondary"
                            }
                            className={
                              record.isMAOrMCOM
                                ? "bg-orange-100 text-orange-800 border-orange-200"
                                : record.physicalRegistrationDone
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }
                          >
                            {record.isMAOrMCOM ? (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Not Applicable
                              </>
                            ) : record.physicalRegistrationDone ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Physical Done
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Program:</span> {record.programCourseName}
                          </div>
                          <div>
                            <span className="font-medium">Application No:</span>{" "}
                            {record.cuRegistrationApplicationNumber}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span> {record.status}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {record.isMAOrMCOM ? (
                          <div className="flex items-center text-orange-600">
                            <XCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Not Applicable</span>
                          </div>
                        ) : !record.physicalRegistrationDone ? (
                          <Button
                            onClick={() => handleMarkPhysicalDone(record.id)}
                            disabled={markingPhysical !== null}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            {markingPhysical === record.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Marking...
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Mark Physical Done
                              </>
                            )}
                          </Button>
                        ) : (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            <span className="text-sm font-medium">Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
