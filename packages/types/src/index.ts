export type UserRole = 'PATIENT' | 'DOCTOR' | 'PHARMACIST' | 'ADMIN' | 'RECEPTIONIST';
export type AppLanguage = 'en' | 'hi' | 'kn';

export interface User {
  id: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  patientId: string; // e.g. PHC-PAT-2026-0042
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  bloodGroup?: string | null;
  allergies: string[];
  existingConditions: string[];
  currentMedications: string[];
  medicalHistoryNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DoctorAvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ON LEAVE';

export interface DoctorProfile {
  id: string;
  userId: string;
  doctorId: string; // e.g. PHC-DOC-101
  fullName: string;
  email: string;
  phone: string;
  qualification: string;
  specialization: string;
  yearsOfExperience: number;
  phcId: string;
  phcName?: string;
  workingHours: string;
  status: DoctorAvailabilityStatus;
  roomNumber?: string;
  registrationNumber?: string;
  avatarUrl?: string;
  rating?: number;
  createdAt: string;
}

export interface PharmacistProfile {
  id: string;
  userId: string;
  pharmacistId: string;
  fullName: string;
  email: string;
  phone: string;
  phcId: string;
  phcName?: string;
  licenseNumber: string;
  createdAt: string;
}

export interface AdminProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  phcId: string;
  phcName?: string;
  designation: string;
  createdAt: string;
}

