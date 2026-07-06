import { useState } from "react";
import { ListOrdered, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ResendDialog } from "@/features/notifications/components/resend-dialog";
import { studentAvatarUrl } from "@/utils/studentAvatarUrl";
import { humanizeFailureReason } from "@/features/notifications/utils/format";
import {
  getNotificationContents,
  getNotificationPreview,
  type NotificationContentRow,
  type NotificationPreview,
} from "@/features/notifications/api/notifications-api";
import {
  FeesTable,
  FeesTableBody,
  FeesTableCell,
  FeesTableHead,
  FeesTableHeader,
  FeesTableRow,
} from "@/features/fees-dashboard/components/FeesTable";

/** Recipient identity: student photo (unified avatar resolver) + name/email/phone. */
export function RecipientCell({
  name,
  email,
  phone,
  whatsapp,
  studentUid,
}: {
  name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  studentUid: string | null;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const avatar = studentAvatarUrl(studentUid ?? undefined);
  const initials = (name ?? email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const contact = phone || whatsapp;

  return (
    <div className="flex items-center gap-2.5">
      {avatar && !imgFailed ? (
        <img
          src={avatar}
          alt={name ?? "student"}
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="h-8 w-8 shrink-0 rounded-full border border-[#d4d4d4] object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#d4d4d4] bg-[#f0f0f0] text-[10px] font-semibold text-[#666]">
          {initials}
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-[#1a1a1a]">{name ?? "—"}</div>
        <div className="truncate text-[11px] text-[#777]">
          {email ?? "—"}
          {contact ? <span className="ml-1.5 text-[#999]">· {contact}</span> : null}
        </div>
      </div>
    </div>
  );
}

function FieldsTable({ rows }: { rows: NotificationContentRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[#888]">
        No field values captured for this notification.
      </p>
    );
  }
  return (
    <FeesTable framed>
      <FeesTableHeader>
        <FeesTableHead className="w-[38%]">Field</FeesTableHead>
        <FeesTableHead>Value</FeesTableHead>
      </FeesTableHeader>
      <FeesTableBody>
        {rows.map((r, i) => (
          <FeesTableRow key={i}>
            <FeesTableCell className="whitespace-normal break-words font-medium">
              {r.field ?? `Field ${i + 1}`}
            </FeesTableCell>
            <FeesTableCell className="whitespace-pre-wrap [overflow-wrap:anywhere]">
              {r.value || "—"}
            </FeesTableCell>
          </FeesTableRow>
        ))}
      </FeesTableBody>
    </FeesTable>
  );
}

/**
 * Email templates carry fixed-width tables (600px+); force them to shrink to
 * the iframe viewport so the preview never scrolls horizontally.
 */
const PREVIEW_FIT_CSS =
  "<style>html,body{overflow-x:hidden!important;margin:0;}" +
  "body *{max-width:100%!important;box-sizing:border-box;}" +
  "img{height:auto!important;}table{width:100%!important;}</style>";

function fitPreviewHtml(html: string): string {
  return /<head[^>]*>/i.test(html)
    ? html.replace(/<head[^>]*>/i, (m) => m + PREVIEW_FIT_CSS)
    : PREVIEW_FIT_CSS + html;
}

/**
 * "Fields" dialog. WhatsApp → fields table only. Email → two panes: fields
 * table (left) + the real email template rendered with this notification's
 * data (right, sandboxed iframe).
 */
export function FieldsDialogButton({
  notificationId,
  masterName,
  variant,
}: {
  notificationId: number;
  masterName: string | null;
  variant?: string;
}) {
  const [open, setOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [rows, setRows] = useState<NotificationContentRow[] | null>(null);
  const [preview, setPreview] = useState<NotificationPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const isEmail = variant === "EMAIL";

  const openDialog = async () => {
    setOpen(true);
    setLoading(true);
    setRows(null);
    setPreview(null);
    try {
      const [contents, prev] = await Promise.all([
        getNotificationContents(notificationId),
        isEmail ? getNotificationPreview(notificationId) : Promise.resolve(null),
      ]);
      setRows(contents);
      setPreview(prev);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => void openDialog()}
      >
        <ListOrdered className="mr-1 h-3.5 w-3.5" /> View
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={
            isEmail
              ? "flex max-h-[92vh] w-[95vw] max-w-[1400px] flex-col xl:max-w-[80vw]"
              : "flex max-h-[85vh] w-[95vw] max-w-lg flex-col"
          }
        >
          <DialogHeader>
            <DialogTitle>Template fields{masterName ? ` — ${masterName}` : ""}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-[#7c3aed]" />
              </div>
            ) : isEmail ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.5fr]">
                <div className="min-w-0">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#666]">
                    Fields
                  </h4>
                  <FieldsTable rows={rows ?? []} />
                </div>
                <div className="min-w-0">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#666]">
                    Email preview
                    {preview?.rendered === false && (
                      <span className="ml-2 font-normal normal-case text-[#999]">
                        (template unavailable — showing summary)
                      </span>
                    )}
                  </h4>
                  {preview?.subject && (
                    <p className="mb-2 rounded-md border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 text-xs">
                      <span className="font-semibold text-[#555]">Subject:</span>{" "}
                      <span className="text-[#1a1a1a]">{preview.subject}</span>
                    </p>
                  )}
                  {preview?.html ? (
                    <iframe
                      title="Email preview"
                      srcDoc={fitPreviewHtml(preview.html)}
                      sandbox=""
                      className="h-[65vh] w-full rounded-md border border-[#d4d4d4] bg-white"
                    />
                  ) : (
                    <p className="py-6 text-center text-sm text-[#888]">Preview unavailable.</p>
                  )}
                </div>
              </div>
            ) : (
              <FieldsTable rows={rows ?? []} />
            )}
          </div>

          {/* Fixed footer */}
          <DialogFooter className="shrink-0 gap-2 border-t pt-3 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
              disabled={loading}
              onClick={() => setResendOpen(true)}
            >
              <Send className="mr-1.5 h-3.5 w-3.5" /> Resend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResendDialog
        open={resendOpen}
        onOpenChange={setResendOpen}
        notificationId={notificationId}
        masterName={masterName}
        variant={variant}
      />
    </>
  );
}

/**
 * Failure reason: plain-language summary in the cell; dialog adds the fix hint
 * and the raw technical error for support staff.
 */
export function ReasonCell({ reason }: { reason: string | null }) {
  const [open, setOpen] = useState(false);
  if (!reason) return <span className="text-[#bbb]">—</span>;
  const friendly = humanizeFailureReason(reason);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="block max-w-[280px] whitespace-normal break-words text-left text-xs font-medium leading-snug text-rose-600 underline decoration-dotted underline-offset-2 hover:text-rose-700"
        title="Click for details"
      >
        {friendly.summary}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-lg">
          <DialogHeader>
            <DialogTitle>Why did this fail?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm font-semibold text-rose-800">{friendly.summary}</p>
              {friendly.hint && (
                <p className="mt-1 text-xs leading-relaxed text-rose-700">{friendly.hint}</p>
              )}
            </div>
            <details className="rounded-md border border-[#e0e0e0]">
              <summary className="cursor-pointer select-none px-3 py-2 text-xs font-medium text-[#555] hover:bg-[#fafafa]">
                Technical details
              </summary>
              <pre className="max-h-[40vh] overflow-auto whitespace-pre-wrap break-words border-t border-[#e0e0e0] bg-[#fafafa] p-3 font-mono text-[11px] leading-relaxed text-[#444]">
                {reason}
              </pre>
            </details>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
