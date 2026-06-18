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

// Match snapcard: 900×600 landscape webcam feed, then a centred 420×420 crop.
const CAPTURE_WIDTH = 900;
const CAPTURE_HEIGHT = 600;
const CROP_SIZE = 420;

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
    canvas.width = CAPTURE_WIDTH;
    canvas.height = CAPTURE_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
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
    // Take a centred CROP_SIZE×CROP_SIZE square from the captured frame so the
    // face ends up roughly in the middle of the photo region.
    const src = canvasRef.current;
    const cropX = Math.max(0, Math.round((src.width - CROP_SIZE) / 2));
    const cropY = Math.max(0, Math.round((src.height - CROP_SIZE) / 2));
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = CROP_SIZE;
    cropCanvas.height = CROP_SIZE;
    const cctx = cropCanvas.getContext("2d");
    if (!cctx) return;
    cctx.drawImage(src, cropX, cropY, CROP_SIZE, CROP_SIZE, 0, 0, CROP_SIZE, CROP_SIZE);
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Capture Student Photo</DialogTitle>
        </DialogHeader>

        {streamErr && (
          <div className="text-sm text-red-600 mb-2">
            {streamErr} – allow camera access and reopen.
          </div>
        )}

        {/* Fixed-size 3:2 stage matching snapcard's 900×600 frame so dialog
            height never shifts while waiting for camera / preview. */}
        <div
          className="relative mx-auto w-full bg-black/90 rounded-md overflow-hidden"
          style={{ maxWidth: 600, aspectRatio: "3 / 2" }}
        >
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
          {!streamReady && !preview && !streamErr && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
              Connecting to camera…
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {!preview ? (
            <Button onClick={handleSnapshot} disabled={!streamReady}>
              Snap
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setPreview(null)}>
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
