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
    toast({ title: "Generating PDF...", description: "Please wait while we render the high-quality PDF." });

    // Temporarily adjust styles for perfect rendering
    const originalTransform = element.style.transform;
    element.style.transform = 'none';

    // Capture the element at high resolution (scale: 3 for crisp text)
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    element.style.transform = originalTransform;

    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    const imgWidth = 210; // Standard A4 width in mm
    const pageHeight = 297; // Standard A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Remaining pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Save the PDF
    pdf.save(`Permionics_Case_Study_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({ title: "Success", description: "PDF exported successfully." });
  } catch (error) {
    console.error("PDF Export Error:", error);
    toast({ title: "Export Failed", description: "An error occurred while generating the PDF.", variant: "destructive" });
  }
}
