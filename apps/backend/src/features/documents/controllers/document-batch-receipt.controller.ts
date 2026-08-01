import type { Request, Response } from "express";
import {
  createBatchReceipt,
  deleteBatchReceipt,
  updateBatchReceipt,
  generateLedgerEntriesForBatchReceipt,
  listBatchReceipts,
  markLedgerEntryCollected,
  resolveBatchReceiptPromotionIds,
  setBatchReceiptMode,
  type BatchReceiptModeName,
} from "../services/document-batch-receipt.service.js";

const MODES: BatchReceiptModeName[] = ["EXAM_LINKED", "ADMINISTRATIVE"];

function currentUserId(req: Request): number | null {
  const user = req.user as { id?: number } | undefined;
  return typeof user?.id === "number" ? user.id : null;
}

function toDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function getBatchReceipts(req: Request, res: Response) {
  try {
    const academicYearId = req.query.academicYearId
      ? Number(req.query.academicYearId)
      : undefined;
    const documentTypeId = req.query.documentTypeId
      ? Number(req.query.documentTypeId)
      : undefined;

    const rows = await listBatchReceipts({ academicYearId, documentTypeId });
    return res.json({ payload: rows });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to list document batch receipts",
      error: String(error),
    });
  }
}

export async function postBatchReceipt(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const {
      documentTypeId,
      name,
      academicYearId,
      classId,
      programCourseIds,
      appearTypeId,
    } = req.body ?? {};

    if (!documentTypeId || !name?.trim() || !academicYearId || !classId) {
      return res.status(400).json({
        message:
          "documentTypeId, name, academicYearId and classId are required.",
      });
    }
    if (!Array.isArray(programCourseIds) || programCourseIds.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one program course is required." });
    }

    const created = await createBatchReceipt(
      {
        documentTypeId: Number(documentTypeId),
        name: String(name),
        academicYearId: Number(academicYearId),
        classId: Number(classId),
        programCourseIds: programCourseIds.map(Number),
        appearTypeId: appearTypeId ? Number(appearTypeId) : null,
        expectedArrivalDate: toDate(req.body?.expectedArrivalDate),
        availableFromDate: toDate(req.body?.availableFromDate),
        documentsReceivedBy: req.body?.documentsReceivedBy
          ? Number(req.body.documentsReceivedBy)
          : null,
        documentsReceivedAt: toDate(req.body?.documentsReceivedAt),
      },
      userId,
    );

    return res.status(201).json({ payload: created });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create the document batch receipt",
      error: String(error),
    });
  }
}

export async function putBatchReceipt(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "A valid batch id is required." });
    }

    const b = req.body ?? {};
    const updated = await updateBatchReceipt(
      id,
      {
        ...(b.name === undefined ? {} : { name: String(b.name) }),
        ...(b.documentTypeId === undefined
          ? {}
          : { documentTypeId: Number(b.documentTypeId) }),
        ...(b.academicYearId === undefined
          ? {}
          : { academicYearId: Number(b.academicYearId) }),
        ...(b.classId === undefined ? {} : { classId: Number(b.classId) }),
        ...(b.programCourseIds === undefined
          ? {}
          : {
              programCourseIds: (b.programCourseIds as unknown[]).map(Number),
            }),
        ...(b.appearTypeId === undefined
          ? {}
          : { appearTypeId: b.appearTypeId ? Number(b.appearTypeId) : null }),
        ...(b.expectedArrivalDate === undefined
          ? {}
          : { expectedArrivalDate: toDate(b.expectedArrivalDate) }),
        ...(b.availableFromDate === undefined
          ? {}
          : { availableFromDate: toDate(b.availableFromDate) }),
        ...(b.documentsReceivedBy === undefined
          ? {}
          : {
              documentsReceivedBy: b.documentsReceivedBy
                ? Number(b.documentsReceivedBy)
                : null,
            }),
        ...(b.documentsReceivedAt === undefined
          ? {}
          : { documentsReceivedAt: toDate(b.documentsReceivedAt) }),
      },
      userId,
    );
    return res.json({ payload: updated });
  } catch (error) {
    // The scope-freeze guard is a client error, not a server fault.
    const message = String((error as Error)?.message ?? error);
    const isGuard = message.includes("can no longer be changed");
    return res.status(isGuard ? 409 : 500).json({
      message: isGuard
        ? message
        : "Failed to update the document batch receipt",
      error: message,
    });
  }
}

