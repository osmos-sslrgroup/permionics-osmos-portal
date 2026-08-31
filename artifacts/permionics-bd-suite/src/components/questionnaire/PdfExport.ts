import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Question, Section, ClientInfo } from '@/types/questionnaire';

export const generatePdf = async (
  sectorName: string,
  clientInfo: ClientInfo,
  questions: Question[],
  sections: Section[],
  logoUrl: string
): Promise<void> => {
  // A4 portrait
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Brand colors
  const primaryBlue: [number, number, number] = [12, 74, 140]; // #0C4A8C
  const lightBlue: [number, number, number] = [230, 241, 251]; // #E6F1FB

  // Helper to add header to every page
  const addHeader = async () => {
    // Top border
    doc.setDrawColor(...primaryBlue);
    doc.setLineWidth(0.5);
    doc.line(margin, 28, pageWidth - margin, 28);

    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryBlue);
    doc.setFontSize(14);
    doc.text('TECHNICAL QUESTIONNAIRE', pageWidth - margin, 20, { align: 'right' });

    // Sector badge
    doc.setFontSize(10);
    doc.setFillColor(...lightBlue);
    const textWidth = doc.getTextWidth(sectorName);
    doc.rect(pageWidth - margin - textWidth - 6, 22, textWidth + 6, 5, 'F');
    doc.text(sectorName, pageWidth - margin - 3, 26, { align: 'right' });

    try {
      // Fetch and embed logo
      const response = await fetch(logoUrl);
      const blob = await response.blob();

      const reader = new FileReader();
      const base64data = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Add logo (aspect ratio approx 3:1)
      doc.addImage(base64data, 'PNG', margin, 12, 40, 13);
    } catch (error) {
      console.error('Could not load logo for PDF:', error);
      // Fallback text if image fails
      doc.setFont('helvetica', 'bold');
      doc.text('PERMIONICS', margin, 20);
    }
  };

  // Helper to add footer to every page
  const addFooter = (pageNumber: number, totalPages: number) => {
    doc.setDrawColor(...primaryBlue);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('Permionics Membranes Pvt. Ltd. | Customized Membrane Solutions', margin, pageHeight - 10);
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // Initial header
  await addHeader();

  let currentY = 35;

  // Render Client Info Table
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { fillColor: lightBlue, textColor: primaryBlue, fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 55 },
      2: { fillColor: lightBlue, textColor: primaryBlue, fontStyle: 'bold', cellWidth: 30 },
      3: { cellWidth: 45 }
    },
    body: [
      ['Company Name', clientInfo.companyName || '', 'Date', clientInfo.date || ''],
      ['Contact Person', clientInfo.contactPerson || '', 'Location', clientInfo.location || '']
    ],
    didDrawPage: (data) => {
      // Need to cast data.cursor to access y
      const cursor = data.cursor as { x: number, y: number };
      if (cursor && cursor.y) {
        currentY = cursor.y + 10;
      }
    }
  });

  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.text('Please provide detailed information to help us design the optimal membrane solution.', margin, currentY);
  currentY += 10;

  // Process sections and questions
  const organizedData = sections.map(section => ({
    section,
    questions: questions.filter(q => q.sectionId === section.id).sort((a, b) => a.number - b.number)
  })).filter(group => group.questions.length > 0);

  const unsectionedQs = questions.filter(q => !q.sectionId).sort((a, b) => a.number - b.number);

  if (unsectionedQs.length > 0) {
    organizedData.push({
      section: { id: 'unsectioned', title: 'Other Questions', isExpanded: true },
      questions: unsectionedQs
    });
  }

  for (const group of organizedData) {
    // Check page break for section header
    if (currentY > pageHeight - 40) {
      doc.addPage();
      await addHeader();
      currentY = 35;
    }

    // Section Header
    doc.setFillColor(...lightBlue);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 8, 'F');

    // Left blue border accent for section
    doc.setFillColor(...primaryBlue);
    doc.rect(margin, currentY, 2, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryBlue);
    doc.setFontSize(10);
    doc.text(group.section.title.toUpperCase(), margin + 5, currentY + 5.5);

    currentY += 15;

    for (const q of group.questions) {
      // Estimate question height
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const qText = `Q${q.number}. ${q.text}${q.required ? ' *' : ' (optional)'}`;
      const splitText = doc.splitTextToSize(qText, pageWidth - 2 * margin);
      const textHeight = splitText.length * 5;

      let requiredSpace = textHeight + 5;
      if (q.type === 'Text') requiredSpace += 15;
      else if (q.type === 'Number') requiredSpace += 10;
      else if (q.type === 'Choice') requiredSpace += 10;
      else if (q.type === 'Table') requiredSpace += 35;

      // Check page break
      if (currentY + requiredSpace > pageHeight - margin) {
        doc.addPage();
        await addHeader();
        currentY = 35;
      }

      // Draw question text
      doc.setTextColor(30, 30, 30);
      doc.text(splitText, margin, currentY);
      currentY += textHeight + 2;

      // Draw answer blanks based on type
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.2);

      if (q.type === 'Text') {
        doc.setLineDashPattern([1, 1], 0);
        doc.line(margin + 5, currentY + 5, pageWidth - margin, currentY + 5);
        doc.line(margin + 5, currentY + 13, pageWidth - margin, currentY + 13);
        doc.setLineDashPattern([], 0); // reset
        currentY += 20;
      }
      else if (q.type === 'Number') {
        doc.setLineDashPattern([1, 1], 0);
        doc.line(margin + 5, currentY + 5, margin + 60, currentY + 5);
        doc.setLineDashPattern([], 0);
        currentY += 12;
      }
      else if (q.type === 'Choice') {
        doc.setLineDashPattern([1, 1], 0);
        const options = ['(   ) ....................', '(   ) ....................', '(   ) ....................'];
        let xOffset = margin + 5;
        options.forEach(opt => {
          doc.text(opt, xOffset, currentY + 5);
          xOffset += 50;
        });
        doc.setLineDashPattern([], 0);
        currentY += 12;
      }
      else if (q.type === 'Table') {
        autoTable(doc, {
          startY: currentY + 2,
          margin: { left: margin + 5, right: margin },
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3,
            lineColor: [180, 180, 180]
          },
          headStyles: {
            fillColor: [245, 245, 245],
            textColor: [80, 80, 80]
          },
          head: [['Parameter', 'Unit', 'Value']],
          body: [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
          ],
          didDrawPage: (data) => {
            const cursor = data.cursor as { x: number, y: number };
            if (cursor && cursor.y) {
              currentY = cursor.y;
            }
          }
        });
        currentY += 8;
      }

      currentY += 5; // spacing between questions
    }

    currentY += 5; // spacing between sections
  }

  // Add footers with page numbers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages);
  }

  // Save the PDF
  const filename = `Permionics_Questionnaire_${sectorName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
