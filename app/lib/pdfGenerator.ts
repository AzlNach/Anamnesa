'use client'

import jsPDF from 'jspdf';

export interface DiagnosisData {
  finalDiagnosis: any;
  sessionData: any;
  generatedAt: Date;
}

export function generateHealthReportPDF(data: DiagnosisData): void {
  // A4 dimensions in points (210mm x 297mm = 595.28 x 841.89 points)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });
  
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 60; // Increased margin for better spacing
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin + 30;

  // Professional color scheme
  const colors = {
    primary: '#1f2937',      // Dark gray for main text
    secondary: '#4b5563',    // Medium gray for secondary text
    accent: '#2563eb',       // Blue for headers
    success: '#059669',      // Green for positive elements
    warning: '#d97706',      // Orange for warnings
    danger: '#dc2626',       // Red for urgent items
    purple: '#7c3aed',       // Purple for recommendations
    background: '#f8fafc'    // Light background
  };

  // Helper function for page management
  const checkNewPage = (spaceNeeded: number = 60) => {
    if (yPosition + spaceNeeded > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin + 30;
      return true;
    }
    return false;
  };

  // Enhanced text function with better spacing
  const addText = (text: string, options: {
    fontSize?: number;
    color?: string;
    isBold?: boolean;
    isItalic?: boolean;
    lineHeight?: number;
    indent?: number;
    align?: 'left' | 'center' | 'right';
    marginBottom?: number;
  } = {}) => {
    const {
      fontSize = 11,
      color = colors.primary,
      isBold = false,
      isItalic = false,
      lineHeight = 1.6,
      indent = 0,
      align = 'left',
      marginBottom = 12
    } = options;

    checkNewPage(fontSize * lineHeight + marginBottom);

    pdf.setFont('helvetica', isBold ? 'bold' : (isItalic ? 'italic' : 'normal'));
    pdf.setFontSize(fontSize);
    pdf.setTextColor(color);
    
    const effectiveWidth = contentWidth - indent - 10;
    const lines = pdf.splitTextToSize(text, effectiveWidth);
    
    lines.forEach((line: string, index: number) => {
      if (index > 0) checkNewPage(fontSize * lineHeight);
      
      let xPosition = margin + indent;
      if (align === 'center') {
        xPosition = pageWidth / 2;
        pdf.text(line, xPosition, yPosition, { align: 'center' });
      } else if (align === 'right') {
        xPosition = pageWidth - margin;
        pdf.text(line, xPosition, yPosition, { align: 'right' });
      } else {
        pdf.text(line, xPosition, yPosition);
      }
      
      yPosition += fontSize * lineHeight;
    });
    yPosition += marginBottom;
  };

  // Professional section header
  const addSectionHeader = (title: string, color: string = colors.accent) => {
    checkNewPage(80);
    yPosition += 20;
    
    // Header background with rounded corners
    pdf.setFillColor(color);
    pdf.roundedRect(margin, yPosition - 22, contentWidth, 35, 4, 4, 'F');
    
    // Header text
    pdf.setTextColor('#FFFFFF');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(title, margin + 20, yPosition - 2);
    
    yPosition += 35;
  };

  // Professional info box
  const addInfoBox = (content: string, bgColor: string = '#f9fafb', borderColor: string = '#e5e7eb', textColor: string = colors.primary) => {
    checkNewPage(100);
    
    const lines = pdf.splitTextToSize(content, contentWidth - 60);
    const boxHeight = Math.max(60, lines.length * 16 + 30);
    
    // Box shadow effect
    pdf.setFillColor('#00000010');
    pdf.roundedRect(margin + 5, yPosition + 5, contentWidth - 10, boxHeight, 6, 6, 'F');
    
    // Main box
    pdf.setFillColor(bgColor);
    pdf.setDrawColor(borderColor);
    pdf.setLineWidth(1);
    pdf.roundedRect(margin, yPosition, contentWidth, boxHeight, 6, 6, 'FD');
    
    // Box content
    pdf.setTextColor(textColor);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    lines.forEach((line: string, index: number) => {
      pdf.text(line, margin + 30, yPosition + 25 + (index * 16));
    });
    
    yPosition += boxHeight + 20;
  };

  // Document header with enhanced design
  pdf.setFillColor(colors.background);
  pdf.rect(0, 0, pageWidth, 140, 'F');
  
  // Add subtle border
  pdf.setDrawColor('#e5e7eb');
  pdf.setLineWidth(2);
  pdf.line(0, 140, pageWidth, 140);
  
  // Main title with better spacing
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.setTextColor(colors.accent);
  pdf.text('LAPORAN KONSULTASI KESEHATAN', pageWidth/2, 55, { align: 'center' });
  
  // Subtitle
  pdf.setFontSize(16);
  pdf.setTextColor(colors.secondary);
  pdf.text('Anamnesa AI - Konsultasi Kesehatan Berbasis AI', pageWidth/2, 85, { align: 'center' });
  
  // Professional date formatting
  pdf.setFontSize(12);
  pdf.setTextColor(colors.primary);
  const currentDate = data.generatedAt.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long', 
    year: 'numeric'
  });
  const currentTime = data.generatedAt.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
  pdf.text(`${currentDate}, ${currentTime}`, pageWidth/2, 110, { align: 'center' });

  yPosition = 170;

  // Patient Information Section with better formatting
  addSectionHeader('[INFO] INFORMASI PASIEN', colors.success);
  
  const patientInfo = [
    `Keluhan Utama: ${data.sessionData.originalComplaint}`,
    `Jumlah Pertanyaan Anamnesis: ${data.sessionData.questions?.length || 0} pertanyaan`,
    `ID Konsultasi: ANM-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    `Waktu Konsultasi: ${currentDate}, ${currentTime}`
  ];
  
  patientInfo.forEach(info => {
    addText(info, { 
      fontSize: 12, 
      color: colors.primary,
      marginBottom: 8,
      indent: 10
    });
  });

  // Anamnesis Results with enhanced formatting
  addSectionHeader('[ANALYSIS] HASIL ANAMNESIS INTERAKTIF', colors.accent);
  
  if (data.sessionData.questions && data.sessionData.answers) {
    data.sessionData.questions.forEach((question: any, index: number) => {
      const answer = data.sessionData.answers[index];
      
      // Question with better styling
      addText(`${index + 1}. ${question.question}`, { 
        fontSize: 12, 
        color: colors.primary, 
        isBold: true,
        marginBottom: 6,
        indent: 10
      });
      
      // Answer with proper indentation
      addText(`${answer}`, { 
        fontSize: 11, 
        color: colors.secondary,
        marginBottom: 15,
        indent: 30
      });
    });
  }

  // Enhanced Diagnosis Section
  addSectionHeader('[DIAGNOSIS] HASIL DIAGNOSIS AI', colors.danger);
  
  // Professional diagnosis box
  checkNewPage(140);
  
  // Box shadow
  pdf.setFillColor('#00000015');
  pdf.roundedRect(margin + 5, yPosition + 5, contentWidth - 10, 120, 8, 8, 'F');
  
  // Main diagnosis box
  pdf.setFillColor('#fef2f2');
  pdf.setDrawColor(colors.danger);
  pdf.setLineWidth(2);
  pdf.roundedRect(margin, yPosition, contentWidth, 120, 8, 8, 'FD');
  
  // Diagnosis content with better typography
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(colors.danger);
  pdf.text(`${data.finalDiagnosis.diagnosis}`, margin + 30, yPosition + 35);
  
  pdf.setFontSize(14);
  pdf.setTextColor(colors.primary);
  pdf.text(`Tingkat Keyakinan: ${data.finalDiagnosis.confidence}%`, margin + 30, yPosition + 60);
  
  // Enhanced confidence bar
  const barWidth = 250;
  const barHeight = 12;
  const confidenceWidth = (data.finalDiagnosis.confidence / 100) * barWidth;
  
  // Bar background
  pdf.setFillColor('#e5e7eb');
  pdf.roundedRect(margin + 30, yPosition + 70, barWidth, barHeight, 6, 6, 'F');
  
  // Confidence fill with gradient effect
  const confidenceColor = data.finalDiagnosis.confidence >= 70 ? '#10b981' : 
                         data.finalDiagnosis.confidence >= 50 ? '#f59e0b' : '#ef4444';
  pdf.setFillColor(confidenceColor);
  pdf.roundedRect(margin + 30, yPosition + 70, confidenceWidth, barHeight, 6, 6, 'F');
  
  // Percentage text on bar
  pdf.setFontSize(10);
  pdf.setTextColor('#ffffff');
  if (confidenceWidth > 40) {
    pdf.text(`${data.finalDiagnosis.confidence}%`, margin + 30 + confidenceWidth/2, yPosition + 79, { align: 'center' });
  }
  
  yPosition += 140;
  
  // Diagnosis details with better formatting
  if (data.finalDiagnosis.description) {
    addText('Deskripsi Kondisi:', { 
      fontSize: 13, 
      isBold: true, 
      color: colors.primary,
      marginBottom: 8
    });
    addText(data.finalDiagnosis.description, { 
      fontSize: 11, 
      color: colors.secondary,
      lineHeight: 1.7,
      indent: 15,
      marginBottom: 15
    });
  }
  
  if (data.finalDiagnosis.reasoning) {
    addText('Alasan dan Analisis:', { 
      fontSize: 13, 
      isBold: true, 
      color: colors.primary,
      marginBottom: 8
    });
    addText(data.finalDiagnosis.reasoning, { 
      fontSize: 11, 
      color: colors.secondary,
      lineHeight: 1.7,
      indent: 15,
      marginBottom: 20
    });
  }

  // Enhanced Recommendations Section
  addSectionHeader('[RECOMMENDATIONS] REKOMENDASI TINDAKAN MEDIS', colors.purple);
  
  if (data.finalDiagnosis.recommendations?.immediate_actions) {
    addText('Tindakan Segera yang Diperlukan:', { 
      fontSize: 13, 
      isBold: true, 
      color: colors.primary,
      marginBottom: 8
    });
    
    if (Array.isArray(data.finalDiagnosis.recommendations.immediate_actions)) {
      data.finalDiagnosis.recommendations.immediate_actions.forEach((action: string) => {
        addText(`• ${action}`, { 
          fontSize: 11, 
          color: colors.secondary,
          indent: 20,
          marginBottom: 6
        });
      });
    } else {
      addText(`• ${data.finalDiagnosis.recommendations.immediate_actions}`, { 
        fontSize: 11, 
        color: colors.secondary,
        indent: 20,
        marginBottom: 10
      });
    }
  }
  
  if (data.finalDiagnosis.recommendations?.doctor_type) {
    addText('Spesialis yang Disarankan:', { 
      fontSize: 13, 
      isBold: true, 
      color: colors.primary,
      marginBottom: 8
    });
    addText(data.finalDiagnosis.recommendations.doctor_type, { 
      fontSize: 12, 
      color: colors.accent,
      isBold: true,
      indent: 20,
      marginBottom: 15
    });
  }
  
  if (data.finalDiagnosis.recommendations?.urgency_level) {
    addText('Tingkat Urgensi:', { 
      fontSize: 13, 
      isBold: true, 
      color: colors.primary,
      marginBottom: 8
    });
    const urgencyColor = data.finalDiagnosis.recommendations.urgency_level.toLowerCase().includes('tinggi') ? colors.danger :
                        data.finalDiagnosis.recommendations.urgency_level.toLowerCase().includes('sedang') ? colors.warning : colors.success;
    addText(data.finalDiagnosis.recommendations.urgency_level, { 
      fontSize: 12, 
      color: urgencyColor,
      isBold: true,
      indent: 20,
      marginBottom: 15
    });
  }

  if (data.finalDiagnosis.recommendations?.tests_needed) {
    addText('Pemeriksaan yang Mungkin Diperlukan:', { 
      fontSize: 13, 
      isBold: true, 
      color: colors.primary,
      marginBottom: 8
    });
    if (Array.isArray(data.finalDiagnosis.recommendations.tests_needed)) {
      data.finalDiagnosis.recommendations.tests_needed.forEach((test: string) => {
        addText(`• ${test}`, { 
          fontSize: 11, 
          color: colors.secondary,
          indent: 20,
          marginBottom: 6
        });
      });
    } else {
      addText(`• ${data.finalDiagnosis.recommendations.tests_needed}`, { 
        fontSize: 11, 
        color: colors.secondary,
        indent: 20,
        marginBottom: 15
      });
    }
  }

  // Enhanced General Care Section
  addSectionHeader('[CARE] PERAWATAN UMUM & GAYA HIDUP', colors.success);
  
  if (data.finalDiagnosis.recommendations?.general_care) {
    addText('Perawatan Umum:', { 
      fontSize: 13, 
      isBold: true, 
      color: colors.primary,
      marginBottom: 8
    });
    if (Array.isArray(data.finalDiagnosis.recommendations.general_care)) {
      data.finalDiagnosis.recommendations.general_care.forEach((care: string) => {
        addText(`• ${care}`, { 
          fontSize: 11, 
          color: colors.secondary,
          indent: 20,
          marginBottom: 6
        });
      });
    } else {
      addText(`• ${data.finalDiagnosis.recommendations.general_care}`, { 
        fontSize: 11, 
        color: colors.secondary,
        indent: 20,
        marginBottom: 15
      });
    }
  }

  if (data.finalDiagnosis.recommendations?.lifestyle_changes) {
    addText('Perubahan Gaya Hidup:', { 
      fontSize: 13, 
      isBold: true, 
      color: colors.primary,
      marginBottom: 8
    });
    if (Array.isArray(data.finalDiagnosis.recommendations.lifestyle_changes)) {
      data.finalDiagnosis.recommendations.lifestyle_changes.forEach((change: string) => {
        addText(`• ${change}`, { 
          fontSize: 11, 
          color: colors.secondary,
          indent: 20,
          marginBottom: 6
        });
      });
    } else {
      addText(`• ${data.finalDiagnosis.recommendations.lifestyle_changes}`, { 
        fontSize: 11, 
        color: colors.secondary,
        indent: 20,
        marginBottom: 15
      });
    }
  }

  // Enhanced Medical Disclaimer
  addSectionHeader('[WARNING] DISCLAIMER MEDIS PENTING', colors.danger);
  
  const disclaimer = `PERNYATAAN PENTING: Hasil konsultasi AI ini BUKAN merupakan diagnosis medis final dan TIDAK DAPAT menggantikan konsultasi langsung dengan dokter atau tenaga medis profesional yang berkualifikasi. Aplikasi Anamnesa AI hanya memberikan panduan awal dan analisis berbasis kecerdasan buatan untuk membantu Anda mempersiapkan konsultasi medis.

TINDAKAN DARURAT: Dalam situasi darurat medis, gejala yang memburuk dengan cepat, atau kondisi yang mengancam jiwa, segera hubungi layanan gawat darurat (119), datang ke Unit Gawat Darurat rumah sakit terdekat, atau hubungi dokter Anda.

KONSULTASI PROFESIONAL: Selalu konsultasikan kondisi kesehatan Anda dengan dokter yang berkualifikasi untuk mendapatkan diagnosis yang akurat, pengobatan yang tepat, dan rencana perawatan yang sesuai dengan kondisi medis Anda.

BATASAN TANGGUNG JAWAB: Anamnesa AI dan pengembangnya tidak bertanggung jawab atas keputusan medis, tindakan, atau hasil pengobatan yang diambil berdasarkan informasi dari aplikasi ini. Penggunaan aplikasi ini sepenuhnya merupakan tanggung jawab pengguna.`;
  
  addInfoBox(disclaimer, '#fef2f2', '#fca5a5', colors.danger);

  // Professional footer with enhanced design
  checkNewPage(100);
  
  // Footer separator
  pdf.setDrawColor('#d1d5db');
  pdf.setLineWidth(1);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 40;
  
  // Footer content with better typography
  pdf.setFontSize(10);
  pdf.setTextColor(colors.secondary);
  pdf.setFont('helvetica', 'normal');
  
  const footerLines = [
    'Dibuat oleh Anamnesa AI - Asisten Konsultasi Kesehatan Berbasis Kecerdasan Buatan',
    `ID Dokumen: ANM-${Date.now().toString(36).toUpperCase()}`,
    `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    })}`,
    'Untuk informasi lebih lanjut kunjungi: anamnesa-ai.com'
  ];
  
  footerLines.forEach((line, index) => {
    pdf.text(line, pageWidth/2, yPosition + (index * 14), { align: 'center' });
  });

  // Generate filename with better naming convention
  const fileName = `Anamnesa_HealthReport_${new Date().toISOString().split('T')[0]}_${Date.now().toString(36).substr(2, 6)}.pdf`;
  pdf.save(fileName);
}
