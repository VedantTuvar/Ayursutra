import PDFDocument from 'pdfkit';
import { Response } from 'express';

/**
 * Write a styled clinical invoice PDF straight onto an Express Response stream
 */
export function generateInvoicePDF(invoice: any, res: Response): void {
  const doc = new PDFDocument({ margin: 50 });

  // Pipe doc directly onto response stream
  doc.pipe(res);

  // 1. Header & Clinic metadata
  doc
    .fillColor('#15803d') // Forest green brand color
    .fontSize(20)
    .text('AyurSutra 🌿', 50, 45)
    .fillColor('#334155')
    .fontSize(10)
    .text(invoice.clinic?.name || 'AyurSutra Wellness Center', 50, 70)
    .text(invoice.clinic?.email || 'billing@ayursutra.com', 50, 85)
    .text(invoice.clinic?.phone || '+91 99999 99999', 50, 100)
    .text(`GSTIN: ${invoice.clinic?.gstNumber || 'N/A'}`, 50, 115);

  // 2. Invoice identifiers
  doc
    .fillColor('#0f172a')
    .fontSize(16)
    .text('TAX INVOICE', 350, 45, { align: 'right' })
    .fillColor('#475569')
    .fontSize(10)
    .text(`Invoice #: ${invoice.invoiceNumber}`, 350, 70, { align: 'right' })
    .text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`, 350, 85, { align: 'right' })
    .text(`Status: ${invoice.status}`, 350, 100, { align: 'right' });

  doc.moveDown(2);
  doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(50, 135).lineTo(550, 135).stroke();

  // 3. Bill To Details
  doc
    .fillColor('#0f172a')
    .fontSize(11)
    .text('BILL TO:', 50, 155)
    .fillColor('#334155')
    .fontSize(10)
    .text(invoice.patient?.user?.name || 'Amit Patel', 50, 170)
    .text(invoice.patient?.user?.phone || 'N/A', 50, 185)
    .text(invoice.patient?.user?.email || 'N/A', 50, 200);

  doc.moveDown(2);

  // 4. Line Items Table Headers
  const tableTop = 230;
  doc
    .fillColor('#1e293b')
    .fontSize(10)
    .text('Item Description', 50, tableTop)
    .text('Qty', 320, tableTop, { width: 30, align: 'right' })
    .text('Unit Cost', 380, tableTop, { width: 60, align: 'right' })
    .text('Amount', 480, tableTop, { width: 70, align: 'right' });

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

  // 5. Line Items Rows
  let position = tableTop + 25;
  invoice.lineItems.forEach((item: any) => {
    doc
      .fillColor('#334155')
      .fontSize(9)
      .text(item.description, 50, position, { width: 250 })
      .text(String(item.quantity), 320, position, { width: 30, align: 'right' })
      .text(`INR ${Number(item.unitPrice).toFixed(2)}`, 380, position, { width: 60, align: 'right' })
      .text(`INR ${Number(item.total).toFixed(2)}`, 480, position, { width: 70, align: 'right' });

    position += doc.heightOfString(item.description, { width: 250 }) + 10;
  });

  doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(50, position).lineTo(550, position).stroke();
  position += 15;

  // 6. Subtotal calculations
  const detailsStart = 350;
  doc
    .fillColor('#475569')
    .fontSize(9)
    .text('Subtotal:', detailsStart, position)
    .text(`INR ${Number(invoice.subtotal).toFixed(2)}`, 480, position, { width: 70, align: 'right' });

  position += 15;
  doc
    .text(`Discount:`, detailsStart, position)
    .text(`- INR ${Number(invoice.discountAmount).toFixed(2)}`, 480, position, { width: 70, align: 'right' });

  position += 15;
  doc
    .text(`GST (18%):`, detailsStart, position)
    .text(`INR ${Number(invoice.gstAmount).toFixed(2)}`, 480, position, { width: 70, align: 'right' });

  position += 20;
  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(detailsStart, position).lineTo(550, position).stroke();

  position += 10;
  doc
    .fillColor('#15803d') // Brand color
    .fontSize(11)
    .text('Grand Total:', detailsStart, position)
    .text(`INR ${Number(invoice.totalAmount).toFixed(2)}`, 480, position, { width: 70, align: 'right' });

  // 7. Footer notes
  doc
    .fillColor('#64748b')
    .fontSize(8)
    .text('Thank you for choosing AyurSutra for your healing journey.', 50, doc.page.height - 80, { align: 'center' })
    .text('This is a computer-generated tax invoice and does not require signatures.', 50, doc.page.height - 65, { align: 'center' });

  // Finalize Document
  doc.end();
}
