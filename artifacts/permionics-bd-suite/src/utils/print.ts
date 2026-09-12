import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from '@/hooks/use-toast';

export async function printCaseStudy() {
  const element = document.getElementById('cs-root');
  if (!element) {
    toast({ title: "Error", description: "Could not find case study preview to export.", variant: "destructive" });
    return;
  }

  try {
    toast({ title: "Generating PDF...", description: "Please wait while we render your multi-page document." });

    const originalTransform = element.style.transform;
    element.style.transform = 'none';

    // Capture at high resolution (scale 2.5 for crisp text & manageable memory)
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    element.style.transform = originalTransform;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Standard A4 height in canvas pixels based on width ratio
    const pageCanvasHeight = Math.floor((canvasWidth * pdfHeight) / pdfWidth);

    // Check for explicit page break element inside template
    const pageBreakElement = element.querySelector('.cs-page-break');
    let page1CanvasHeight = pageCanvasHeight;

    if (pageBreakElement) {
      const elementRect = element.getBoundingClientRect();
      const breakRect = pageBreakElement.getBoundingClientRect();
      const breakOffsetY = breakRect.top - elementRect.top + breakRect.height;
      if (element.offsetHeight > 0) {
        page1CanvasHeight = Math.floor((breakOffsetY / element.offsetHeight) * canvasHeight);
      }
    }

    // --- Page 1 ---
    const p1Canvas = document.createElement('canvas');
    p1Canvas.width = canvasWidth;
    const p1SliceHeight = Math.min(page1CanvasHeight, canvasHeight);
    p1Canvas.height = p1SliceHeight;
    const p1Ctx = p1Canvas.getContext('2d');
    if (p1Ctx) {
      p1Ctx.drawImage(canvas, 0, 0, canvasWidth, p1SliceHeight, 0, 0, canvasWidth, p1SliceHeight);
      const p1Data = p1Canvas.toDataURL('image/jpeg', 0.98);
      const p1ImgHeight = (p1SliceHeight * pdfWidth) / canvasWidth;
      pdf.addImage(p1Data, 'JPEG', 0, 0, pdfWidth, Math.min(p1ImgHeight, pdfHeight));
    }

    // --- Page 2 and subsequent pages ---
    let currentSrcY = page1CanvasHeight;
    while (currentSrcY < canvasHeight - 10) {
      pdf.addPage();
      const sliceHeight = Math.min(pageCanvasHeight, canvasHeight - currentSrcY);
      const pNextCanvas = document.createElement('canvas');
      pNextCanvas.width = canvasWidth;
      pNextCanvas.height = sliceHeight;

      const pNextCtx = pNextCanvas.getContext('2d');
      if (pNextCtx) {
        pNextCtx.drawImage(canvas, 0, currentSrcY, canvasWidth, sliceHeight, 0, 0, canvasWidth, sliceHeight);
        const pNextData = pNextCanvas.toDataURL('image/jpeg', 0.98);
        const pNextImgHeight = (sliceHeight * pdfWidth) / canvasWidth;
        pdf.addImage(pNextData, 'JPEG', 0, 0, pdfWidth, Math.min(pNextImgHeight, pdfHeight));
      }
      currentSrcY += sliceHeight;
    }

    pdf.save(`Permionics_Case_Study_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({ title: "Success", description: "Multi-page PDF exported successfully." });
  } catch (error) {
    console.error("PDF Export Error:", error);
    toast({ title: "Export Failed", description: "An error occurred while generating the PDF.", variant: "destructive" });
  }
}
