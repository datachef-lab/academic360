/** Build and trigger download of a CSV file from tabular data. */
export function downloadCsv(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers, ...rows]
    .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  // Prefix BOM so Excel reliably detects UTF-8.
  const csvWithBom = `\uFEFF${csv}`;
  const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Delay revocation to avoid download cancellation in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const formatCsvDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};
