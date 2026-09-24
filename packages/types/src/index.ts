export * from './i18n';
import { AppLanguage } from './i18n';
export type UserRole = 'PATIENT' | 'DOCTOR' | 'PHARMACIST' | 'ADMIN' | 'RECEPTIONIST' | 'HEALTH_ASSISTANT';

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
  | 'CRITICAL_TRIAGE'
  | 'CAMP_REGISTERED'
  | 'CAMP_REMINDER'
  | 'COMPLAINT_REGISTERED'
  | 'COMPLAINT_UPDATE'
  | 'COMPLAINT_RESOLVED'
  | 'COMPLAINT_ASSIGNED'
  | 'EMERGENCY_PRE_ALERT'
  | 'EMERGENCY_PREP_INSTRUCTIONS'
  | 'FOLLOW_UP_DUE_REMINDER'
  | 'FOLLOW_UP_LOGGED';

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

// -------------------------------------------------------------
// COMPLAINTS & GRIEVANCE REDRESSAL TYPES
// -------------------------------------------------------------
export type ComplaintCategory =
  | 'SERVICE_QUALITY'
  | 'STAFF_BEHAVIOUR'
  | 'MEDICINE_AVAILABILITY'
  | 'FACILITY_CLEANLINESS'
  | 'WAIT_TIME'
  | 'OTHER';

export type ComplaintStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ComplaintHistoryEntry {
  id: string;
  timestamp: string;
  fromStatus?: ComplaintStatus;
  toStatus: ComplaintStatus;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  note: string;
}

export interface ComplaintReply {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  message: string;
  createdAt: string;
  isInternal?: boolean;
}

export interface Complaint {
  id: string;
  complaintId: string; // e.g. CMP-2026-0001
  userId: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  userRole: UserRole;
  phcId: string;
  phcName: string;
  category: ComplaintCategory;
  categoryLabel?: string;
  subject: string;
  description: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedToId?: string | null;
  assignedToName?: string | null;
  assignedToRole?: UserRole | null;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  history: ComplaintHistoryEntry[];
  replies: ComplaintReply[];
  createdAt: string;
  updatedAt: string;
}

export interface ComplaintSummaryMetrics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byCategory: Record<string, number>;
  byPhc: Record<string, number>;
  avgResolutionHours: number;
}

// -------------------------------------------------------------
// CALL SERVICES, TELEPHONY & CALLBACK QUEUE TYPES
// -------------------------------------------------------------
export type CallbackRequestStatus = 'Pending' | 'Called' | 'Missed' | 'Completed' | 'Cancelled';

