import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, FileText, Edit3, BookOpen, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import SubjectSelectionForm from "../components/SubjectSelectionForm";
import { fetchStudentByUid } from "@/services/student";
import { StudentDto } from "@repo/db/dtos/user";

export default function CuRegStudentPage() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
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

  // Mock CU Registration form data (similar to student console form)
  const cuRegistrationData = {
    personalInfo: {
      fullName: "John Doe",
      parentName: "Robert Doe",
      gender: "Male",
      nationality: "Indian",
      aadhaarNumber: "1234 5678 9012",
      apaarId: "APAAR123456789",
    },
    addressData: {
      residential: {
        addressLine: "123 Main Street, Park Avenue",
        city: "Kolkata",
        district: "Kolkata",
        policeStation: "Park Street",
        postOffice: "Park Street",
        state: "West Bengal",
        country: "India",
        pinCode: "700016",
      },
      mailing: {
        addressLine: "123 Main Street, Park Avenue",
        city: "Kolkata",
        district: "Kolkata",
        policeStation: "Park Street",
        postOffice: "Park Street",
        state: "West Bengal",
        country: "India",
        pinCode: "700016",
      },
    },
    documents: {
      classXIIMarksheet: "uploaded",
      aadhaarCard: "uploaded",
      apaarId: "uploaded",
      fatherId: "uploaded",
      motherId: "uploaded",
      ewsCertificate: "not-applicable",
    },
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "corrections":
        return <Badge className="bg-orange-100 text-orange-800">Corrections Required</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/dashboard/cu-registration")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Student Details</h1>
            {loading ? (
              <p className="text-slate-600">Loading student data...</p>
            ) : error ? (
              <p className="text-red-600">Error: {error}</p>
            ) : studentData ? (
              <p className="text-slate-600">
                UID: {studentData.uid} •{" "}
                {studentData.personalDetails
                  ? `${studentData.personalDetails.firstName} ${studentData.personalDetails.middleName || ""} ${studentData.personalDetails.lastName || ""}`.trim()
                  : "Unknown"}
              </p>
            ) : (
              <p className="text-slate-600">No student data available</p>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          {studentData && getStatusBadge("submitted")}
          <Button variant="outline" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Edit Details
          </Button>
        </div>
      </div>

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
                        <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                          {cuRegistrationData.personalInfo.fullName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.2 Parent/Guardian Name</label>
                        <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                          {cuRegistrationData.personalInfo.parentName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.3 Gender</label>
                        <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                          {cuRegistrationData.personalInfo.gender}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.4 Nationality</label>
                        <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                          {cuRegistrationData.personalInfo.nationality}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.5 Aadhaar Number</label>
                        <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                          {cuRegistrationData.personalInfo.aadhaarNumber}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-600">1.6 APAAR ID</label>
                        <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                          {cuRegistrationData.personalInfo.apaarId}
                        </p>
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
                        <p className="text-slate-800 bg-gray-50 p-2 rounded border min-h-[60px]">
                          {cuRegistrationData.addressData.residential.addressLine}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.2 City</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.residential.city}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.3 District</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.residential.district}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.4 Police Station</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.residential.policeStation}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.5 Post Office</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.residential.postOffice}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.6 State</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.residential.state}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.7 Country</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.residential.country}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">2.8 Pin Code</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.residential.pinCode}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mailing Address */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-800">Mailing Address</h3>
                      <div>
                        <label className="text-sm font-medium text-slate-600">3.1 Address Line</label>
                        <p className="text-slate-800 bg-gray-50 p-2 rounded border min-h-[60px]">
                          {cuRegistrationData.addressData.mailing.addressLine}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.2 City</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.mailing.city}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.3 District</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.mailing.district}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.4 Police Station</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.mailing.policeStation}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.5 Post Office</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.mailing.postOffice}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.6 State</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.mailing.state}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.7 Country</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.mailing.country}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">3.8 Pin Code</label>
                          <p className="text-slate-800 bg-gray-50 p-2 rounded border">
                            {cuRegistrationData.addressData.mailing.pinCode}
                          </p>
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
