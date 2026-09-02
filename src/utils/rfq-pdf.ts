import { jsPDF } from 'jspdf';
import dayjs from 'dayjs';

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const MARGIN_X = 90;
const CONTENT_TOP = 250;
const CONTENT_BOTTOM = 100;
const BODY_FONT_SIZE = 27;
const LINE_HEIGHT = 43;

const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  if (!text) return [''];

  const lines: string[] = [];
  let line = '';
  for (const character of text) {
    const nextLine = `${line}${character}`;
    if (line && context.measureText(nextLine).width > maxWidth) {
      lines.push(line);
      line = character;
    } else {
      line = nextLine;
    }
  }
  lines.push(line);
  return lines;
};

const createPdfPage = (title: string, lines: string[], pageNumber: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('ไม่สามารถสร้าง PDF ได้');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  context.fillStyle = '#1f3f37';
  context.fillRect(MARGIN_X, 170, PAGE_WIDTH - MARGIN_X * 2, 5);
  context.font = '700 42px Tahoma, sans-serif';
  context.fillText(title, MARGIN_X, 105);
  context.fillStyle = '#64748b';
  context.font = '24px Tahoma, sans-serif';
  context.fillText(`สร้างเมื่อ ${dayjs().format('DD/MM/YYYY HH:mm')}  |  หน้า ${pageNumber}`, MARGIN_X, 145);

  context.fillStyle = '#172033';
  context.font = `${BODY_FONT_SIZE}px Tahoma, sans-serif`;
  let y = CONTENT_TOP;
  lines.forEach((line) => {
    context.fillText(line, MARGIN_X, y);
    y += LINE_HEIGHT;
  });

  return canvas.toDataURL('image/jpeg', 0.95);
};

export const downloadRfqPdf = (rfqId: string, content: string): void => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('ไม่สามารถสร้าง PDF ได้');
  }

  context.font = `${BODY_FONT_SIZE}px Tahoma, sans-serif`;
  const maxWidth = PAGE_WIDTH - MARGIN_X * 2;
  const wrappedLines = content.split(/\r?\n/).flatMap((paragraph) => wrapText(context, paragraph, maxWidth));
  const linesPerPage = Math.floor((PAGE_HEIGHT - CONTENT_TOP - CONTENT_BOTTOM) / LINE_HEIGHT);
  const title = `ข้อมูล RFQ ${rfqId}`;
  const pages = Array.from(
    { length: Math.max(1, Math.ceil(wrappedLines.length / linesPerPage)) },
    (_value, index) => wrappedLines.slice(index * linesPerPage, (index + 1) * linesPerPage)
  );

  const pdfDocument = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pages.forEach((lines, index) => {
    if (index > 0) pdfDocument.addPage();
    pdfDocument.addImage(createPdfPage(title, lines, index + 1), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
  });

  const safeId = rfqId.replace(/[^a-zA-Z0-9_-]/g, '_');
  pdfDocument.save(`RFQ-${safeId}.pdf`);
};
