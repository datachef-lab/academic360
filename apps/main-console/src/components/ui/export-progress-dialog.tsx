import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { ProgressUpdate } from "@/types/progress";

interface ExportProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  progressUpdate?: ProgressUpdate | null;
}

export function ExportProgressDialog({ isOpen, onClose, progressUpdate }: ExportProgressDialogProps) {
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"started" | "in_progress" | "completed" | "error">("started");
  const [fileName, setFileName] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const [stage, setStage] = useState<string>("");
  const [pdfCount, setPdfCount] = useState<number | undefined>(undefined);
  const [pdfTotal, setPdfTotal] = useState<number | undefined>(undefined);
  const [documentsCount, setDocumentsCount] = useState<number | undefined>(undefined);
  const [documentsTotal, setDocumentsTotal] = useState<number | undefined>(undefined);
  const [currentFile, setCurrentFile] = useState<string>("");

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setProgress(0);
      setMessage("");
      setStatus("started");
      setFileName(undefined);
      setError(undefined);
      setStage("");
      setPdfCount(undefined);
      setPdfTotal(undefined);
      setDocumentsCount(undefined);
      setDocumentsTotal(undefined);
      setCurrentFile("");
    }
  }, [isOpen]);

  // Update progress when progressUpdate prop changes
  useEffect(() => {
    if (progressUpdate) {
      console.log("Progress dialog received update:", progressUpdate);
      setProgress(progressUpdate.progress);
      setMessage(progressUpdate.message);
      setStatus(progressUpdate.status);

      if (progressUpdate.fileName) {
        setFileName(progressUpdate.fileName);
      }

      if (progressUpdate.error) {
        setError(progressUpdate.error);
      }

      // Handle download progress specific fields
      if (progressUpdate.stage) {
        setStage(progressUpdate.stage);
      }

      if (progressUpdate.pdfCount !== undefined) {
        setPdfCount(progressUpdate.pdfCount);
      }

      if (progressUpdate.pdfTotal !== undefined) {
        setPdfTotal(progressUpdate.pdfTotal);
      }

      if (progressUpdate.documentsCount !== undefined) {
        setDocumentsCount(progressUpdate.documentsCount);
      }

      if (progressUpdate.documentsTotal !== undefined) {
        setDocumentsTotal(progressUpdate.documentsTotal);
      }

      if (progressUpdate.currentFile) {
        setCurrentFile(progressUpdate.currentFile);
      }
    }
  }, [progressUpdate]);

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "in_progress":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Starting</Badge>;
    }
  };

  // Auto close after completion
  useEffect(() => {
    if (status === "completed") {
      const timer = setTimeout(() => {
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  const handleClose = () => {
    if (status === "completed" || status === "error") {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {progressUpdate?.type === "download_progress" ? "Download Progress" : "Export Progress"}
            {getStatusBadge()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Status Message */}
          <div className="space-y-2">
            <p className="text-sm text-slate-700">{message}</p>
            {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
          </div>

          {/* File Name */}
          {fileName && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">File Name:</p>
              <p className="text-sm text-slate-600 bg-slate-50 p-2 rounded font-mono break-all whitespace-pre-wrap">
                {fileName}
              </p>
            </div>
          )}

          {/* Download Progress Details */}
          {(stage || pdfCount !== undefined || documentsCount !== undefined || currentFile) && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Download Details:</p>
              <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded space-y-1">
                {stage && (
                  <div className="flex justify-between">
                    <span>Stage:</span>
                    <span className="font-medium capitalize">{stage.replace("_", " ")}</span>
                  </div>
                )}
                {pdfCount !== undefined && pdfTotal !== undefined && progressUpdate?.stage === "downloading_pdfs" && (
                  <div className="flex justify-between">
                    <span>PDFs Downloaded:</span>
                    <span className="font-medium">
                      {pdfCount} of {pdfTotal}
                    </span>
                  </div>
                )}
                {documentsCount !== undefined &&
                  documentsTotal !== undefined &&
                  progressUpdate?.stage === "downloading_documents" && (
                    <div className="flex justify-between">
                      <span>Documents Downloaded:</span>
                      <span className="font-medium">
                        {documentsCount} of {documentsTotal}
                      </span>
                    </div>
                  )}
                {currentFile && (
                  <div className="flex justify-between">
                    <span>Current File:</span>
                    <span className="font-medium truncate ml-2">{currentFile}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            {(status === "completed" || status === "error") && (
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            )}
          </div>

          {/* Progress Steps */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600">Export Steps:</p>
            <div className="space-y-1 text-xs">
              <div className={`flex items-center gap-2 ${progress >= 10 ? "text-green-600" : "text-slate-400"}`}>
                <div className={`w-2 h-2 rounded-full ${progress >= 10 ? "bg-green-600" : "bg-slate-300"}`} />
                Fetching metadata
              </div>
              <div className={`flex items-center gap-2 ${progress >= 30 ? "text-green-600" : "text-slate-400"}`}>
                <div className={`w-2 h-2 rounded-full ${progress >= 30 ? "bg-green-600" : "bg-slate-300"}`} />
                Loading student data
              </div>
              <div className={`flex items-center gap-2 ${progress >= 80 ? "text-green-600" : "text-slate-400"}`}>
                <div className={`w-2 h-2 rounded-full ${progress >= 80 ? "bg-green-600" : "bg-slate-300"}`} />
                Generating Excel file
              </div>
              <div className={`flex items-center gap-2 ${progress >= 100 ? "text-green-600" : "text-slate-400"}`}>
                <div className={`w-2 h-2 rounded-full ${progress >= 100 ? "bg-green-600" : "bg-slate-300"}`} />
                Export completed
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
