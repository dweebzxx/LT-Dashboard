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
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin - 25;

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const noPdfElements = element.querySelectorAll('.no-pdf-export');
    const originalDisplays: string[] = [];

    noPdfElements.forEach((el, idx) => {
      const htmlEl = el as HTMLElement;
      originalDisplays[idx] = htmlEl.style.display;
      htmlEl.style.display = 'none';
    });

    const canvas = await html2canvas(element, {
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scale: 2,
    } as any);

    noPdfElements.forEach((el, idx) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.display = originalDisplays[idx];
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    const sections = detectSections(element);
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
        margin + 25 + yOffset,
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

function detectSections(element: HTMLElement): Array<{ top: number; height: number; type: string }> {
  const sections: Array<{ top: number; height: number; type: string }> = [];

  const tables = element.querySelectorAll('table');
  tables.forEach((table) => {
    const rect = table.getBoundingClientRect();
    const containerRect = element.getBoundingClientRect();
    sections.push({
      top: rect.top - containerRect.top,
      height: rect.height,
      type: 'table',
    });
  });

  const charts = element.querySelectorAll('.recharts-wrapper, .recharts-responsive-container');
  charts.forEach((chart) => {
    const rect = chart.getBoundingClientRect();
    const containerRect = element.getBoundingClientRect();
    sections.push({
      top: rect.top - containerRect.top,
      height: rect.height,
      type: 'chart',
    });
  });

  return sections.sort((a, b) => a.top - b.top);
}

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
