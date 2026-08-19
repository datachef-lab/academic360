import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { scanGatePass, type ScanResult } from "../services/service-requests.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, Camera, CameraOff, Loader2, RotateCcw } from "lucide-react";
type ScanState = "idle" | "scanning" | "success" | "error" | "loading";

type JsQRFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
) => { data: string } | null;

export default function GateScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const jsqrRef = useRef<JsQRFn | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualNonce, setManualNonce] = useState("");
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Cooldown to avoid re-scanning same nonce immediately
  const cooldownRef = useRef(false);

  // Load jsQR lazily
  useEffect(() => {
    import("jsqr").then((mod) => {
      // jsqr exports default function
      jsqrRef.current = (mod.default ?? mod) as JsQRFn;
    });
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const performScan = useCallback(async (nonce: string) => {
    if (!nonce) return;
    setScanState("loading");
    setResult(null);
    try {
      const res = await scanGatePass(nonce);
      setResult(res);
      setScanState(res.result === "GREEN" ? "success" : "error");
    } catch {
      setScanState("error");
      setResult({ result: "RED", reason: "Network error or invalid nonce" });
    }
  }, []);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const jsqr = jsqrRef.current;

    if (!video || !canvas || !jsqr || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      rafRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsqr(imageData.data, imageData.width, imageData.height);

    if (code && code.data && !cooldownRef.current) {
      // Extract nonce from scanned URL (format: ...?t=<nonce>) or treat as raw nonce
      let nonce = code.data;
      try {
        const url = new URL(code.data);
        nonce = url.searchParams.get("t") ?? code.data;
      } catch {
        // not a URL — use raw
      }

      if (nonce !== lastScanned) {
        setLastScanned(nonce);
        cooldownRef.current = true;
        setScanState("scanning");
        void performScan(nonce).finally(() => {
          // Resume scanning after 4 seconds
          setTimeout(() => {
            cooldownRef.current = false;
          }, 4000);
        });
      }
    }

    rafRef.current = requestAnimationFrame(scanFrame);
  }, [lastScanned, performScan]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setScanState("idle");
    setResult(null);
    setLastScanned(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setCameraError(msg);
      toast.error(`Camera error: ${msg}`);
    }
  }, [scanFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleReset = () => {
    setScanState("idle");
    setResult(null);
    setLastScanned(null);
    cooldownRef.current = false;
  };

  const handleManualScan = async () => {
    const nonce = manualNonce.trim();
    if (!nonce) {
      toast.error("Enter a nonce or scan URL");
      return;
    }
    await performScan(nonce);
  };

  const isGreen = result?.result === "GREEN";

  return (
    <div className="flex flex-col items-center min-h-full bg-slate-900 p-4 gap-5">
      <h1 className="text-white text-2xl font-bold tracking-tight mt-2">Gate Scanner</h1>

      {/* Result overlay (full-screen feel) */}
      {(scanState === "success" || scanState === "error") && result && (
        <div
          className={`w-full max-w-lg rounded-2xl p-8 flex flex-col items-center gap-4 text-center shadow-2xl ${
            isGreen ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {isGreen ? (
            <CheckCircle2 className="h-20 w-20 text-white" />
          ) : (
            <XCircle className="h-20 w-20 text-white" />
          )}
          <h2 className="text-3xl font-extrabold text-white">
            {isGreen ? "ACCESS GRANTED" : "ACCESS DENIED"}
          </h2>
          {result.reason && (
            <p className="text-white/90 text-lg">{result.reason}</p>
          )}
          {isGreen && result.pass && (
            <div className="text-white/90 text-sm text-left w-full bg-white/10 rounded-lg p-4 space-y-1">
              <p>
                <span className="font-semibold">Visitor:</span>{" "}
                {result.pass.payload.visitorName}
              </p>
              <p>
                <span className="font-semibold">Type:</span> {result.pass.payload.userType}
              </p>
              {result.pass.payload.destinationDept && (
                <p>
                  <span className="font-semibold">Destination:</span>{" "}
                  {result.pass.payload.destinationDept}
                </p>
              )}
              {result.pass.payload.timeSlot && (
                <p>
                  <span className="font-semibold">Time Slot:</span>{" "}
                  {result.pass.payload.timeSlot}
                </p>
              )}
              {result.checkedInAt && (
                <p>
                  <span className="font-semibold">Checked In:</span>{" "}
                  {new Date(result.checkedInAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
          <Button
            onClick={handleReset}
            variant="outline"
            className="bg-white/20 text-white border-white/40 hover:bg-white/30 mt-2"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Scan Next
          </Button>
        </div>
      )}

      {scanState === "loading" && (
        <div className="flex flex-col items-center gap-3 py-10 text-white">
          <Loader2 className="h-12 w-12 animate-spin" />
          <p className="text-lg">Verifying…</p>
        </div>
      )}

      {/* Camera section */}
      {scanState !== "loading" && scanState !== "success" && scanState !== "error" && (
        <div className="w-full max-w-lg flex flex-col gap-4">
          {/* Video viewport */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border-2 border-slate-700">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
              autoPlay
            />
            {/* Scan reticle */}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white/60 rounded-lg relative">
                  {/* Corner marks */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-violet-400 rounded-tl" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-violet-400 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-violet-400 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-violet-400 rounded-br" />
                </div>
              </div>
            )}
            {!cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                <CameraOff className="h-12 w-12" />
              </div>
            )}
          </div>

          {/* Hidden canvas for QR decode */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera controls */}
          <div className="flex gap-3 justify-center">
            {cameraActive ? (
              <Button
                onClick={stopCamera}
                variant="outline"
                className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
              >
                <CameraOff className="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
            ) : (
              <Button
                onClick={startCamera}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            )}
          </div>

          {cameraError && (
            <p className="text-red-400 text-sm text-center">{cameraError}</p>
          )}

          {/* Manual nonce entry */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4 flex flex-col gap-3">
            <Label htmlFor="manual-nonce" className="text-slate-300 text-sm">
              Manual Entry (paste nonce or scan URL)
            </Label>
            <div className="flex gap-2">
              <Input
                id="manual-nonce"
                placeholder="Nonce or URL with ?t=…"
                value={manualNonce}
                onChange={(e) => setManualNonce(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleManualScan()}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
              <Button
                onClick={handleManualScan}
                className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                disabled={!manualNonce.trim()}
              >
                Verify
              </Button>
            </div>
          </div>
        </div>
      )}

      <p className="text-slate-500 text-xs text-center pb-4">
        Scanner is online-only. All verifications are server-side.
      </p>
    </div>
  );
}
