"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { useStudent } from "@/providers/student-provider";

interface CorrectionFlags {
  gender: boolean;
  nationality: boolean;
  apaarId: boolean;
  subjects: boolean;
}

interface PersonalInfoData {
  fullName: string;
  parentName: string;
  gender: string;
  nationality: string;
  ews: string;
  aadhaarNumber: string;
  apaarId: string;
}

interface AddressData {
  residential: {
    addressLine: string;
    city: string;
    district: string;
    policeStation: string;
    postOffice: string;
    state: string;
    country: string;
    pinCode: string;
  };
  mailing: {
    addressLine: string;
    city: string;
    district: string;
    policeStation: string;
    postOffice: string;
    state: string;
    country: string;
    pinCode: string;
  };
}

export default function CURegistrationPage() {
  const { profileInfo, loading: profileLoading } = useProfile();
  const { student } = useStudent();

  const [activeTab, setActiveTab] = useState("personal");
  const [correctionFlags, setCorrectionFlags] = useState<CorrectionFlags>({
    gender: false,
    nationality: false,
    apaarId: false,
    subjects: false,
  });
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
    fullName: "",
    parentName: "",
    gender: "",
    nationality: "",
    ews: "No",
    aadhaarNumber: "",
    apaarId: "",
  });
  const [personalDeclared, setPersonalDeclared] = useState(false);
  const [addressData, setAddressData] = useState<AddressData>({
    residential: {
      addressLine: "",
      city: "",
      district: "",
      policeStation: "",
      postOffice: "",
      state: "West Bengal",
      country: "India",
      pinCode: "",
    },
    mailing: {
      addressLine: "",
      city: "",
      district: "",
      policeStation: "",
      postOffice: "",
      state: "West Bengal",
      country: "India",
      pinCode: "",
    },
  });
  const [addressDeclared, setAddressDeclared] = useState(false);
  const [addressErrors, setAddressErrors] = useState<string[]>([]);
  const [subjectsData, setSubjectsData] = useState({
    DSCC: { sem1: "", sem2: "", sem3: "", sem4: "" },
    Minor: { sem1: "", sem2: "", sem3: "", sem4: "" },
    IDC: { sem1: "", sem2: "", sem3: "", sem4: "" },
    SEC: { sem1: "", sem2: "", sem3: "", sem4: "" },
    AEC: { sem1: "", sem2: "", sem3: "", sem4: "" },
    CVAC: { sem1: "", sem2: "", sem3: "", sem4: "" },
  });
  const [subjectsDeclared, setSubjectsDeclared] = useState(false);
  const [documents, setDocuments] = useState({
    classXIIMarksheet: null as File | null,
    aadhaarCard: null as File | null,
    apaarIdCard: null as File | null,
    fatherPhotoId: null as File | null,
    motherPhotoId: null as File | null,
    ewsCertificate: null as File | null,
  });
  const [documentsConfirmed, setDocumentsConfirmed] = useState(false);
  const [showReviewConfirm, setShowReviewConfirm] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ file: File; type: string } | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  // Populate form data when profile data is loaded
  React.useEffect(() => {
    if (profileInfo?.personalDetails) {
      const personalDetails = profileInfo.personalDetails;
      const familyDetails = profileInfo.familyDetails;

      console.log("Profile data loaded:", {
        personalDetails,
        familyDetails,
        profileInfo,
      });

      // Update personal info
      setPersonalInfo((prev) => ({
        ...prev,
        fullName:
          `${personalDetails.firstName || ""} ${personalDetails.middleName || ""} ${personalDetails.lastName || ""}`.trim(),
        parentName: familyDetails?.father?.name || familyDetails?.mother?.name || "",
        gender: personalDetails.gender || "",
        nationality: personalDetails.nationality?.name || "",
        aadhaarNumber: personalDetails.aadhaarCardNumber || "XXXX XXXX XXXX",
        apaarId: "", // APAAR ID is not in PersonalDetailsT, will be handled separately
      }));

      // Update address data
      if (personalDetails.residentialAddress) {
        setAddressData((prev) => ({
          ...prev,
          residential: {
            addressLine: personalDetails.residentialAddress?.addressLine || "",
            city: personalDetails.residentialAddress?.city?.name || "",
            district: personalDetails.residentialAddress?.district?.name || "",
            policeStation: (personalDetails.residentialAddress as any)?.otherPoliceStation || "",
            postOffice: (personalDetails.residentialAddress as any)?.otherPostoffice || "",
            state: personalDetails.residentialAddress?.state?.name || "West Bengal",
            country: personalDetails.residentialAddress?.country?.name || "India",
            pinCode: (personalDetails.residentialAddress as any)?.pincode || "",
          },
        }));
      }

      if (personalDetails.mailingAddress) {
        setAddressData((prev) => ({
          ...prev,
          mailing: {
            addressLine: personalDetails.mailingAddress?.addressLine || "",
            city: personalDetails.mailingAddress?.city?.name || "",
            district: personalDetails.mailingAddress?.district?.name || "",
            policeStation: (personalDetails.mailingAddress as any)?.otherPoliceStation || "",
            postOffice: (personalDetails.mailingAddress as any)?.otherPostoffice || "",
            state: personalDetails.mailingAddress?.state?.name || "West Bengal",
            country: personalDetails.mailingAddress?.country?.name || "India",
            pinCode: (personalDetails.mailingAddress as any)?.pincode || "",
          },
        }));
      }
    }
  }, [profileInfo]);

  const handleCorrectionToggle = (field: keyof CorrectionFlags) => {
    setCorrectionFlags((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePersonalInfoChange = (field: keyof PersonalInfoData, value: string) => {
    setPersonalInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (type: "residential" | "mailing", field: string, value: string) => {
    setAddressData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const handleDeclarationChange = (checked: boolean) => {
    setPersonalDeclared(checked);

    if (checked) {
      toast.success("Personal Info Declared", {
        description: "You can now proceed to the Address Info tab.",
        duration: 3000,
      });

      // Automatically switch to Address tab after a short delay
      setTimeout(() => {
        setActiveTab("address");
      }, 1000);
    }
  };

  const getDeclarationText = () => {
    const hasCorrections = Object.values(correctionFlags).some((flag) => flag);
    if (hasCorrections) {
      return "I declare that the information in Personal Info is accurate. Note: Corrections will be reviewed by staff.";
    }
    return "I declare that the information in Personal Info is accurate.";
  };

  const isPersonalTabValid = () => {
    return personalDeclared;
  };

  const validateAddressFields = () => {
    const errors: string[] = [];
    const { residential, mailing } = addressData;

    // Check residential address fields
    if (!residential.addressLine.trim()) errors.push("Residential Address Line");
    if (!residential.city.trim()) errors.push("Residential City");
    if (!residential.district.trim()) errors.push("Residential District");
    if (!residential.policeStation.trim()) errors.push("Residential Police Station");
    if (!residential.postOffice.trim()) errors.push("Residential Post Office");
    if (!residential.pinCode.trim()) errors.push("Residential Pin Code");

    // Check mailing address fields
    if (!mailing.addressLine.trim()) errors.push("Mailing Address Line");
    if (!mailing.city.trim()) errors.push("Mailing City");
    if (!mailing.district.trim()) errors.push("Mailing District");
    if (!mailing.policeStation.trim()) errors.push("Mailing Police Station");
    if (!mailing.postOffice.trim()) errors.push("Mailing Post Office");
    if (!mailing.pinCode.trim()) errors.push("Mailing Pin Code");

    setAddressErrors(errors);
    return errors.length === 0;
  };

  const handleAddressDeclarationChange = (checked: boolean) => {
    setAddressDeclared(checked);

    if (checked) {
      const isValid = validateAddressFields();
      if (isValid) {
        toast.success("Address Info Declared", {
          description: "You can now proceed to the Subjects Overview tab.",
          duration: 3000,
        });

        // Automatically switch to Subjects tab after a short delay
        setTimeout(() => {
          setActiveTab("subjects");
        }, 1000);
      }
    }
  };

  const isAddressTabValid = () => {
    return addressDeclared && addressErrors.length === 0;
  };

  const handleSubjectChange = (category: string, semester: string, value: string) => {
    setSubjectsData((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [semester]: value,
      },
    }));
  };

  const handleSubjectsDeclarationChange = (checked: boolean) => {
    setSubjectsDeclared(checked);

    if (checked) {
      toast.success("Subjects Overview Declared", {
        description: "You can now proceed to the Documents tab.",
        duration: 3000,
      });

      // Automatically switch to Documents tab after a short delay
      setTimeout(() => {
        setActiveTab("documents");
      }, 1000);
    }
  };

  const isSubjectsTabValid = () => {
    return subjectsDeclared;
  };

  const handleFileUpload = (documentType: keyof typeof documents, file: File | null) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: file,
    }));
  };

  const handleFilePreview = (file: File) => {
    const fileType = file.type.startsWith("image/") ? "image" : "pdf";
    setPreviewFile({ file, type: fileType });
    setPreviewDialogOpen(true);
  };

  const getFilePreviewUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  const getRequiredDocuments = () => {
    const required = ["classXIIMarksheet", "fatherPhotoId", "motherPhotoId"];

    // Add Aadhaar or APAAR based on personal info
    if (personalInfo.aadhaarNumber && personalInfo.aadhaarNumber !== "XXXX XXXX XXXX") {
      required.push("aadhaarCard");
    } else {
      required.push("apaarIdCard");
    }

    // Add EWS certificate if EWS is Yes
    if (personalInfo.ews === "Yes") {
      required.push("ewsCertificate");
    }

    return required;
  };

  const getMissingDocuments = () => {
    const required = getRequiredDocuments();
    return required.filter((doc) => !documents[doc as keyof typeof documents]);
  };

  const isDocumentsTabValid = () => {
    return documentsConfirmed && getMissingDocuments().length === 0;
  };

  const canReviewConfirm = () => {
    return isPersonalTabValid() && isAddressTabValid() && isSubjectsTabValid() && isDocumentsTabValid();
  };

  const handleReviewConfirm = () => {
    if (canReviewConfirm()) {
      setShowReviewConfirm(true);
    }
  };

  const canNavigateToTab = (tabName: string) => {
    switch (tabName) {
      case "personal":
        return true;
      case "address":
        return isPersonalTabValid();
      case "subjects":
        return isPersonalTabValid() && isAddressTabValid();
      case "documents":
        return isPersonalTabValid() && isAddressTabValid() && isSubjectsTabValid();
      default:
        return false;
    }
  };

  // Show loading state while profile data is being fetched
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Calcutta University - Registration</h1>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-lg border border-gray-200 bg-white rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 bg-white">
                <div className="flex w-full">
                  <button
                    onClick={() => setActiveTab("personal")}
                    disabled={!canNavigateToTab("personal")}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === "personal"
                        ? "text-blue-600 border-blue-600 bg-transparent"
                        : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                    } ${!canNavigateToTab("personal") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    Personal Info
                  </button>
                  <button
                    onClick={() => setActiveTab("address")}
                    disabled={!canNavigateToTab("address")}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === "address"
                        ? "text-blue-600 border-blue-600 bg-transparent"
                        : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                    } ${!canNavigateToTab("address") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    Address Info
                  </button>
                  <button
                    onClick={() => setActiveTab("subjects")}
                    disabled={!canNavigateToTab("subjects")}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === "subjects"
                        ? "text-blue-600 border-blue-600 bg-transparent"
                        : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                    } ${!canNavigateToTab("subjects") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    Subjects Overview
                  </button>
                  <button
                    onClick={() => setActiveTab("documents")}
                    disabled={!canNavigateToTab("documents")}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === "documents"
                        ? "text-blue-600 border-blue-600 bg-transparent"
                        : "text-gray-500 hover:text-gray-700 bg-transparent border-transparent"
                    } ${!canNavigateToTab("documents") ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    Documents
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 bg-white">
                {/* Personal Info Tab */}
                <TabsContent value="personal" className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Name</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                          1.1 Full name
                        </Label>
                        <Input
                          id="fullName"
                          value={personalInfo.fullName}
                          className="bg-gray-50 text-gray-600 border-gray-300"
                          readOnly
                        />
                      </div>

                      {/* Father/Mother Name */}
                      <div className="space-y-2">
                        <Label htmlFor="parentName" className="text-sm font-medium text-gray-700">
                          1.2 Father / Mother's Name
                        </Label>
                        <Input
                          id="parentName"
                          value={personalInfo.parentName}
                          className="bg-gray-50 text-gray-600 border-gray-300"
                          readOnly
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">1.3 Gender</Label>
                        <div className="flex flex-col gap-2">
                          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm">
                            {personalInfo.gender}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">1.3 Request correction</span>
                            <Switch
                              checked={correctionFlags.gender}
                              onCheckedChange={() => handleCorrectionToggle("gender")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Nationality */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">1.4 Nationality</Label>
                        <div className="flex flex-col gap-2">
                          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm">
                            {personalInfo.nationality}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">1.4 Request correction</span>
                            <Switch
                              checked={correctionFlags.nationality}
                              onCheckedChange={() => handleCorrectionToggle("nationality")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* EWS */}
                      <div className="space-y-2">
                        <Label htmlFor="ews" className="text-sm font-medium text-gray-700">
                          1.5 Whether belong to EWS
                        </Label>
                        <Select
                          value={personalInfo.ews}
                          onValueChange={(value) => handlePersonalInfoChange("ews", value)}
                        >
                          <SelectTrigger className="w-full border-gray-300">
                            <SelectValue placeholder="Select EWS status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Aadhaar Number */}
                      <div className="space-y-2">
                        <Label htmlFor="aadhaarNumber" className="text-sm font-medium text-gray-700">
                          1.6 Aadhaar Number
                        </Label>
                        <Input
                          id="aadhaarNumber"
                          value={personalInfo.aadhaarNumber}
                          className="bg-gray-50 text-gray-600 border-gray-300"
                          readOnly
                        />
                      </div>

                      {/* APAAR ID */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="apaarId" className="text-sm font-medium text-gray-700">
                          1.7 APAAR (ABC) ID
                        </Label>
                        <div className="flex flex-col gap-2">
                          <Input
                            id="apaarId"
                            value={personalInfo.apaarId}
                            onChange={(e) => handlePersonalInfoChange("apaarId", e.target.value)}
                            placeholder="Enter APAAR ID"
                            className={`w-full border-gray-300 ${correctionFlags.apaarId ? "bg-white" : "bg-gray-50 text-gray-600"}`}
                            readOnly={!correctionFlags.apaarId}
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">1.7 Request correction</span>
                            <Switch
                              checked={correctionFlags.apaarId}
                              onCheckedChange={() => handleCorrectionToggle("apaarId")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Declaration */}
                      <div className="pt-2 md:col-span-2">
                        <div className="flex items-start space-x-3">
                          <Checkbox
                            id="personalDeclaration"
                            checked={personalDeclared}
                            onCheckedChange={handleDeclarationChange}
                            className="mt-1"
                          />
                          <Label
                            htmlFor="personalDeclaration"
                            className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                          >
                            {getDeclarationText()}
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Address Info Tab */}
                <TabsContent value="address" className="space-y-6">
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      {/* Residential Address */}
                      <div className="space-y-4 lg:pr-8 lg:border-r lg:border-gray-200">
                        <h3 className="text-base font-medium text-gray-900">Residential Address</h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="residential-address" className="text-sm font-medium text-gray-700">
                              2.1 Address Line
                            </Label>
                            <Textarea
                              id="residential-address"
                              value={addressData.residential.addressLine}
                              onChange={(e) => handleAddressChange("residential", "addressLine", e.target.value)}
                              placeholder="Enter address line"
                              className="border-gray-300 min-h-[80px]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="residential-city" className="text-sm font-medium text-gray-700">
                                2.2 City
                              </Label>
                              <Input
                                id="residential-city"
                                value={addressData.residential.city}
                                onChange={(e) => handleAddressChange("residential", "city", e.target.value)}
                                placeholder="Enter city"
                                className="border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="residential-district" className="text-sm font-medium text-gray-700">
                                2.3 District
                              </Label>
                              <Input
                                id="residential-district"
                                value={addressData.residential.district}
                                onChange={(e) => handleAddressChange("residential", "district", e.target.value)}
                                placeholder="Enter district"
                                className="border-gray-300"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="residential-police" className="text-sm font-medium text-gray-700">
                                2.4 Police Station
                              </Label>
                              <Input
                                id="residential-police"
                                value={addressData.residential.policeStation}
                                onChange={(e) => handleAddressChange("residential", "policeStation", e.target.value)}
                                placeholder="Enter police station"
                                className="border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="residential-post" className="text-sm font-medium text-gray-700">
                                2.5 Post Office
                              </Label>
                              <Input
                                id="residential-post"
                                value={addressData.residential.postOffice}
                                onChange={(e) => handleAddressChange("residential", "postOffice", e.target.value)}
                                placeholder="Enter post office"
                                className="border-gray-300"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="residential-state" className="text-sm font-medium text-gray-700">
                                2.6 State
                              </Label>
                              <Input
                                id="residential-state"
                                value={addressData.residential.state}
                                className="bg-gray-50 text-gray-600 border-gray-300"
                                readOnly
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="residential-country" className="text-sm font-medium text-gray-700">
                                2.7 Country
                              </Label>
                              <Input
                                id="residential-country"
                                value={addressData.residential.country}
                                className="bg-gray-50 text-gray-600 border-gray-300"
                                readOnly
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="residential-pin" className="text-sm font-medium text-gray-700">
                                2.8 Pin Code
                              </Label>
                              <Input
                                id="residential-pin"
                                value={addressData.residential.pinCode}
                                onChange={(e) => handleAddressChange("residential", "pinCode", e.target.value)}
                                placeholder="Enter pin code"
                                className="border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mailing Address */}
                      <div className="space-y-4 lg:pl-8">
                        <h3 className="text-base font-medium text-gray-900">Mailing Address</h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="mailing-address" className="text-sm font-medium text-gray-700">
                              2.9 Address Line
                            </Label>
                            <Textarea
                              id="mailing-address"
                              value={addressData.mailing.addressLine}
                              onChange={(e) => handleAddressChange("mailing", "addressLine", e.target.value)}
                              placeholder="Enter address line"
                              className="border-gray-300 min-h-[80px]"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="mailing-city" className="text-sm font-medium text-gray-700">
                                2.10 City
                              </Label>
                              <Input
                                id="mailing-city"
                                value={addressData.mailing.city}
                                onChange={(e) => handleAddressChange("mailing", "city", e.target.value)}
                                placeholder="Enter city"
                                className="border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mailing-district" className="text-sm font-medium text-gray-700">
                                2.11 District
                              </Label>
                              <Input
                                id="mailing-district"
                                value={addressData.mailing.district}
                                onChange={(e) => handleAddressChange("mailing", "district", e.target.value)}
                                placeholder="Enter district"
                                className="border-gray-300"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="mailing-police" className="text-sm font-medium text-gray-700">
                                2.12 Police Station
                              </Label>
                              <Input
                                id="mailing-police"
                                value={addressData.mailing.policeStation}
                                onChange={(e) => handleAddressChange("mailing", "policeStation", e.target.value)}
                                placeholder="Enter police station"
                                className="border-gray-300"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mailing-post" className="text-sm font-medium text-gray-700">
                                2.13 Post Office
                              </Label>
                              <Input
                                id="mailing-post"
                                value={addressData.mailing.postOffice}
                                onChange={(e) => handleAddressChange("mailing", "postOffice", e.target.value)}
                                placeholder="Enter post office"
                                className="border-gray-300"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="mailing-state" className="text-sm font-medium text-gray-700">
                                2.14 State
                              </Label>
                              <Input
                                id="mailing-state"
                                value={addressData.mailing.state}
                                className="bg-gray-50 text-gray-600 border-gray-300"
                                readOnly
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mailing-country" className="text-sm font-medium text-gray-700">
                                2.15 Country
                              </Label>
                              <Input
                                id="mailing-country"
                                value={addressData.mailing.country}
                                className="bg-gray-50 text-gray-600 border-gray-300"
                                readOnly
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mailing-pin" className="text-sm font-medium text-gray-700">
                                2.16 Pin Code
                              </Label>
                              <Input
                                id="mailing-pin"
                                value={addressData.mailing.pinCode}
                                onChange={(e) => handleAddressChange("mailing", "pinCode", e.target.value)}
                                placeholder="Enter pin code"
                                className="border-gray-300"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Declaration and Error Messages */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="addressDeclaration"
                          checked={addressDeclared}
                          onCheckedChange={handleAddressDeclarationChange}
                          className="mt-1"
                        />
                        <Label
                          htmlFor="addressDeclaration"
                          className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                        >
                          I declare that the addresses provided are correct (all fields mandatory).
                        </Label>
                      </div>

                      {/* Error Messages */}
                      {addressErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <div className="text-sm text-red-800">
                            <p className="font-medium mb-1">Please complete all address fields. Missing:</p>
                            <p className="text-red-600">{addressErrors.join(", ")}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Subjects Overview Tab */}
                <TabsContent value="subjects" className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Subjects Overview (Semesters 1-4)</h2>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">3.1 Request correction</span>
                        <Switch
                          checked={correctionFlags.subjects}
                          onCheckedChange={() => handleCorrectionToggle("subjects")}
                        />
                      </div>
                    </div>

                    {/* Subjects Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700">
                              3.1 Category
                            </th>
                            <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                              3.2 Sem 1
                            </th>
                            <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                              3.3 Sem 2
                            </th>
                            <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                              3.4 Sem 3
                            </th>
                            <th className="border border-gray-300 px-2 py-2 text-center text-sm font-medium text-gray-700">
                              3.5 Sem 4
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(subjectsData).map(([category, semesters]) => (
                            <tr key={category} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50">
                                {category}
                              </td>
                              {Object.entries(semesters).map(([sem, value]) => (
                                <td key={sem} className="border border-gray-300 px-2 py-2">
                                  <div className="relative">
                                    <Input
                                      value={value}
                                      onChange={(e) => handleSubjectChange(category, sem, e.target.value)}
                                      placeholder={category === "CVAC" ? "e.g. Dance, Music" : "Subject"}
                                      className={`w-full text-center text-sm border-gray-300 h-8 ${
                                        correctionFlags.subjects ? "bg-gray-50 text-gray-600" : "bg-white"
                                      }`}
                                      readOnly={correctionFlags.subjects}
                                    />
                                  </div>
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Declaration */}
                    <div className="mt-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="subjectsDeclaration"
                          checked={subjectsDeclared}
                          onCheckedChange={handleSubjectsDeclarationChange}
                          className="mt-1"
                        />
                        <Label
                          htmlFor="subjectsDeclaration"
                          className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                        >
                          {correctionFlags.subjects
                            ? "I confirm the subjects listed above for Semesters 1-4. Note: Corrections will be reviewed by staff."
                            : "I confirm the subjects listed above for Semesters 1-4."}
                        </Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Uploads</h2>

                    {/* Document Upload Sections - Exact Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Class XII Original Board Marksheet */}
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium text-gray-700">
                            4.1 Class XII Original Board Marksheet
                          </Label>
                          <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                            Required
                          </Badge>
                        </div>
                        <div className="relative">
                          <Input
                            value={documents.classXIIMarksheet?.name || "No file chosen"}
                            readOnly
                            className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("classXIIMarksheet")?.click()}
                            className="absolute right-[0.2rem] top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300 bg-white"
                          >
                            Upload
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">Max 5MB • PDF / JPG</p>
                          <input
                            id="classXIIMarksheet"
                            type="file"
                            accept=".pdf,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload("classXIIMarksheet", e.target.files?.[0] || null)}
                          />
                        </div>
                        {documents.classXIIMarksheet && (
                          <div className="mt-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                {documents.classXIIMarksheet.type.startsWith("image/") ? (
                                  <img
                                    src={getFilePreviewUrl(documents.classXIIMarksheet)}
                                    alt="Preview"
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => handleFilePreview(documents.classXIIMarksheet!)}
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                    onClick={() => handleFilePreview(documents.classXIIMarksheet!)}
                                  >
                                    PDF
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 truncate">{documents.classXIIMarksheet.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(documents.classXIIMarksheet.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Aadhaar Card */}
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium text-gray-700">4.2 Aadhaar Card (if Indian)</Label>
                          <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                            Required
                          </Badge>
                        </div>
                        <div className="relative">
                          <Input
                            value={documents.aadhaarCard?.name || "No file chosen"}
                            readOnly
                            className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("aadhaarCard")?.click()}
                            className="absolute right-[0.2rem] top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300 bg-white"
                          >
                            Upload
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">Max 5MB • PDF / JPG</p>
                          <input
                            id="aadhaarCard"
                            type="file"
                            accept=".pdf,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload("aadhaarCard", e.target.files?.[0] || null)}
                          />
                        </div>
                        {documents.aadhaarCard && (
                          <div className="mt-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                {documents.aadhaarCard.type.startsWith("image/") ? (
                                  <img
                                    src={getFilePreviewUrl(documents.aadhaarCard)}
                                    alt="Preview"
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => handleFilePreview(documents.aadhaarCard!)}
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                    onClick={() => handleFilePreview(documents.aadhaarCard!)}
                                  >
                                    PDF
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 truncate">{documents.aadhaarCard.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(documents.aadhaarCard.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* APAAR ID Card */}
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium text-gray-700">4.3 APAAR (ABC) ID Card</Label>
                          <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                            Required
                          </Badge>
                        </div>
                        <div className="relative">
                          <Input
                            value={documents.apaarIdCard?.name || "No file chosen"}
                            readOnly
                            className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("apaarIdCard")?.click()}
                            className="absolute right-[0.2rem] top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300 bg-white"
                          >
                            Upload
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">Max 5MB • PDF / JPG</p>
                          <input
                            id="apaarIdCard"
                            type="file"
                            accept=".pdf,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload("apaarIdCard", e.target.files?.[0] || null)}
                          />
                        </div>
                        {documents.apaarIdCard && (
                          <div className="mt-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                {documents.apaarIdCard.type.startsWith("image/") ? (
                                  <img
                                    src={getFilePreviewUrl(documents.apaarIdCard)}
                                    alt="Preview"
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => handleFilePreview(documents.apaarIdCard!)}
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                    onClick={() => handleFilePreview(documents.apaarIdCard!)}
                                  >
                                    PDF
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 truncate">{documents.apaarIdCard.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(documents.apaarIdCard.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Father's Government-issued Photo ID */}
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium text-gray-700">
                            4.4 Father's Government-issued Photo ID
                          </Label>
                          <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                            Required
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">Passport / Voter ID / Driving Licence (photo)</p>
                        <div className="relative">
                          <Input
                            value={documents.fatherPhotoId?.name || "No file chosen"}
                            readOnly
                            className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max 5MB • PDF / JPG</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("fatherPhotoId")?.click()}
                            className="absolute right-2 top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300"
                          >
                            Upload
                          </Button>
                          <input
                            id="fatherPhotoId"
                            type="file"
                            accept=".pdf,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload("fatherPhotoId", e.target.files?.[0] || null)}
                          />
                        </div>
                        {documents.fatherPhotoId && (
                          <div className="mt-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                {documents.fatherPhotoId.type.startsWith("image/") ? (
                                  <img
                                    src={getFilePreviewUrl(documents.fatherPhotoId)}
                                    alt="Preview"
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => handleFilePreview(documents.fatherPhotoId!)}
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                    onClick={() => handleFilePreview(documents.fatherPhotoId!)}
                                  >
                                    PDF
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 truncate">{documents.fatherPhotoId.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(documents.fatherPhotoId.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Mother's Government-issued Photo ID */}
                      <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium text-gray-700">
                            4.5 Mother's Government-issued Photo ID
                          </Label>
                          <Badge variant="outline" className="text-xs text-red-600 border-red-600">
                            Required
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">Passport / Voter ID / Driving Licence (photo)</p>
                        <div className="relative">
                          <Input
                            value={documents.motherPhotoId?.name || "No file chosen"}
                            readOnly
                            className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                          />
                          <p className="text-xs text-gray-500 mt-1">Max 5MB • PDF / JPG</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("motherPhotoId")?.click()}
                            className="absolute right-[0.2rem] top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300"
                          >
                            Upload
                          </Button>
                          <input
                            id="motherPhotoId"
                            type="file"
                            accept=".pdf,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload("motherPhotoId", e.target.files?.[0] || null)}
                          />
                        </div>
                        {documents.motherPhotoId && (
                          <div className="mt-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                {documents.motherPhotoId.type.startsWith("image/") ? (
                                  <img
                                    src={getFilePreviewUrl(documents.motherPhotoId)}
                                    alt="Preview"
                                    className="w-full h-full object-cover cursor-pointer"
                                    onClick={() => handleFilePreview(documents.motherPhotoId!)}
                                  />
                                ) : (
                                  <div
                                    className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                    onClick={() => handleFilePreview(documents.motherPhotoId!)}
                                  >
                                    PDF
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-600 truncate">{documents.motherPhotoId.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(documents.motherPhotoId.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* EWS Certificate - Only show if EWS is Yes */}
                      {personalInfo.ews === "Yes" && (
                        <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-medium text-gray-700">4.6 EWS Certificate</Label>
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          </div>
                          <div className="relative">
                            <Input
                              value={documents.ewsCertificate?.name || "No file chosen"}
                              readOnly
                              className="bg-gray-50 text-sm border-gray-300 h-9 pr-20"
                            />
                            <p className="text-xs text-gray-500 mt-1">Max 5MB • PDF / JPG</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById("ewsCertificate")?.click()}
                              className="absolute right-[0.2rem] top-[32%] -translate-y-1/2 h-7 px-3 text-xs border-gray-300"
                            >
                              Upload
                            </Button>
                            <input
                              id="ewsCertificate"
                              type="file"
                              accept=".pdf,.jpg,.jpeg"
                              className="hidden"
                              onChange={(e) => handleFileUpload("ewsCertificate", e.target.files?.[0] || null)}
                            />
                          </div>
                          {documents.ewsCertificate && (
                            <div className="mt-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 border border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                                  {documents.ewsCertificate.type.startsWith("image/") ? (
                                    <img
                                      src={getFilePreviewUrl(documents.ewsCertificate)}
                                      alt="Preview"
                                      className="w-full h-full object-cover cursor-pointer"
                                      onClick={() => handleFilePreview(documents.ewsCertificate!)}
                                    />
                                  ) : (
                                    <div
                                      className="w-full h-full flex items-center justify-center bg-red-50 text-red-600 text-xs cursor-pointer"
                                      onClick={() => handleFilePreview(documents.ewsCertificate!)}
                                    >
                                      PDF
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-600 truncate">{documents.ewsCertificate.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(documents.ewsCertificate.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="mt-6">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="documentsConfirmation"
                          checked={documentsConfirmed}
                          onCheckedChange={(checked: boolean) => setDocumentsConfirmed(checked)}
                          className="mt-1"
                        />
                        <Label
                          htmlFor="documentsConfirmation"
                          className="text-sm text-gray-700 leading-relaxed cursor-pointer"
                        >
                          I confirm that the uploaded documents correspond to the data provided.
                        </Label>
                      </div>
                    </div>

                    {/* Error Messages */}
                    {getMissingDocuments().length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-red-600">
                          Missing required documents:{" "}
                          {getMissingDocuments()
                            .map((doc) => {
                              const names: { [key: string]: string } = {
                                classXIIMarksheet: "Class XII marksheet",
                                aadhaarCard: "Aadhaar Card",
                                apaarIdCard: "APAAR ID Card",
                                fatherPhotoId: "Father's government photo ID",
                                motherPhotoId: "Mother's government photo ID",
                                ewsCertificate: "EWS Certificate",
                              };
                              return names[doc] || doc;
                            })
                            .join(", ")}
                        </p>
                      </div>
                    )}

                    {/* Review & Confirm Button */}
                    <div className="mt-6">
                      <Button
                        onClick={handleReviewConfirm}
                        disabled={!canReviewConfirm()}
                        className={`w-full py-2 text-sm font-medium ${
                          canReviewConfirm()
                            ? "bg-gray-600 hover:bg-gray-700 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Review & Confirm
                      </Button>
                    </div>

                    {/* Bottom Instruction */}
                    <div className="mt-3">
                      <p className="text-sm text-red-600">
                        To Review & Confirm you must: declare Personal, Address and Subjects tabs and upload all
                        required documents.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* File Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {previewFile && (
              <div className="w-full">
                {previewFile.type === "image" ? (
                  <img
                    src={getFilePreviewUrl(previewFile.file)}
                    alt="File preview"
                    className="w-full h-auto max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="w-full h-[70vh] border border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="text-6xl text-red-600 mb-4">📄</div>
                      <p className="text-lg font-medium text-gray-700 mb-2">{previewFile.file.name}</p>
                      <p className="text-sm text-gray-500">{(previewFile.file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p className="text-sm text-gray-500 mt-2">
                        PDF files cannot be previewed in the browser. Please download to view.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
