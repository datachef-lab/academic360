import React from "react";

interface LoadingIndicatorProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
  variant?: "default" | "inline" | "minimal";
}

export function LoadingIndicator({
  message = "Loading data...",
  subMessage = "Please wait while we retrieve your information",
  fullScreen = false,
  variant = "default",
}: LoadingIndicatorProps) {
  if (variant === "minimal") {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
        {message && (
          <span className="ml-3 text-sm font-medium text-indigo-700">
            {message}
          </span>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="relative bg-white/10 p-6 rounded-xl mb-8">
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="text-lg font-medium text-indigo-700">{message}</p>
          </div>
          {subMessage && (
            <div className="w-full max-w-md bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">{subMessage}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant with full page or contained options
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? "fixed inset-0 z-50 bg-white/80" : "h-[80vh]"
      } bg-white/95 rounded-xl p-8 shadow-sm`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
        </div>
        <p className="text-purple-800 font-medium animate-pulse text-xl">
          {message}
        </p>
        {subMessage && (
          <p className="text-gray-500 text-sm text-center max-w-md">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
}