export interface CallbackRequest {
  id: string;
  requestId: string; // e.g. CB-2026-0001
  patientId?: string | null;
  name: string;
  phone: string;
  reason: string;
  preferredTime: string; // e.g. "Morning (09:00 AM - 12:00 PM)", "Evening (04:00 PM - 07:00 PM)"
  phcId?: string | null;
  phcName?: string | null;
  status: CallbackRequestStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  notes?: string | null;
  callAttempts: number;
  lastAttemptAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CallLogDirection = 'INBOUND' | 'OUTBOUND';

export type CallLogOutcome =
  | 'CONNECTED'
  | 'BUSY'
  | 'NO_ANSWER'
  | 'FAILED'
  | 'CALLBACK_RESOLVED';

export interface CallLogEntry {
  id: string;
  callSessionId?: string;
  callerName: string;
  callerPhone: string;
  receiverName: string;
  receiverPhone: string;
  receiverRole: string; // e.g., "National Emergency 108", "Medical Officer", "PHC Karol Bagh", "ASHA Facilitator"
  direction: CallLogDirection;
  purpose: string; // e.g., "Emergency Triage", "OPD Inquiry", "Callback Resolution", "Medicine Stock Inquiry"
  outcome: CallLogOutcome;
  durationSeconds: number;
  notes?: string | null;
  callbackRequestId?: string | null;
  phcId?: string | null;
  timestamp: string;
}

export type HelplineCategory =
  | 'EMERGENCY'
  | 'HEALTH_HELPLINE'
  | 'MENTAL_HEALTH'
  | 'MATERNAL_CHILD'
  | 'PHC_DIRECT'
  | 'HEALTH_ASSISTANT'
  | 'AMBULANCE';

export interface HelplineContact {
  id: string;
  name: string;
  category: HelplineCategory;
  number: string;
  telLink: string; // formatted e.g. "tel:108", "tel:+919876543210"
  description: string;
  availableHours: string;
  tollFree: boolean;
  phcId?: string;
  badge?: string;
}

export interface TelephonyCallInitiateRequest {
  toPhone: string;
  toName: string;
  fromRole?: string;
  purpose: string;
  callbackRequestId?: string;
  phcId?: string;
}

export interface TelephonyCallSession {
  sessionId: string;
  status: 'INITIATED' | 'RINGING' | 'CONNECTED' | 'COMPLETED' | 'FAILED';
  provider: 'MOCK_PROVIDER' | 'TWILIO' | 'EXOTEL';
  toPhone: string;
  toName: string;
  startedAt: string;
  durationSeconds?: number;
  message: string;
}

// -------------------------------------------------------------
// REAL-TIME HUMAN HEALTH ASSISTANT & WEBRTC CALLING TYPES
// -------------------------------------------------------------
export type AssistantPresenceStatus = 'ONLINE' | 'BUSY' | 'OFFLINE';

export type AssistantRoleType =
  | 'ASHA_FACILITATOR'
  | 'ANM_SPECIALIST'
  | 'COMMUNITY_HEALTH_OFFICER'
  | 'HEALTH_ASSISTANT';

export interface HealthAssistantProfile {
  id: string; // e.g. "asst-001"
  userId: string; // e.g. "user-asst-001"
  assistantId: string; // e.g. "PHC-ASHA-001"
  fullName: string;
  email: string;
  phone: string;
  phcId: string;
  phcName?: string;
  role: AssistantRoleType;
  designation: string; // e.g. "Lead ASHA Facilitator", "ANM Midwife"
  status: AssistantPresenceStatus;
  specializations: string[];
  languages: string[];
  yearsOfExperience: number;
  rating: number;
  activeChatSessionsCount: number;
  avatarUrl?: string;
  shiftHours?: string;
  createdAt: string;
}

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface ChatAttachment {
  url: string;
  name: string;
  type: 'IMAGE' | 'FILE';
  sizeBytes?: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId: string;
  text: string;
  attachment?: ChatAttachment | null;
  status: MessageStatus;
  readAt?: string | null;
  timestamp: string; // ISO 8601
}

export type ChatSessionStatus = 'WAITING' | 'ACTIVE' | 'RESOLVED' | 'TRANSFERRED';

export interface CallSessionState {
  status: 'IDLE' | 'RINGING' | 'CONNECTING' | 'IN_CALL' | 'ENDED' | 'REJECTED' | 'MISSED';
  callerId?: string;
  callerName?: string;
  callerRole?: UserRole;
  receiverId?: string;
  receiverName?: string;
  startedAt?: string;
  durationSeconds?: number;
  callLogId?: string;
}

export interface ChatSessionParticipant {
  id: string;
  name: string;
  role: UserRole;
  designation?: string;
  joinedAt: string;
  avatarUrl?: string;
}

export interface SharedCareNote {
  id: string;
  sessionId: string;
  patientId: string;
  ticketId?: string | null;
  title: string;
  summary: string;
  authorName: string;
  authorRole: UserRole;
  instructions: string[]; // e.g. ["Drink 2.5L ORS hydration fluids daily", "Monitor body temp every 4 hours"]
  dietaryPrecautions?: string[];
  medicationNotes?: string[];
  emergencyWarning?: string | null;
  updatedAt: string;
}

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SupportTicketCategory =
  | 'GENERAL_CONSULTATION'
  | 'SYMPTOM_ASSESSMENT'
  | 'MEDICATION_INQUIRY'
  | 'MATERNAL_CHILD_HEALTH'
  | 'CHRONIC_CARE_NCD'
  | 'EMERGENCY_TRIAGE'
  | 'LAB_REPORT_REVIEW'
  | 'POST_OPD_FOLLOWUP';

export interface TicketActionLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details?: string;
}

