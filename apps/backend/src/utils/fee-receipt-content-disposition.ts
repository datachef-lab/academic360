/**
 * Browser PDF tab title + Save-as name: `uid | Receipt - Semester | Course (Session).pdf`
 * Uses RFC 5987 `filename*` so Unicode and `|` work; ASCII `filename` fallback for older clients.
 */
export function buildFeeReceiptPdfContentDisposition(result: {
  uid: string;
  receiptName: string;
  semester: string;
  programCourse: string;
  session: string;
}): string {
  const displayName = `${result.uid} | ${result.receiptName} - ${result.semester} | ${result.programCourse} (${result.session}).pdf`;
  const asciiFallback = `fee-receipt-${String(result.uid).replace(/[^\w.-]+/g, "_")}.pdf`;
  const encoded = encodeURIComponent(displayName);
  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
