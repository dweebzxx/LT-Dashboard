import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportOptions {
  tabName: string;
  n: number;
  total: number;
}

export async function exportToPDF(
  element: HTMLElement,
  options: ExportOptions
): Promise<void> {
  const { tabName, n, total } = options;

  await new Promise(resolve => setTimeout(resolve, 500));

  const canvas = await html2canvas(element, {
    scale: 3,
    useCORS: true,
    logging: false,
    backgroundColor: '#f3f4f6',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgWidth = 210;
  const pageHeight = 297;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  const addHeader = (pageNum: number, totalPages: number) => {
    pdf.setFillColor(220, 38, 38);
    pdf.rect(0, 0, pageWidth, 20, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Little Tikes Survey Analytics', margin, 12);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${tabName} | Page ${pageNum} of ${totalPages}`, pageWidth - margin, 12, { align: 'right' });
  };

  const addFooter = (pageNum: number) => {
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(`Generated on ${date} | N = ${n} / ${total}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  let heightLeft = imgHeight;
  let position = 25;
  let pageNum = 1;

  const availableHeight = pageHeight - 40;
  const totalPages = Math.ceil(imgHeight / availableHeight);

  addHeader(pageNum, totalPages);

  pdf.addImage(
    canvas.toDataURL('image/png', 1.0),
    'PNG',
    margin,
    position,
    contentWidth,
    imgHeight
  );

  addFooter(pageNum);

  heightLeft -= availableHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 25;
    pdf.addPage();
    pageNum++;

    addHeader(pageNum, totalPages);

    pdf.addImage(
      canvas.toDataURL('image/png', 1.0),
      'PNG',
      margin,
      position,
      contentWidth,
      imgHeight
    );

    addFooter(pageNum);
    heightLeft -= availableHeight;
  }

  const fileName = `Little-Tikes-${tabName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
