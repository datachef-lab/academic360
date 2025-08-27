"use client";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { Student } from "@/types/academics/student";
import { useAuth } from "@/hooks/use-auth";
import { BatchCustom } from "@/types/academics/batch";
import { getStudentData } from "@/app/actions/student-actions";
import { StudentAccessControl } from "@/types/academics/access-control";

interface StudentContextType {
  student: Student | null;
  batches: BatchCustom[];
  loading: boolean;
  accessControl: StudentAccessControl | null;
  error: string | null;
  refetch: () => Promise<void>;
}

// Create the context with a default value
const StudentContext = createContext<StudentContextType>({
  student: null,
  batches: [],
  loading: true,
  accessControl: null,
  error: null,
  refetch: async () => {},
});

// Custom hook to use the context
export const useStudent = () => useContext(StudentContext);

// Provider component to wrap around components that need access to the context
export const StudentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [batches, setBatches] = useState<BatchCustom[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [accessControl, setAccessControl] =
    useState<StudentAccessControl | null>(null);

  // Function to fetch student data
  const fetchStudentData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await getStudentData(user?.codeNumber);

      if (!res) {
        throw new Error("Failed to fetch student data");
      }

      // Make sure we copy restriction fields from the auth user to the student data
      if (res.student) {
        setStudent({
          ...res.student,
          mailingPinNo: res.student.mailingPinNo || "", // Provide a default value if undefined
          resiPinNo: res.student.resiPinNo || "", // Provide a default value if undefined
        });
        await fetchAccessControl(res.student.id!);
      }

      setBatches(res.batches || []);
    } catch (err) {
      console.error("Error fetching student data:", err);
      setError("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccessControl = async (studentId: number) => {
    try {
      const response = await fetch(
        `/api/access-control?studentId=${studentId}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      setAccessControl(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch student data when the user changes
  useEffect(() => {
    if (user) {
      fetchStudentData();
    } else {
      setStudent(null);
      setBatches([]);
    }
  }, [user?.codeNumber]);

  // Create the context value object
  const value = useMemo(
    () => ({
      student,
      batches,
      loading,
      accessControl,
      error,
      refetch: fetchStudentData,
    }),
    [student, batches, loading, error]
  );

  // Return the provider with the value
  return (
    <StudentContext.Provider value={value}>{children}</StudentContext.Provider>
  );
};
