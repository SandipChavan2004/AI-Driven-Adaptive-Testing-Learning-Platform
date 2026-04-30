import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate and download a PDF report for a completed test.
 * @param {object} opts
 * @param {string} opts.subject
 * @param {number} opts.score
 * @param {number} opts.accuracy
 * @param {number} opts.correct
 * @param {number} opts.total
 * @param {string} opts.level - capability level
 * @param {string} opts.userName
 * @param {string} opts.date
 * @param {Array}  opts.recommendations - [{title, url}]
 * @param {string} [opts.elementId]    - optional: capture a DOM element instead
 */
export const downloadTestReport = async (opts) => {
  const {
    subject, score, accuracy, correct, total,
    level, userName, date, recommendations = [],
  } = opts;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();

  /* ── Header gradient bar ── */
  pdf.setFillColor(249, 115, 22);       // orange-500
  pdf.rect(0, 0, W, 38, 'F');

  pdf.setFillColor(234, 88, 12);        // orange-600
  pdf.rect(0, 30, W, 8, 'F');

  /* ── Logo placeholder circle ── */
  pdf.setFillColor(255, 255, 255);
  pdf.circle(20, 19, 8, 'F');
  pdf.setTextColor(249, 115, 22);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CM', 19.5, 22, { align: 'center' });

  /* ── Brand name ── */
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('CodeMentorAI', 33, 18);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('A comprehensive adaptive testing and learning analytics platform.', 33, 23);

  /* ── Report title ── */
  pdf.setFontSize(11);
  pdf.text('TEST PERFORMANCE REPORT', W - 10, 16, { align: 'right' });
  pdf.text(date, W - 10, 23, { align: 'right' });

  let y = 52;

  /* ── Student info ── */
  pdf.setTextColor(30, 30, 30);
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  pdf.text(userName || 'Student', 14, y);
  y += 7;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Subject: ${subject}   |   Level: ${level}`, 14, y);
  y += 12;

  /* ── Divider ── */
  pdf.setDrawColor(249, 115, 22);
  pdf.setLineWidth(0.5);
  pdf.line(14, y, W - 14, y);
  y += 10;

  /* ── Score cards (4 boxes) ── */
  const cards = [
    { label: 'Score', value: score, unit: '/100', color: [249, 115, 22] },
    { label: 'Accuracy', value: `${accuracy}%`, unit: '', color: [16, 185, 129] },
    { label: 'Correct', value: correct, unit: `/${total}`, color: [59, 130, 246] },
    { label: 'Grade', value: score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D', unit: '', color: score >= 80 ? [16, 185, 129] : [249, 115, 22] },
  ];

  const cardW = (W - 28 - 9) / 4;
  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + 3);
    pdf.setFillColor(250, 250, 250);
    pdf.roundedRect(x, y, cardW, 28, 3, 3, 'F');
    pdf.setDrawColor(...card.color);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(x, y, cardW, 28, 3, 3, 'S');

    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...card.color);
    pdf.text(String(card.value), x + cardW / 2, y + 16, { align: 'center' });

    if (card.unit) {
      pdf.setFontSize(9);
      pdf.setTextColor(120, 120, 120);
      pdf.text(card.unit, x + cardW / 2 + 8, y + 16, { align: 'left' });
    }

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text(card.label.toUpperCase(), x + cardW / 2, y + 24, { align: 'center' });
  });
  y += 38;

  /* ── Performance summary ── */
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 30, 30);
  pdf.text('Performance Summary', 14, y);
  y += 7;

  const summary = score >= 80
    ? `Excellent! You've demonstrated strong mastery of ${subject}. You're ready to explore advanced topics.`
    : score >= 60
    ? `Good performance on ${subject}. Focus on the recommended resources below to strengthen weak areas.`
    : `Keep practicing ${subject}. Review the fundamentals and use the course recommendations to improve your score.`;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(70, 70, 70);
  const summaryLines = pdf.splitTextToSize(summary, W - 28);
  pdf.text(summaryLines, 14, y);
  y += summaryLines.length * 5 + 10;

  /* ── Recommendations ── */
  if (recommendations.length > 0) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.text('Recommended Resources', 14, y);
    y += 8;

    recommendations.slice(0, 4).forEach((rec, i) => {
      pdf.setFillColor(255, 247, 237);
      pdf.roundedRect(14, y, W - 28, 14, 2, 2, 'F');

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(180, 60, 10);
      pdf.text(`${i + 1}.`, 18, y + 9);

      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(30, 30, 30);
      const titleLines = pdf.splitTextToSize(rec.title || rec, W - 42);
      pdf.text(titleLines[0], 24, y + 9);
      y += 17;
    });
    y += 4;
  }

  /* ── Footer ── */
  pdf.setFillColor(249, 249, 249);
  pdf.rect(0, H - 18, W, 18, 'F');
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Generated by CodeMentorAI · Adaptive Learning Platform', W / 2, H - 9, { align: 'center' });
  pdf.text(`Score ${score}/100 · ${subject} · ${date}`, W / 2, H - 4, { align: 'center' });

  /* ── Download ── */
  pdf.save(`CodeMentorAI_${subject}_Report_${date.replace(/\//g, '-')}.pdf`);
};

/**
 * Capture a DOM element as PDF (for full-page screenshots)
 */
export const captureElementAsPDF = async (elementId, filename = 'report.pdf') => {
  const el = document.getElementById(elementId);
  if (!el) return;
  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const H = (canvas.height * W) / canvas.width;
  pdf.addImage(imgData, 'PNG', 0, 0, W, Math.min(H, pdf.internal.pageSize.getHeight()));
  pdf.save(filename);
};