export interface OnCallSupportTicket {
  id: string; // e.g. "tkt-001"
  ticketNumber: string; // e.g. "TKT-2026-0001"
  patientId: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  creatorId: string;
  creatorName: string;
  creatorRole: UserRole;
  assignedStaffId: string;
  assignedStaffName: string;
  assignedStaffRole: UserRole;
  escalatedDoctorId?: string | null;
  escalatedDoctorName?: string | null;
  escalatedDoctorSpecialization?: string | null;
  sessionId?: string | null; // linked chat session
  category: SupportTicketCategory;
  subject: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  tags: string[]; // e.g. ["Fever > 3 Days", "Hypertension", "Maternal Care"]
  notes: string; // Clinical observations during call/chat
  sharedCareNotes?: string | null; // Text snippet of shared care instructions
  resolutionSummary?: string | null;
  phcId: string;
  phcName: string;
  actionLogs: TicketActionLog[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

export interface QuickReplyTemplate {
  id: string;
  category: string; // e.g. "Intake", "Symptom Check", "Medications", "Home Care", "Escalation", "Emergency"
  title: string;
  text: string;
  tags?: string[];
  suggestedAction?: 'SHARED_NOTE' | 'ESCALATE' | 'TICKET' | 'NONE';
}

export type TimelineEventType =
  | 'CHAT_MESSAGE'
  | 'CHAT_SESSION'
  | 'VOICE_CALL'
  | 'SUPPORT_TICKET'
  | 'DOCTOR_ESCALATION'
  | 'SHARED_NOTE_UPDATE'
  | 'OPD_APPOINTMENT'
  | 'PRE_CHECKUP'
  | 'PRESCRIPTION'
  | 'COMPLAINT_LOG';

export interface PatientTimelineEvent {
  id: string;
  patientId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  badgeText?: string;
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'emerald';
  metadata?: Record<string, any>;
  linkId?: string;
}

export interface ChatSession {
  id: string; // e.g. "chat-ses-001"
  patientId: string;
  patientUserId: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  assistantId: string;
  assistantUserId: string;
  assistantName: string;
  assistantRole: string;
  phcId: string;
  phcName: string;
  status: ChatSessionStatus;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCountPatient: number;
  unreadCountAssistant: number;
  callState: CallSessionState;
  activeTicketId?: string | null;
  sharedNotes?: SharedCareNote | null;
  escalatedDoctorId?: string | null;
  escalatedDoctorName?: string | null;
  participants?: ChatSessionParticipant[];
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type WebRTCSignalingType =
  | 'AUTH'
  | 'JOIN_SESSION'
  | 'LEAVE_SESSION'
  | 'SEND_MESSAGE'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_READ'
  | 'TYPING'
  | 'ASSISTANT_STATUS_UPDATE'
  | 'SHARED_NOTE_UPDATE'
  | 'DOCTOR_ESCALATED'
  | 'TICKET_UPDATED'
  | 'CALL_INITIATE'
  | 'CALL_RINGING'
  | 'CALL_ACCEPT'
  | 'CALL_REJECT'
  | 'CALL_END'
  | 'CALL_OFFER'
  | 'CALL_ANSWER'
  | 'ICE_CANDIDATE';

export interface WebRTCSignalingPayload {
  type: WebRTCSignalingType;
  sessionId?: string;
  senderId?: string;
  senderName?: string;
  senderRole?: UserRole;
  recipientId?: string;
  message?: ChatMessage;
  status?: AssistantPresenceStatus;
  sharedNote?: SharedCareNote;
  ticket?: OnCallSupportTicket;
  doctor?: { id: string; name: string; specialization?: string; role?: UserRole };
  isTyping?: boolean;
  sdp?: any;
  candidate?: any;
  reason?: string;
  timestamp?: string;
}

// -------------------------------------------------------------
// SOCIAL HEALTH AWARENESS & PUBLIC EDUCATION TYPES
// -------------------------------------------------------------

export type AwarenessContentType = 'ARTICLE' | 'INFOGRAPHIC' | 'VIDEO_SHORT' | 'HEALTH_ALERT';

export type AwarenessCategory =
  | 'VACCINATION_DRIVE'
  | 'SEASONAL_DISEASE'
  | 'HYGIENE_NUTRITION'
  | 'MATERNAL_CHILD_HEALTH'
  | 'CHRONIC_NCD'
  | 'EMERGENCY_SCHEMES';

export type AwarenessPublishStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface LocalizedAwarenessContent {
  title: string;
  summary: string;
  content?: string; // Formatted article body / guidance
  keyTakeaways?: string[]; // Quick bullet takeaways
  audioNarratorText?: string; // Text-to-speech audio transcript
  mediaCaption?: string;
  shareMessage?: string; // Pre-composed WhatsApp share message
}

export interface AwarenessItem {
  id: string; // e.g. "aw-001"
  slug: string; // e.g. "mission-indradhanush-vaccination-drive"
  type: AwarenessContentType;
  category: AwarenessCategory;
  status: AwarenessPublishStatus;
  isFeatured: boolean;
  isUrgentAlert: boolean;
  validUntil?: string | null; // For date-bound vaccination drives / alerts
  coverImageUrl?: string;
  mediaUrl?: string; // Video URL, high-res Infographic PDF/Image
  thumbnailUrl?: string;
  videoDurationSeconds?: number;
  readTimeMinutes?: number;
  tags: string[]; // e.g. ["Polio", "Immunization", "Mission Indradhanush"]
  authorName: string;
  authorRole: string; // e.g. "State Epidemiologist", "National Health Mission", "Senior Medical Officer"
  phcId?: string | null;
  phcName?: string | null;
  likesCount: number;
  sharesCount: number;
  viewsCount: number;
  translations: {
    en: LocalizedAwarenessContent;
    hi: LocalizedAwarenessContent;
    [langCode: string]: LocalizedAwarenessContent;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

export interface AwarenessFilterParams {
  type?: AwarenessContentType | 'ALL';
  category?: AwarenessCategory | 'ALL';
  language?: AppLanguage;
  search?: string;
  isFeatured?: boolean;
  isUrgentAlert?: boolean;
  status?: AwarenessPublishStatus;
}

// -------------------------------------------------------------
// HEALTH CAMP & COMMUNITY OUTREACH MODULE TYPES
// -------------------------------------------------------------
export type HealthCampType =
  | 'GENERAL'
  | 'EYE'
  | 'DENTAL'
  | 'VACCINATION'
  | 'MATERNAL_CHILD'
  | 'NCD_SCREENING'
  | 'AYUSH';

export type HealthCampStatus =
  | 'UPCOMING'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

export type CampRegistrationStatus =
  | 'REGISTERED'
  | 'ATTENDED'
  | 'NO_SHOW'
  | 'CANCELLED';

export interface HealthCampOutcome {
  peopleScreened: number;
  referralsMade: number;
  vaccinationsAdministered?: number;
  medicinesDistributed?: number;
  criticalCasesIdentified?: number;
  notes?: string;
  recordedAt?: string;
  recordedBy?: string;
}

export interface HealthCampRegistration {
  id: string; // e.g. "reg-001"
  campId: string; // e.g. "camp-001"
  patientId?: string | null;
  participantName: string;
  participantPhone: string;
  participantAge: number;
  participantGender: 'Male' | 'Female' | 'Other';
  tokenNumber: number;
  status: CampRegistrationStatus;
  attendedAt?: string | null;
  notes?: string | null;
  reminderSent: boolean;
  registeredAt: string;
}

export interface HealthCamp {
  id: string; // e.g. "camp-001"
  campId: string; // e.g. "CAMP-2026-001"
  title: string;
  description: string;
  type: HealthCampType;
  status: HealthCampStatus;
  startDate: string; // e.g. "2026-10-05"
  endDate: string; // e.g. "2026-10-05"
  time: string; // e.g. "09:00 AM - 03:00 PM"
  venue: string; // e.g. "Community Hall, Karol Bagh"
  address: string;
  pincode?: string;
  phcId: string;
  phcName: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  registeredCount: number;
  assignedAssistantId?: string | null;
  assignedAssistantName?: string | null;
  assignedAssistantRole?: string | null;
  assignedDoctorId?: string | null;
  assignedDoctorName?: string | null;
  assignedDoctorSpeciality?: string | null;
  organizerRole: 'ASHA' | 'CHO' | 'ANM' | 'DOCTOR' | 'ADMIN';
  organizerName: string;
  contactPhone: string;
  bannerImage?: string;
  servicesOffered: string[];
  eligibility: string;
  outcome?: HealthCampOutcome | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCampFilterParams {
  type?: HealthCampType | 'ALL';
  status?: HealthCampStatus | 'ALL';
  phcId?: string;
  location?: string;
  upcomingOnly?: boolean;
  assignedAssistantId?: string;
  assignedDoctorId?: string;
  search?: string;
}

export interface HealthCampAnalytics {
  totalCamps: number;
  upcomingCamps: number;
  completedCamps: number;
  totalRegistrations: number;
  totalScreened: number;
  totalReferrals: number;
  campsByType: Record<HealthCampType, number>;
}

// ----------------------------------------------------
// Emergency Pre-Alert Workflow Models (ASHA -> Facility)
// ----------------------------------------------------

export type EmergencySeverityLevel = 'CRITICAL' | 'SEVERE' | 'MODERATE';

export type EmergencyAlertStatus =
  | 'ALERT_RAISED'
  | 'ACKNOWLEDGED'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'HANDED_OVER'
  | 'CANCELLED';

export type EmergencyTransportMode =
  | 'AMBULANCE_108'
  | 'PRIVATE_VEHICLE'
  | 'AUTO_RICKSHAW'
  | 'COMMUNITY_TRANSPORT'
  | 'OTHER';

export interface EmergencyVitals {
  bp?: string; // e.g. "80/50" or "180/110"
  pulse?: number; // bpm e.g. 125
  temperature?: number; // deg F e.g. 102.4
  spO2?: number; // % e.g. 88
  respiratoryRate?: number; // breaths/min e.g. 28
  bloodSugar?: number; // mg/dL e.g. 45
  gcsScore?: number; // Glasgow Coma Scale 3-15
}

export interface EmergencyAuditEntry {
  id: string;
  status: EmergencyAlertStatus;
  action: string;
  performedBy: string;
  role: UserRole | 'PATIENT' | 'ASHA' | 'DRIVER' | 'SYSTEM';
  timestamp: string;
  notes?: string;
  details?: Record<string, any>;
}

export interface EmergencyPreAlert {
  id: string;
  alertNumber: string; // e.g. "EPA-20260924-001"
  patientId?: string | null;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  patientPhone?: string;
  patientAbhaId?: string;
  ashaWorkerId: string;
  ashaWorkerName: string;
  ashaWorkerPhone: string;
  sourceLocation: string; // Village / Area / Sub-centre name
  sourcePincode?: string;
  targetFacilityId: string; // PHC or CHC ID
  targetFacilityName: string;
  targetFacilityType: string;
  chiefComplaints: string[];
  symptomsDescription: string;
  vitals: EmergencyVitals;
  severity: EmergencySeverityLevel;
  transportMode: EmergencyTransportMode;
  ambulanceVehicleNumber?: string;
  ambulanceContact?: string;
  departureTime: string;
  estimatedArrivalMinutes: number;
  estimatedArrivalTime: string; // ISO string or format e.g. "18:45"
  status: EmergencyAlertStatus;
  
  // Doctor Acknowledgement & Triage Preparation
  acknowledgedByDoctorId?: string | null;
  acknowledgedByDoctorName?: string | null;
  acknowledgedAt?: string | null;
  doctorPreparationInstructions?: string[];
  doctorPreparationNotes?: string | null;
  bedAssigned?: string | null;
  teamAssigned?: string | null;
  
  // Arrival & Handover
  arrivedAt?: string | null;
  handedOverAt?: string | null;
  handoverNotes?: string | null;
  attendingPhysicianName?: string | null;
  
  // Metric Calculations
  metrics: {
    responseTimeMinutes?: number | null; // Raised -> Acknowledged
    transitTimeMinutes?: number | null;  // In-Transit -> Arrived
    totalDurationMinutes?: number | null; // Raised -> Handed Over
  };
  
  // Audit Trail
  timeline: EmergencyAuditEntry[];
  
  // Broadcast Deliveries
  deliveryStatus: {
    pushSent: boolean;
    smsSent: boolean;
    emailSent: boolean;
    broadcastAt: string;
  };

  // Enriched Live ETA info
  liveEta?: {
    remainingMinutes: number;
    estimatedArrivalTimeFormatted: string;
    isOverdue: boolean;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyPreAlertFilterParams {
  facilityId?: string;
  status?: EmergencyAlertStatus | 'ALL' | 'ACTIVE';
  severity?: EmergencySeverityLevel | 'ALL';
  ashaWorkerId?: string;
  search?: string;
}

export interface EmergencyAlertMetrics {
  totalAlerts: number;
  activeIncomingAlerts: number;
  criticalCases: number;
  avgResponseTimeMinutes: number;
  avgTransitTimeMinutes: number;
  handedOverCount: number;
}

// ----------------------------------------------------
// Patient Referral Follow-up & Tracking Models
// ----------------------------------------------------

export type FollowUpStatus = 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'MISSED' | 'CANCELLED';

export type PatientConditionState =
  | 'IMPROVED'
  | 'STABLE'
  | 'DETERIORATING'
  | 'CRITICAL'
  | 'RECOVERED';

export type ReferralTreatmentStatus =
  | 'REFERRED'
  | 'CONSULTATION_COMPLETED'
  | 'UNDER_TREATMENT'
  | 'ADMITTED'
  | 'DISCHARGED'
  | 'COMPLETED';

export type MedicationAdherenceLevel = 'FULL' | 'PARTIAL' | 'NON_ADHERENT';

export interface FollowUpTimelineEvent {
  id: string;
  type:
    | 'REFERRAL_INITIATED'
    | 'HIGHER_PHC_CONSULTATION'
    | 'TREATMENT_STATUS_UPDATE'
    | 'ASHA_FOLLOW_UP_LOGGED'
    | 'FOLLOW_UP_REMINDER_SENT'
    | 'HOSPITAL_DISCHARGE'
    | 'PRESCRIPTION_ADJUSTED';
  title: string;
  description: string;
  performedBy: string;
  role: UserRole | 'ASHA' | 'STAFF' | 'SYSTEM';
  facilityName?: string;
  timestamp: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface PatientFollowUpEntry {
  id: string;
  referralId: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  patientPhone?: string;
  patientAbhaId?: string;
  patientVillage: string;
  patientAddress?: string;
  
  // ASHA Assignment
  ashaWorkerId: string;
  ashaWorkerName: string;
  ashaWorkerPhone?: string;
  
  // Referral Origin & Destination
  referringPhcId: string;
  referringPhcName: string;
  higherPhcId: string;
  higherPhcName: string;
  
  // Clinical Diagnosis & Referral Reason
  condition: string; // e.g. "Severe Hypertension & Gestational Diabetes"
  category: 'CHRONIC_NCD' | 'MATERNAL_CHILD' | 'CARDIAC' | 'COMMUNICABLE' | 'SURGICAL_POSTOP' | 'GENERAL';
  referralDate: string;
  referralReason: string;
  
  // Higher PHC Shared Treatment Status
  referralTreatmentStatus: ReferralTreatmentStatus;
  higherPhcDoctorId?: string | null;
  higherPhcDoctorName?: string | null;
  higherPhcDoctorNotes?: string | null;
  higherPhcUpdatedAt?: string | null;
  
  // Follow-up Schedule & Dates
  scheduledDueDate: string; // e.g. "2026-09-28"
  followUpDate?: string | null; // e.g. "2026-09-24" (when conducted)
  nextVisitDate?: string | null; // next scheduled follow-up
  status: FollowUpStatus;
  isOverdue: boolean;
  daysOverdue?: number;
  
  // Follow-up Assessment Recorded by ASHA
  conditionUpdate?: PatientConditionState | null;
  vitals?: EmergencyVitals | null;
  medicinesTaken: string[];
  adherenceRate: MedicationAdherenceLevel;
  notes: string;
  
  // Automated Reminders
  reminderSent: boolean;
  reminderSentAt?: string | null;
  
  // Shared Timeline
  timeline: FollowUpTimelineEvent[];
  
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpFilterParams {
  village?: string;
  condition?: string;
  category?: string;
  status?: FollowUpStatus | 'ALL';
  treatmentStatus?: ReferralTreatmentStatus | 'ALL';
  ashaWorkerId?: string;
  facilityId?: string;
  search?: string;
}

export interface FollowUpAnalyticsMetrics {
  totalReferrals: number;
  pendingFollowUps: number;
  overdueFollowUps: number;
  completedFollowUps: number;
  fullAdherenceCount: number;
  adherenceRatePercent: number;
  villageBreakdown: Record<string, number>;
}






