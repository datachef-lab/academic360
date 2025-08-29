"use client";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { BatchCustom } from "@/types/academics/batch";
import { StudentAccessControl } from "@/types/academics/access-control";
import { StudentDto } from "@repo/db/dtos/user";

interface StudentContextType {
  student: StudentDto | null;
  batches: BatchCustom[];
  loading: boolean;
  accessControl: StudentAccessControl | null;
  error: string | null;
  refetch: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType>({
  student: null,
  batches: [],
  loading: false,
  accessControl: null,
  error: null,
  refetch: async () => {},
});

export const useStudent = () => useContext(StudentContext);

export const StudentProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [student, setStudent] = useState<StudentDto | null>(null);
  const [batches, setBatches] = useState<BatchCustom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [accessControl, setAccessControl] = useState<StudentAccessControl | null>(null);

  const fetchStudentData = async () => {
    console.log("📋 fetchStudentData called", {
      hasUser: !!user,
      hasPayload: !!user?.payload,
    });

    if (!user) {
      console.log("❌ No user found");
      setStudent(null);
      setError(null);
      return;
    }

    if (!user.payload) {
      console.log("❌ User has no student data");
      setStudent(null);
      setError("No student profile found");
      return;
    }

    console.log("✅ Setting student data from user payload");
    setStudent(user.payload);
    setError(null);
  };

  useEffect(() => {
    if (!authLoading) {
      fetchStudentData();
    }
  }, [user, authLoading]);

  const value = useMemo(
    () => ({
      student,
      batches,
      loading: authLoading || loading,
      accessControl,
      error,
      refetch: fetchStudentData,
    }),
    [student, batches, loading, authLoading, accessControl, error],
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
};
