/**
 * Captures the #cs-root element as a high-quality multi-page A4 PDF using html2canvas + jsPDF.
 * Slices long content cleanly across standard A4 pages (210mm x 297mm).
 */
export async function printCaseStudy() {
  const el = document.getElementById("cs-root");
  if (!el) {
    console.error("cs-root element not found");
    return;
  }
  
  // By using native window.print(), we rely on the browser's PDF generator,
  // which respects CSS page-break-inside: avoid; preventing elements from being cut in half.
  window.print();
}
