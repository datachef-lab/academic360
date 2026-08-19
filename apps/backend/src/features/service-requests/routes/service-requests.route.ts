/**
 * Service-Requests router — mounted at /api/service-requests in app.ts
 *
 * Route overview:
 *   Public / Alumni OTP flow:
 *     POST   /alumni/intake                       Create draft + upload ID proof
 *     POST   /alumni/verify-otp/send              Re-send OTP
 *     POST   /alumni/verify-otp/check             Verify OTP (marks contactVerified)
 *
 *   Submission:
 *     POST   /submit                              Students (verifyJWT) or Alumni (reference token)
 *
 *   Tracking (public):
 *     GET    /service-types                       List active service types
 *     GET    /tickets/:ref                        Tracking by reference ID
 *
 *   Clerk (verifyJWT required):
 *     GET    /queue                               Department queue
 *     GET    /tickets/:id                         Full ticket detail
 *     GET    /tickets/:id/events                  Audit event trail
 *     POST   /tickets/:id/review                  ROUTED → UNDER_REVIEW
 *     POST   /tickets/:id/approve                 UNDER_REVIEW → APPROVED
 *     POST   /tickets/:id/reject                  UNDER_REVIEW → REJECTED
 *     POST   /tickets/:id/fulfilment              APPROVED → PENDING_SLOT_BOOKING or FULFILLED
 *     GET    /alumni/intake/:id/id-proof-url      Signed URL for ID proof (clerk only)
 *     POST   /alumni/intake/:id/verify-id-proof   Mark ID proof verified
 *     POST   /alumni/intake/:id/upload-id-proof   Re-upload ID proof
 *
 *   Slots (verifyJWT):
 *     GET    /departments/:id/slots               Available slots for date
 *     GET    /departments/:id/slot-windows        List slot window config
 *     POST   /departments/:id/slot-windows        Create slot window
 *     PUT    /departments/:id/slot-windows/:wId   Update slot window
 *     DELETE /departments/:id/slot-windows/:wId   Delete slot window
 *     POST   /tickets/:id/book                    Book slot
 *     POST   /tickets/:id/cancel-booking          Cancel booking
 *     POST   /tickets/:id/reschedule              Reschedule to new slot
 *
 *   Gate pass (verifyJWT):
 *     POST   /gate/scan                           Guard scan (GREEN/RED)
 *     POST   /gate/bypass                         Issue bypass pass
 *     GET    /gate/tickets/:ticketId/pass         Get active pass + QR
 */

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { requireStaff } from "@/middlewares/requireRole.middleware.js";
import { optionalAuth } from "@/middlewares/optionalAuth.middleware.js";
import { setService } from "@/utils/setService.js";

import {
  createIntake,
  sendOtp,
  checkOtp,
  getIdProofUrl,
  verifyIdProof,
  uploadIdProofForIntake,
} from "../controllers/alumni-intake.controller.js";

import {
  submitRequest,
  getTicketByRef,
  getQueue,
  startReview,
  approveTicket,
  rejectTicket,
  setFulfilment,
  getServiceTypes,
  getTicketEvents,
  getTicketDetail,
  createStudentDraft,
  getMyTickets,
} from "../controllers/ticket.controller.js";

import {
  getSlots,
  bookTicketSlot,
  cancelBooking,
  rescheduleBooking,
  listSlotWindows,
  createSlotWindow,
  updateSlotWindow,
  deleteSlotWindow,
} from "../controllers/slot.controller.js";

import {
  scan,
  issueBypass,
  getPass,
} from "../controllers/gate-pass.controller.js";

// ---------------------------------------------------------------------------
// Multer setup for ID proof uploads (images + PDF, ≤5 MB)
// Stored to temp dir; s3.service then uploads from disk.
// ---------------------------------------------------------------------------

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(_dirname, "../../../../public/temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const idProofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `id-proof-${Date.now()}${ext}`);
  },
});

const idProofFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WebP, and PDF files are allowed for ID proof"));
  }
};

const idProofUpload = multer({
  storage: idProofStorage,
  fileFilter: idProofFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const router = express.Router();
router.use(setService("service-requests"));

// --- Alumni OTP flow (public) ---
router.post("/alumni/intake", idProofUpload.single("idProof"), createIntake as any);
router.post("/alumni/verify-otp/send", sendOtp as any);
router.post("/alumni/verify-otp/check", checkOtp as any);

// --- Submission ---
// POST /submit handles both authenticated students AND alumni (reference token).
// optionalAuth attaches req.user when a valid USER token is present (student path);
// an alumni reference token leaves req.user unset and the controller takes the
// alumni branch. We can't use verifyJWT here because it would 401 the alumni.
router.post("/submit", optionalAuth, submitRequest as any);

// --- Student console (verifyJWT required) ---
router.post("/student/draft", verifyJWT, createStudentDraft as any);
router.get("/my-tickets", verifyJWT, getMyTickets as any);

// --- Public ---
router.get("/service-types", getServiceTypes as any);
router.get("/tickets/:ref", getTicketByRef as any);

// --- Clerk routes (staff role required) ---
router.get("/queue", verifyJWT, requireStaff, getQueue as any);
router.get("/tickets/:id/events", verifyJWT, requireStaff, getTicketEvents as any);
// Specific sub-routes before /:id to avoid shadowing
router.get("/tickets/:id/detail", verifyJWT, requireStaff, getTicketDetail as any);
router.post("/tickets/:id/review", verifyJWT, requireStaff, startReview as any);
router.post("/tickets/:id/approve", verifyJWT, requireStaff, approveTicket as any);
router.post("/tickets/:id/reject", verifyJWT, requireStaff, rejectTicket as any);
router.post("/tickets/:id/fulfilment", verifyJWT, requireStaff, setFulfilment as any);
// Booking actions: owning student OR staff — ownership enforced in the controller.
router.post("/tickets/:id/book", verifyJWT, bookTicketSlot as any);
router.post("/tickets/:id/cancel-booking", verifyJWT, cancelBooking as any);
router.post("/tickets/:id/reschedule", verifyJWT, rescheduleBooking as any);

// --- ID proof (staff only — PII) ---
router.get("/alumni/intake/:id/id-proof-url", verifyJWT, requireStaff, getIdProofUrl as any);
router.post("/alumni/intake/:id/verify-id-proof", verifyJWT, requireStaff, verifyIdProof as any);
router.post(
  "/alumni/intake/:id/upload-id-proof",
  verifyJWT,
  requireStaff,
  idProofUpload.single("idProof"),
  uploadIdProofForIntake as any,
);

// --- Slot windows admin CRUD (staff only) ---
router.get("/departments/:id/slots", getSlots as any);
router.get("/departments/:id/slot-windows", verifyJWT, requireStaff, listSlotWindows as any);
router.post("/departments/:id/slot-windows", verifyJWT, requireStaff, createSlotWindow as any);
router.put("/departments/:id/slot-windows/:windowId", verifyJWT, requireStaff, updateSlotWindow as any);
router.delete("/departments/:id/slot-windows/:windowId", verifyJWT, requireStaff, deleteSlotWindow as any);

// --- Gate pass ---
// Scan/bypass are guard/clerk actions (staff). Pass retrieval allows the
// owning student too — enforced in the controller.
router.post("/gate/scan", verifyJWT, requireStaff, scan as any);
router.post("/gate/bypass", verifyJWT, requireStaff, issueBypass as any);
router.get("/gate/tickets/:ticketId/pass", verifyJWT, getPass as any);

export default router;
