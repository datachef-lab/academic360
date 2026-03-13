import type { Request, Response } from "express";
import {
  distributeAdmitCard as distributeAdmitCardService,
  searchCandidate as searchCandidateService,
  listAdmitCardDistributions,
} from "../services/admit-card.service.js";

export async function searchCandidate(req: Request, res: Response) {
  try {
    const searchTerm = (req.query.search_term as string | undefined) ?? "";

    if (!searchTerm.trim()) {
      return res.status(400).json({ message: "search_term is required." });
    }

    const examGroupIdRaw = req.query.exam_group_id as string | undefined;
    const examGroupId = examGroupIdRaw ? Number(examGroupIdRaw) : undefined;
    if (examGroupIdRaw && !Number.isFinite(examGroupId)) {
      return res.status(400).json({
        message: "exam_group_id must be a valid number when provided.",
      });
    }

    const result = await searchCandidateService(examGroupId, searchTerm.trim());

    if (!result) {
      return res
        .status(404)
        .json({ message: "No candidate found for this exam" });
    }

    return res.json(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[AdmitCard] searchCandidate error:", error);
    return res
      .status(500)
      .json({ message: "Failed to search candidate", error: String(error) });
  }
}

export async function distributeAdmitCard(req: Request, res: Response) {
  try {
    const { studentId } = req.body as {
      studentId?: number;
    };

    if (!studentId || !Number.isFinite(Number(studentId))) {
      return res
        .status(400)
        .json({ message: "studentId is required and must be a number." });
    }

    const user = req.user as { id?: number } | undefined;
    const distributedByUserId = user?.id;

    if (!distributedByUserId) {
      return res
        .status(401)
        .json({ message: "Unauthorized: user not found in session." });
    }

    const record = await distributeAdmitCardService(
      Number(studentId),
      distributedByUserId,
    );

    return res.status(201).json({
      message: "Admit card distributed successfully",
      payload: record,
    });
  } catch (error: any) {
    // eslint-disable-next-line no-console
    console.error("[AdmitCard] distributeAdmitCard error:", error);

    if (
      error instanceof Error &&
      error.message.includes("already marked as distributed")
    ) {
      return res.status(409).json({ message: error.message });
    }

    return res
      .status(500)
      .json({ message: "Failed to mark admit card as distributed" });
  }
}

export async function getAdmitCardDistributions(req: Request, res: Response) {
  try {
    const examGroupIdRaw = req.query.exam_group_id as string | undefined;
    const examGroupId = examGroupIdRaw ? Number(examGroupIdRaw) : undefined;
    if (examGroupIdRaw && !Number.isFinite(examGroupId)) {
      return res.status(400).json({
        message: "exam_group_id must be a valid number when provided.",
      });
    }

    const rows = await listAdmitCardDistributions(examGroupId);
    return res.json(rows);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[AdmitCard] getAdmitCardDistributions error:", error);
    return res.status(500).json({
      message: "Failed to fetch admit card distributions",
      error: String(error),
    });
  }
}

export async function downloadAdmitCardDistributions(
  req: Request,
  res: Response,
) {
  try {
    const examGroupIdRaw = req.query.exam_group_id as string | undefined;
    const examGroupId = examGroupIdRaw ? Number(examGroupIdRaw) : undefined;
    if (examGroupIdRaw && !Number.isFinite(examGroupId)) {
      return res.status(400).json({
        message: "exam_group_id must be a valid number when provided.",
      });
    }

    const rows = await listAdmitCardDistributions(examGroupId);

    const headers = [
      "Student Name",
      "UID",
      "Roll Number",
      "Registration No",
      "Program Course",
      "Semester",
      "Shift",
      "Appear type",
      "Date of Collection",
      "Admit Card Saved By",
    ];

    const escape = (value: unknown): string => {
      const s = value == null ? "" : String(value);
      if (s.includes('"') || s.includes(",") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines: string[] = [];
    lines.push(headers.join(","));

    for (const row of rows) {
      const dateStr = row.collectionDate
        ? new Date(row.collectionDate).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })
        : "";

      lines.push(
        [
          row.studentName,
          row.uid,
          row.rollNumber ?? "",
          row.registrationNumber ?? "",
          row.programCourse ?? "",
          row.semester ?? "",
          row.shift ?? "",
          row.appearType ?? "",
          dateStr,
          row.savedByName ?? "",
        ]
          .map(escape)
          .join(","),
      );
    }

    const csv = lines.join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="admit-card-distributions.csv"',
    );
    return res.send(csv);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[AdmitCard] downloadAdmitCardDistributions error:", error);
    return res.status(500).json({
      message: "Failed to download admit card distributions",
      error: String(error),
    });
  }
}
