"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Phone,
  User,
  Users,
  BookText,
  Award,
  Clock,
  GraduationCap,
  Heart,
  AlertTriangle,
  Car,
  Home,
  FileText,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  Globe,
  Briefcase,
  School,
  Edit,
  Save,
  X,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import type { UserDto, ProfileInfo, FamilyDto } from "@repo/db/dtos/user";
import { useStudent } from "@/providers/student-provider";
import type { StudentAcademicSubjectsDto } from "@repo/db/dtos/admissions";

export default function ProfileContent() {
  const { user } = useAuth();
  const { profileInfo, loading, error } = useProfile();
  const [activeTab, setActiveTab] = useState("personal");
  const [isEditing, setIsEditing] = useState(false);
  const { student } = useStudent();

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 text-lg font-medium">Error loading profile</div>
        <div className="text-gray-500 text-sm mt-2">{error}</div>
      </div>
    );

  if (!profileInfo)
    return (
      <div className="p-6 text-center">
        <div className="text-gray-600 text-lg font-medium">Profile data not found</div>
      </div>
    );

  // Extract nested objects with proper type checking
  const personalDetails = profileInfo.personalDetails;
  const applicationForm = profileInfo.applicationFormDto;
  const familyDetails = profileInfo.familyDetails;
  console.log("familyDetails:", familyDetails);
  const healthDetails = profileInfo.healthDetails;
  const emergencyContactDetails = profileInfo.emergencyContactDetails;
  const transportDetails = profileInfo.transportDetails;
  const accommodationDetails = profileInfo.accommodationDetails;

  // Prefer values from student provider where requested
  const uidFromStudent = student?.id ? String(student.id) : "Not Available";
  const courseNameFromStudent = student?.programCourse?.course?.name || "";
  const courseTypeFromStudent = student?.programCourse?.courseType?.shortName || "";

  // Helper function to format date
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Not Available";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to get student image URL
  const getStudentImageUrl = (uid?: string) => {
    if (!uid) return null;
    return `https://74.207.233.48:8443/hrclIRP/studentimages/Student_Image_${uid}.jpg`;
  };

  // Helper function to format address
  const formatAddress = (address: any) => {
    if (!address) return "Not Available";
    const parts = [
      address.addressLine,
      address.city?.name,
      address.state?.name,
      address.country?.name,
      address.pincode,
    ].filter(Boolean);
    return parts.join(", ") || "Not Available";
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 pb-20">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-1">Manage your personal information and academic details</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="h-24 w-24 border-4 border-white shadow-lg rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {getStudentImageUrl(student?.uid) ? (
                        <img
                          src={getStudentImageUrl(student?.uid) || ""}
                          alt={user?.name || "Student"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 text-2xl font-bold">{user?.name?.charAt(0) || "S"}</span>
                      )}
                    </div>
                    <Badge className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-1">
                      Student
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name || "Not Available"}</h2>
                  <p className="text-sm text-gray-600 mb-4">UID: {student?.uid}</p>

                  <Separator />

                  {/* Quick Stats */}
                  <div className="space-y-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">College Roll Number</span>
                      <span className="font-semibold">{student?.classRollNumber || "N/A"}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Program Course</span>
                      <span className="font-semibold text-right text-xs">
                        {student?.currentPromotion?.programCourse?.name}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-2">
            {/* Navigation Tabs */}
            {/* <Card className="mb-6">
              <CardContent className="p-0 overflow-x-auto">
                <div className="flex border-b whitespace-nowrap">
                  {[{ id: "personal", label: "Personal", icon: User }].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card> */}

            {/* Tab Content */}
            <Card>
              <CardContent className="p-6">
                {activeTab === "personal" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Personal Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Application Number */}
                        <div className="space-y-2">
                          <label htmlFor="applicationNo" className="text-sm font-medium text-gray-700">
                            Application Number
                          </label>
                          <Input
                            id="applicationNo"
                            value={profileInfo.admissionCourseDetailsDto?.appNumber || ""}
                            // value={applicationForm?.courseApplication?.[0]?.appNumber || ""}
                            disabled
                            className="bg-gray-50"
                          />
                          {/* {JSON.stringify(profileInfo.admissionCourseDetailsDto)} */}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                            Full Name
                          </label>
                          <Input
                            id="fullName"
                            value={user?.name || ""}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                            Date of Birth
                          </label>
                          <Input
                            id="dateOfBirth"
                            value={formatDate(personalDetails?.dateOfBirth || undefined)}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="gender" className="text-sm font-medium text-gray-700">
                            Gender
                          </label>
                          <Input
                            id="gender"
                            value={personalDetails?.gender || ""}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="nationality" className="text-sm font-medium text-gray-700">
                            Nationality
                          </label>
                          <Input
                            id="nationality"
                            value={personalDetails?.nationality?.name || ""}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="religion" className="text-sm font-medium text-gray-700">
                            Religion
                          </label>
                          <Input
                            id="religion"
                            value={personalDetails?.religion?.name || ""}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="category" className="text-sm font-medium text-gray-700">
                            Category
                          </label>
                          <Input
                            id="category"
                            value={personalDetails?.category?.name || ""}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="bloodGroup" className="text-sm font-medium text-gray-700">
                            Blood Group
                          </label>
                          <Input
                            id="bloodGroup"
                            value={healthDetails?.bloodGroup?.type || ""}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="aadhaar" className="text-sm font-medium text-gray-700">
                            Aadhaar Card Number
                          </label>
                          <Input
                            id="aadhaar"
                            value={personalDetails?.aadhaarCardNumber || ""}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="mobileNumber" className="text-sm font-medium text-gray-700">
                            Mobile Number
                          </label>
                          <Input
                            id="mobileNumber"
                            value={personalDetails?.mobileNumber || ""}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-700">
                            WhatsApp Number
                          </label>
                          <Input
                            id="whatsappNumber"
                            value={personalDetails?.whatsappNumber || ""}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div>
                        {/* Father Name */}
                        <div className="space-y-2">
                          <label htmlFor="fatherNamePersonal" className="text-sm font-medium text-gray-700">
                            Father's Name
                          </label>
                          {(() => {
                            const father = familyDetails?.members?.find((m) => m.type === "FATHER");
                            return (
                              <Input
                                id="fatherNamePersonal"
                                value={father?.name || ""}
                                disabled
                                className="bg-gray-50"
                              />
                            );
                          })()}
                        </div>
                        {/* Mother Name */}
                        <div className="space-y-2">
                          <label htmlFor="motherNamePersonal" className="text-sm font-medium text-gray-700">
                            Mother's Name
                          </label>
                          {(() => {
                            const mother = familyDetails?.members?.find((m) => m.type === "MOTHER");
                            return (
                              <Input
                                id="motherNamePersonal"
                                value={mother?.name || ""}
                                disabled
                                className="bg-gray-50"
                              />
                            );
                          })()}
                        </div>
                        {/* Emails */}
                        <div className="space-y-2">
                          <label htmlFor="personalEmail" className="text-sm font-medium text-gray-700">
                            Personal Email ID
                          </label>
                          <Input
                            id="personalEmail"
                            value={student?.personalEmail || ""}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="institutionalEmail" className="text-sm font-medium text-gray-700">
                            Institutional Email ID
                          </label>
                          <Input id="institutionalEmail" value={user?.email || ""} disabled className="bg-gray-50" />
                        </div>
                        {/* <div className="space-y-2">
                          <label htmlFor="motherTongue" className="text-sm font-medium text-gray-700">
                            Mother Tongue
                          </label>
                          <Input
                            id="motherTongue"
                            value={personalDetails?.motherTongue?.name || ""}
                            disabled={!isEditing}
                            className={!isEditing ? "bg-gray-50" : ""}
                          />
                        </div> */}
                      </div>
                    </div>

                    <Separator />

                    {/* <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Address Information
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-gray-700">Residential Address</h4>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label htmlFor="resAddress" className="text-sm font-medium text-gray-700">
                                Address Line
                              </label>
                              <Textarea
                                id="resAddress"
                                value={personalDetails?.address?.[0]?.addressLine || ""}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-gray-50" : ""}
                                rows={4}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label htmlFor="resCity" className="text-sm font-medium text-gray-700">
                                  City
                                </label>
                                <Input
                                  id="resCity"
                                  value={personalDetails?.address?.[0]?.city?.name || ""}
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="resState" className="text-sm font-medium text-gray-700">
                                  State
                                </label>
                                <Input
                                  id="resState"
                                  value={personalDetails?.address?.[0]?.state?.name || ""}
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label htmlFor="resCountry" className="text-sm font-medium text-gray-700">
                                  Country
                                </label>
                                <Input
                                  id="resCountry"
                                  value={personalDetails?.address?.[0]?.country?.name || ""}
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="resDistrict" className="text-sm font-medium text-gray-700">
                                  District
                                </label>
                                <Input
                                  id="resDistrict"
                                  value={
                                    personalDetails?.address?.[0]?.otherDistrict ||
                                    personalDetails?.address?.[0]?.district?.name ||
                                    ""
                                  }
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label htmlFor="resPostOffice" className="text-sm font-medium text-gray-700">
                                  Post Office
                                </label>
                                <Input
                                  id="resPostOffice"
                                  value={personalDetails?.address?.[0]?.otherPostoffice || ""}
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="resPoliceStation" className="text-sm font-medium text-gray-700">
                                  Police Station
                                </label>
                                <Input
                                  id="resPoliceStation"
                                  value={personalDetails?.address?.[0]?.otherPoliceStation || ""}
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="resPincode" className="text-sm font-medium text-gray-700">
                                Pincode
                              </label>
                              <Input
                                id="resPincode"
                                value={personalDetails?.address?.[0]?.pincode || ""}
                                disabled={!isEditing}
                                className={!isEditing ? "bg-gray-50" : ""}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-gray-700">Mailing Address</h4>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <label htmlFor="mailAddress" className="text-sm font-medium text-gray-700">
                                Address Line
                              </label>
                              <Textarea
                                id="mailAddress"
                                value={
                                  personalDetails?.address?.[1]?.addressLine ||
                                  personalDetails?.address?.[0]?.addressLine ||
                                  ""
                                }
                                disabled={!isEditing}
                                className={!isEditing ? "bg-gray-50" : ""}
                                rows={4}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label htmlFor="mailCity" className="text-sm font-medium text-gray-700">
                                  City
                                </label>
                                <Input
                                  id="mailCity"
                                  value={
                                    personalDetails?.address?.[1]?.city?.name ||
                                    personalDetails?.address?.[0]?.city?.name ||
                                    ""
                                  }
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="mailState" className="text-sm font-medium text-gray-700">
                                  State
                                </label>
                                <Input
                                  id="mailState"
                                  value={
                                    personalDetails?.address?.[1]?.state?.name ||
                                    personalDetails?.address?.[0]?.state?.name ||
                                    ""
                                  }
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label htmlFor="mailCountry" className="text-sm font-medium text-gray-700">
                                  Country
                                </label>
                                <Input
                                  id="mailCountry"
                                  value={
                                    personalDetails?.address?.[1]?.country?.name ||
                                    personalDetails?.address?.[0]?.country?.name ||
                                    ""
                                  }
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="mailDistrict" className="text-sm font-medium text-gray-700">
                                  District
                                </label>
                                <Input
                                  id="mailDistrict"
                                  value={
                                    personalDetails?.address?.[1]?.otherDistrict ||
                                    personalDetails?.address?.[1]?.district?.name ||
                                    personalDetails?.address?.[0]?.otherDistrict ||
                                    personalDetails?.address?.[0]?.district?.name ||
                                    ""
                                  }
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label htmlFor="mailPostOffice" className="text-sm font-medium text-gray-700">
                                  Post Office
                                </label>
                                <Input
                                  id="mailPostOffice"
                                  value={
                                    personalDetails?.address?.[1]?.otherPostoffice ||
                                    personalDetails?.address?.[0]?.otherPostoffice ||
                                    ""
                                  }
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                              <div className="space-y-2">
                                <label htmlFor="mailPoliceStation" className="text-sm font-medium text-gray-700">
                                  Police Station
                                </label>
                                <Input
                                  id="mailPoliceStation"
                                  value={
                                    personalDetails?.address?.[1]?.otherPoliceStation ||
                                    personalDetails?.address?.[0]?.otherPoliceStation ||
                                    ""
                                  }
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <label htmlFor="mailPincode" className="text-sm font-medium text-gray-700">
                                  Pincode
                                </label>
                                <Input
                                  id="mailPincode"
                                  value={
                                    personalDetails?.address?.[1]?.pincode ||
                                    personalDetails?.address?.[0]?.pincode ||
                                    ""
                                  }
                                  disabled={!isEditing}
                                  className={!isEditing ? "bg-gray-50" : ""}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                )}

                {false && activeTab === "family" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Family Information
                    </h3>

                    {/* Father's Information */}
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-800">Father's Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="fatherTitle" className="text-sm font-medium text-gray-700">
                            Title
                          </label>
                          {(() => {
                            const father = familyDetails?.members?.find((m) => m.type === "FATHER");
                            return (
                              <Input id="fatherTitle" value={father?.title || ""} disabled className="bg-gray-50" />
                            );
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="fatherName" className="text-sm font-medium text-gray-700">
                            Name
                          </label>
                          {(() => {
                            const father = familyDetails?.members?.find((m) => m.type === "FATHER");
                            return <Input id="fatherName" value={father?.name || ""} disabled className="bg-gray-50" />;
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="fatherPhone" className="text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                          {(() => {
                            const father = familyDetails?.members?.find((m) => m.type === "FATHER");
                            return (
                              <Input id="fatherPhone" value={father?.phone || ""} disabled className="bg-gray-50" />
                            );
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="fatherEmail" className="text-sm font-medium text-gray-700">
                            Email
                          </label>
                          {(() => {
                            const father = familyDetails?.members?.find((m) => m.type === "FATHER");
                            return (
                              <Input id="fatherEmail" value={father?.email || ""} disabled className="bg-gray-50" />
                            );
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="fatherOccupation" className="text-sm font-medium text-gray-700">
                            Occupation
                          </label>
                          {(() => {
                            const father = familyDetails?.members?.find((m) => m.type === "FATHER");
                            return (
                              <Input
                                id="fatherOccupation"
                                value={father?.occupation?.name || ""}
                                disabled
                                className="bg-gray-50"
                              />
                            );
                          })()}
                        </div>
                        {/* <div className="space-y-2">
                          <label htmlFor="fatherAadhaar" className="text-sm font-medium text-gray-700">
                            Aadhaar Card
                          </label>
                          <Input
                            id="fatherAadhaar"
                            value={familyDetails?.father?.aadhaarCardNumber || ""}
                            disabled
                            className="bg-gray-50"
                          />
                        </div> */}
                      </div>
                    </div>

                    {/* Mother's Information */}
                    <div className="space-y-4">
                      <Separator />
                      <h4 className="text-md font-semibold text-gray-800">Mother's Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="motherTitle" className="text-sm font-medium text-gray-700">
                            Title
                          </label>
                          {(() => {
                            const mother = familyDetails?.members?.find((m) => m.type === "MOTHER");
                            return (
                              <Input id="motherTitle" value={mother?.title || ""} disabled className="bg-gray-50" />
                            );
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="motherName" className="text-sm font-medium text-gray-700">
                            Name
                          </label>
                          {(() => {
                            const mother = familyDetails?.members?.find((m) => m.type === "MOTHER");
                            return <Input id="motherName" value={mother?.name || ""} disabled className="bg-gray-50" />;
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="motherPhone" className="text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                          {(() => {
                            const mother = familyDetails?.members?.find((m) => m.type === "MOTHER");
                            return (
                              <Input id="motherPhone" value={mother?.phone || ""} disabled className="bg-gray-50" />
                            );
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="motherEmail" className="text-sm font-medium text-gray-700">
                            Email
                          </label>
                          {(() => {
                            const mother = familyDetails?.members?.find((m) => m.type === "MOTHER");
                            return (
                              <Input id="motherEmail" value={mother?.email || ""} disabled className="bg-gray-50" />
                            );
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="motherOccupation" className="text-sm font-medium text-gray-700">
                            Occupation
                          </label>
                          {(() => {
                            const mother = familyDetails?.members?.find((m) => m.type === "MOTHER");
                            return (
                              <Input
                                id="motherOccupation"
                                value={mother?.occupation?.name || ""}
                                disabled
                                className="bg-gray-50"
                              />
                            );
                          })()}
                        </div>
                        {/* <div className="space-y-2">
                          <label htmlFor="motherAadhaar" className="text-sm font-medium text-gray-700">
                            Aadhaar Card
                          </label>
                          <Input
                            id="motherAadhaar"
                            value={familyDetails?.mother?.aadhaarCardNumber || ""}
                            disabled
                            className="bg-gray-50"
                          />
                        </div> */}
                      </div>
                    </div>

                    {/* Guardian's Information */}
                    <div className="space-y-4">
                      <Separator />
                      <h4 className="text-md font-semibold text-gray-800">Guardian's Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="guardianTitle" className="text-sm font-medium text-gray-700">
                            Title
                          </label>
                          {(() => {
                            const guardian = familyDetails?.members?.find((m) => m.type === "GUARDIAN");
                            return (
                              <Input id="guardianTitle" value={guardian?.title || ""} disabled className="bg-gray-50" />
                            );
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="guardianName" className="text-sm font-medium text-gray-700">
                            Name
                          </label>
                          {(() => {
                            const guardian = familyDetails?.members?.find((m) => m.type === "GUARDIAN");
                            return (
                              <Input id="guardianName" value={guardian?.name || ""} disabled className="bg-gray-50" />
                            );
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="guardianPhone" className="text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                          {(() => {
                            const guardian = familyDetails?.members?.find((m) => m.type === "GUARDIAN");
                            return (
                              <Input id="guardianPhone" value={guardian?.phone || ""} disabled className="bg-gray-50" />
                            );
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="guardianEmail" className="text-sm font-medium text-gray-700">
                            Email
                          </label>
                          {(() => {
                            const guardian = familyDetails?.members?.find((m) => m.type === "GUARDIAN");
                            return (
                              <Input id="guardianEmail" value={guardian?.email || ""} disabled className="bg-gray-50" />
                            );
                          })()}
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="guardianOccupation" className="text-sm font-medium text-gray-700">
                            Occupation
                          </label>
                          {(() => {
                            const guardian = familyDetails?.members?.find((m) => m.type === "GUARDIAN");
                            return (
                              <Input
                                id="guardianOccupation"
                                value={guardian?.occupation?.name || ""}
                                disabled
                                className="bg-gray-50"
                              />
                            );
                          })()}
                        </div>
                        {/* <div className="space-y-2">
                          <label htmlFor="guardianAadhaar" className="text-sm font-medium text-gray-700">
                            Aadhaar Card
                          </label>
                          <Input
                            id="guardianAadhaar"
                            value={familyDetails?.guardian?.aadhaarCardNumber || ""}
                            disabled
                            className="bg-gray-50"
                          />
                        </div> */}
                      </div>
                    </div>
                  </div>
                )}

                {false && activeTab === "application" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Application Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="course" className="text-sm font-medium text-gray-700">
                          Program Course
                        </label>
                        <Input
                          id="course"
                          value={`${student?.programCourse?.course?.name || ""}${student?.programCourse?.courseType?.shortName ? ` (${student?.programCourse?.courseType?.shortName})` : ""}`}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="section" className="text-sm font-medium text-gray-700">
                          Section
                        </label>
                        <Input
                          id="section"
                          value={
                            student?.currentPromotion?.section?.name ||
                            applicationForm?.courseApplication?.[0]?.class?.name ||
                            ""
                          }
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="rollNumber" className="text-sm font-medium text-gray-700">
                          College Roll Number
                        </label>
                        <Input
                          id="rollNumber"
                          value={applicationForm?.courseApplication?.[0]?.classRollNumber || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="uid" className="text-sm font-medium text-gray-700">
                          UID
                        </label>
                        <Input
                          id="uid"
                          value={user?.payload.uid || "" || applicationForm?.courseApplication?.[0]?.rfidNumber || ""}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>

                    {/* Academic Details */}
                    <Separator />
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-900">Academic Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label htmlFor="lastInstitution" className="text-sm font-medium text-gray-700">
                            Last Institution
                          </label>
                          <Input
                            id="lastInstitution"
                            value={applicationForm?.academicInfo?.lastSchoolName || ""}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="board" className="text-sm font-medium text-gray-700">
                            Board / University
                          </label>
                          <Input
                            id="board"
                            value={applicationForm?.academicInfo?.board?.name || ""}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="yop" className="text-sm font-medium text-gray-700">
                            Year of Passing
                          </label>
                          <Input
                            id="yop"
                            value={applicationForm?.academicInfo?.yearOfPassing || ""}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="percentage" className="text-sm font-medium text-gray-700">
                            Percentage / CGPA
                          </label>
                          <Input
                            id="percentage"
                            value={applicationForm?.academicInfo?.percentageOfMarks || ""}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Board Subjects Table */}
                    <div className="space-y-3">
                      <h4 className="text-md font-semibold text-gray-900">12th Board Subjects & Marks</h4>
                      <div className="overflow-x-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-700">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Sr No</th>
                              {/* <th className="px-4 py-3 text-left font-semibold">Subject Code</th> */}
                              <th className="px-4 py-3 text-left font-semibold">Subject Name</th>
                              {/* <th className="px-4 py-3 text-center font-semibold">Passing (Theory)</th> */}
                              {/* <th className="px-4 py-3 text-center font-semibold">Passing (Practical)</th> */}
                              <th className="px-4 py-3 text-center font-semibold">Theory (Obtained/Full)</th>
                              <th className="px-4 py-3 text-center font-semibold">Practical (Obtained/Full)</th>
                              <th className="px-4 py-3 text-center font-semibold">Total (Obtained/Full)</th>
                              <th className="px-4 py-3 text-center font-semibold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {(applicationForm?.academicInfo?.subjects ?? []).length === 0 ? (
                              <tr>
                                <td className="px-4 py-6 text-center text-gray-500" colSpan={5}>
                                  No subjects available
                                </td>
                              </tr>
                            ) : (
                              applicationForm!.academicInfo!.subjects!.map(
                                (item: StudentAcademicSubjectsDto, index: number) => {
                                  const subjectCode = item?.boardSubject?.boardSubjectName?.code || "";
                                  const subjectName =
                                    item?.boardSubject?.boardSubjectName?.name || `Subject ${index + 1}`;
                                  const fullMarksTheory = Number(item?.boardSubject?.fullMarksTheory || 0);
                                  const passingMarksTheory = Number(item?.boardSubject?.passingMarksTheory || 0);
                                  const fullMarksPractical = Number(item?.boardSubject?.fullMarksPractical || 0);
                                  const passingMarksPractical = Number(item?.boardSubject?.passingMarksPractical || 0);
                                  const theoryMarks = Number(item?.theoryMarks || 0);
                                  const practicalMarks = Number(item?.practicalMarks || 0);
                                  const computedMarks = theoryMarks + practicalMarks;
                                  const totalMarks = Number(computedMarks);
                                  const totalFullMarks = fullMarksTheory + fullMarksPractical;
                                  return (
                                    <tr key={index} className="hover:bg-gray-50">
                                      <td className="px-4 py-3">{index + 1}</td>
                                      {/* <td className="px-4 py-3">{subjectCode}</td> */}
                                      <td className="px-4 py-3">{subjectName}</td>
                                      {/* <td className="px-4 py-3 text-center">{passingMarksTheory}</td>
                                      <td className="px-4 py-3 text-center">{passingMarksPractical}</td> */}
                                      <td className="px-4 py-3 text-center">{`${theoryMarks}/${fullMarksTheory}`}</td>
                                      <td className="px-4 py-3 text-center">{`${practicalMarks}/${fullMarksPractical}`}</td>
                                      <td className="px-4 py-3 text-center font-medium">{`${totalMarks}/${totalFullMarks}`}</td>
                                      <td className="px-4 py-3 text-center">
                                        <span
                                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item?.resultStatus === "PASS" ? "bg-green-100 text-green-700" : item?.resultStatus === "FAIL" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                                        >
                                          {item?.resultStatus || "N/A"}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                },
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* {activeTab === "health" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Health Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="bloodGroup" className="text-sm font-medium text-gray-700">
                          Blood Group
                        </label>
                        <Input
                          id="bloodGroup"
                          value={healthDetails?.bloodGroup?.type || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="height" className="text-sm font-medium text-gray-700">
                          Height
                        </label>
                        <Input
                          id="height"
                          value={healthDetails?.height ? `${healthDetails.height} cm` : ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="weight" className="text-sm font-medium text-gray-700">
                          Weight
                        </label>
                        <Input
                          id="weight"
                          value={healthDetails?.weight ? `${healthDetails.weight} kg` : ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="allergies" className="text-sm font-medium text-gray-700">
                          Allergies
                        </label>
                        <Input
                          id="allergies"
                          value={healthDetails?.allergy || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                  </div>
                )} */}

                {false && activeTab === "emergency" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Emergency Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="emergencyContact" className="text-sm font-medium text-gray-700">
                          Contact Person
                        </label>
                        <Input
                          id="emergencyContact"
                          value={emergencyContactDetails?.personName || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="relationship" className="text-sm font-medium text-gray-700">
                          Relationship
                        </label>
                        <Input
                          id="relationship"
                          value={emergencyContactDetails?.havingRelationAs || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="emergencyPhone" className="text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <Input
                          id="emergencyPhone"
                          value={emergencyContactDetails?.phone || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="emergencyEmail" className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <Input
                          id="emergencyEmail"
                          value={emergencyContactDetails?.email || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* {activeTab === "transport" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Transport Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="transportMode" className="text-sm font-medium text-gray-700">
                          Transport Mode
                        </label>
                        <Input
                          id="transportMode"
                          value={transportDetails?.transportInfo?.mode || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="pickupPoint" className="text-sm font-medium text-gray-700">
                          Pickup Point
                        </label>
                        <Input
                          id="pickupPoint"
                          value={transportDetails?.pickupPoint?.name || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="routeName" className="text-sm font-medium text-gray-700">
                          Route Name
                        </label>
                        <Input
                          id="routeName"
                          value={transportDetails?.transportInfo?.routeName || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="driverName" className="text-sm font-medium text-gray-700">
                          Driver Name
                        </label>
                        <Input
                          id="driverName"
                          value={transportDetails?.transportInfo?.driverName || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                  </div>
                )} */}

                {/* {activeTab === "accommodation" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Home className="h-5 w-5" />
                      Accommodation Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="placeOfStay" className="text-sm font-medium text-gray-700">
                          Place of Stay
                        </label>
                        <Input
                          id="placeOfStay"
                          value={accommodationDetails?.placeOfStay || ""}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                          Start Date
                        </label>
                        <Input
                          id="startDate"
                          value={formatDate(accommodationDetails?.startDate || undefined)}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                          End Date
                        </label>
                        <Input
                          id="endDate"
                          value={formatDate(accommodationDetails?.endDate || undefined)}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="accommodationAddress" className="text-sm font-medium text-gray-700">
                          Address
                        </label>
                        <Input
                          id="accommodationAddress"
                          value={formatAddress(accommodationDetails?.address)}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-50" : ""}
                        />
                      </div>
                    </div>
                  </div>
                )} */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
