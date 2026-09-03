/**
 * Export utilities for Case Study Generator:
 * Supports PNG, JPEG, HTML-Docx, and browser Native Print triggers.
 */

export async function exportToImage(format: "png" | "jpeg" = "png") {
  const el = document.getElementById("cs-root");
  if (!el) {
    console.error("cs-root element not found");
    return;
  }

  const { default: html2canvas } = await import("html2canvas");

  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = "visible";

  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: el.scrollWidth,
      height: el.scrollHeight,
    });

    document.body.style.overflow = originalOverflow;

    const mimeType = format === "png" ? "image/png" : "image/jpeg";
    const dataUrl = canvas.toDataURL(mimeType, 0.95);

    const link = document.createElement("a");
    link.download = `Permionics_CaseStudy_${Date.now()}.${format}`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    document.body.style.overflow = originalOverflow;
    console.error(`Export to ${format} failed:`, err);
    alert(`Export to ${format.toUpperCase()} failed. Please try again.`);
  }
}

export async function exportToDocx() {
  const el = document.getElementById("cs-root");
  if (!el) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Permionics Case Study</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.5; }
          h1, h2, h3 { color: #003466; }
          table { border-collapse: collapse; width: 100%; margin: 12px 0; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
          th { background-color: #003466; color: white; }
          .highlight { background-color: #f0f5fb; padding: 10px; border-left: 4px solid #1a5fa8; }
        </style>
      </head>
      <body>
        ${el.innerHTML}
      </body>
    </html>
  `;

  const blob = new Blob(["\ufeff" + htmlContent], {
    type: "application/msword;charset=utf-8",
  });

  const link = document.createElement("a");
  link.download = `Permionics_CaseStudy_${Date.now()}.doc`;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
}

export function triggerNativePrint() {
  window.print();
}
