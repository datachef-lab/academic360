"use client";

import React, { useState, useEffect } from "react";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import WelcomeBanner from "./WelcomeBanner";
import BasicInfo from "./BasicInfo";
import SemesterSummary from "./SemesterSummary";
import ErrorCard from "./ErrorCard";
import StudentMissingCard from "./StudentMissingCard";
import DailyNotices from "./DailyNotices";
import { useStudent } from "@/providers/student-provider";

export default function HomeContent() {
  const { student, loading, batches, error, refetch } = useStudent();
  const [isContentReady, setIsContentReady] = useState(false);

  // Prevent flickering by holding the loading state until content is ready
  useEffect(() => {
    if (!loading && student && batches) {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setIsContentReady(true);
      }, 300);
      return () => clearTimeout(timer);
    } else if (loading) {
      setIsContentReady(false);
    }
  }, [loading, student, batches]);

  // Show loading UI until content is fully ready
  if (loading || !isContentReady) {
    return (
      <LoadingIndicator
        message="Loading your dashboard..."
        subMessage="Please wait while we retrieve your latest information"
      />
    );
  }

  // Error handling for API errors
  if (error) {
    return <ErrorCard error={error} refetch={refetch} />;
  }

  // Error handling for missing data
  if (!student) {
    return <StudentMissingCard refetch={refetch} />;
  }

  // Error handling for missing batches
//   if (!batches || batches.length === 0) {
//     return <BatchesMissingCard refetch={refetch} />;
//   }

  return (
    <div className="space-y-8 min-h-screen">
      <WelcomeBanner student={student} />
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.1fr] auto-rows-fr gap-6">
        <div>
          <BasicInfo student={student} batches={batches} />
          <SemesterSummary student={student} />
        </div>
        <div>
          <DailyNotices />
        </div>
      </div>
    </div>
  );
}

// Stream determination logic
//   let stream;
//   if (batches && batches.length > 0) {
//     switch (batches[0].coursename.trim().toUpperCase()) {
//       case "BBA":
//         stream = "BBA";
//         break;
//       case "B.COM":
//         stream = "BCOM";
//         break;
//       case "B.A.":
//         stream = "BA";
//         break;
//       case "B.SC":
//         stream = "BSC";
//         break;
//       case "B.SC.":
//         stream = "BSC";
//         break;
//       case "B.ED":
//         stream = "BED";
//         break;
//       case "M.COM":
//         stream = "MCOM";
//         break;
//       case "M.A.":
//         stream = "MA";
//         break;
//       default:
//         stream = "BCOM";
//         break;
//     }
//   }
