import { jsPDF } from 'jspdf';
import type { ArtworkDetails, PriceCalculation } from '../types/artwork';
import { formatCurrency, formatPriceRange } from './priceCalculator';
import { CAREER_STAGE_LABELS, EDUCATION_LABELS, MEDIUM_LABELS, SALES_RANGE_LABELS } from '../types/artwork';

const COLORS = {
    gold: [201, 151, 31] as [number, number, number],
    dark: [12, 10, 9] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    gray: [168, 162, 158] as [number, number, number],
    lightGray: [229, 229, 228] as [number, number, number]
};

export async function generatePDF(artwork: ArtworkDetails, calc: PriceCalculation): Promise<void> {
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // ===== Background =====
    pdf.setFillColor(...COLORS.dark);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // ===== Header =====
    pdf.setFillColor(...COLORS.gold);
    pdf.rect(0, 0, pageWidth, 50, 'F');

    // Logo/Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(28);
    pdf.setTextColor(...COLORS.dark);
    pdf.text('Artpresso', margin, 30);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('ARTWORK PRICE QUOTE', margin, 40);

    // Date
    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    pdf.setFontSize(10);
    pdf.text(date, pageWidth - margin, 30, { align: 'right' });

    y = 65;

    // ===== Artwork Image (if available) =====
    if (artwork.imageDataUrl) {
        try {
            const imgWidth = contentWidth * 0.6;
            const imgHeight = 60;
            const imgX = (pageWidth - imgWidth) / 2;

            pdf.addImage(artwork.imageDataUrl, 'JPEG', imgX, y, imgWidth, imgHeight);
            y += imgHeight + 15;
        } catch (error) {
            console.warn('Could not add image to PDF:', error);
        }
    }

    // ===== Artwork Info =====
    pdf.setTextColor(...COLORS.white);
    pdf.setFont('helvetica', 'bolditalic');
    pdf.setFontSize(20);
    pdf.text(`"${artwork.title}"`, pageWidth / 2, y, { align: 'center' });
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(`by ${artwork.artistName}`, pageWidth / 2, y, { align: 'center' });
    y += 6;

    const dimensionStr = artwork.dimensions.depth
        ? `${artwork.dimensions.width} × ${artwork.dimensions.height} × ${artwork.dimensions.depth} ${artwork.dimensions.unit}`
        : `${artwork.dimensions.width} × ${artwork.dimensions.height} ${artwork.dimensions.unit}`;
    pdf.setFontSize(10);
    pdf.text(`${MEDIUM_LABELS[artwork.medium]} • ${dimensionStr}`, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // ===== Divider =====
    pdf.setDrawColor(...COLORS.gold);
    pdf.setLineWidth(0.5);
    pdf.line(margin + 30, y, pageWidth - margin - 30, y);
    y += 15;

    // ===== Main Price =====
    pdf.setTextColor(...COLORS.gray);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('RECOMMENDED RETAIL PRICE', pageWidth / 2, y, { align: 'center' });
    y += 10;

    pdf.setTextColor(...COLORS.gold);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(36);
    pdf.text(formatCurrency(calc.totalPrice, calc.currency), pageWidth / 2, y, { align: 'center' });
    y += 10;

    pdf.setTextColor(...COLORS.gray);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`Price Range: ${formatPriceRange(calc.lowPrice, calc.highPrice, calc.currency)}`, pageWidth / 2, y, { align: 'center' });
    y += 20;

    // ===== Price Breakdown Box =====
    const boxHeight = 60;
    pdf.setFillColor(20, 18, 17);
    pdf.roundedRect(margin, y, contentWidth, boxHeight, 3, 3, 'F');

    const boxY = y + 10;
    pdf.setTextColor(...COLORS.lightGray);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('PRICE BREAKDOWN', margin + 10, boxY);

    let lineY = boxY + 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...COLORS.gray);

    // Breakdown rows
    const rows = [
        ['Base Artwork Price', formatCurrency(calc.basePrice, calc.currency)]
    ];

    if (calc.materialsCost > 0) {
        rows.push(['Materials (2× markup)', formatCurrency(calc.materialsCost, calc.currency)]);
    }
    if (calc.framingCost > 0) {
        rows.push(['Framing (2× markup)', formatCurrency(calc.framingCost, calc.currency)]);
    }

    rows.forEach(([label, value]) => {
        pdf.text(label, margin + 10, lineY);
        pdf.text(value, pageWidth - margin - 10, lineY, { align: 'right' });
        lineY += 7;
    });

    // Total line
    lineY += 3;
    pdf.setDrawColor(...COLORS.gold);
    pdf.line(margin + 10, lineY - 4, pageWidth - margin - 10, lineY - 4);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...COLORS.white);
    pdf.text('Total', margin + 10, lineY);
    pdf.text(formatCurrency(calc.totalPrice, calc.currency), pageWidth - margin - 10, lineY, { align: 'right' });

    y += boxHeight + 15;

    // ===== Calculation Details =====
    pdf.setTextColor(...COLORS.gray);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('CALCULATION DETAILS', margin, y);
    y += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    const details = [
        [`Area: ${calc.breakdown.areaSqIn.toFixed(2)} sq in`, `Base Rate: $${calc.breakdown.baseRatePerSqIn}/sq in (${CAREER_STAGE_LABELS[artwork.careerStage]})`],
        [`Market Multiplier: ×${calc.breakdown.marketMultiplier.toFixed(3)}`, `Medium: ×${calc.breakdown.mediumMultiplier} (${MEDIUM_LABELS[artwork.medium]})`],
        [`Sales: ×${calc.breakdown.salesMultiplier} (${SALES_RANGE_LABELS[artwork.salesRange]})`, `Education: ×${calc.breakdown.educationMultiplier} (${EDUCATION_LABELS[artwork.education]})`]
    ];

    if (calc.breakdown.depthMultiplier) {
        details.push([`3D Depth: ×${calc.breakdown.depthMultiplier.toFixed(3)}`, '']);
    }

    details.forEach(([left, right]) => {
        pdf.text(left, margin, y);
        if (right) {
            pdf.text(right, pageWidth / 2 + 5, y);
        }
        y += 5;
    });

    // ===== Footer =====
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(
        'Generated by Artpresso • Professional Artwork Pricing Calculator',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
    );

    // ===== Save PDF =====
    const filename = `${artwork.title.replace(/[^a-z0-9]/gi, '_')}_quote_${Date.now()}.pdf`;
    pdf.save(filename);
}
