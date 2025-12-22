"use client";

import React from "react";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import WelcomeBanner from "./WelcomeBanner";
import BasicInfo from "./BasicInfo";
import SemesterSummary from "./SemesterSummary";
import ErrorCard from "./ErrorCard";
import StudentMissingCard from "./StudentMissingCard";
import DailyNotices from "./DailyNotices";
import SubjectSelectionCard from "./SubjectSelectionCard";
import { useStudent } from "@/providers/student-provider";
import { useAuth } from "@/hooks/use-auth";
import type { StudentDto } from "@repo/db/dtos/user";

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
          <h2 className="text-xl font-semibold mb-2">Welcome, {(user.name as string) || "Student"}!</h2>
          <p className="text-gray-600 mb-4">Your student profile is being set up.</p>
          <button onClick={refetch} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Show the main dashboard content
  return (
    <div className="space-y-8 min-h-screen">
      <WelcomeBanner student={student} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicInfo student={student} />
        <SubjectSelectionCard />
      </div>
    </div>
  );
}
