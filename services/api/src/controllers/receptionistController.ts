import { Response } from 'express';
import { DataStore } from '../db/dataStore';
import { AuthRequest } from '../middleware/auth';
import { PreConsultationCheckup, MedicalTestItem, PatientProfile, User, Appointment } from '@phc-connect/types';

export class ReceptionistController {
  /**
   * GET /api/receptionist/overview
   * Dashboard statistics for the Front Desk / Receptionist
   */
  public static async getOverview(req: AuthRequest, res: Response): Promise<void> {
    try {
      const phcId = req.user?.phcId || 'phc-001';
      const checkups = DataStore.preConsultations.filter(
        (c) => !phcId || c.phcId === phcId || c.phcId === 'phc-001'
      );

      const waitingDoctorCount = checkups.filter((c) => c.status === 'WAITING_FOR_DOCTOR').length;
      const completedToday = checkups.filter((c) => c.status === 'COMPLETED').length;
      
      const emergencyFlagsCount = checkups.filter((c) => {
        const sys = Number(c.vitals?.bpSystolic);
        const dia = Number(c.vitals?.bpDiastolic);
        const pulse = Number(c.vitals?.pulseRate);
        const temp = Number(c.vitals?.bodyTemperature);
        return (sys >= 160 || sys <= 85 || dia >= 100 || pulse >= 120 || pulse <= 45 || temp >= 39.5);
      }).length;

      res.status(200).json({
        success: true,
        metrics: {
          totalToday: checkups.length,
          waitingDoctorCount,
          completedToday,
          emergencyFlagsCount,
          avgPreCheckMinutes: 4.2,
          recentCheckups: checkups.slice(0, 15),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch receptionist overview.' });
    }
  }

  /**
   * GET /api/receptionist/patients
   * Search patients by name, phone, or patient ID code
   */
  public static async searchPatients(req: AuthRequest, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string || '').toLowerCase().trim();
      let results = DataStore.patients;

      if (search) {
        results = results.filter((p) =>
          p.fullName.toLowerCase().includes(search) ||
          p.patientId.toLowerCase().includes(search) ||
          p.phone.replace(/\D/g, '').includes(search.replace(/\D/g, '')) ||
          p.id.toLowerCase().includes(search)
        );
      }

      res.status(200).json({
        success: true,
        patients: results.slice(0, 20),
        total: results.length,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to search patients.' });
    }
  }

  /**
   * POST /api/receptionist/patient
   * Register a new patient at the Front Desk
   */
  public static async registerPatient(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        fullName,
        age,
        gender,
        phone,
        email,
        address,
        bloodGroup,
        allergies,
        existingConditions,
        currentMedications,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
      } = req.body;

      if (!fullName || !fullName.trim()) {
        res.status(400).json({ success: false, message: 'Patient full name is required.' });
        return;
      }
      if (!age || isNaN(Number(age))) {
        res.status(400).json({ success: false, message: 'Valid patient age is required.' });
        return;
      }
      if (!gender) {
        res.status(400).json({ success: false, message: 'Patient gender is required.' });
        return;
      }

      // Format unique Patient ID
      const count = DataStore.patients.length + 1;
      const patientCode = `PHC-PAT-2026-${count.toString().padStart(4, '0')}`;
      const patId = `pat-${Date.now()}`;
      const userId = `user-pat-${Date.now()}`;
      const formattedPhone = phone ? (phone.startsWith('+91') ? phone : `+91 ${phone.replace(/\s+/g, '')}`) : '+91 98000 00000';

      const newUser: User = {
        id: userId,
        fullName: fullName.trim(),
        phone: formattedPhone,
        email: email || null,
        role: 'PATIENT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newPatient: PatientProfile = {
        id: patId,
        userId,
        patientId: patientCode,
        fullName: fullName.trim(),
        age: Number(age),
        gender: gender || 'Other',
        phone: formattedPhone,
        email: email || null,
        address: address || 'Local Resident',
        bloodGroup: bloodGroup || 'O+ve',
        emergencyContactName: emergencyContactName || 'Family Member',
        emergencyContactPhone: emergencyContactPhone || formattedPhone,
        emergencyContactRelation: emergencyContactRelation || 'Relative',
        allergies: Array.isArray(allergies) ? allergies : allergies ? [allergies] : [],
        existingConditions: Array.isArray(existingConditions) ? existingConditions : existingConditions ? [existingConditions] : [],
        currentMedications: Array.isArray(currentMedications) ? currentMedications : currentMedications ? [currentMedications] : [],
        medicalHistoryNotes: 'Registered via Front Desk Receptionist Desk',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      DataStore.users.push(newUser);
      DataStore.patients.push(newPatient);

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully.',
        patient: newPatient,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to register patient.' });
    }
  }

  /**
   * POST /api/receptionist/checkup
   * Record pre-consultation measurements and vital signs
   */
  public static async recordCheckup(req: AuthRequest, res: Response): Promise<void> {
    try {
      const {
        patientId,
        patientCode,
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        patientAddress,
        bloodGroup,
        vitals,
        measurements,
        otherTestsNotes,
        otherTests,
        doctorId,
        doctorName,
        phcId,
      } = req.body;

      if (!patientName || !patientName.trim()) {
        res.status(400).json({ success: false, message: 'Patient Name is required.' });
        return;
      }
      if (!patientAge || isNaN(Number(patientAge))) {
        res.status(400).json({ success: false, message: 'Valid Patient Age is required.' });
        return;
      }
      if (!patientGender) {
        res.status(400).json({ success: false, message: 'Patient Gender is required.' });
        return;
      }

      // Check if patient exists or create on the fly
      let patient = DataStore.patients.find(
        (p) => p.id === patientId || p.patientId === patientCode || p.patientId === patientId
      );

      let finalPatId = patient?.id;
      let finalPatCode = patient?.patientId || patientCode;

      if (!patient) {
        // Create new patient record
        const count = DataStore.patients.length + 1;
        finalPatCode = patientCode || `PHC-PAT-2026-${count.toString().padStart(4, '0')}`;
        finalPatId = `pat-${Date.now()}`;
        const userId = `user-pat-${Date.now()}`;
        const formattedPhone = patientPhone ? (patientPhone.startsWith('+91') ? patientPhone : `+91 ${patientPhone.replace(/\s+/g, '')}`) : '+91 98000 00000';

        const newUser: User = {
          id: userId,
          fullName: patientName.trim(),
          phone: formattedPhone,
          role: 'PATIENT',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        patient = {
          id: finalPatId,
          userId,
          patientId: finalPatCode,
          fullName: patientName.trim(),
          age: Number(patientAge),
          gender: patientGender,
          phone: formattedPhone,
          address: patientAddress || 'Local Resident',
          bloodGroup: bloodGroup || 'O+ve',
          emergencyContactName: 'Family Member',
          emergencyContactPhone: formattedPhone,
          emergencyContactRelation: 'Relative',
          allergies: [],
          existingConditions: [],
          currentMedications: [],
          medicalHistoryNotes: 'Pre-consultation checkup created at Receptionist Desk',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        DataStore.users.push(newUser);
        DataStore.patients.push(patient);
      } else {
        // Update existing patient's age/gender/phone if updated
        patient.fullName = patientName.trim();
        patient.age = Number(patientAge);
        patient.gender = patientGender;
        if (patientPhone) patient.phone = patientPhone;
        if (patientAddress) patient.address = patientAddress;
        if (bloodGroup) patient.bloodGroup = bloodGroup;
        patient.updatedAt = new Date().toISOString();
      }

      // Calculate BMI if height and weight present
      let calculatedBmi: number | undefined = undefined;
      let calculatedBmiCategory: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | undefined = undefined;

      const heightNum = Number(measurements?.height);
      const weightNum = Number(measurements?.weight);

      if (heightNum > 0 && weightNum > 0) {
        const heightInMeters = heightNum / 100;
        calculatedBmi = Number((weightNum / (heightInMeters * heightInMeters)).toFixed(2));
        if (calculatedBmi < 18.5) calculatedBmiCategory = 'Underweight';
        else if (calculatedBmi < 25) calculatedBmiCategory = 'Normal';
        else if (calculatedBmi < 30) calculatedBmiCategory = 'Overweight';
        else calculatedBmiCategory = 'Obese';
      }

      // Format BP
      const bpSys = vitals?.bpSystolic ? String(vitals.bpSystolic).trim() : '';
      const bpDia = vitals?.bpDiastolic ? String(vitals.bpDiastolic).trim() : '';
      const bpFormatted = (bpSys && bpDia) ? `${bpSys}/${bpDia} mmHg` : bpSys || bpDia || undefined;

      const receptionist = DataStore.receptionists.find((r) => r.id === req.user?.receptionistId || r.userId === req.user?.id) || DataStore.receptionists[0];
      const phc = DataStore.phcs.find((p) => p.id === phcId || p.id === receptionist?.phcId) || DataStore.phcs[0];
      const targetDoctor = doctorId ? DataStore.doctors.find((d) => d.id === doctorId || d.doctorId === doctorId) : (DataStore.doctors.find((d) => d.phcId === phc.id && d.status === 'AVAILABLE') || DataStore.doctors[0]);

      const checkupCount = DataStore.preConsultations.length + 1;
      const checkupNumber = `CHK-2026-${checkupCount.toString().padStart(4, '0')}`;
      const checkupId = `chk-${Date.now()}`;

      // Clean test rows
      const cleanTests: MedicalTestItem[] = Array.isArray(otherTests)
        ? otherTests
            .filter((t: any) => t && t.testName && t.testName.trim())
            .map((t: any, idx: number) => ({
              id: t.id || `test-${Date.now()}-${idx}`,
              testName: t.testName.trim(),
              resultValue: String(t.resultValue || '').trim(),
              unit: t.unit ? String(t.unit).trim() : undefined,
              notes: t.notes ? String(t.notes).trim() : undefined,
            }))
        : [];

      const newCheckup: PreConsultationCheckup = {
        id: checkupId,
        checkupNumber,
        patientId: finalPatId,
        patientCode: finalPatCode,
        patientName: patientName.trim(),
        patientAge: Number(patientAge),
        patientGender,
        patientPhone: patient.phone,
        patientAddress: patient.address,
        bloodGroup: patient.bloodGroup,
        receptionistId: receptionist?.id || 'rec-001',
        receptionistName: receptionist?.fullName || 'Front Desk Officer',
        phcId: phc.id,
        phcName: phc.name,
        vitals: {
          bpSystolic: vitals?.bpSystolic ? Number(vitals.bpSystolic) : undefined,
          bpDiastolic: vitals?.bpDiastolic ? Number(vitals.bpDiastolic) : undefined,
          bpFormatted,
          pulseRate: vitals?.pulseRate ? Number(vitals.pulseRate) : undefined,
          bodyTemperature: vitals?.bodyTemperature ? Number(vitals.bodyTemperature) : undefined,
          respiratoryRate: vitals?.respiratoryRate ? Number(vitals.respiratoryRate) : undefined,
        },
        measurements: {
          height: heightNum > 0 ? heightNum : undefined,
          weight: weightNum > 0 ? weightNum : undefined,
          bmi: calculatedBmi || measurements?.bmi,
          bmiCategory: calculatedBmiCategory || measurements?.bmiCategory,
        },
        otherTestsNotes: otherTestsNotes ? String(otherTestsNotes).trim() : undefined,
        otherTests: cleanTests,
        doctorId: targetDoctor?.id,
        doctorName: targetDoctor?.fullName,
        status: 'WAITING_FOR_DOCTOR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      DataStore.preConsultations.unshift(newCheckup);

      // Create / link OPD Appointment token so Doctor Dashboard sees it in the queue
      const tokenNum = DataStore.appointments.filter((a) => a.date === new Date().toISOString().split('T')[0]).length + 1;
      const aptNumber = `APT-2026-${(DataStore.appointments.length + 1).toString().padStart(4, '0')}`;
      
      const newAppointment: Appointment = {
        id: `apt-${Date.now()}`,
        appointmentNumber: aptNumber,
        patientId: finalPatId,
        patientName: patient.fullName,
        patientAge: patient.age,
        patientGender: patient.gender,
        patientPhone: patient.phone,
        doctorId: targetDoctor?.id || 'doc-001',
        doctorName: targetDoctor?.fullName || 'Dr. Rajesh Verma',
        doctorSpecialization: targetDoctor?.specialization || 'General Medicine',
        phcId: phc.id,
        phcName: phc.name,
        date: new Date().toISOString().split('T')[0],
        timeSlot: 'Walk-in Pre-checked',
        tokenNumber: tokenNum,
        reasonForVisit: otherTestsNotes || 'Pre-consultation Check-up Completed at Reception Desk',
        symptoms: cleanTests.map((t) => `${t.testName}: ${t.resultValue} ${t.unit || ''}`.trim()),
        criticalityLevel: (Number(vitals?.bpSystolic) >= 160 || Number(vitals?.pulseRate) >= 120) ? 'HIGH' : 'MEDIUM',
        status: 'Checked In',
        consultationNotes: `Pre-check Vitals: BP ${bpFormatted || 'N/A'}, Pulse ${vitals?.pulseRate || 'N/A'} bpm, Temp ${vitals?.bodyTemperature || 'N/A'} °C, Resp ${vitals?.respiratoryRate || 'N/A'}/min. BMI: ${calculatedBmi || 'N/A'}.`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      DataStore.appointments.push(newAppointment);
      newCheckup.appointmentId = newAppointment.id;

      // Add Notification
      DataStore.notifications.unshift({
        id: `notif-${Date.now()}`,
        patientId: finalPatId,
        title: `Pre-Consultation Recorded • Token #${tokenNum}`,
        message: `Your pre-consultation vitals were recorded by Front Desk (${receptionist?.fullName}). Token #${tokenNum} assigned for Dr. ${targetDoctor?.fullName}.`,
        type: 'APPOINTMENT_CONFIRMED',
        read: false,
        createdAt: new Date().toISOString(),
      });

      res.status(201).json({
        success: true,
        message: 'Patient details and pre-consultation measurements saved successfully.',
        checkup: newCheckup,
        appointment: newAppointment,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to record pre-consultation checkup.' });
    }
  }

  /**
   * GET /api/receptionist/checkups
   * List all pre-consultations
   */
  public static async getCheckups(req: AuthRequest, res: Response): Promise<void> {
    try {
      const search = (req.query.search as string || '').toLowerCase().trim();
      let results = DataStore.preConsultations;

      if (search) {
        results = results.filter((c) =>
          c.patientName.toLowerCase().includes(search) ||
          c.patientCode.toLowerCase().includes(search) ||
          c.checkupNumber.toLowerCase().includes(search)
        );
      }

      res.status(200).json({
        success: true,
        checkups: results,
        total: results.length,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to retrieve checkups.' });
    }
  }
}
