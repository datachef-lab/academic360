export interface ProgressUpdate {
  id: string;
  userId: string;
  type: "export_progress" | "download_progress" | "in_progress";
  message: string;
  progress: number; // 0-100
  status: "started" | "in_progress" | "completed" | "error";
  fileName?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  meta?: Record<string, unknown>;
  // Additional fields for download progress
  stage?: "listing" | "downloading_pdfs" | "downloading_documents" | "creating_zips" | "completed" | "error";
  pdfCount?: number;
  pdfTotal?: number; // Total PDFs that will be downloaded
  documentsCount?: number;
  documentsTotal?: number; // Total documents that will be downloaded
  currentFile?: string;
}
