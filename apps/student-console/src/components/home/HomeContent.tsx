"use client";

import React from "react";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import WelcomeBanner from "./WelcomeBanner";
import BasicInfo from "./BasicInfo";
import SemesterSummary from "./SemesterSummary";
import ErrorCard from "./ErrorCard";
import StudentMissingCard from "./StudentMissingCard";
import DailyNotices from "./DailyNotices";
import { useStudent } from "@/providers/student-provider";
import { useAuth } from "@/hooks/use-auth";
import { Student } from "@/types/academics/student";
import { StudentDto } from "@repo/db/dtos/user";

// Helper function to map StudentDto to the expected Student type for child components
function mapStudentDtoToStudent(studentDto: StudentDto): Student {
  return {
    // Map the basic properties
    id: studentDto.id,
    name: studentDto.name,
    email: studentDto.personalDetails?.email,
    contactNo: studentDto.personalDetails?.phoneNumber,
    phoneMobileNo: studentDto.personalDetails?.phoneNumber,
    dateOfBirth: studentDto.personalDetails?.dateOfBirth ? new Date(studentDto.personalDetails.dateOfBirth) : undefined,
    sexId:
      studentDto.personalDetails?.gender === "MALE"
        ? 1
        : studentDto.personalDetails?.gender === "FEMALE"
          ? 2
          : undefined,

    // Map academic identifier properties
    codeNumber: studentDto.academicIdentifier?.uid || "",
    rollNumber: studentDto.academicIdentifier?.rollNumber,

    // Map personal details
    nationalityId: studentDto.personalDetails?.nationality?.id,
    religionId: studentDto.personalDetails?.religion?.id,
    studentCategoryId: studentDto.personalDetails?.category?.id,
    motherTongueId: studentDto.personalDetails?.motherTongue?.id,

    // Map addresses
    mailingAddress: studentDto.personalDetails?.mailingAddress?.addressLine,
    residentialAddress: studentDto.personalDetails?.residentialAddress?.addressLine,

    // Map family details (if available)
    fatherName: studentDto.family?.fatherDetails?.name,
    fatherMobNo: studentDto.family?.fatherDetails?.phoneNumber,
    motherName: studentDto.family?.motherDetails?.name,
    motherMobNo: studentDto.family?.motherDetails?.phoneNumber,
    guardianName: studentDto.family?.guardianDetails?.name,
    guardianMobNo: studentDto.family?.guardianDetails?.phoneNumber,

    // Map other properties with defaults
    tmpApplicationId: null,
    mailingPinNo: undefined,
    resiPinNo: undefined,
    admissionYear: undefined,
    oldcodeNumber: undefined,
    active: undefined,
    alumni: undefined,
    imgFile: undefined,
    applicantSignature: undefined,
    resiPhoneMobileNo: undefined,
    bloodGroup: undefined,
    eyePowerLeft: undefined,
    eyePowerRight: undefined,
    emrgnResidentPhNo: undefined,
    emrgnOfficePhNo: undefined,
    emrgnMotherMobNo: undefined,
    emrgnFatherMobNo: undefined,
    lastInstitution: undefined,
    lastInstitutionAddress: undefined,
    handicapped: undefined,
    handicappedDetails: undefined,
    lsmedium: undefined,
    annualFamilyIncome: undefined,
    lastBoardUniversity: undefined,
    institutionId: undefined,
    fatherOccupation: 0,
    fatherOffPhone: undefined,
    fatherEmail: undefined,
    motherOccupation: 0,
    motherOffPhone: undefined,
    motherEmail: undefined,
    guardianOccupation: 0,
    guardianOffAddress: undefined,
    guardianOffPhone: undefined,
    guardianEmail: undefined,
    admissioncodeno: undefined,
    // Add other required properties with appropriate defaults
  } as Student;
}

export default function HomeContent() {
  const { student, loading, batches, error, refetch } = useStudent();
  const { user } = useAuth();

  console.log("🏠 HomeContent render:", {
    loading,
    hasStudent: !!student,
    hasUser: !!user,
    error,
  });

  // Show loading while auth is still checking
  if (loading) {
    return (
      <LoadingIndicator
        message="Loading your dashboard..."
        subMessage="Please wait while we retrieve your latest information"
      />
    );
  }

  // Error handling for API errors (but not "No student profile found")
  if (error && error !== "No student profile found") {
    return <ErrorCard error={error} refetch={refetch} />;
  }

  // If no user after auth is complete, show missing card
  if (!user) {
    return <StudentMissingCard refetch={refetch} />;
  }

  // If user exists but no student data, show welcome message
  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user.payload?.name || "Student"}!</h2>
          <p className="text-gray-600 mb-4">Your student profile is being set up.</p>
          <button onClick={refetch} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Map StudentDto to Student type for child components
  const mappedStudent = mapStudentDtoToStudent(student);

  // Show the main dashboard content
  return (
    <div className="space-y-8 min-h-screen">
      <WelcomeBanner student={mappedStudent} />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.1fr] auto-rows-fr gap-6">
        <div>
          <BasicInfo student={mappedStudent} batches={batches} />
          <SemesterSummary student={mappedStudent} />
        </div>
        <div>
          <DailyNotices />
        </div>
      </div>
    </div>
  );
}
