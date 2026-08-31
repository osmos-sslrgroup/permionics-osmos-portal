/**
 * Captures the #cs-root element as a high-quality PDF using html2canvas + jsPDF.
 * Outputs a clean A4 single-page PDF with proper margins.
 */
export async function printCaseStudy() {
  const el = document.getElementById("cs-root");
  if (!el) {
    console.error("cs-root element not found");
    return;
  }

  // Dynamically import to avoid SSR issues
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  // Temporarily ensure the element is not clipped for capture
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = "visible";

  try {
    const canvas = await html2canvas(el, {
      scale: 2,              // 2x for crisp print quality
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: el.scrollWidth,
      height: el.scrollHeight,
      windowWidth: el.scrollWidth,
      windowHeight: el.scrollHeight,
    });

    document.body.style.overflow = originalOverflow;

    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    // A4 dimensions in mm
    const A4_W = 210;
    const A4_H = 297;

    const canvasW = canvas.width;
    const canvasH = canvas.height;

    // Scale image to fit A4 width exactly (210mm) and calculate height based on element aspect ratio
    const imgW = A4_W;
    const imgH = (canvasH / canvasW) * A4_W;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [imgW, imgH], // Single dynamic page matching the exact content height
      compress: true,
    });

    pdf.addImage(imgData, "JPEG", 0, 0, imgW, imgH);
    pdf.save(`Permionics_CaseStudy_${Date.now()}.pdf`);
  } catch (err) {
    document.body.style.overflow = originalOverflow;
    console.error("PDF export failed:", err);
    alert("PDF export failed. Please try again.");
  }
}
