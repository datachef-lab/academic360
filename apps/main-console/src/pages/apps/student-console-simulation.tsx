import React, { useRef, useEffect, useState, useCallback } from "react";
// import MasterLayout from "@/components/layouts/MasterLayout";
// import { ExternalLink } from "lucide-react";
import { Maximize, Minimize } from "lucide-react";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { Button } from "@/components/ui/button";

// Student console base URL - can be configured via env variable
const STUDENT_CONSOLE_BASE_URL = import.meta.env.VITE_APP_STUDENT_CONSOLE_URL || "http://localhost:3000";

// const subLinks = [{ title: "Simulation", url: "simulation", icon: ExternalLink }];

export default function StudentConsoleSimulation() {
  useRestrictTempUsers();
  const { accessToken } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

      // Handle request to open PDF in new tab (from nested iframe)
      if (event.data.type === "OPEN_PDF_IN_NEW_TAB" && event.data.url) {
        // Open the PDF URL in a new tab from the parent window (not blocked by iframe restrictions)
        window.open(event.data.url, "_blank", "noopener,noreferrer");
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

  // Fullscreen functionality
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        const element = containerRef.current as HTMLElement & {
          webkitRequestFullscreen?: () => Promise<void>;
          msRequestFullscreen?: () => Promise<void>;
        };
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          // Safari
          await element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {
          // IE/Edge
          await element.msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        const doc = document as Document & {
          webkitExitFullscreen?: () => Promise<void>;
          msExitFullscreen?: () => Promise<void>;
        };
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          // Safari
          await doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          // IE/Edge
          await doc.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        msFullscreenElement?: Element | null;
      };
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("msfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isFullscreen, toggleFullscreen]);

  return (
    // <MasterLayout subLinks={subLinks}>
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col relative ${isFullscreen ? "fixed inset-0 z-[9999] bg-white p-0" : "p-0"}`}
    >
      {/* Fullscreen Button - Fixed at bottom right */}
      {!isFullscreen && (
        <Button
          onClick={toggleFullscreen}
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-[10000] flex items-center gap-2 bg-white shadow-lg"
        >
          <Maximize className="w-4 h-4" />
          Enter Fullscreen
        </Button>
      )}

      {/* Exit Fullscreen Button - Fixed at bottom right */}
      {isFullscreen && (
        <Button
          onClick={toggleFullscreen}
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-[10000] flex items-center gap-2 bg-white shadow-lg"
        >
          <Minimize className="w-4 h-4" />
          Exit Fullscreen (ESC)
        </Button>
      )}

      {/* Student Console Iframe - Full width and height */}
      <div className="w-full h-full overflow-hidden">
        <iframe
          ref={iframeRef}
          src={studentConsoleUrl}
          className="w-full h-full border-0"
          title="Student Console Simulation"
          allow="camera; microphone; geolocation; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
    // </MasterLayout>
  );
}
