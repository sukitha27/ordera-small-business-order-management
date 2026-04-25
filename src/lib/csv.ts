// CSV export helpers.
// Hand-rolled to avoid pulling in a CSV library for ~30 lines of work.
// Handles Excel-style escaping: quotes around fields with commas/quotes/newlines,
// and double-quotes for embedded quotes.

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // If the cell contains a comma, quote, or newline, wrap in quotes
  // and escape any embedded quotes by doubling them.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function buildCsv(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const bodyLines = rows.map((row) => row.map(escapeCsvCell).join(","));
  // BOM ensures Excel opens UTF-8 (Sinhala) text correctly. Without this,
  // Excel mangles non-ASCII characters when opened on Windows.
  const BOM = "\uFEFF";
  return BOM + [headerLine, ...bodyLines].join("\r\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Free the blob URL after a short delay to avoid race conditions in some browsers
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Small helper to make consistent filenames
export function csvFilename(prefix: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${prefix}-${yyyy}-${mm}-${dd}.csv`;
}