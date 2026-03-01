import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const exportToPDF = (title: string, subtitle: string, columns: string[], rows: any[][]) => {
  const doc = new jsPDF();
  
  // Add Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('BUMDes Maju Bersama', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(title, 105, 22, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 105, 28, { align: 'center' });

  // Add Table
  autoTable(doc, {
    startY: 35,
    head: [columns],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Add Signatures
  const finalY = (doc as any).lastAutoTable.finalY || 40;
  if (finalY + 40 < doc.internal.pageSize.height) {
    doc.text('Mengetahui,', 40, finalY + 20, { align: 'center' });
    doc.text('Direktur BUMDes', 40, finalY + 25, { align: 'center' });
    doc.text('(_________________)', 40, finalY + 45, { align: 'center' });

    doc.text('Dibuat Oleh,', 170, finalY + 20, { align: 'center' });
    doc.text('Bendahara', 170, finalY + 25, { align: 'center' });
    doc.text('(_________________)', 170, finalY + 45, { align: 'center' });
  }

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};

export const exportToExcel = (title: string, columns: string[], rows: any[][]) => {
  const worksheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${title.replace(/\s+/g, '_')}.xlsx`);
};
