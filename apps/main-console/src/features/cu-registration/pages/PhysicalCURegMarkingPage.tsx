import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, User, CheckCircle, XCircle, Clock, UserCheck } from "lucide-react";
import axiosInstance from "@/utils/api";
import { fetchStudentByUid } from "@/services/student";
import { getUserById } from "@/services/user";

interface CuRegistrationData {
  id: number;
  studentName: string;
  studentUid: string;
  programCourseName: string;
  cuRegistrationApplicationNumber: string;
  status: string;
  physicalRegistrationDone: boolean;
  physicalRegistrationDoneAt?: string | null;
  physicalRegistrationDoneBy?: {
    id: number;
    name: string;
  } | null;
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
  const [studentStatus, setStudentStatus] = useState<{
    studentInactive: boolean;
    leavingDate?: string | null;
    leavingReason?: string | null;
    userInactive: boolean;
    userSuspended: boolean;
    suspendedTillDate?: string | null;
    suspendedReason?: string | null;
  } | null>(null);

  const formatDateTime = (d?: string | Date | null) => {
    if (!d) return "";
    try {
      return new Date(d).toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return String(d);
    }
  };

  const isBlocked = Boolean(
    studentStatus &&
      (studentStatus.studentInactive ||
        studentStatus.userInactive ||
        studentStatus.userSuspended ||
        !!studentStatus.leavingDate),
  );

  const handleSearch = async () => {
    if (!studentUid.trim()) {
      setError("Please enter a student UID");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setCuRegistrationData([]);
    setStudentStatus(null);

    try {
      // 1) Resolve student and linked user status first
      const student = await fetchStudentByUid(studentUid.trim());
      if (student) {
        try {
          const resp = await getUserById(student.userId as number);
          type UserStatus = {
            isActive?: boolean;
            isSuspended?: boolean;
            suspendedTillDate?: string | null;
            suspendedReason?: string | null;
          };
          const usr = (resp?.payload ?? null) as UserStatus | null;
          setStudentStatus({
            studentInactive: student.active === false,
            leavingDate: (student.leavingDate as unknown as string) || null,
            leavingReason: (student.leavingReason as unknown as string) || null,
            userInactive: usr?.isActive === false,
            userSuspended: usr?.isSuspended === true,
            suspendedTillDate: usr?.suspendedTillDate ?? null,
            suspendedReason: usr?.suspendedReason ?? null,
          });
        } catch {
          // Proceed even if user status fails
          setStudentStatus({
            studentInactive: student.active === false,
            leavingDate: (student.leavingDate as unknown as string) || null,
            leavingReason: (student.leavingReason as unknown as string) || null,
            userInactive: false,
            userSuspended: false,
          });
        }
      }

      // 2) Fetch CU registration records
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
            physicalRegistrationDoneAt?: string | null;
            physicalRegistrationDoneBy?: {
              id: number;
              name: string;
            } | null;
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
            physicalRegistrationDoneAt: rec.physicalRegistrationDoneAt || null,
            physicalRegistrationDoneBy: rec.physicalRegistrationDoneBy || null,
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
    if (isBlocked) {
      setError("This student is not eligible for physical marking due to inactive/suspended/leaving status.");
      return;
    }
    // Find the record to check its status
    const record = cuRegistrationData.find((r) => r.id === correctionRequestId);

    // Check if status is REQUEST_CORRECTION - show alert and return early
    if (record && record.status === "REQUEST_CORRECTION") {
      setError("Rectification request is still pending. Physical submission will be allowed only after rectification.");
      return;
    }

    // Check if status is PENDING - show alert and return early
    if (record && record.status === "PENDING") {
      setError(
        `Cannot mark physical registration as done. Status is "PENDING". Please wait for the registration status to be updated.`,
      );
      return;
    }

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
              ? {
                  ...record,
                  physicalRegistrationDone: true,
                  status: "PHYSICAL_REGISTRATION_DONE",
                  physicalRegistrationDoneAt:
                    response.data.payload?.correctionRequest?.physicalRegistrationDoneAt || new Date().toISOString(),
                  physicalRegistrationDoneBy:
                    response.data.payload?.correctionRequest?.physicalRegistrationDoneBy || null,
                }
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

        {studentStatus && isBlocked && (
          <Alert className="mb-6" variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {studentStatus.userInactive && <div>User status: Inactive</div>}
                {studentStatus.userSuspended && (
                  <div>
                    Suspended
                    {studentStatus.suspendedTillDate ? ` till ${formatDateTime(studentStatus.suspendedTillDate)}` : ""}
                    {studentStatus.suspendedReason ? ` — ${studentStatus.suspendedReason}` : ""}
                  </div>
                )}
                {studentStatus.studentInactive && <div>Student record marked as inactive</div>}
                {!!studentStatus.leavingDate && (
                  <div>
                    Leaving date: {formatDateTime(studentStatus.leavingDate)}
                    {studentStatus.leavingReason ? ` — ${studentStatus.leavingReason}` : ""}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {cuRegistrationData.length > 0 && !isBlocked && (
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
                            <span className="font-medium">CU Form No:</span> {record.cuRegistrationApplicationNumber}
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
                            className={
                              record.status === "PENDING" || record.status === "REQUEST_CORRECTION"
                                ? "bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            }
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
                          <div className="flex flex-col items-end text-green-600">
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2" />
                              <span className="text-sm font-medium">Completed</span>
                            </div>
                            {record.physicalRegistrationDoneAt && (
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(record.physicalRegistrationDoneAt).toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            )}
                            {record.physicalRegistrationDoneBy && (
                              <div className="text-xs text-gray-500">by {record.physicalRegistrationDoneBy.name}</div>
                            )}
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
