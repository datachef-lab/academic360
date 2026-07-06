import express from "express";
import ExcelJS from "exceljs";
import multer from "multer";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  confirmResend,
  createMaster,
  exportNotifications,
  getDashboard,
  getMasterPreview,
  getNotificationContents,
  getNotificationPreview,
  getResendStatus,
  getResendVerifiers,
  getStats,
  listMasters,
  listMasterFields,
  listNotifications,
  setMasterPreviewImage,
  startResendOtp,
  updateMaster,
  verifyResendOtp,
  ResendError,
} from "@/features/notifications-console/services/notifications-console.service.js";

const previewImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const RESEND_HTTP: Record<string, number> = {
  NOT_FOUND: 404,
  NO_VERIFIERS: 409,
  INVALID_OTP: 400,
  INVALID_SESSION: 410,
};

function sendResendError(res: express.Response, e: unknown): boolean {
  if (e instanceof ResendError) {
    res
      .status(RESEND_HTTP[e.code] ?? 400)
      .json(
        new ApiResponse(
          RESEND_HTTP[e.code] ?? 400,
          "ERROR",
          { code: e.code },
          e.message,
        ),
      );
    return true;
  }
  return false;
}

const requestUserId = (req: express.Request): number => {
  const u = req.user as { id?: number } | undefined;
  return Number(u?.id ?? 0);
};

