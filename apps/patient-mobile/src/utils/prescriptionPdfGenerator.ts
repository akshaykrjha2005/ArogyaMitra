import { jsPDF } from 'jspdf';

export interface PrescriptionData {
  recordNumber?: string;
  consultationDate?: string;
  patient: {
    fullName: string;
    patientId: string;
    age: number;
    gender: string;
    phone: string;
    allergies?: string[];
    existingConditions?: string[];
  };
  doctor: {
    fullName: string;
    doctorId?: string;
    specialization: string;
    qualification?: string;
    registrationNumber?: string;
    roomNumber?: string;
    phcName: string;
    phcAddress?: string;
    phcPhone?: string;
  };
  vitals: {
    bp?: string;
    temperature?: string;
    pulse?: string;
    spO2?: string;
    weight?: string;
    bloodGlucose?: string;
  };
  diagnosis: string[];
  clinicalAssessment?: string;
  recommendedTests?: string[];
  prescriptions: Array<{
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }>;
  referralType?: string;
  followUpDate?: string | null;
  doctorNotes?: string;
}

export class PrescriptionPDFGenerator {
  public static generate(data: PrescriptionData, shouldDownload = true): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // --- 1. HEADER & GOVT EMBLEM ACCENT ---
    doc.setFillColor(0, 105, 92); // Deep Teal
    doc.rect(margin, y, contentWidth, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('NATIONAL HEALTH MISSION • GOVT. OF INDIA', margin + 6, y + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const phcHeader = `${data.doctor.phcName.toUpperCase()} | E-PRESCRIPTION & OPD SUMMARY`;
    doc.text(phcHeader, margin + 6, y + 14);

    doc.setFontSize(8);
    doc.setTextColor(224, 242, 241);
    const subContact = data.doctor.phcAddress || 'Integrated Digital Health Portal (Ayushman Bharat - PHC Connect)';
    doc.text(subContact, margin + 6, y + 19);

    // Record ID Badge on right
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth - margin - 50, y + 4, 46, 16, 2, 2, 'F');
    doc.setTextColor(0, 105, 92);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('OPD RECORD NO.', pageWidth - margin - 47, y + 9);
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const recId = data.recordNumber || `REC-${Date.now().toString().slice(-6)}`;
    doc.text(recId, pageWidth - margin - 47, y + 15);

    y += 28;

    // --- 2. DOCTOR & CLINICAL METADATA BAR ---
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.doctor.fullName || 'Medical Officer', margin + 4, y + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const docMeta = `${data.doctor.specialization || 'General Medicine'} • ${data.doctor.qualification || 'MBBS'} • Reg: ${data.doctor.registrationNumber || 'MCI-DEL-2022'}`;
    doc.text(docMeta, margin + 4, y + 11);

    // Consultation Date on Right
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('Date & Time:', pageWidth - margin - 50, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const consultTime = data.consultationDate || new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    doc.text(consultTime, pageWidth - margin - 50, y + 11);

    y += 20;

    // --- 3. PATIENT DEMOGRAPHICS & CLINICAL FLAGS ---
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

    // Patient Name & ID
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.patient.fullName, margin + 4, y + 6);

    doc.setFontSize(8.5);
    doc.setTextColor(25, 118, 210);
    doc.text(`ID: ${data.patient.patientId}`, margin + 65, y + 6);

    // Patient info row
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    const patDetails = `${data.patient.age} Yrs • ${data.patient.gender} • Phone: ${data.patient.phone}`;
    doc.text(patDetails, margin + 4, y + 11);

    // Allergies & Comorbidities Badges
    let badgeX = margin + 4;
    const allergiesList = data.patient.allergies || [];
    if (allergiesList.length > 0) {
      doc.setTextColor(220, 38, 38);
      doc.setFont('helvetica', 'bold');
      doc.text(`Allergies: ${allergiesList.join(', ')}`, badgeX, y + 16);
      badgeX += 55;
    } else {
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'normal');
      doc.text('No Known Drug Allergies (NKDA)', badgeX, y + 16);
      badgeX += 55;
    }

    const conditionsList = data.patient.existingConditions || [];
    if (conditionsList.length > 0) {
      doc.setTextColor(2, 132, 199);
      doc.setFont('helvetica', 'normal');
      doc.text(`History: ${conditionsList.join(', ')}`, badgeX, y + 16);
    }

    y += 24;

