"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCollegeSettings } from "@/hooks/use-college-settings";
import {
  fetchServiceTypes,
  createAlumniIntake,
  sendOtp,
  checkOtp,
  submitServiceRequest,
} from "@/services/service-requests.service";
import type { ServiceType } from "@/services/service-requests.service";

export const dynamic = "force-dynamic";

type Step = "identity" | "otp" | "request" | "done";

const ID_PROOF_TYPES = [
  { value: "OLD_ID_CARD", label: "Old College ID Card" },
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "PASSPORT", label: "Passport" },
  { value: "OTHER", label: "Other Government ID" },
];

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "identity", label: "Identity" },
    { key: "otp", label: "Verify" },
    { key: "request", label: "Request" },
    { key: "done", label: "Done" },
  ];
  const idx = steps.findIndex((s) => s.key === step);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < idx
                ? "bg-green-500 text-white"
                : i === idx
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-400"
            }`}
          >
            {i < idx ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          <span
            className={`text-xs font-medium ${i === idx ? "text-indigo-700" : "text-gray-400"}`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="h-px w-6 bg-gray-300" />}
        </div>
      ))}
    </div>
  );
}

export default function AlumniIntakePage() {
  const { collegeName, abbreviation, logoUrl } = useCollegeSettings();
  const router = useRouter();

  const [step, setStep] = useState<Step>("identity");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Identity form
  const [form, setForm] = useState({
    fullName: "",
    yearOfPassing: "",
    courseStream: "",
    universityRegNo: "",
    collegeRollNo: "",
    mobileWhatsapp: "",
    email: "",
    idProofType: "",
  });
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Service types
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);

  useEffect(() => {
    fetchServiceTypes().then(setServiceTypes).catch(console.error);
  }, []);

  // OTP step state
  const [intakeId, setIntakeId] = useState<number | null>(null);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(600); // 10 min
  const [referenceToken, setReferenceToken] = useState("");

  // Done step
  const [referenceId, setReferenceId] = useState("");

  // Countdown timer
  useEffect(() => {
    if (step !== "otp" || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Step 1: Identity → create intake + send OTP ──────────────────────────

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idProofFile) {
      setError("Please upload an ID proof document.");
      return;
    }
    if (!serviceTypeId) {
      setError("Please select a service type.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await createAlumniIntake(
        { ...form, serviceTypeId, details: {} },
        idProofFile,
      );
      if (res.httpStatusCode !== 200 && res.httpStatusCode !== 201) {
        throw new Error(res.message || "Failed to submit identity");
      }
      setIntakeId(res.payload.intakeId);
      setTicketId(res.payload.ticketId);
      setCountdown(600);
      setStep("otp");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (!intakeId) return;
    setLoading(true);
    setError("");
    try {
      await sendOtp(intakeId);
      setCountdown(600);
      setOtp("");
    } catch {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OTP verification ──────────────────────────────────────────────

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the 6-digit OTP.");
      return;
    }
    if (!intakeId) return;
    setError("");
    setLoading(true);
    try {
      const res = await checkOtp(intakeId, otp);
      if (res.httpStatusCode !== 200) throw new Error(res.message || "OTP verification failed");
      setReferenceToken(res.payload.referenceToken);
      setStep("request");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Invalid or expired OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Submit request ────────────────────────────────────────────────

  const [requiresPhysical, setRequiresPhysical] = useState<boolean | null>(null);

  const selectedService = serviceTypes.find((s) => s.id === serviceTypeId);

  useEffect(() => {
    if (selectedService) {
      setRequiresPhysical(selectedService.requiresPhysicalPresenceDefault);
    }
  }, [selectedService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId) return;
    setError("");
    setLoading(true);
    try {
      const res = await submitServiceRequest(
        {
          ticketId,
          requiresPhysicalPresence: requiresPhysical ?? undefined,
        },
        referenceToken,
      );
      if (res.httpStatusCode !== 200 && res.httpStatusCode !== 201) {
        throw new Error(res.message || "Submission failed");
      }
      setReferenceId(res.payload.referenceId);
      setStep("done");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Submission failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-indigo-900 flex flex-col items-center justify-start px-4 py-10">
      {/* Branding */}
      <div className="mb-6 flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain bg-white p-1" />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            {(abbreviation || collegeName || "S").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          {abbreviation && (
            <p className="text-xs font-semibold text-indigo-300 uppercase tracking-widest">
              {abbreviation}
            </p>
          )}
          <h1 className="text-lg font-bold text-white leading-tight">Alumni Service Request</h1>
        </div>
      </div>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl p-6 md:p-10">
        <StepIndicator step={step} />

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* ── Step 1: Identity form ─────────────────────────────────────── */}
        {step === "identity" && (
          <form onSubmit={handleIdentitySubmit} className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-4">
                <Link href="/services" className="text-indigo-600 hover:underline">
                  <ArrowLeft className="inline h-3 w-3 mr-1" />
                  Back to chooser
                </Link>
              </p>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Your Identity</h2>
              <p className="text-sm text-gray-500">
                Fill in your details as they appear on your college records.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={setField("fullName")}
                  required
                  placeholder="As on college records"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="yearOfPassing">Year of Passing</Label>
                  <Input
                    id="yearOfPassing"
                    value={form.yearOfPassing}
                    onChange={setField("yearOfPassing")}
                    required
                    placeholder="e.g. 2021"
                    maxLength={4}
                  />
                </div>
                <div>
                  <Label htmlFor="courseStream">Course / Stream</Label>
                  <Input
                    id="courseStream"
                    value={form.courseStream}
                    onChange={setField("courseStream")}
                    required
                    placeholder="e.g. B.Sc. Physics"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="universityRegNo">University Reg No</Label>
                  <Input
                    id="universityRegNo"
                    value={form.universityRegNo}
                    onChange={setField("universityRegNo")}
                    required
                    placeholder="University registration"
                  />
                </div>
                <div>
                  <Label htmlFor="collegeRollNo">College Roll No</Label>
                  <Input
                    id="collegeRollNo"
                    value={form.collegeRollNo}
                    onChange={setField("collegeRollNo")}
                    required
                    placeholder="College roll number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="mobileWhatsapp">WhatsApp Mobile</Label>
                  <Input
                    id="mobileWhatsapp"
                    type="tel"
                    value={form.mobileWhatsapp}
                    onChange={setField("mobileWhatsapp")}
                    required
                    placeholder="+91XXXXXXXXXX"
                    maxLength={13}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={setField("email")}
                    required
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Service type */}
              <div>
                <Label htmlFor="serviceType">Service Required</Label>
                <Select
                  value={serviceTypeId ? String(serviceTypeId) : ""}
                  onValueChange={(v) => setServiceTypeId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service..." />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((st) => (
                      <SelectItem key={st.id} value={String(st.id)}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ID proof type */}
              <div>
                <Label htmlFor="idProofType">ID Proof Type</Label>
                <Select
                  value={form.idProofType}
                  onValueChange={(v) => setForm((f) => ({ ...f, idProofType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID proof..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ID_PROOF_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ID proof file */}
              <div>
                <Label>ID Proof Document</Label>
                <div
                  className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  {idProofFile ? (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <FileText className="h-5 w-5 text-indigo-600" />
                      <span>{idProofFile.name}</span>
                      <span className="text-gray-400">
                        ({(idProofFile.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <Upload className="h-6 w-6" />
                      <span className="text-xs">Click to upload (JPG, PNG, PDF — max 5 MB)</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      setError("File size must be under 5 MB.");
                      return;
                    }
                    setIdProofFile(file);
                    setError("");
                  }}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !form.idProofType || !serviceTypeId}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? "Submitting..." : "Verify Contact Info"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        )}

        {/* ── Step 2: OTP ───────────────────────────────────────────────── */}
        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Verify Your Contact</h2>
              <p className="text-sm text-gray-500">
                A 6-digit OTP has been sent to your WhatsApp (<strong>{form.mobileWhatsapp}</strong>
                ) and email (<strong>{form.email}</strong>). Valid for 10 minutes.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="w-11 h-11 text-lg font-semibold border-2 border-gray-300 rounded-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              {countdown > 0 ? (
                <p className="text-xs text-gray-500">Expires in {formatTime(countdown)}</p>
              ) : (
                <p className="text-xs text-red-500">OTP expired.</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={loading}
                onClick={handleResend}
              >
                Resend OTP
              </Button>
              <Button
                type="submit"
                disabled={loading || otp.length !== 6 || countdown === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? "Verifying..." : "Verify"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </form>
        )}

        {/* ── Step 3: Submit request ────────────────────────────────────── */}
        {step === "request" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Submit Service Request</h2>
              <p className="text-sm text-gray-500">
                Your contact is verified. Review your request details before submitting.
              </p>
            </div>

            <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Service</span>
                <span className="font-medium text-gray-800">
                  {selectedService?.name ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="font-medium text-gray-800">{form.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-800">{form.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">WhatsApp</span>
                <span className="font-medium text-gray-800">{form.mobileWhatsapp}</span>
              </div>
            </div>

            {selectedService?.requiresPhysicalPresenceDefault !== undefined && (
              <div>
                <Label className="block mb-2">Campus visit required?</Label>
                <div className="flex gap-3">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      type="button"
                      onClick={() => setRequiresPhysical(v)}
                      className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                        requiresPhysical === v
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-500 hover:border-indigo-300"
                      }`}
                    >
                      {v ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {loading ? "Submitting..." : "Submit Request"}
              {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        )}

        {/* ── Step 4: Done ──────────────────────────────────────────────── */}
        {step === "done" && (
          <div className="text-center space-y-6">
            <div className="flex flex-col items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Request Submitted!</h2>
              <p className="text-sm text-gray-500">
                Your request has been routed to the concerned department.
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Reference ID</p>
              <p className="text-2xl font-mono font-bold text-indigo-700">{referenceId}</p>
              <p className="text-xs text-gray-400 mt-2">
                Save this ID to track your request status.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link href={`/services/track?ref=${referenceId}`}>
                <Button variant="outline" className="w-full">
                  Track This Request
                </Button>
              </Link>
              <Link href="/services">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                  Back to Services
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
