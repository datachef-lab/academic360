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
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState("personal");
  const [correctionFlags, setCorrectionFlags] = useState<CorrectionFlags>({
    gender: false,
    nationality: false,
    apaarId: false,
    subjects: false,
  });
  const [personalInfo, setPersonalInfo] = useState<PersonalInfoData>({
    fullName: "John Doe",
    parentName: "Jane Doe",
    gender: "Male",
    nationality: "Indian",
    ews: "No",
    aadhaarNumber: "XXXX XXXX XXXX",
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 overflow-x-hidden">
      <div className="w-full px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calcutta University — Registration</h1>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-xl border-0 bg-white rounded-lg overflow-hidden w-full">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 bg-white w-full">
                <TabsList className="grid w-full grid-cols-4 h-auto bg-transparent p-0 min-w-0">
                  <TabsTrigger
                    value="personal"
                    className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "personal"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    disabled={!canNavigateToTab("personal")}
                  >
                    Personal Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="address"
                    className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "address"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    disabled={!canNavigateToTab("address")}
                  >
                    Address Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="subjects"
                    className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "subjects"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    disabled={!canNavigateToTab("subjects")}
                  >
                    Subjects Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className={`flex-1 py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "documents"
                        ? "border-purple-600 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    disabled={!canNavigateToTab("documents")}
                  >
                    Documents
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="p-8 bg-white w-full">
                {/* Personal Info Tab */}
                <TabsContent value="personal" className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Student Name</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                          Full name
                        </Label>
                        <Input
                          id="fullName"
                          value={personalInfo.fullName}
                          className="bg-gray-100 text-gray-600"
                          readOnly
                        />
                      </div>

                      {/* Father/Mother Name */}
                      <div className="space-y-2">
                        <Label htmlFor="parentName" className="text-sm font-medium text-gray-700">
                          Father / Mother's Name
                        </Label>
                        <Input
                          id="parentName"
                          value={personalInfo.parentName}
                          className="bg-gray-100 text-gray-600"
                          readOnly
                        />
                      </div>

                      {/* Gender */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Gender</Label>
                        <div className="flex flex-col gap-3">
                          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm">
                            {personalInfo.gender}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Request correction</span>
                            <Switch
                              checked={correctionFlags.gender}
                              onCheckedChange={() => handleCorrectionToggle("gender")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Nationality */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Nationality</Label>
                        <div className="flex flex-col gap-3">
                          <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm">
                            {personalInfo.nationality}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Request correction</span>
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
                          Whether belong to EWS
                        </Label>
                        <Select
                          value={personalInfo.ews}
                          onValueChange={(value) => handlePersonalInfoChange("ews", value)}
                        >
                          <SelectTrigger className="w-full">
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
                          Aadhaar Number
                        </Label>
                        <Input
                          id="aadhaarNumber"
                          value={personalInfo.aadhaarNumber}
                          className="bg-gray-100 text-gray-600"
                          readOnly
                        />
                      </div>

                      {/* APAAR ID */}
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="apaarId" className="text-sm font-medium text-gray-700">
                          APAAR (ABC) ID
                        </Label>
                        <div className="flex flex-col gap-3">
                          <Input
                            id="apaarId"
                            value={personalInfo.apaarId}
                            onChange={(e) => handlePersonalInfoChange("apaarId", e.target.value)}
                            placeholder="Enter APAAR ID"
                            className={`w-full ${correctionFlags.apaarId ? "" : "bg-gray-100 text-gray-600"}`}
                            readOnly={!correctionFlags.apaarId && personalInfo.apaarId !== ""}
                          />
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Request correction</span>
                            <Switch
                              checked={correctionFlags.apaarId}
                              onCheckedChange={() => handleCorrectionToggle("apaarId")}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Declaration */}
                      <div className="pt-4 md:col-span-2">
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
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Address Information</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Residential Address */}
                      <div className="space-y-4 lg:pr-8 lg:border-r lg:border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Residential Address</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="residential-address" className="text-sm font-medium text-gray-700">
                              Address Line
                            </Label>
                            <Input
                              id="residential-address"
                              value={addressData.residential.addressLine}
                              onChange={(e) => handleAddressChange("residential", "addressLine", e.target.value)}
                              placeholder="Enter address line"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="residential-city" className="text-sm font-medium text-gray-700">
                                City
                              </Label>
                              <Input
                                id="residential-city"
                                value={addressData.residential.city}
                                onChange={(e) => handleAddressChange("residential", "city", e.target.value)}
                                placeholder="Enter city"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="residential-district" className="text-sm font-medium text-gray-700">
                                District
                              </Label>
                              <Input
                                id="residential-district"
                                value={addressData.residential.district}
                                onChange={(e) => handleAddressChange("residential", "district", e.target.value)}
                                placeholder="Enter district"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="residential-police" className="text-sm font-medium text-gray-700">
                                Police Station
                              </Label>
                              <Input
                                id="residential-police"
                                value={addressData.residential.policeStation}
                                onChange={(e) => handleAddressChange("residential", "policeStation", e.target.value)}
                                placeholder="Enter police station"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="residential-post" className="text-sm font-medium text-gray-700">
                                Post Office
                              </Label>
                              <Input
                                id="residential-post"
                                value={addressData.residential.postOffice}
                                onChange={(e) => handleAddressChange("residential", "postOffice", e.target.value)}
                                placeholder="Enter post office"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="residential-state" className="text-sm font-medium text-gray-700">
                                State
                              </Label>
                              <Input
                                id="residential-state"
                                value={addressData.residential.state}
                                className="bg-gray-100 text-gray-600"
                                readOnly
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="residential-country" className="text-sm font-medium text-gray-700">
                                Country
                              </Label>
                              <Input
                                id="residential-country"
                                value={addressData.residential.country}
                                className="bg-gray-100 text-gray-600"
                                readOnly
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="residential-pin" className="text-sm font-medium text-gray-700">
                                Pin Code
                              </Label>
                              <Input
                                id="residential-pin"
                                value={addressData.residential.pinCode}
                                onChange={(e) => handleAddressChange("residential", "pinCode", e.target.value)}
                                placeholder="Enter pin code"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mailing Address */}
                      <div className="space-y-4 lg:pl-8">
                        <h3 className="text-lg font-medium text-gray-900">Mailing Address</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="mailing-address" className="text-sm font-medium text-gray-700">
                              Address Line
                            </Label>
                            <Input
                              id="mailing-address"
                              value={addressData.mailing.addressLine}
                              onChange={(e) => handleAddressChange("mailing", "addressLine", e.target.value)}
                              placeholder="Enter address line"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mailing-city" className="text-sm font-medium text-gray-700">
                                City
                              </Label>
                              <Input
                                id="mailing-city"
                                value={addressData.mailing.city}
                                onChange={(e) => handleAddressChange("mailing", "city", e.target.value)}
                                placeholder="Enter city"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mailing-district" className="text-sm font-medium text-gray-700">
                                District
                              </Label>
                              <Input
                                id="mailing-district"
                                value={addressData.mailing.district}
                                onChange={(e) => handleAddressChange("mailing", "district", e.target.value)}
                                placeholder="Enter district"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mailing-police" className="text-sm font-medium text-gray-700">
                                Police Station
                              </Label>
                              <Input
                                id="mailing-police"
                                value={addressData.mailing.policeStation}
                                onChange={(e) => handleAddressChange("mailing", "policeStation", e.target.value)}
                                placeholder="Enter police station"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mailing-post" className="text-sm font-medium text-gray-700">
                                Post Office
                              </Label>
                              <Input
                                id="mailing-post"
                                value={addressData.mailing.postOffice}
                                onChange={(e) => handleAddressChange("mailing", "postOffice", e.target.value)}
                                placeholder="Enter post office"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="mailing-state" className="text-sm font-medium text-gray-700">
                                State
                              </Label>
                              <Input
                                id="mailing-state"
                                value={addressData.mailing.state}
                                className="bg-gray-100 text-gray-600"
                                readOnly
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mailing-country" className="text-sm font-medium text-gray-700">
                                Country
                              </Label>
                              <Input
                                id="mailing-country"
                                value={addressData.mailing.country}
                                className="bg-gray-100 text-gray-600"
                                readOnly
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="mailing-pin" className="text-sm font-medium text-gray-700">
                                Pin Code
                              </Label>
                              <Input
                                id="mailing-pin"
                                value={addressData.mailing.pinCode}
                                onChange={(e) => handleAddressChange("mailing", "pinCode", e.target.value)}
                                placeholder="Enter pin code"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Declaration and Error Messages */}
                    <div className="mt-8 space-y-4">
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
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                          <div className="text-sm text-red-800">
                            <p className="font-medium mb-2">Please complete all address fields. Missing:</p>
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
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Subjects Overview (Semesters 1–4)</h2>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-600">Request correction</span>
                        <Switch
                          checked={correctionFlags.subjects}
                          onCheckedChange={() => handleCorrectionToggle("subjects")}
                        />
                      </div>
                    </div>

                    {/* Subjects Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 rounded-lg">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                              Category
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                              Sem 1
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                              Sem 2
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                              Sem 3
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700">
                              Sem 4
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(subjectsData).map(([category, semesters]) => (
                            <tr key={category} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50">
                                {category}
                              </td>
                              {Object.entries(semesters).map(([sem, value]) => (
                                <td key={sem} className="border border-gray-300 px-2 py-2">
                                  <Input
                                    value={value}
                                    onChange={(e) => handleSubjectChange(category, sem, e.target.value)}
                                    placeholder={category === "CVAC" ? "e.g. Dance, Music" : "Subject"}
                                    className={`w-full text-center ${
                                      correctionFlags.subjects ? "bg-gray-100 text-gray-600" : "bg-white"
                                    }`}
                                    readOnly={correctionFlags.subjects}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Declaration */}
                    <div className="mt-8">
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
                            ? "I confirm the subjects listed above for Semesters 1–4. Note: Corrections will be reviewed by staff."
                            : "I confirm the subjects listed above for Semesters 1–4."}
                        </Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Document Uploads</h2>

                    {/* Document Upload Sections - Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Class XII Original Board Marksheet */}
                      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-sm font-medium text-gray-700">
                            Class XII Original Board Marksheet
                          </Label>
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        </div>
                        <div className="space-y-3">
                          <Input
                            value={documents.classXIIMarksheet?.name || "No file chosen"}
                            readOnly
                            className="bg-gray-50 text-sm"
                          />
                          <p className="text-xs text-gray-500">Max 5MB • PDF / JPG</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("classXIIMarksheet")?.click()}
                            className="w-full"
                          >
                            Upload
                          </Button>
                          <input
                            id="classXIIMarksheet"
                            type="file"
                            accept=".pdf,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload("classXIIMarksheet", e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>

                      {/* Aadhaar Card */}
                      {personalInfo.aadhaarNumber && personalInfo.aadhaarNumber !== "XXXX XXXX XXXX" && (
                        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <Label className="text-sm font-medium text-gray-700">Aadhaar Card (if Indian)</Label>
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <Input
                              value={documents.aadhaarCard?.name || "No file chosen"}
                              readOnly
                              className="bg-gray-50 text-sm"
                            />
                            <p className="text-xs text-gray-500">Max 5MB • PDF / JPG</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById("aadhaarCard")?.click()}
                              className="w-full"
                            >
                              Upload
                            </Button>
                            <input
                              id="aadhaarCard"
                              type="file"
                              accept=".pdf,.jpg,.jpeg"
                              className="hidden"
                              onChange={(e) => handleFileUpload("aadhaarCard", e.target.files?.[0] || null)}
                            />
                          </div>
                        </div>
                      )}

                      {/* APAAR ID Card */}
                      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-sm font-medium text-gray-700">APAAR (ABC) ID Card</Label>
                          {(!personalInfo.aadhaarNumber || personalInfo.aadhaarNumber === "XXXX XXXX XXXX") && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Input
                            value={documents.apaarIdCard?.name || "No file chosen"}
                            readOnly
                            className="bg-gray-50 text-sm"
                          />
                          <p className="text-xs text-gray-500">Max 5MB • PDF / JPG</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("apaarIdCard")?.click()}
                            className="w-full"
                          >
                            Upload
                          </Button>
                          <input
                            id="apaarIdCard"
                            type="file"
                            accept=".pdf,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => handleFileUpload("apaarIdCard", e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>

                      {/* Father's Government-issued Photo ID */}
                      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-sm font-medium text-gray-700">
                            Father's Government-issued Photo ID
                          </Label>
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">Passport / Voter ID / Driving Licence (photo)</p>
                        <div className="space-y-3">
                          <Input
                            value={documents.fatherPhotoId?.name || "No file chosen"}
                            readOnly
                            className="bg-gray-50 text-sm"
                          />
                          <p className="text-xs text-gray-500">Max 5MB • PDF / JPG</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("fatherPhotoId")?.click()}
                            className="w-full"
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
                      </div>

                      {/* Mother's Government-issued Photo ID */}
                      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-sm font-medium text-gray-700">
                            Mother's Government-issued Photo ID
                          </Label>
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">Passport / Voter ID / Driving Licence (photo)</p>
                        <div className="space-y-3">
                          <Input
                            value={documents.motherPhotoId?.name || "No file chosen"}
                            readOnly
                            className="bg-gray-50 text-sm"
                          />
                          <p className="text-xs text-gray-500">Max 5MB • PDF / JPG</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("motherPhotoId")?.click()}
                            className="w-full"
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
                      </div>

                      {/* EWS Certificate - Only show if EWS is Yes */}
                      {personalInfo.ews === "Yes" && (
                        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <Label className="text-sm font-medium text-gray-700">EWS Certificate</Label>
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          </div>
                          <div className="space-y-3">
                            <Input
                              value={documents.ewsCertificate?.name || "No file chosen"}
                              readOnly
                              className="bg-gray-50 text-sm"
                            />
                            <p className="text-xs text-gray-500">Max 5MB • PDF / JPG</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById("ewsCertificate")?.click()}
                              className="w-full"
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
                        </div>
                      )}
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="mt-8">
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
                      <div className="mt-4">
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
                    <div className="mt-8">
                      <Button
                        onClick={handleReviewConfirm}
                        disabled={!canReviewConfirm()}
                        className={`w-full py-3 text-base font-medium ${
                          canReviewConfirm()
                            ? "bg-gray-600 hover:bg-gray-700 text-white"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        Review & Confirm
                      </Button>
                    </div>

                    {/* Bottom Instruction */}
                    <div className="mt-4">
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
    </div>
  );
}
