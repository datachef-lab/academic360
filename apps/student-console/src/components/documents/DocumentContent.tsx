"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Eye, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScanDoc } from "@/lib/services/docs.service";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStudent } from "@/providers/student-provider";
import { useRouter } from "next/navigation";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

interface DocumentContentProps {
  scannedDocs?: ScanDoc[];
}

interface Document {
  filePath: string;
  semester: number | null;
  type: string;
  fileName: string;
  framework?: string;
  year?: number;
}

export default function DocumentContent({ scannedDocs }: DocumentContentProps) {
  const { user, accessToken } = useAuth();
  const { student, batches, accessControl } = useStudent();
  const router = useRouter();
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [selectedView, setSelectedView] = useState<string>("marksheets");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>(
    scannedDocs?.map((doc) => ({
      filePath: doc.filePath,
      semester: doc.semester,
      type: doc.type,
      year: doc.year,
      fileName: doc.filePath.split("/").pop() || "Unknown",
      framework: doc.framework,
    })) || []
  );
  const hasInitialDataRef = React.useRef(
    !!scannedDocs && scannedDocs.length > 0
  );
  const loadingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState<boolean>(!hasInitialDataRef.current);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessControl?.access_course) {
      router.back();
    }
  }, [accessControl, router]);

  // Clear any existing timeout on unmount
  useEffect(() => {
    // Immediately fetch documents when component mounts
    if (user && accessToken && !hasInitialDataRef.current) {
      fetchDocuments();
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [user, accessToken]);

  const fetchDocuments = async () => {
    if (!user || !accessToken) return;

    // If we already have documents from the server, don't fetch again
    if (hasInitialDataRef.current && documents.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Determine stream based on course name
    let stream = "BCOM";
    try {
      if (batches && batches.length > 0) {
        const courseName = batches[0].coursename.trim().toUpperCase();
        switch (courseName) {
          case "BBA":
            stream = "BBA";
            break;
          case "B.COM":
            stream = "BCOM";
            break;
          case "B.A.":
            stream = "BA";
            break;
          case "B.SC":
          case "B.SC.":
            stream = "BSC";
            break;
          case "B.ED":
            stream = "BED";
            break;
          case "M.COM":
            stream = "MCOM";
            break;
          case "M.A.":
            stream = "MA";
            break;
          default:
            stream = "BCOM";
            break;
        }
      }

      // Use the user's rollNumber if available, or fall back to a default for testing
      const rollNumber = student?.univlstexmrollno || "191017-11-0592";

      console.log("Fetching documents with:", {
        rollNumber,
        stream,
      });

      // Create URL with URLSearchParams for proper encoding
      const params = new URLSearchParams();
      params.append("rollNumber", rollNumber);
      params.append("stream", stream);

      const response = await fetch(`/api/docs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      // Create a download URL with the filePath and disposition set to attachment
      const params = new URLSearchParams();
      params.append("filePath", filePath);
      params.append("disposition", "attachment");
      params.append("token", accessToken || "");

      const downloadUrl = `/api/docs?${params.toString()}`;

      // Create a temporary anchor element
      const link = document.createElement("a");

      // Set href with access token as query parameter for authentication
      link.href = downloadUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      // Trigger the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download document. Please try again.");
    }
  };

  const handlePreview = (filePath: string) => {
    // Get file extension
    const fileExt = filePath.split(".").pop()?.toLowerCase();

    // Include access token in the preview URL and set disposition to inline
    const params = new URLSearchParams();
    params.append("filePath", filePath);
    params.append("disposition", "inline");
    params.append("token", accessToken || "");

    const previewUrl = `/api/docs?${params.toString()}`;

    // For debugging purposes
    console.log(`Previewing ${fileExt} file: ${filePath}`);

    setPreviewUrl(previewUrl);
  };

  const closePreview = () => {
    setPreviewUrl(null);
  };

  // Filter documents based on selected tab and semester
  const filteredDocuments = documents.filter((doc) => {
    const isMarksheet = doc.type.toUpperCase().includes("MARKSHEET");

    if (selectedView === "marksheets" && !isMarksheet) {
      return false;
    }

    if (selectedView === "other-documents" && isMarksheet) {
      return false;
    }

    if (selectedView === "marksheets" && selectedSemester !== "all") {
      return doc.semester === parseInt(selectedSemester);
    }

    return true;
  });

  // Get unique semesters for the semester dropdown
  const semesters = [
    ...new Set(
      documents
        .filter((doc) => doc.semester !== null)
        .map((doc) => doc.semester)
    ),
  ].sort((a, b) => (a || 0) - (b || 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white py-10 px-6 mb-8 rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-400 mix-blend-overlay blur-2xl"></div>
          <div className="absolute right-40 top-20 w-32 h-32 rounded-full bg-purple-400 mix-blend-overlay blur-xl"></div>
          <div className="absolute left-20 bottom-10 w-48 h-48 rounded-full bg-indigo-300 mix-blend-overlay blur-2xl"></div>
          <div className="absolute inset-0 bg-[url('/illustrations/dots-pattern.svg')] opacity-5"></div>
        </div>
        <div className="max-w-6xl mx-auto relative">
          <div className="flex items-center">
            <div className="mr-5 bg-white/10 backdrop-blur-sm p-4 rounded-xl shadow-xl border border-white/10">
              <FileText size={36} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-md">
                Academic Documents
              </h1>
              <p className="text-blue-50 text-lg drop-shadow max-w-2xl">
                Access and manage all your important academic documents in one
                place
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div className="bg-white/70 backdrop-blur-sm px-5 py-3 rounded-xl shadow-sm border border-indigo-100">
            <Tabs
              value={selectedView}
              onValueChange={setSelectedView}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-[360px] bg-indigo-50">
                <TabsTrigger
                  value="marksheets"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white"
                >
                  Marksheets
                </TabsTrigger>
                <TabsTrigger
                  value="other-documents"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white"
                >
                  Other Documents
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {selectedView === "marksheets" && semesters.length > 0 && (
            <div className="mt-4 sm:mt-0">
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
              >
                <SelectTrigger className="w-[180px] border-indigo-200 bg-white/80 backdrop-blur-sm">
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem} value={sem?.toString() || ""}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {loading && (
          <LoadingIndicator
            variant="inline"
            message="Loading documents..."
            subMessage="This may take a moment as we securely retrieve your documents."
          />
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && documents.length === 0 && (
          <div className="text-center py-12 bg-white/50 rounded-lg shadow-sm">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              No Documents Found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              We couldn&apos;t find any documents for your account. If you
              believe this is an error, please contact the administrative staff.
            </p>
          </div>
        )}

        {!loading && filteredDocuments.length > 0 && (
          <Tabs
            value={selectedView}
            onValueChange={setSelectedView}
            className="mt-0"
          >
            <TabsContent value="marksheets">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDocuments.map((doc, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/30 group"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 w-full"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center text-gray-800 group-hover:text-blue-700 transition-colors">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-lg mr-3 text-white shadow-md">
                              <FileText className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">
                              {doc.type}{" "}
                              {doc.semester ? `(Semester ${doc.semester})` : ""}
                            </span>
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-2 ml-12 flex items-center">
                            <span className="h-2 w-2 rounded-full bg-blue-400 mr-2"></span>
                            {doc.framework && (
                              <span className="mr-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                                {doc.framework}
                              </span>
                            )}
                            {doc.year && (
                              <span className="mr-2">{doc.year}</span>
                            )}
                            <span>Filename: {doc.fileName}</span>
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-5">
                      <div className="flex space-x-3 mt-4">
                        <Button
                          variant="outline"
                          className="border-blue-100 hover:border-blue-200 hover:bg-blue-50 text-gray-600 hover:text-blue-700 transition-colors"
                          onClick={() => handlePreview(doc.filePath)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                          onClick={() => handleDownload(doc.filePath)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="other-documents">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDocuments.map((cert, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30 group"
                  >
                    <div className="h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 w-full"></div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center text-gray-800 group-hover:text-purple-700 transition-colors">
                            <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2.5 rounded-lg mr-3 text-white shadow-md">
                              <FileText className="w-5 h-5" />
                            </div>
                            <span className="font-semibold">{cert.type}</span>
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-2 ml-12 flex items-center">
                            <span className="h-2 w-2 rounded-full bg-purple-400 mr-2"></span>
                            {cert.framework && (
                              <span className="mr-2 px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">
                                {cert.framework}
                              </span>
                            )}
                            {cert.year && (
                              <span className="mr-2">{cert.year}</span>
                            )}
                            <span>Filename: {cert.fileName}</span>
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-5">
                      <div className="flex space-x-3 mt-4">
                        <Button
                          variant="outline"
                          className="border-purple-100 hover:border-purple-200 hover:bg-purple-50 text-gray-600 hover:text-purple-700 transition-colors"
                          onClick={() => handlePreview(cert.filePath)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-md hover:shadow-lg transition-all"
                          onClick={() => handleDownload(cert.filePath)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={closePreview}>
        <DialogContent className="max-w-none w-full h-screen p-0 m-0 border-0 rounded-none overflow-hidden bg-white">
          {/* Minimal floating controls */}
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm rounded-full border-gray-300 shadow-md"
              onClick={() => previewUrl && window.open(previewUrl, "_blank")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm rounded-full border-gray-300 shadow-md"
              onClick={() => {
                if (previewUrl) {
                  const downloadUrl = previewUrl.replace(
                    "disposition=inline",
                    "disposition=attachment"
                  );
                  window.open(downloadUrl, "_blank");
                }
              }}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm rounded-full border-gray-300 shadow-md"
              onClick={closePreview}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Direct PDF display */}
          <iframe
            src={previewUrl || ""}
            className="w-full h-full border-0"
            title="PDF Preview"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
