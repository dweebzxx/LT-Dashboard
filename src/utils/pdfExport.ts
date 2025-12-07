import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import 'jspdf-autotable';

interface ExportOptions {
  tabName: string;
  filterInfo?: string;
  includeTimestamp?: boolean;
}

export const exportTabToPDF = async (
  elementId: string,
  options: ExportOptions
): Promise<void> => {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element with id "${elementId}" not found`);
    return;
  }

  try {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin - 20;

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    } as any);

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    const totalPages = Math.ceil(imgHeight / contentHeight);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      pdf.setFillColor(220, 38, 38);
      pdf.rect(0, 0, pageWidth, 8, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Little Tikes Survey Analytics Dashboard', margin, 6);

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(options.tabName, margin, 18);

      if (options.filterInfo && page === 0) {
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(options.filterInfo, margin, 23);
      }

      const yOffset = -(page * contentHeight);

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin + 20 + yOffset,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );

      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.setFont('helvetica', 'normal');

      const footerText = options.includeTimestamp !== false
        ? `Generated: ${timestamp}`
        : '';
      const pageText = `Page ${page + 1} of ${totalPages}`;

      pdf.text(footerText, margin, pageHeight - 5);
      pdf.text(pageText, pageWidth - margin - 30, pageHeight - 5);
    }

    const fileName = `${options.tabName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export const getFilterInfoText = (
  filteredCount: number,
  totalCount: number,
  hasActiveFilters: boolean
): string => {
  if (!hasActiveFilters) {
    return `Showing all data (N = ${totalCount})`;
  }
  return `Filtered data: N = ${filteredCount} of ${totalCount}`;
};
