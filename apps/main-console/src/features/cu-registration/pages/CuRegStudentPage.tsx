import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, BookOpen, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import SubjectSelectionForm from "../components/SubjectSelectionForm";
import { fetchStudentByUid } from "@/services/student";
import { StudentDto } from "@repo/db/dtos/user";
import { getUserById } from "@/services/user";
import { UserAvatar } from "@/hooks/UserAvatar";

export default function CuRegStudentPage() {
  const { uid } = useParams<{ uid: string }>();
  const [activeTab, setActiveTab] = useState("subject-selection");
  const [studentData, setStudentData] = useState<StudentDto | null>(null);
  const [userName, setUserName] = useState<string | undefined>(undefined);
  const [userImage, setUserImage] = useState<string | undefined>(undefined);
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const display = (v?: string | null) => (v && String(v).trim().length > 0 ? String(v) : "—");
  const valueClass = "text-slate-800 bg-gray-50 p-2 rounded border min-h-[40px] flex items-center";

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

        // Provisional name from personalDetails
        const first = data?.personalDetails?.firstName || "";
        const middle = data?.personalDetails?.middleName || "";
        const last = data?.personalDetails?.lastName || "";
        const fromPersonal = `${first} ${middle} ${last}`.replace(/\s+/g, " ").trim();
        if (fromPersonal) setDisplayName(fromPersonal);

        // fetch linked user for official name/photo
        if (data?.userId) {
          const res = await getUserById(data.userId);
          console.log("res", res);
          const nm = res.payload?.name;
          if (nm && nm.trim()) setDisplayName(nm.trim());
          setUserName(nm || undefined);
          setUserImage(res.payload?.image || undefined);
        }

        // Ensure some value is present to avoid blank cell
        setDisplayName((prev) => prev || "N/A");
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

  // Build CU Registration display data from real student data
  const cuRegistrationData = {
    personalInfo: {
      fullName: displayName || "",
      parentName: "",
      gender: studentData?.personalDetails?.gender || "",
      nationality:
        studentData?.personalDetails?.nationality?.name || studentData?.personalDetails?.otherNationality || "",
      aadhaarNumber: studentData?.personalDetails?.aadhaarCardNumber || "",
      apaarId: studentData?.apaarId || studentData?.personalDetails?.aadhaarCardNumber || "",
    },
    addressData: {
      residential: {
        addressLine: studentData?.personalDetails?.address?.[0]?.address || "",
        city: studentData?.personalDetails?.address?.[0]?.city?.name || "",
        district: studentData?.personalDetails?.address?.[0]?.district?.name || "",
        policeStation:
          studentData?.personalDetails?.address?.[0]?.policeStation?.name ||
          studentData?.personalDetails?.address?.[0]?.otherPoliceStation ||
          "",
        postOffice:
          studentData?.personalDetails?.address?.[0]?.postoffice?.name ||
          studentData?.personalDetails?.address?.[0]?.otherPostoffice ||
          "",
        state: studentData?.personalDetails?.address?.[0]?.state?.name || "",
        country: studentData?.personalDetails?.address?.[0]?.country?.name || "",
        pinCode: studentData?.personalDetails?.address?.[0]?.pincode || "",
      },
      mailing: {
        addressLine: studentData?.personalDetails?.address?.[1]?.address || "",
        city: studentData?.personalDetails?.address?.[1]?.city?.name || "",
        district: studentData?.personalDetails?.address?.[1]?.district?.name || "",
        policeStation:
          studentData?.personalDetails?.address?.[1]?.policeStation?.name ||
          studentData?.personalDetails?.address?.[1]?.otherPoliceStation ||
          "",
        postOffice:
          studentData?.personalDetails?.address?.[1]?.postoffice?.name ||
          studentData?.personalDetails?.address?.[1]?.otherPostoffice ||
          "",
        state: studentData?.personalDetails?.address?.[1]?.state?.name || "",
        country: studentData?.personalDetails?.address?.[1]?.country?.name || "",
        pinCode: studentData?.personalDetails?.address?.[1]?.pincode || "",
      },
    },
    documents: {
      classXIIMarksheet: "",
      aadhaarCard: "",
      apaarId: "",
      fatherId: "",
      motherId: "",
      ewsCertificate: "",
    },
  };

  // Note: status badge helper removed as it was unused

  return (
    <div className="p-6 space-y-6">
      {/* Student Information Card */}
      {studentData?.currentPromotion && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg">
          {/* Academic Information */}
          <div className="flex mb-4 items-start">
            <div className="mr-4 self-stretch flex items-center">
              <UserAvatar
                user={{
                  name: userName || studentData?.personalDetails?.firstName || undefined,
                  image:
                    userImage ||
                    (studentData?.uid
                      ? `https://74.207.233.48:8443/hrclIRP/studentimages/Student_Image_${studentData.uid}.jpg`
                      : undefined),
                }}
                size="lg"
                className="h-20 w-20 md:h-24 md:w-24"
              />
            </div>
            <div className="w-44 pr-2">
              <div className="text-base font-bold">Academic Year</div>
              <div className="text-base font-bold mt-1">Program Course</div>
              <div className="text-base font-bold mt-1">Student Name</div>
              <div className="text-base font-bold mt-1">UID</div>
            </div>
            <div className="w-4 pr-2">
              <div className="text-base font-bold">:</div>
              <div className="text-base font-bold mt-1">:</div>
              <div className="text-base font-bold mt-1">:</div>
              <div className="text-base font-bold mt-1">:</div>
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-blue-900">
                {studentData.currentPromotion.session?.academicYear?.year || "N/A"}
              </div>
              <div className="text-base font-bold text-blue-900 mt-1">
                {studentData.currentPromotion.programCourse?.name || "N/A"}
              </div>
              <div className="text-base font-bold text-blue-900 mt-1">{displayName || ""}</div>
              <div className="text-base font-bold text-blue-900 mt-1">{studentData.uid || "N/A"}</div>
            </div>
          </div>

          {/* Admin Notes - Always show for Subject Selection tab */}
          {activeTab === "subject-selection" && (
            <div className="flex items-start gap-3 pt-4 border-t border-blue-200">
              <div className="w-5 h-5 mt-0.5 flex-shrink-0">ℹ️</div>
              <div className="flex-1">
                <div className="text-base leading-relaxed">Changes will be logged for audit purposes.</div>
              </div>
            </div>
          )}
        </div>
      )}

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
          ) : studentData ? (
            <>
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.1 Full Name</label>
                        <p className={valueClass}>{display(cuRegistrationData.personalInfo.fullName)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.2 Parent/Guardian Name</label>
                        <p className={valueClass}>{display(cuRegistrationData.personalInfo.parentName)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.3 Gender</label>
                        <p className={valueClass}>{display(cuRegistrationData.personalInfo.gender)}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.4 Nationality</label>
                        <p className={valueClass}>{display(cuRegistrationData.personalInfo.nationality)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.5 Aadhaar Number</label>
                        <p className={valueClass}>{display(cuRegistrationData.personalInfo.aadhaarNumber)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.6 APAAR ID</label>
                        <p className={valueClass}>{display(cuRegistrationData.personalInfo.apaarId)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Residential Address */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800">Residential Address</h3>
                      <div>
                        <label className="text-sm font-medium text-slate-600">2.1 Address Line</label>
                        <p className={valueClass}>{display(cuRegistrationData.addressData.residential.addressLine)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.2 City</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.residential.city)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.3 District</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.residential.district)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.4 Police Station</label>
                          <p className={valueClass}>
                            {display(cuRegistrationData.addressData.residential.policeStation)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.5 Post Office</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.residential.postOffice)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.6 State</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.residential.state)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.7 Country</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.residential.country)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.8 Pin Code</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.residential.pinCode)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Mailing Address */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800">Mailing Address</h3>
                      <div>
                        <label className="text-sm font-medium text-slate-600">3.1 Address Line</label>
                        <p className={valueClass}>{display(cuRegistrationData.addressData.mailing.addressLine)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.2 City</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.mailing.city)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.3 District</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.mailing.district)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.4 Police Station</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.mailing.policeStation)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.5 Post Office</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.mailing.postOffice)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.6 State</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.mailing.state)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.7 Country</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.mailing.country)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.8 Pin Code</label>
                          <p className={valueClass}>{display(cuRegistrationData.addressData.mailing.pinCode)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Upload Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Upload Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium text-slate-600">
                          4.1 Class XII Original Board Marksheet
                        </span>
                        <Badge
                          className={
                            cuRegistrationData.documents.classXIIMarksheet === "uploaded"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {cuRegistrationData.documents.classXIIMarksheet === "uploaded" ? "Uploaded" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium text-slate-600">4.2 Aadhaar Card</span>
                        <Badge
                          className={
                            cuRegistrationData.documents.aadhaarCard === "uploaded"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {cuRegistrationData.documents.aadhaarCard === "uploaded" ? "Uploaded" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium text-slate-600">4.3 APAAR (ABC) ID Card</span>
                        <Badge
                          className={
                            cuRegistrationData.documents.apaarId === "uploaded"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {cuRegistrationData.documents.apaarId === "uploaded" ? "Uploaded" : "Pending"}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium text-slate-600">
                          4.4 Father's Government-issued Photo ID
                        </span>
                        <Badge
                          className={
                            cuRegistrationData.documents.fatherId === "uploaded"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {cuRegistrationData.documents.fatherId === "uploaded" ? "Uploaded" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium text-slate-600">
                          4.5 Mother's Government-issued Photo ID
                        </span>
                        <Badge
                          className={
                            cuRegistrationData.documents.motherId === "uploaded"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {cuRegistrationData.documents.motherId === "uploaded" ? "Uploaded" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <span className="text-sm font-medium text-slate-600">4.6 EWS Certificate</span>
                        <Badge
                          className={
                            cuRegistrationData.documents.ewsCertificate === "not-applicable"
                              ? "bg-gray-100 text-gray-800"
                              : cuRegistrationData.documents.ewsCertificate === "uploaded"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {cuRegistrationData.documents.ewsCertificate === "not-applicable"
                            ? "Not Applicable"
                            : cuRegistrationData.documents.ewsCertificate === "uploaded"
                              ? "Uploaded"
                              : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
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
