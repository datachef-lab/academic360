import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createAlumniIntake,
  getAlumniIntake,
  getIdProofSignedUrl,
  markIdProofVerified,
  uploadIdProof,
} from "../services/alumni-intake.service.js";
import {
  sendContactVerificationOtp,
  verifyContactOtp,
  submitAlumniTicket,
} from "../services/contact-verification.service.js";
import { createTicket } from "../services/ticket.service.js";
import { lookupServiceType } from "../services/routing.service.js";

// ---------------------------------------------------------------------------
// POST /alumni/intake
//
// Accepts multipart/form-data with optional `idProof` file.
// Creates an alumni intake record + DRAFT ticket and starts the OTP flow.
// ---------------------------------------------------------------------------

export const createIntake = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      fullName,
      yearOfPassing,
      courseStream,
      universityRegNo,
      collegeRollNo,
      mobileWhatsapp,
      email,
      idProofType,
      serviceTypeId,
      details,
    } = req.body as Record<string, string>;

    if (!fullName || !yearOfPassing || !courseStream || !mobileWhatsapp || !email || !idProofType) {
      res.status(400).json(new ApiError(400, "fullName, yearOfPassing, courseStream, mobileWhatsapp, email, and idProofType are required"));
      return;
    }

    if (!serviceTypeId) {
      res.status(400).json(new ApiError(400, "serviceTypeId is required"));
      return;
    }

    const parsedServiceTypeId = Number(serviceTypeId);
    if (isNaN(parsedServiceTypeId)) {
      res.status(400).json(new ApiError(400, "serviceTypeId must be a number"));
      return;
    }

    // Validate service type exists
    const serviceType = await lookupServiceType(parsedServiceTypeId);
    if (!serviceType) {
      res.status(404).json(new ApiError(404, `Service type ${parsedServiceTypeId} not found`));
      return;
    }
    if (!serviceType.isActive) {
      res.status(400).json(new ApiError(400, `Service type '${serviceType.name}' is not active`));
      return;
    }

    // The uploaded file (if any)
    const idProofFile = req.file;

    // 1. Create the alumni intake record
    const intake = await createAlumniIntake({
      fullName,
      yearOfPassing,
      courseStream,
      universityRegNo: universityRegNo || undefined,
      collegeRollNo: collegeRollNo || undefined,
      mobileWhatsapp,
      email,
      idProofType: idProofType as "OLD_ID_CARD" | "AADHAAR" | "PASSPORT" | "OTHER",
      idProofFile,
    });

    // 2. Create a DRAFT ticket linked to the intake
    const parsedDetails = details ? (typeof details === "string" ? JSON.parse(details) : details) : undefined;
    const ticket = await createTicket({
      requestorType: "ALUMNI",
      alumniIntakeId: intake.id,
      serviceTypeId: parsedServiceTypeId,
      contactEmail: email,
      contactPhone: mobileWhatsapp,
      details: parsedDetails,
    });

    // 3. Send OTP to verify contact
    const otpResult = await sendContactVerificationOtp(intake.id);

    res.status(201).json(
      new ApiResponse(201, "CREATED", {
        intakeId: intake.id,
        ticketId: ticket.id,
        referenceId: ticket.referenceId,
        otpSent: otpResult,
      }, "Alumni intake created. OTP sent to email and WhatsApp."),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /alumni/verify-otp/send
//
// Re-sends OTP for an existing intake.
// ---------------------------------------------------------------------------

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { intakeId } = req.body as { intakeId?: number };

    if (!intakeId) {
      res.status(400).json(new ApiError(400, "intakeId is required"));
      return;
    }

    const result = await sendContactVerificationOtp(Number(intakeId));

    res.status(200).json(
      new ApiResponse(200, "SUCCESS", result, "OTP sent to email and WhatsApp"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /alumni/verify-otp/check
//
// Verifies OTP; marks intake contactVerified; updates linked ticket.
// ---------------------------------------------------------------------------

export const checkOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Frontend sends `code`; accept `otpCode` as an alias for robustness.
    const { intakeId, code, otpCode, ticketId } = req.body as {
      intakeId?: number;
      code?: string;
      otpCode?: string;
      ticketId?: number;
    };
    const otp = code ?? otpCode;

    if (!intakeId || !otp) {
      res.status(400).json(new ApiError(400, "intakeId and code are required"));
      return;
    }

    const result = await verifyContactOtp({
      intakeId: Number(intakeId),
      otpCode: otp,
      ticketId: ticketId ? Number(ticketId) : undefined,
    });

    if (!result.success) {
      res.status(400).json(new ApiError(400, result.message));
      return;
    }

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          contactVerified: true,
          referenceToken: result.referenceToken,
          ticketId: result.ticketId,
        },
        result.message,
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// GET /alumni/intake/:id/id-proof-url
//
// Returns a time-limited pre-signed URL for the ID proof (clerk only).
// ---------------------------------------------------------------------------

export const getIdProofUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const intakeId = Number(req.params.id);
    if (isNaN(intakeId)) {
      res.status(400).json(new ApiError(400, "Invalid intake ID"));
      return;
    }

    const url = await getIdProofSignedUrl(intakeId);
    res.status(200).json(
      new ApiResponse(200, "SUCCESS", { url }, "Signed URL generated"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /alumni/intake/:id/verify-id-proof
//
// Marks intake idProofVerified (clerk action).
// Body: { verified?: boolean }
// ---------------------------------------------------------------------------

export const verifyIdProof = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const intakeId = Number(req.params.id);
    if (isNaN(intakeId)) {
      res.status(400).json(new ApiError(400, "Invalid intake ID"));
      return;
    }

    const { verified = true } = req.body as { verified?: boolean };

    const updated = await markIdProofVerified(intakeId, verified);

    res.status(200).json(
      new ApiResponse(200, "UPDATED", updated, `ID proof ${verified ? "verified" : "unverified"}`),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};

// ---------------------------------------------------------------------------
// POST /alumni/intake/:id/upload-id-proof
//
// Re-uploads the ID proof for an existing intake.
// ---------------------------------------------------------------------------

export const uploadIdProofForIntake = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const intakeId = Number(req.params.id);
    if (isNaN(intakeId)) {
      res.status(400).json(new ApiError(400, "Invalid intake ID"));
      return;
    }

    if (!req.file) {
      res.status(400).json(new ApiError(400, "No file uploaded"));
      return;
    }

    const updated = await uploadIdProof(intakeId, req.file);

    res.status(200).json(
      new ApiResponse(200, "UPDATED", { idProofS3Key: updated.idProofS3Key }, "ID proof uploaded"),
    );
  } catch (error) {
    handleError(error, res, next);
  }
};