    // --- 4. RECORDED PATIENT VITALS ---
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);

    const vitalCols = [
      { label: 'BLOOD PRESSURE', val: data.vitals.bp || '120/80 mmHg' },
      { label: 'TEMPERATURE', val: data.vitals.temperature ? `${data.vitals.temperature} °F` : '98.6 °F' },
      { label: 'PULSE RATE', val: data.vitals.pulse ? `${data.vitals.pulse} bpm` : '72 bpm' },
      { label: 'SpO2 SATURATION', val: data.vitals.spO2 ? `${data.vitals.spO2} %` : '99 %' },
      { label: 'BODY WEIGHT', val: data.vitals.weight ? `${data.vitals.weight} kg` : '65 kg' },
    ];

    const colWidth = contentWidth / vitalCols.length;
    vitalCols.forEach((col, idx) => {
      const colX = margin + idx * colWidth + 4;
      doc.text(col.label, colX, y + 5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(col.val, colX, y + 10);
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
    });

    y += 18;

    // --- 5. CLINICAL DIAGNOSIS & EXAMINATION NOTES ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 105, 92);
    doc.text('CLINICAL DIAGNOSIS & PROVISIONAL ICD', margin, y + 3);

    y += 6;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, contentWidth, 11, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const diagText = (data.diagnosis && data.diagnosis.length > 0) ? data.diagnosis.join(' • ') : 'General Clinical Evaluation';
    doc.text(diagText, margin + 4, y + 7);

    y += 15;

    if (data.clinicalAssessment) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Clinical Assessment & Examination Notes:', margin, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      const splitNotes = doc.splitTextToSize(data.clinicalAssessment, contentWidth);
      doc.text(splitNotes, margin, y);
      y += splitNotes.length * 4 + 4;
    }

    // --- 6. DIGITAL PRESCRIPTION (Rx TABLE) ---
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 105, 92);
    doc.text('Rx — PRESCRIBED MEDICINES', margin, y + 2);

    y += 5;

    // Table Header
    doc.setFillColor(0, 105, 92);
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');

    const headers = [
      { name: '#', w: 8 },
      { name: 'MEDICINE NAME (GENERIC / IP)', w: 60 },
      { name: 'DOSAGE', w: 22 },
      { name: 'FREQUENCY', w: 32 },
      { name: 'DURATION', w: 22 },
      { name: 'INSTRUCTIONS / TIMING', w: 38 },
    ];

    let headerX = margin + 2;
    headers.forEach((h) => {
      doc.text(h.name, headerX, y + 4.5);
      headerX += h.w;
    });

    y += 7;

    // Table Rows
    const meds = data.prescriptions || [];
    if (meds.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('No prescription medicines required. Advised rest and hydration.', margin + 4, y + 5);
      y += 8;
    } else {
      meds.forEach((m, idx) => {
        const isEven = idx % 2 === 0;
        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y + 8, margin + contentWidth, y + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);

        let rowX = margin + 2;
        doc.text(String(idx + 1), rowX, y + 5.2);
        rowX += 8;

        doc.setFont('helvetica', 'bold');
        doc.text(m.medicineName || 'Medicine', rowX, y + 5.2);
        rowX += 60;

        doc.setFont('helvetica', 'normal');
        doc.text(m.dosage || '-', rowX, y + 5.2);
        rowX += 22;

        doc.text(m.frequency || '-', rowX, y + 5.2);
        rowX += 32;

        doc.text(m.duration || '-', rowX, y + 5.2);
        rowX += 22;

        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const inst = m.instructions ? m.instructions.slice(0, 32) : 'After meals';
        doc.text(inst, rowX, y + 5.2);

        y += 8;
      });
    }

    y += 5;

    // --- 7. RECOMMENDED LAB TESTS & INVESTIGATIONS ---
    const labTests = data.recommendedTests || [];
    if (labTests.length > 0) {
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 105, 92);
      doc.text('RECOMMENDED DIAGNOSTIC / LAB INVESTIGATIONS:', margin, y + 2);
      y += 5;

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(labTests.join('  •  '), margin + 4, y + 5.2);
      y += 12;
    }

    // --- 8. DISPOSITION, FOLLOW-UP & EMERGENCY RED FLAGS ---
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(margin, y, contentWidth, 15, 2, 2, 'FD');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(185, 28, 28);
    doc.text('DISPOSITION & FOLLOW-UP ADVICE:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const disp = data.referralType || 'Patient Treated (Routine Discharge)';
    const fup = data.followUpDate ? ` | Next Review on: ${data.followUpDate}` : '';
    doc.text(`${disp}${fup}`, margin + 4, y + 10);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text('🚨 24x7 Ambulance: 108 / 112', pageWidth - margin - 50, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Emergency care available at nearest CHC/District Hospital', pageWidth - margin - 65, y + 10);

    y += 19;

    // --- 9. DOCTOR SIGNATURE & OFFICIAL PHC VERIFICATION SEAL ---
    const signBoxY = Math.max(y, pageHeight - margin - 30);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('• Take all medicines exactly as prescribed by the Medical Officer.', margin, signBoxY + 6);
    doc.text('• Generic essential medicines are dispensed free of cost at PHC Pharmacy.', margin, signBoxY + 10);
    doc.text(`• Validated by Digital EHR & Ayushman Bharat Health Account (ABHA).`, margin, signBoxY + 14);

    const signX = pageWidth - margin - 60;
    doc.setDrawColor(203, 213, 225);
    doc.line(signX, signBoxY + 14, signX + 55, signBoxY + 14);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(data.doctor.fullName || 'Medical Officer', signX + 4, signBoxY + 18);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Authorized Signature & PHC Seal`, signX + 4, signBoxY + 22);

    // --- 10. BOTTOM FOOTER ---
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const footerText = `ArogyaMitra PHC Connect • Computer Generated Official Medical Prescription • Generated on ${new Date().toISOString()}`;
    doc.text(footerText, pageWidth / 2, pageHeight - 6, { align: 'center' });

    if (shouldDownload) {
      const sanitizedName = data.patient.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Prescription_${sanitizedName}_${recId}.pdf`;
      doc.save(filename);
    }

    return doc;
  }
}
