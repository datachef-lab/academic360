import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ProgressUpdate {
  id: string;
  userId: string;
  type: "export_progress";
  message: string;
  progress: number; // 0-100
  status: "started" | "in_progress" | "completed" | "error";
  fileName?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  meta?: Record<string, unknown>;
}

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

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setProgress(0);
      setMessage("");
      setStatus("started");
      setFileName(undefined);
      setError(undefined);
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
            Export Progress
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
