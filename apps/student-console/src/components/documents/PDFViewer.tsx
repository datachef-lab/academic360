"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ExternalLink,
} from "lucide-react";

interface PDFViewerProps {
  url: string;
  onDownload?: () => void;
}

export default function PDFViewer({ url, onDownload }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewerMode, setViewerMode] = useState<"native" | "google">("native");
  const [objectFailed, setObjectFailed] = useState(false);

  // Create Google Docs Viewer URL
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    url
  )}&embedded=true`;

  // Handle zoom in
  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  // Handle zoom out
  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  // Handle rotation
  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Toggle between viewers
  const toggleViewer = () => {
    setViewerMode(viewerMode === "native" ? "google" : "native");
    setLoading(true);
  };

  // Reset loading state when URL changes
  useEffect(() => {
    setLoading(true);
    setObjectFailed(false);
    setViewerMode("native");
  }, [url]);

  // Handle object load error
  const handleObjectError = () => {
    setObjectFailed(true);
    setLoading(false);
  };

  // Add a listener for the iframe to detect if PDF failed to load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && viewerMode === "native") {
        setObjectFailed(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [loading, viewerMode]);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="bg-white border-b border-gray-200 p-2 flex justify-between">
        <div className="flex items-center space-x-2">
          {viewerMode === "native" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomOut}
                disabled={zoom <= 50}
                className="bg-white border-gray-200"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2 text-gray-700">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={zoomIn}
                disabled={zoom >= 200}
                className="bg-white border-gray-200"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rotate}
                className="bg-white border-gray-200"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={toggleViewer}
            className="bg-white border-gray-200"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            {viewerMode === "native"
              ? "Use Google Viewer"
              : "Use Browser Viewer"}
          </Button>
        </div>

        {onDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="bg-white border-gray-200"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 relative overflow-auto bg-white">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {viewerMode === "native" && !objectFailed && (
          <div
            className="w-full h-full"
            style={{
              overflow: "auto",
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: "center center",
              transition: "transform 0.2s ease",
            }}
          >
            <object
              data={url}
              type="application/pdf"
              className="w-full h-full"
              onLoad={() => setLoading(false)}
              onError={handleObjectError}
            >
              <div className="w-full h-full flex flex-col items-center justify-center bg-white p-6">
                <p className="text-gray-700 mb-4 text-center">
                  Unable to display PDF directly. Your browser may be blocking
                  embedded PDFs.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={toggleViewer}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Use Google Viewer
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.open(url, "_blank")}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </object>
          </div>
        )}

        {(viewerMode === "google" || objectFailed) && (
          <div className="w-full h-full bg-white">
            <iframe
              src={googleViewerUrl}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              title="Google Docs PDF Viewer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
