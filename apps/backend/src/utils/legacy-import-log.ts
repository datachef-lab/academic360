/**
 * Durable per-UID legacy-import outcomes, appended as JSON lines to
 * logs/legacy-import.log. The upload's HTTP/socket response is the only other
 * place these surface, and a dismissed response leaves no trace — the Jul 15-16
 * staging import lost 79 PG students' fees to legacy-DB timeouts nobody could
 * see afterwards, and the Jul 22 import silently loaded ZERO subject
 * selections (skippedMeta) for the whole cohort. A logging failure must never
 * break the import itself.
 *
 * Kinds:
 *  - "student"           — the per-student pipeline outcome
 *  - "fees"              — the chained legacy fee load
 *  - "structure"         — ensureAcademicYearStructure failures/copies (uid is
 *                          "AY:<id>" when no student uid applies)
 *  - "subject-selection" — per-student legacy selection migration counts
 */
export async function recordImportLog(
  uid: string,
  kind: "student" | "fees" | "structure" | "subject-selection",
  status: "ok" | "error" | "skipped",
  message: string | null,
) {
  try {
    const fs = await import("fs").then((m) => m.promises);
    await fs.mkdir("./logs", { recursive: true });
    const line = JSON.stringify({
      at: new Date().toISOString(),
      uid,
      kind,
      status,
      ...(message ? { message } : {}),
    });
    await fs.appendFile("./logs/legacy-import.log", line + "\n");
  } catch (e) {
    console.error(
      "[LegacyImport] failed to write import log:",
      (e as Error)?.message,
    );
  }
}
