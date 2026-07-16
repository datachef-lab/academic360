import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Request a high-ish landscape feed; the video fills the dialog (object-cover).
const CAPTURE_WIDTH = 1280;
const CAPTURE_HEIGHT = 720;
// Saved photo is a centred square = this fraction of the displayed video height,
// rendered at OUTPUT_SIZE px. The green frame on screen marks exactly this square.
const CROP_FRACTION = 0.72;
const OUTPUT_SIZE = 600;

interface Props {
  open: boolean;
  onClose: () => void;
  onCapture: (full: Blob, cropped: Blob) => void;
}

export default function WebcamCaptureDialog({ open, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [streamErr, setStreamErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    let mediaStream: MediaStream | null = null;
    setStreamErr(null);
    setStreamReady(false);
    setPreview(null);

    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: CAPTURE_WIDTH },
          height: { ideal: CAPTURE_HEIGHT },
          facingMode: "user",
        },
        audio: false,
      })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .then(() => setStreamReady(true))
            .catch(() => setStreamErr("Could not start camera preview."));
        }
      })
      .catch((err: Error) => {
        setStreamErr(err.message || "Camera access denied.");
      });

    return () => {
      active = false;
      mediaStream?.getTracks().forEach((t) => t.stop());
    };
  }, [open]);

  const handleSnapshot = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Capture at the camera's native resolution for a crisp image.
    const vw = video.videoWidth || CAPTURE_WIDTH;
    const vh = video.videoHeight || CAPTURE_HEIGHT;
    canvas.width = vw;
    canvas.height = vh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, vw, vh);
    setPreview(canvas.toDataURL("image/png"));
  };

  const handleConfirm = async () => {
    if (!canvasRef.current || !preview) return;
    const full: Blob | null = await new Promise((resolve) =>
      canvasRef.current!.toBlob((b) => resolve(b), "image/png", 1),
    );
    if (!full) {
      toast.error("Could not capture snapshot.");
      return;
    }
    // Crop the centred square that the green frame marks. The video fills the
    // stage via object-cover, so map the on-screen square (CROP_FRACTION of the
    // displayed height) back into native pixels using the cover scale factor.
    const src = canvasRef.current;
    const video = videoRef.current;
    const displayW = video?.clientWidth || src.width;
    const displayH = video?.clientHeight || src.height;
    const coverScale = Math.max(displayW / src.width, displayH / src.height);
    const sideDisplay = CROP_FRACTION * displayH;
    const sideNative = Math.min(src.width, src.height, Math.round(sideDisplay / coverScale));
    const cropX = Math.max(0, Math.round((src.width - sideNative) / 2));
    const cropY = Math.max(0, Math.round((src.height - sideNative) / 2));
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = OUTPUT_SIZE;
    cropCanvas.height = OUTPUT_SIZE;
    const cctx = cropCanvas.getContext("2d");
    if (!cctx) return;
    cctx.drawImage(src, cropX, cropY, sideNative, sideNative, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    const cropped: Blob | null = await new Promise((resolve) =>
      cropCanvas.toBlob((b) => resolve(b), "image/png", 1),
    );
    if (!cropped) {
      toast.error("Could not crop photo.");
      return;
    }
    onCapture(full, cropped);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex h-[90vh] w-[90vh] max-h-[90vh] max-w-[90vw] flex-col gap-0 overflow-hidden border-neutral-800 bg-neutral-950 p-0 text-white sm:max-w-[90vw] [&>button]:text-white/70 [&>button]:hover:text-white">
        <DialogHeader className="shrink-0 border-b border-white/10 px-6 py-4">
          <DialogTitle className="text-white">Capture Student Photo</DialogTitle>
        </DialogHeader>

        {streamErr && (
          <div className="shrink-0 px-6 pt-3 text-sm text-red-600">
            {streamErr} – allow camera access and reopen.
          </div>
        )}

        {/* Full-bleed stage: the camera fills the whole dialog body like a
            background. The centred green square marks exactly what gets saved. */}
        <div className="relative min-h-0 flex-1 bg-black">
          <div className="absolute inset-0 overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-cover"
              style={{ visibility: preview ? "hidden" : "visible" }}
            />
            {preview && (
              <img
                src={preview}
                alt="preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {/* Green frame marking exactly the centred square that gets cropped &
              saved (CROP_FRACTION of the displayed video height). The box-shadow
              dims everything outside the capture area. */}
            {streamReady && !preview && (
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-green-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
                style={{ height: `${CROP_FRACTION * 100}%` }}
              >
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-green-500 px-2 py-0.5 text-[11px] font-medium text-white">
                  Capture area
                </span>
              </div>
            )}
            {!streamReady && !preview && !streamErr && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                Connecting to camera…
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-white/10 px-6 py-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-white hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          {!preview ? (
            <Button onClick={handleSnapshot} disabled={!streamReady}>
              Snap
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setPreview(null)}
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Retake
              </Button>
              <Button onClick={handleConfirm}>Use Photo</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