const csvInts = (v: unknown): number[] =>
  String(v ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

const csvStrs = (v: unknown): string[] =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// Stored timestamps are IST wall-clock in a tz-less column; drizzle parses them
// as if UTC, so the UTC components ARE the intended wall-clock.
const fmtIST = (d: Date | string | null): string => {
  if (!d) return "";
  const date =
    typeof d === "string"
      ? new Date(
          d.includes("Z") || d.includes("+") ? d : d.replace(" ", "T") + "Z",
        )
      : d;
  return date.toLocaleString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

async function sendWorkbook(
  res: express.Response,
  wb: ExcelJS.Workbook,
  filename: string,
) {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  const buffer = await wb.xlsx.writeBuffer();
  res.send(Buffer.from(buffer));
}

/**
 * Read-only console endpoints for the main-console Notifications module.
 * GET /            — paginated triggered-notifications list (+filters)
 * GET /masters     — notification masters (read-only)
 * GET /stats       — totals + by-variant + recent (Home page)
 */
const router = express.Router();

router.use(verifyJWT);

const posInt = (v: unknown, fallback: number, max?: number): number => {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return max ? Math.min(Math.floor(n), max) : Math.floor(n);
};

router.get("/", async (req, res, next) => {
  try {
    const data = await listNotifications({
      page: posInt(req.query.page, 1),
      limit: posInt(req.query.limit, 20, 100),
      status: (req.query.status as string) || null,
      variant: (req.query.variant as string) || null,
      masterId:
        Number(req.query.masterId) > 0 ? Number(req.query.masterId) : null,
      search: (req.query.search as string) || null,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Notifications fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.get("/dashboard", async (req, res, next) => {
  try {
    const days = Number(req.query.days);
    const data = await getDashboard({
      academicYearIds: csvInts(req.query.academicYearIds),
      variants: csvStrs(req.query.variants),
      statuses: csvStrs(req.query.statuses),
      userTypes: csvStrs(req.query.userTypes),
      programCourseIds: csvInts(req.query.programCourseIds),
      streamIds: csvInts(req.query.streamIds),
      affiliationIds: csvInts(req.query.affiliationIds),
      regulationTypeIds: csvInts(req.query.regulationTypeIds),
      classIds: csvInts(req.query.classIds),
      shiftIds: csvInts(req.query.shiftIds),
      days: Number.isFinite(days) && days > 0 ? days : null,
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          data,
          "Notification dashboard fetched.",
        ),
      );
  } catch (e) {
    handleError(e, res, next);
  }
});

router.get("/export", async (req, res, next) => {
  try {
    const rows = await exportNotifications({
      status: (req.query.status as string) || null,
      variant: (req.query.variant as string) || null,
      masterId:
        Number(req.query.masterId) > 0 ? Number(req.query.masterId) : null,
      search: (req.query.search as string) || null,
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Notifications");
    ws.columns = [
      { header: "Date", key: "date", width: 22 },
      { header: "Master", key: "master", width: 32 },
      { header: "Template", key: "template", width: 24 },
      { header: "Channel", key: "channel", width: 12 },
      { header: "Type", key: "type", width: 18 },
      { header: "Recipient Name", key: "name", width: 28 },
      { header: "Recipient Email", key: "email", width: 32 },
      { header: "Status", key: "status", width: 10 },
      { header: "Sent At", key: "sentAt", width: 22 },
      { header: "Failed Reason", key: "reason", width: 40 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const r of rows) {
      ws.addRow({
        date: fmtIST(r.createdAt),
        master: r.masterName ?? "",
        template: r.masterTemplate ?? "",
        channel: r.variant,
        type: r.type,
        name: r.userName ?? "",
        email: r.userEmail ?? "",
        status: r.status,
        sentAt: fmtIST(r.sentAt),
        reason: r.failedReason ?? "",
      });
    }
    const stamp = new Date().toISOString().slice(0, 10);
    await sendWorkbook(res, wb, `automated-notifications-${stamp}.xlsx`);
  } catch (e) {
    handleError(e, res, next);
  }
});

router.get("/masters/export", async (_req, res, next) => {
  try {
    const masters = await listMasters();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Notification Masters");
    ws.columns = [
      { header: "Name", key: "name", width: 40 },
      { header: "Channel", key: "variant", width: 12 },
      { header: "Template Key", key: "template", width: 28 },
      { header: "Fields", key: "fields", width: 8 },
      { header: "Active", key: "active", width: 8 },
      { header: "Created", key: "created", width: 22 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const m of masters) {
      ws.addRow({
        name: m.name,
        variant: m.variant,
        template: m.template ?? "",
        fields: m.fieldsCount,
        active: m.isActive ? "Yes" : "No",
        created: fmtIST(m.createdAt),
      });
    }
    const stamp = new Date().toISOString().slice(0, 10);
    await sendWorkbook(res, wb, `notification-masters-${stamp}.xlsx`);
  } catch (e) {
    handleError(e, res, next);
  }
});

router.get("/masters", async (_req, res, next) => {
  try {
    const data = await listMasters();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", data, "Notification masters fetched."),
      );
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post("/masters", async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const variant = typeof body.variant === "string" ? body.variant : "";
    if (
      !name ||
      !["EMAIL", "WHATSAPP", "SMS", "WEB", "OTHER"].includes(variant)
    ) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "ERROR",
            null,
            "Name and a valid channel are required.",
          ),
        );
      return;
    }
    const row = await createMaster({
      name,
      variant,
      template: typeof body.template === "string" ? body.template : null,
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
      fields: Array.isArray(body.fields)
        ? (body.fields as unknown[])
            .filter((f): f is string => typeof f === "string")
            .slice(0, 50)
        : [],
    });
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", row, "Master created."));
  } catch (e) {
    if ((e as { code?: string })?.code === "23505") {
      res
        .status(409)
        .json(
          new ApiResponse(
            409,
            "ERROR",
            null,
            "This template key is already in use.",
          ),
        );
      return;
    }
    handleError(e, res, next);
  }
});

router.get("/masters/:id/preview", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid master id."));
      return;
    }
    const data = await getMasterPreview(id);
    if (!data) {
      res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Master not found."));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Master preview."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.post(
  "/masters/:id/preview-image",
  previewImageUpload.single("image"),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id) || id < 1) {
        res
          .status(400)
          .json(new ApiResponse(400, "ERROR", null, "Invalid master id."));
        return;
      }
      if (!req.file) {
        res
          .status(400)
          .json(new ApiResponse(400, "ERROR", null, "No image uploaded."));
        return;
      }
      const row = await setMasterPreviewImage(id, req.file);
      if (!row) {
        res
          .status(404)
          .json(new ApiResponse(404, "ERROR", null, "Master not found."));
        return;
      }
      res
        .status(200)
        .json(new ApiResponse(200, "SUCCESS", row, "Preview image updated."));
    } catch (e) {
      handleError(e, res, next);
    }
  },
);

router.get("/masters/:id/fields", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid master id."));
      return;
    }
    const data = await listMasterFields(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Master fields fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.patch("/masters/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid master id."));
      return;
    }
    const body = req.body ?? {};
    const patch: {
      name?: string;
      template?: string | null;
      isActive?: boolean;
      newFields?: string[];
      meta?: Array<{ fieldId: number; sequence: number; flag: boolean }>;
    } = {};
    if (typeof body.name === "string") patch.name = body.name;
    if (typeof body.template === "string" || body.template === null)
      patch.template = body.template;
    if (typeof body.isActive === "boolean") patch.isActive = body.isActive;
    if (Array.isArray(body.newFields))
      patch.newFields = (body.newFields as unknown[])
        .filter((f): f is string => typeof f === "string")
        .slice(0, 50);
    if (Array.isArray(body.meta))
      patch.meta = (body.meta as unknown[])
        .map((m) => {
          const e = m as {
            fieldId?: unknown;
            sequence?: unknown;
            flag?: unknown;
          };
          const fieldId = Number(e.fieldId);
          const sequence = Number(e.sequence);
          if (!Number.isFinite(fieldId) || !Number.isFinite(sequence))
            return null;
          return { fieldId, sequence, flag: e.flag !== false };
        })
        .filter(
          (m): m is { fieldId: number; sequence: number; flag: boolean } =>
            m !== null,
        )
        .slice(0, 100);
    if (Object.keys(patch).length === 0) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Nothing to update."));
      return;
    }
    const row = await updateMaster(id, patch);
    if (!row) {
      res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Master not found."));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Master updated."));
  } catch (e) {
    handleError(e, res, next);
  }
});

