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

  // Dynamically import to avoid SSR issues
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = "visible";

  try {
    const canvas = await html2canvas(el, {
      scale: 2, // 2x for crisp print quality
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

    // Standard A4 dimensions in mm
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Scaled height in mm based on A4 width aspect ratio
    const imgWidth = A4_WIDTH;
    const imgHeight = (canvasHeight / canvasWidth) * A4_WIDTH;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    let heightLeft = imgHeight;
    let position = 0;

    // Render Page 1
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= A4_HEIGHT;

    // Render subsequent standard A4 pages if content spans beyond 1 page
    while (heightLeft > 2) {
      position -= A4_HEIGHT;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= A4_HEIGHT;
    }

    pdf.save(`Permionics_CaseStudy_${Date.now()}.pdf`);
  } catch (err) {
    document.body.style.overflow = originalOverflow;
    console.error("PDF export failed:", err);
    alert("PDF export failed. Please try again.");
  }
}