export interface ReceptionistProfile {
  id: string;
  userId: string;
  receptionistId: string; // e.g. PHC-REC-001
  fullName: string;
  email: string;
  phone: string;
  phcId: string;
  phcName?: string;
  counterNumber?: string;
  shift?: string;
  createdAt: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface PHC {
  id: string;
  code: string;
  name: string;
  type: 'Urban PHC' | 'Rural PHC' | 'Community Health Centre (CHC)';
  address: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  openingHours: string;
  emergencyServices: boolean;
  totalBeds: number;
  availableDoctorsCount?: number;
  distanceKm?: number;
  availableMedicinesCount?: number;
  estimatedWaitMinutes?: number;
  departments: string[];
}

export type AppointmentStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Checked In'
  | 'In Consultation'
  | 'Completed'
  | 'Cancelled';

export interface Appointment {
  id: string;
  appointmentNumber: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  phcId: string;
  phcName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // e.g. "09:30 AM"
  tokenNumber: number;
  reasonForVisit: string;
  symptoms: string[];
  criticalityLevel: TriageRiskLevel;
  status: AppointmentStatus;
  assessmentId?: string | null;
  consultationNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TriageRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

export interface PossibleCondition {
  name: string;
  probability: 'Low' | 'Moderate' | 'High';
  confidenceScore?: number; // 0 - 99 (%)
  icd10Code?: string; // e.g. "J06.9", "A90", "I21.9"
  description: string;
  contributingSymptoms?: string[];
  recommendedTests?: string[];
  homeCareTips?: string[];
}

export interface SymptomAssessment {
  id: string;
  patientId?: string;
  symptoms: string[];
  duration: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  age: number;
  existingConditions: string[];
  allergies: string[];
  currentMedications: string[];
  riskLevel: TriageRiskLevel;
  possibleConditions: PossibleCondition[];
  recommendedAction: string;
  explanation: string;
  requiresDoctor: boolean;
  emergencyWarning: boolean;
  emergencyRedFlags?: string[];
  recommendedDiagnosticTests?: string[];
  supportiveCareMeasures?: string[];
  warningSignsToWatch?: string[];
  aiModel?: string;
  uploadedPhotoUrl?: string | null;
  photoAnalysisNotes?: string | null;
  disclaimer: string;
  createdAt: string;
}

export type ReferralType =
  | 'Patient Treated'
  | 'Follow-up Required'
  | 'Referred to Specialist'
  | 'Emergency Referral';

export interface PrescriptionItem {
  id?: string;
  medicineId?: string;
  medicineName: string;
  genericName?: string;
  dosage: string; // e.g. "500 mg"
  frequency: string; // e.g. "1-0-1 (Twice daily after meals)"
  duration: string; // e.g. "5 days"
  instructions: string; // e.g. "Take with plenty of water"
}

export interface MedicalRecord {
  id: string;
  recordNumber: string;
  patientId: string;
  patientName?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization: string;
  phcId: string;
  phcName: string;
  appointmentId?: string;
  visitDate: string;
  chiefComplaints: string[];
  clinicalAssessment: string;
  diagnosis: string[];
  vitals?: {
    bp?: string;
    temperature?: string;
    pulse?: string;
    spO2?: string;
    weight?: string;
  };
  prescriptions: PrescriptionItem[];
  recommendedTests: string[];
  followUpDate?: string | null;
  referralType: ReferralType;
  referralDetails?: string | null;
  doctorNotes: string;
  createdAt: string;
}

export type MedicineCategory =
  | 'Analgesic / Antipyretic'
  | 'Antibiotic'
  | 'Antidiabetic'
  | 'Antihypertensive'
  | 'Antihistamine'
  | 'Antacid / GI'
  | 'Vitamin / Supplement'
  | 'Respiratory'
  | 'Topical / Dermatology'
  | 'Emergency & Resuscitation';

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: MedicineCategory;
  strength: string; // e.g. "500mg"
  form: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Drops' | 'Sachet';
  description?: string;
  manufacturer: string;
  storageCondition?: string;
  isEssential: boolean;
}

export interface MedicineInventory {
  id: string;
  medicineId: string;
  phcId: string;
  medicine: Medicine;
  quantity: number;
  minimumStockLevel: number;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  supplier: string;
  costPerUnit: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expiring Soon';
  updatedAt: string;
}

export interface MedicineTransaction {
  id: string;
  medicineId: string;
  medicineName: string;
  phcId: string;
  type: 'DISPENSED' | 'RESTOCKED' | 'EXPIRED_DISPOSAL' | 'ADJUSTMENT';
  quantity: number;
  patientId?: string;
  patientName?: string;
  prescriptionId?: string;
  dispensedBy: string;
  batchNumber: string;
  notes?: string;
  timestamp: string;
}

export type NotificationType =
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_CANCELLED'
  | 'DOCTOR_AVAILABLE'
  | 'MEDICINE_AVAILABLE'
  | 'HEALTH_ALERT'
  | 'CRITICAL_TRIAGE';

export interface Notification {
  id: string;
  userId?: string;
  patientId?: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface AdminAnalyticsSummary {
  totalPatients: number;
  todayPatients: number;
  activeDoctors: number;
  availableDoctors: number;
  totalAppointments: number;
  completedConsultations: number;
  totalMedicines: number;
  lowStockMedicinesCount: number;
  outOfStockMedicinesCount: number;
  patientVisitsTrend: {
    labels: string[];
    data: number[];
  };
  commonSymptoms: {
    symptom: string;
    count: number;
    percentage: number;
  }[];
  commonDiagnoses: {
    condition: string;
    count: number;
    percentage: number;
  }[];
  doctorWorkload: {
    doctorName: string;
    specialization: string;
    consultationsCount: number;
    avgTimeMinutes: number;
  }[];
  medicineConsumption: {
    medicineName: string;
    category: string;
    dispensedUnits: number;
    remainingStock: number;
  }[];
}

export interface MedicalTestItem {
  id: string;
  testName: string;
  resultValue: string;
  unit?: string;
  notes?: string;
}

export interface PreConsultationCheckup {
  id: string;
  checkupNumber: string; // e.g. CHK-2026-0001
  patientId: string; // e.g. pat-0001
  patientCode: string; // e.g. PHC-PAT-2026-0001
  patientName: string;
  patientAge: number;
  patientGender: 'Male' | 'Female' | 'Other';
  patientPhone?: string;
  patientAddress?: string;
  bloodGroup?: string | null;
  receptionistId: string;
  receptionistName: string;
  phcId: string;
  phcName: string;
  vitals: {
    bpSystolic?: number | string;
    bpDiastolic?: number | string;
    bpFormatted?: string; // e.g. "120/80 mmHg"
    pulseRate?: number | string; // bpm
    bodyTemperature?: number | string; // °C
    respiratoryRate?: number | string; // breaths/min
  };
  measurements: {
    height?: number | string; // cm
    weight?: number | string; // kg
    bmi?: number | string; // kg/m²
    bmiCategory?: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  };
  otherTestsNotes?: string;
  otherTests: MedicalTestItem[];
  appointmentId?: string;
  doctorId?: string;
  doctorName?: string;
  status: 'WAITING_FOR_DOCTOR' | 'IN_CONSULTATION' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

export interface ReceptionistOverviewMetrics {
  totalToday: number;
  waitingDoctorCount: number;
  completedToday: number;
  emergencyFlagsCount: number;
  avgPreCheckMinutes: number;
  recentCheckups: PreConsultationCheckup[];
}