router.get("/stats", async (_req, res, next) => {
  try {
    const data = await getStats();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", data, "Notification stats fetched."),
      );
  } catch (e) {
    handleError(e, res, next);
  }
});

// ---------------------------------------------------------------------------
// Resend flow
// ---------------------------------------------------------------------------

router.get("/:id/resend/verifiers", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid notification id."));
      return;
    }
    const data = await getResendVerifiers(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Resend verifiers fetched."));
  } catch (e) {
    if (sendResendError(res, e)) return;
    handleError(e, res, next);
  }
});

router.post("/:id/resend/otp", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid notification id."));
      return;
    }
    const data = await startResendOtp(id, requestUserId(req));
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Verification code sent."));
  } catch (e) {
    if (sendResendError(res, e)) return;
    handleError(e, res, next);
  }
});

router.post("/:id/resend/verify", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const otp = String(req.body?.otp ?? "").trim();
    if (!Number.isFinite(id) || id < 1 || !otp) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid request."));
      return;
    }
    const data = await verifyResendOtp(id, requestUserId(req), otp);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Verification successful."));
  } catch (e) {
    if (sendResendError(res, e)) return;
    handleError(e, res, next);
  }
});

router.post("/:id/resend/confirm", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const token = String(req.body?.token ?? "");
    const selectedUserIds = Array.isArray(req.body?.selectedUserIds)
      ? (req.body.selectedUserIds as unknown[])
          .map(Number)
          .filter((n) => Number.isFinite(n))
      : undefined;
    if (!Number.isFinite(id) || id < 1 || !token) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid request."));
      return;
    }
    const data = await confirmResend(
      id,
      requestUserId(req),
      token,
      selectedUserIds,
    );
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Resend queued."));
  } catch (e) {
    if (sendResendError(res, e)) return;
    handleError(e, res, next);
  }
});

router.get("/:id/resend/status", async (req, res, next) => {
  try {
    const newId = Number(req.query.newId);
    if (!Number.isFinite(newId) || newId < 1) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid notification id."));
      return;
    }
    const data = await getResendStatus(newId);
    if (!data) {
      res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Notification not found."));
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Status fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
});

// Registered last so literal routes (/dashboard, /masters, /stats, /export)
// always win over the :id pattern.
router.get("/:id/preview", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid notification id."));
      return;
    }
    const data = await getNotificationPreview(id);
    if (!data) {
      res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "Notification not found."));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", data, "Notification preview rendered."),
      );
  } catch (e) {
    handleError(e, res, next);
  }
});

router.get("/:id/contents", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id < 1) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "Invalid notification id."));
      return;
    }
    const data = await getNotificationContents(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", data, "Notification contents fetched."),
      );
  } catch (e) {
    handleError(e, res, next);
  }
});

export default router;
