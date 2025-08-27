"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  User,
  Users,
  BookText,
  Award,
  Clock,
  GraduationCap,
} from "lucide-react";
import Image from "next/image";
import { useStudent } from "@/providers/student-provider";

export default function ProfileContent() {
  const { student, batches } = useStudent();
  const [activeTab, setActiveTab] = useState("basic");

  if (!student) return <div className="p-6">Student data not found</div>;

  // Helper function to format date
  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "basic":
        return (
          <Card className="shadow-md rounded-xl border-none overflow-hidden">
            <CardHeader className="bg-blue-600 py-4">
              <CardTitle className="text-xl text-white flex items-center">
                <div className="mr-3 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white">
              <div className="space-y-1.5 bg-blue-50 p-4 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all">
                <p className="text-sm font-medium text-blue-600">Full Name</p>
                <p className="font-medium text-lg">{student.name}</p>
              </div>
              <div className="space-y-1.5 bg-amber-50 p-4 rounded-lg border border-amber-100 hover:bg-amber-100 transition-all">
                <p className="text-sm font-medium text-amber-600">
                  Date of Birth
                </p>
                <p className="font-medium text-lg">
                  {formatDate(student.dateOfBirth)}
                </p>
              </div>
              <div className="space-y-1.5 bg-indigo-50 p-4 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all">
                <p className="text-sm font-medium text-indigo-600">Gender</p>
                <p className="font-medium text-lg">
                  {student.sexId === 1
                    ? "Male"
                    : student.sexId === 2
                    ? "Female"
                    : "Not Specified"}
                </p>
              </div>
              <div className="space-y-1.5 bg-emerald-50 p-4 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all">
                <p className="text-sm font-medium text-emerald-600">
                  Nationality
                </p>
                <p className="font-medium text-lg">
                  {student?.nationalityName?.trim() || "Not Specified"}
                </p>
              </div>
              <div className="space-y-1.5 bg-rose-50 p-4 rounded-lg border border-rose-100 hover:bg-rose-100 transition-all md:col-span-2">
                <p className="text-sm font-medium text-rose-600">
                  Aadhar Card Number
                </p>
                <p className="font-medium text-lg">
                  {student.aadharcardno || "Not Provided"}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      case "family":
        return (
          <Card className="shadow-md rounded-xl border-none overflow-hidden">
            <CardHeader className="bg-purple-600 py-4">
              <CardTitle className="text-xl text-white flex items-center">
                <div className="mr-3 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                Family Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white">
              <div className="space-y-1.5 bg-purple-50 p-4 rounded-lg border border-purple-100 hover:bg-purple-100 transition-all">
                <p className="text-sm font-medium text-purple-600">
                  Father&apos;s Name
                </p>
                <p className="font-medium text-lg">
                  {student.fatherName || "Not Provided"}
                </p>
              </div>
              <div className="space-y-1.5 bg-blue-50 p-4 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all">
                <p className="text-sm font-medium text-blue-600">
                  Father&apos;s Contact
                </p>
                <p className="font-medium text-lg">
                  {student.fatherMobNo || "Not Provided"}
                </p>
              </div>
              <div className="space-y-1.5 bg-pink-50 p-4 rounded-lg border border-pink-100 hover:bg-pink-100 transition-all">
                <p className="text-sm font-medium text-pink-600">
                  Mother&apos;s Name
                </p>
                <p className="font-medium text-lg">
                  {student.motherName || "Not Provided"}
                </p>
              </div>
              <div className="space-y-1.5 bg-rose-50 p-4 rounded-lg border border-rose-100 hover:bg-rose-100 transition-all">
                <p className="text-sm font-medium text-rose-600">
                  Mother&apos;s Contact
                </p>
                <p className="font-medium text-lg">
                  {student.motherMobNo || "Not Provided"}
                </p>
              </div>
              <div className="space-y-1.5 bg-violet-50 p-4 rounded-lg border border-violet-100 hover:bg-violet-100 transition-all">
                <p className="text-sm font-medium text-violet-600">
                  Guardian&apos;s Name
                </p>
                <p className="font-medium text-lg">
                  {student.guardianName || "Not Provided"}
                </p>
              </div>
              <div className="space-y-1.5 bg-indigo-50 p-4 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all">
                <p className="text-sm font-medium text-indigo-600">
                  Guardian&apos;s Contact
                </p>
                <p className="font-medium text-lg">
                  {student.guardianMobNo || "Not Provided"}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      case "academic":
        return (
          <Card className="shadow-md rounded-xl border-none overflow-hidden">
            <CardHeader className="bg-emerald-600 py-4">
              <CardTitle className="text-xl text-white flex items-center">
                <div className="mr-3 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <BookText className="h-5 w-5 text-white" />
                </div>
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white">
              <div className="space-y-1.5 bg-emerald-50 p-4 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-all">
                <p className="text-sm font-medium text-emerald-600">Course</p>
                <p className="font-medium text-lg">
                  {(batches && batches[batches.length - 1]?.coursename) ||
                    "Not Available"}
                </p>
              </div>
              <div className="space-y-1.5 bg-teal-50 p-4 rounded-lg border border-teal-100 hover:bg-teal-100 transition-all">
                <p className="text-sm font-medium text-teal-600">Section</p>
                <p className="font-medium text-lg">
                  {(batches && batches[batches.length - 1]?.sectionName) ||
                    "Not Available"}
                </p>
              </div>
              <div className="space-y-1.5 bg-blue-50 p-4 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all">
                <p className="text-sm font-medium text-blue-600">
                  Class Roll Number
                </p>
                <p className="font-medium text-lg">
                  {student.rollNumber || "Not Assigned"}
                </p>
              </div>
              <div className="space-y-1.5 bg-indigo-50 p-4 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all">
                <p className="text-sm font-medium text-indigo-600">UID</p>
                <p className="font-medium text-lg">
                  {student.codeNumber || "Not Assigned"}
                </p>
              </div>
              <div className="space-y-1.5 bg-amber-50 p-4 rounded-lg border border-amber-100 hover:bg-amber-100 transition-all">
                <p className="text-sm font-medium text-amber-600">
                  Admission Year
                </p>
                <p className="font-medium text-lg">
                  {student.admissiondate
                    ? new Date(student.admissiondate).getFullYear()
                    : "Not Available"}
                </p>
              </div>
              <div className="space-y-1.5 bg-orange-50 p-4 rounded-lg border border-orange-100 hover:bg-orange-100 transition-all">
                <p className="text-sm font-medium text-orange-600">
                  Admission Date
                </p>
                <p className="font-medium text-lg">
                  {formatDate(student.admissiondate)}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      case "previous":
        return (
          <Card className="shadow-md rounded-xl border-none overflow-hidden">
            <CardHeader className="bg-amber-600 py-4">
              <CardTitle className="text-xl text-white flex items-center">
                <div className="mr-3 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                Previous Education
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white">
              <div className="space-y-1.5 bg-amber-50 p-4 rounded-lg border border-amber-100 hover:bg-amber-100 transition-all">
                <p className="text-sm font-medium text-amber-600">
                  Last Institution Name
                </p>
                <p className="font-medium text-lg">
                  {student.lastInstitution || "Not Provided"}
                </p>
              </div>
              <div className="space-y-1.5 bg-orange-50 p-4 rounded-lg border border-orange-100 hover:bg-orange-100 transition-all">
                <p className="text-sm font-medium text-orange-600">
                  Last Board/University
                </p>
                <p className="font-medium text-lg">
                  {student.lastBoardUniversity
                    ? `ID: ${student.lastBoardUniversity}`
                    : "Not Provided"}
                </p>
              </div>
              <div className="space-y-1.5 bg-yellow-50 p-4 rounded-lg border border-yellow-100 hover:bg-yellow-100 transition-all md:col-span-2">
                <p className="text-sm font-medium text-yellow-600">
                  Passed Year
                </p>
                <p className="font-medium text-lg">
                  {student.lspassedyr || "Not Provided"}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 bg-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-700">Student Profile</h1>
        {student.leavingdate && (
          <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 py-1.5 px-3 text-white">
            <Image
              src="/illustrations/profile/badge.svg"
              alt="Graduate Badge"
              width={16}
              height={16}
              className="mr-2 filter invert"
            />
            Graduated
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Profile Card and Quick Info */}
        <div className="col-span-12 md:col-span-5 lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <Card className="overflow-hidden border-none shadow-lg rounded-xl">
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 h-40 relative">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-blue-400 mix-blend-overlay"></div>
                <div className="absolute right-20 top-10 w-20 h-20 rounded-full bg-purple-400 mix-blend-overlay"></div>
                <div className="absolute left-10 bottom-5 w-28 h-28 rounded-full bg-indigo-300 mix-blend-overlay"></div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-16">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-xl flex items-center justify-center overflow-hidden">
                  {student?.imgFile ? (
                    <Image
                      src={`https://74.207.233.48:8443/hrclIRP/studentimages/${student?.imgFile}`}
                      alt={student?.name || "student-profile-image"}
                      className="h-full w-full object-cover"
                      width={128}
                      height={128}
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-full w-full flex items-center justify-center">
                      <User
                        className="h-14 w-14 text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-20 pb-6 px-6 text-center">
              <h2 className="text-2xl font-bold text-gray-800">
                {student.name}
              </h2>
              <p className="text-indigo-600 font-medium">
                UID: {student.codeNumber}
              </p>
            </div>
          </Card>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xs text-blue-600 font-medium">Email</span>
                <p className="text-gray-800 font-medium truncate">
                  {student.institutionalemail || student.email || "N/A"}
                </p>
              </div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xs text-green-600 font-medium">
                  Phone
                </span>
                <p className="text-gray-800 font-medium">
                  {student.phoneMobileNo || student.contactNo || "N/A"}
                </p>
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xs text-purple-600 font-medium">
                  Framework
                </span>
                <p className="text-gray-800 font-medium">
                  {student.coursetype || "N/A"}
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xs text-amber-600 font-medium">
                  Date of Birth
                </span>
                <p className="text-gray-800 font-medium">
                  {formatDate(student.dateOfBirth)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Tab Navigation and Content */}
        <div className="col-span-12 md:col-span-7 lg:col-span-8 space-y-6">
          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-4 divide-x divide-gray-100">
              <button
                onClick={() => setActiveTab("basic")}
                className={`py-4 px-2 flex flex-col items-center transition-colors ${
                  activeTab === "basic"
                    ? "bg-blue-50 text-blue-700 border-t-2 border-blue-600"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <User className="h-5 w-5 mb-1" />
                <span className="text-sm font-medium">Personal</span>
              </button>
              <button
                onClick={() => setActiveTab("family")}
                className={`py-4 px-2 flex flex-col items-center transition-colors ${
                  activeTab === "family"
                    ? "bg-purple-50 text-purple-700 border-t-2 border-purple-600"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Users className="h-5 w-5 mb-1" />
                <span className="text-sm font-medium">Family</span>
              </button>
              <button
                onClick={() => setActiveTab("academic")}
                className={`py-4 px-2 flex flex-col items-center transition-colors ${
                  activeTab === "academic"
                    ? "bg-emerald-50 text-emerald-700 border-t-2 border-emerald-600"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <BookText className="h-5 w-5 mb-1" />
                <span className="text-sm font-medium">Academic</span>
              </button>
              <button
                onClick={() => setActiveTab("previous")}
                className={`py-4 px-2 flex flex-col items-center transition-colors ${
                  activeTab === "previous"
                    ? "bg-amber-50 text-amber-700 border-t-2 border-amber-600"
                    : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                <Award className="h-5 w-5 mb-1" />
                <span className="text-sm font-medium">Education</span>
              </button>
            </div>
          </div>

          {/* Content Panel */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
