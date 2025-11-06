import React, { useRef, useEffect } from "react";
import MasterLayout from "@/components/layouts/MasterLayout";
import { ExternalLink } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { useAuth } from "@/features/auth/providers/auth-provider";

// Student console base URL - can be configured via env variable
const STUDENT_CONSOLE_BASE_URL = import.meta.env.VITE_STUDENT_CONSOLE_URL || "http://localhost:3000";

const subLinks = [{ title: "Simulation", url: "simulation", icon: ExternalLink }];

export default function StudentConsoleSimulation() {
  useRestrictTempUsers();
  const { accessToken } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Construct student console URL with simulation flag
  const studentConsoleUrl = React.useMemo(() => {
    const url = new URL(STUDENT_CONSOLE_BASE_URL);
    url.searchParams.set("simulation", "true");
    return url.toString();
  }, []);

  // Listen for messages from student console iframe requesting admin token
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      const studentConsoleOrigin = STUDENT_CONSOLE_BASE_URL.replace(/^https?:\/\//, "");
      if (!event.origin.includes(studentConsoleOrigin) && !event.origin.includes("localhost")) {
        return;
      }

      // Handle request for admin token
      if (event.data.type === "REQUEST_ADMIN_TOKEN" && accessToken) {
        // Send admin token to student console
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            {
              type: "ADMIN_TOKEN_RESPONSE",
              token: accessToken,
            },
            STUDENT_CONSOLE_BASE_URL,
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [accessToken]);

  // Send admin token when iframe loads
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !accessToken) return;

    const handleLoad = () => {
      // Wait a bit for iframe to be ready
      setTimeout(() => {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            {
              type: "ADMIN_TOKEN_RESPONSE",
              token: accessToken,
            },
            STUDENT_CONSOLE_BASE_URL,
          );
        }
      }, 500);
    };

    iframe.addEventListener("load", handleLoad);
    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, [accessToken, studentConsoleUrl]);

  return (
    <MasterLayout subLinks={subLinks}>
      <div className="p-6 w-full h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Student Console Simulation</h1>
          <p className="text-gray-600">
            Simulate student console login. Enter a student UID in the console below to login without OTP. This feature
            is only available for admin/staff users.
          </p>
        </div>

        {/* Student Console Iframe */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden min-h-[600px]">
          <iframe
            ref={iframeRef}
            src={studentConsoleUrl}
            className="w-full h-full border-0"
            title="Student Console Simulation"
            allow="camera; microphone; geolocation"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </div>
      </div>
    </MasterLayout>
  );
}