export async function deleteBatchReceiptById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "A valid batch id is required." });
    }
    const result = await deleteBatchReceipt(id);
    return res.json({ payload: result });
  } catch (error) {
    const message = String((error as Error)?.message ?? error);
    const isGuard = message.includes("cannot be deleted");
    return res.status(isGuard ? 409 : 500).json({
      message: isGuard
        ? message
        : "Failed to delete the document batch receipt",
      error: message,
    });
  }
}

/**
 * Toggle a mode. Enabling ADMINISTRATIVE is what creates the ledger entries, so
 * the generation summary comes back in the same response for the console to show.
 */
export async function putBatchReceiptMode(req: Request, res: Response) {
  try {
    const batchReceiptId = Number(req.params.id);
    const mode = String(req.body?.mode ?? "") as BatchReceiptModeName;
    const isEnabled = req.body?.isEnabled;

    if (!Number.isFinite(batchReceiptId)) {
      return res.status(400).json({ message: "A valid batch id is required." });
    }
    if (!MODES.includes(mode)) {
      return res
        .status(400)
        .json({ message: `mode must be one of ${MODES.join(", ")}.` });
    }
    if (typeof isEnabled !== "boolean") {
      return res.status(400).json({ message: "isEnabled must be a boolean." });
    }

    const result = await setBatchReceiptMode(batchReceiptId, mode, isEnabled, {
      notifyStudent: req.body?.notifyStudent,
    });
    return res.json({ payload: result });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update the batch receipt mode",
      error: String(error),
    });
  }
}

/**
 * Re-run generation for a batch whose ADMINISTRATIVE mode is already on — the
 * top-up for promotions created since (late admissions, shift changes).
 */
export async function postBatchReceiptGenerate(req: Request, res: Response) {
  try {
    const batchReceiptId = Number(req.params.id);
    if (!Number.isFinite(batchReceiptId)) {
      return res.status(400).json({ message: "A valid batch id is required." });
    }
    const result = await generateLedgerEntriesForBatchReceipt(batchReceiptId);
    return res.json({ payload: result });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to generate ledger entries",
      error: String(error),
    });
  }
}

/** Dry run: how many promotions the batch's scope resolves to, before enabling. */
export async function getBatchReceiptScope(req: Request, res: Response) {
  try {
    const batchReceiptId = Number(req.params.id);
    if (!Number.isFinite(batchReceiptId)) {
      return res.status(400).json({ message: "A valid batch id is required." });
    }
    const promotionIds = await resolveBatchReceiptPromotionIds(batchReceiptId);
    return res.json({ payload: { eligible: promotionIds.length } });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to resolve the batch scope",
      error: String(error),
    });
  }
}

/** Distribution: PENDING -> COLLECTED on the ledger row. */
export async function postLedgerCollected(req: Request, res: Response) {
  try {
    const userId = currentUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthenticated" });

    const ledgerId = Number(req.params.ledgerId);
    if (!Number.isFinite(ledgerId)) {
      return res
        .status(400)
        .json({ message: "A valid ledger id is required." });
    }

    const result = await markLedgerEntryCollected(ledgerId, userId);
    if (result.alreadyCollected) {
      return res.status(409).json({
        message: "This document is already marked as collected.",
        payload: result,
      });
    }
    return res.json({ payload: result });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to mark the document as collected",
      error: String(error),
    });
  }
}
