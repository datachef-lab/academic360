"use client";
import { useAuth } from "@/hooks/use-auth";
import { useStudent } from "@/providers/student-provider";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

interface SharedAreaProps {
  children: React.ReactNode;
}

export default function SharedArea({ children }: SharedAreaProps) {
  const { user } = useAuth();
  const { student, accessControl, loading } = useStudent();

  if (!user) return null;

  if (loading || !student || !accessControl) {
    return (
      <LoadingIndicator
        message="Loading your dashboard..."
        subMessage="Please wait while we prepare your student portal"
        fullScreen={true}
      />
    );
  }

  return <>{children}</>;
}
