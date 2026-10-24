import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from '@/hooks/use-toast';

export async function printCaseStudy(caseStudyData?: any) {
  const element = document.getElementById('cs-root');
  if (!element) {
    toast({ title: "Error", description: "Could not find case study preview to export.", variant: "destructive" });
    return;
  }

  try {
    toast({ title: "Generating Searchable PDF...", description: "Please wait while we render your multi-page document." });

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

    // Build structured, deterministic text layers for ISO-standard searchable PDF
    const d = caseStudyData || {};
    const client = d.client || "Permionics Project";
    const location = d.location || "India";
    const sector = d.sector || "Water/Wastewater";
    const categoryLabel = d.categoryLabel || "CASE HISTORY | WATER & WASTEWATER";
    const title = d.title || client;
    const application = d.application || "RO";
    const capacity = d.capacity || "N/A";
    const statBar = d.statBar || "";
    const intro = d.intro || "";
    const challengeProblem = d.challengeProblem || "";
    const challengeLimits = d.challengeLimits || "";
    const solDesign = d.solDesign || "";
    const solAuto = d.solAuto || "";
    const solBOO = d.solBOO || "";
    const technologies = Array.isArray(d.technologies) ? d.technologies.join("\n") : (d.technologies || "RO");
    const delivery = d.delivery || "";
    const operations = d.operations || "";

    const page1Text = [
      `C L I E N T ${client}\t${location} · ${sector} Sector`,
      categoryLabel,
      title,
      "SITE INFORMATION",
      `LOCATION:\n${location}`,
      `INDUSTRY:\n${sector}`,
      `APPLICATION:\n${application}`,
      `CAPACITY:\n${capacity}`,
      `CLIENT:\n${client}`,
      `TECHNOLOGIES USED\n${technologies}`,
      delivery ? `DELIVERY MODEL\n${delivery}` : "",
      operations ? `OPERATIONS\n${operations}` : "",
      statBar,
      intro ? `INTRODUCTION\n${intro}` : "",
      "THE CHALLENGE",
      challengeProblem ? `The Problem. ${challengeProblem}` : "",
      challengeLimits ? `Existing Limitations. ${challengeLimits}` : "",
      "THE TECHNICAL SOLUTION",
      solDesign ? `System Design. ${solDesign}` : "",
      solAuto ? `Automation & Control. ${solAuto}` : "",
      solBOO ? `BOO Delivery Model. ${solBOO}` : ""
    ].filter(Boolean).join("\n\n");

    const cardsText = Array.isArray(d.cards) && d.cards.length > 0
      ? d.cards.map((c: any) => `${c.number}\n${c.label}`).join("\n\n")
      : "";

    // Format water table into tab-separated rows for deterministic parser
    let waterTableText = "";
    if (d.waterData && typeof d.waterData === "string" && d.waterData.trim()) {
      const rows = d.waterData.split("\n").map((r: string) => r.trim()).filter(Boolean);
      const formattedRows = rows.map((r: string) => {
        const parts = r.split(/[|\t]+/).map((p: string) => p.trim());
        return parts.join("\t");
      });
      waterTableText = `BEFORE & AFTER: WATER QUALITY COMPARISON\nParameter\tUnit\tFeed (Raw)\tTreated Water\n${formattedRows.join("\n")}`;
    }

    const perfStab = d.perfStab || "";
    const valueDel = d.valueDel || "";
    const envImpact = d.envImpact || "";
    const conclusions = d.conclusions || "";

    const page2Text = [
      cardsText ? `OPERATIONAL RESULTS\n${cardsText}` : "",
      waterTableText,
      perfStab ? `PERFORMANCE STABILITY\n${perfStab}` : "",
      valueDel ? `VALUE DELIVERED\n${valueDel}` : "",
      envImpact ? `ENVIRONMENTAL IMPACT\n${envImpact}` : "",
      conclusions ? `CONCLUSIONS\n${conclusions}` : ""
    ].filter(Boolean).join("\n\n");

    // Helper to inject invisible, selectable, searchable ISO-standard text layer
    const injectTextLayer = (text: string) => {
      try {
        (pdf.internal as any).write("3 Tr"); // ISO 32000 invisible text rendering mode (neither fill nor stroke)
        pdf.setFontSize(8);
        pdf.text(text, 10, 10, { maxWidth: 190 });
        (pdf.internal as any).write("0 Tr"); // Reset back to default fill mode
      } catch (e) {
        console.warn("Could not inject text layer into PDF:", e);
      }
    };

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
    // Inject Page 1 selectable & searchable text layer
    injectTextLayer(page1Text);

    // --- Page 2 and subsequent pages ---
    let currentSrcY = page1CanvasHeight;
    let pageNum = 2;
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

      if (pageNum === 2) {
        // Inject Page 2 selectable & searchable text layer (Cards, Water Quality Table, Conclusions)
        injectTextLayer(page2Text);
      }

      currentSrcY += sliceHeight;
      pageNum++;
    }

    const sanitizedClient = client.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_");
    const filename = `${sanitizedClient}_Case_Study.pdf`;
    pdf.save(filename);
    toast({ title: "Success", description: `Exported searchable PDF: ${filename}` });
  } catch (error) {
    console.error("PDF Export Error:", error);
    toast({ title: "Export Failed", description: "An error occurred while generating the PDF.", variant: "destructive" });
  }
}
