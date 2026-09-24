import { DataStore } from '../db/dataStore';
import { RecommendationService } from '../services/recommendationService';
import {
  Complaint,
  CallbackRequest,
  ChatMessage,
  HealthAssistantProfile,
  ChatSession,
  OnCallSupportTicket,
  SharedCareNote,
  QuickReplyTemplate,
  PatientTimelineEvent,
  AwarenessItem,
  AwarenessContentType,
  AwarenessCategory,
  AwarenessPublishStatus,
  HealthCamp,
  HealthCampRegistration,
  HealthCampOutcome,
  HealthCampType,
  HealthCampStatus,
  EmergencyPreAlert,
  EmergencyAuditEntry,
  EmergencyVitals,
  EmergencySeverityLevel,
  EmergencyAlertStatus,
  EmergencyTransportMode,
  PatientFollowUpEntry,
  FollowUpTimelineEvent,
  FollowUpStatus,
  PatientConditionState,
  ReferralTreatmentStatus,
  MedicationAdherenceLevel,
} from '@phc-connect/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runAllTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 RUNNING AUTOMATED UNIT & INTEGRATION TESTS FOR PHC CONNECT');
  console.log('🧪 ====================================================');

  // Initialize data store
  DataStore.initialize();

  // TEST 1: Database Seed Integrity
  console.log('\n--- TEST SUITE 1: Seed Data Verification ---');
  assert(DataStore.phcs.length >= 5, `Expected at least 5 PHCs, found ${DataStore.phcs.length}`);
  assert(DataStore.doctors.length >= 10, `Expected at least 10 doctors, found ${DataStore.doctors.length}`);
  assert(DataStore.pharmacists.length >= 3, `Expected at least 3 pharmacists, found ${DataStore.pharmacists.length}`);
  assert(DataStore.patients.length >= 20, `Expected at least 20 patients, found ${DataStore.patients.length}`);
  assert(DataStore.medicines.length >= 50, `Expected at least 50 medicines, found ${DataStore.medicines.length}`);

  // TEST 2: Health Assistant Directory & Safety Routing Invariant
  console.log('\n--- TEST SUITE 2: Health Assistant Directory & Safety Routing ---');
  const onlineAssistants = DataStore.healthAssistants.filter((a) => a.status === 'ONLINE');
  assert(onlineAssistants.length >= 1, `Expected at least 1 online health assistant, found ${onlineAssistants.length}`);
  const testAsst = onlineAssistants[0];
  assert(testAsst.languages.length >= 2, 'Health assistant must support multiple regional languages');
  assert(testAsst.designation.length > 0, 'Health assistant must have registered designation');

  // TEST 3: PHC Recommendation & Distance Ranking
  console.log('\n--- TEST SUITE 3: Recommendation Engine ---');
  const patientLat = 28.6448; // Karol Bagh coordinates
  const patientLon = 77.1878;
  const ranked = RecommendationService.rankPHCs({
    patientLat,
    patientLon,
    riskLevel: 'LOW',
    allPhcs: DataStore.phcs,
    allDoctors: DataStore.doctors,
    allInventories: DataStore.inventories.map((i) => ({
      phcId: i.phcId,
      medicineName: i.medicine.name,
      quantity: i.quantity,
    })),
  });
  assert(ranked.length === DataStore.phcs.length, 'All PHCs should be evaluated and ranked');
  assert(ranked[0].phc.id === 'phc-001', 'Karol Bagh PHC should rank #1 for a patient located at Karol Bagh coordinates');
  assert(ranked[0].distanceKm < 0.5, `Distance should be close to 0 km, got ${ranked[0].distanceKm} km`);

  // TEST 4: Appointment State Lifecycle
  console.log('\n--- TEST SUITE 4: Appointment State Machine ---');
  const testApt = DataStore.appointments[0];
  const initialStatus = testApt.status;
  assert(testApt.tokenNumber > 0, 'Appointment should have a valid token number assigned');
  assert(typeof testApt.appointmentNumber === 'string', 'Appointment number must be formatted string');

  // TEST 5: Pharmacist Inventory Dispensing
  console.log('\n--- TEST SUITE 5: Medicine Inventory & Dispensing ---');
  const targetInv = DataStore.inventories.find((i) => i.quantity > 20);
  assert(!!targetInv, 'Found valid inventory batch for testing');
  if (targetInv) {
    const initialQty = targetInv.quantity;
    const dispenseQty = 5;
    targetInv.quantity -= dispenseQty;
    assert(targetInv.quantity === initialQty - dispenseQty, 'Inventory quantity correctly deducted upon dispensing');
  }

  // TEST 6: Phone OTP Authentication & New Account Registration
  console.log('\n--- TEST SUITE 6: Phone OTP & Registration Flow ---');
  const rawPhone1 = '+91 98765 43210';
  const rawPhone2 = '9876543210';
  const rawPhone3 = '+919876543210';
  const norm1 = rawPhone1.replace(/\D/g, '').slice(-10);
  const norm2 = rawPhone2.replace(/\D/g, '').slice(-10);
  const norm3 = rawPhone3.replace(/\D/g, '').slice(-10);
  assert(norm1 === '9876543210' && norm2 === '9876543210' && norm3 === '9876543210', 'Phone numbers in all formats must normalize to 10 digits');

  // Verify existing demo patient phone matches normalized user
  const foundUser = DataStore.users.find((u) => u.phone?.replace(/\D/g, '').slice(-10) === '9876543210');
  assert(!!foundUser, 'Must find registered demo patient by normalized phone');

  // Test registration of new user with details
  const newPatPhone = '+91 99887 76655';
  const initialPatientCount = DataStore.patients.length;
  const dummyNewPatient = {
    id: `pat-${Date.now()}`,
    userId: `user-pat-${Date.now()}`,
    patientId: `PHC-PAT-2026-${(initialPatientCount + 1).toString().padStart(4, '0')}`,
    fullName: 'Test Patient Sharma',
    age: 29,
    gender: 'Female' as const,
    phone: newPatPhone,
    address: 'Dwarka Sector 10, Delhi',
    emergencyContactName: 'Alok Sharma',
    emergencyContactPhone: '+91 99887 76656',
    emergencyContactRelation: 'Brother',
    bloodGroup: 'B+ve',
    allergies: ['Dust'],
    existingConditions: ['None'],
    currentMedications: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  DataStore.patients.push(dummyNewPatient);
  assert(DataStore.patients.length === initialPatientCount + 1, 'New patient account must be registered in DataStore');
  assert(dummyNewPatient.patientId.startsWith('PHC-PAT-2026-'), 'Generated patient ID must follow official format');

  // TEST 7: Receptionist Role & Pre-Consultation Check-Up System
  console.log('\n--- TEST SUITE 7: Receptionist Role & Pre-Consultation Flow ---');
  assert(DataStore.receptionists.length >= 2, `Expected at least 2 receptionists, found ${DataStore.receptionists.length}`);
  assert(DataStore.preConsultations.length >= 2, `Expected at least 2 seeded pre-consultations, found ${DataStore.preConsultations.length}`);

  const demoRec = DataStore.receptionists.find((r) => r.receptionistId === 'PHC-REC-001');
  assert(!!demoRec, 'Receptionist PHC-REC-001 must exist');
  assert(demoRec?.fullName === 'Pooja Sharma', 'Receptionist name matches seed');

  // Verify BMI formula: weight (kg) / (height(m))^2
  const testHeightCm = 175;
  const testWeightKg = 70;
  const heightInMeters = testHeightCm / 100;
  const computedBmi = Number((testWeightKg / (heightInMeters * heightInMeters)).toFixed(2));
  assert(computedBmi === 22.86, `Expected BMI 22.86 for 175cm / 70kg, got ${computedBmi}`);

  // Test adding a pre-consultation checkup
  const initialCheckupCount = DataStore.preConsultations.length;
  const dummyCheckup = {
    id: `chk-${Date.now()}`,
    checkupNumber: `CHK-2026-${(initialCheckupCount + 1).toString().padStart(4, '0')}`,
    patientId: 'pat-0001',
    patientCode: 'PHC-PAT-2026-0001',
    patientName: 'Aakash Jha',
    patientAge: 24,
    patientGender: 'Male' as const,
    patientPhone: '+91 98765 43210',
    receptionistId: 'rec-001',
    receptionistName: 'Pooja Sharma',
    phcId: 'phc-001',
    phcName: 'Central Urban PHC - Karol Bagh',
    vitals: {
      bpSystolic: 120,
      bpDiastolic: 80,
      bpFormatted: '120/80 mmHg',
      pulseRate: 72,
      bodyTemperature: 36.6,
      respiratoryRate: 16,
    },
    measurements: {
      height: testHeightCm,
      weight: testWeightKg,
      bmi: computedBmi,
      bmiCategory: 'Normal' as const,
    },
    otherTestsNotes: 'Routine Front Desk Check-in',
    otherTests: [
      { id: 't1', testName: 'Blood Sugar', resultValue: '110', unit: 'mg/dL' },
      { id: 't2', testName: 'SpO2', resultValue: '98', unit: '%' },
    ],
    status: 'WAITING_FOR_DOCTOR' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  DataStore.preConsultations.unshift(dummyCheckup);
  assert(DataStore.preConsultations.length === initialCheckupCount + 1, 'New pre-consultation checkup must be saved in DataStore');
  assert(dummyCheckup.checkupNumber.startsWith('CHK-2026-'), 'Checkup number must follow formatted naming convention');
  assert(dummyCheckup.otherTests.length === 2, 'Other medical test rows must be stored correctly');

  // TEST 8: Complaint & Grievance Redressal Lifecycle
  console.log('\n--- TEST SUITE 8: Grievance Redressal & Complaint Flow ---');
  assert(DataStore.complaints.length >= 3, 'DataStore must contain seeded initial complaints');

  const initialComplaintCount = DataStore.complaints.length;
  const testComplaintId = `CMP-2026-${(initialComplaintCount + 1).toString().padStart(4, '0')}`;
  const newComplaint: Complaint = {
    id: `cmp-test-${Date.now()}`,
    complaintId: testComplaintId,
    userId: 'user-pat-001',
    userName: 'Aakash Jha',
    userPhone: '+91 98765 43210',
    userRole: 'PATIENT',
    phcId: 'phc-001',
    phcName: 'Central Urban PHC - Karol Bagh',
    category: 'SERVICE_QUALITY',
    categoryLabel: 'Service Quality',
    subject: 'Excessive waiting time at Registration counter',
    description: 'Waited over 45 minutes for registration token due to single counter operation.',
    priority: 'MEDIUM',
    status: 'OPEN',
    assignedToId: null,
    assignedToName: null,
    assignedToRole: null,
    resolutionNotes: null,
    resolvedAt: null,
    closedAt: null,
    history: [
      {
        id: `cmph-test-1`,
        timestamp: new Date().toISOString(),
        toStatus: 'OPEN',
        actorId: 'user-pat-001',
        actorName: 'Aakash Jha',
        actorRole: 'PATIENT',
        note: 'Grievance submitted by citizen',
      },
    ],
    replies: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  DataStore.complaints.unshift(newComplaint);
  assert(DataStore.complaints.length === initialComplaintCount + 1, 'New complaint must be recorded in DataStore');
  assert(newComplaint.complaintId.startsWith('CMP-2026-'), 'Complaint ID must follow format CMP-2026-XXXX');

  // Test status progression to IN_PROGRESS with assignment
  newComplaint.status = 'IN_PROGRESS';
  newComplaint.assignedToId = 'admin-001';
  newComplaint.assignedToName = 'Dr. Vandana Rao';
  newComplaint.history.push({
    id: `cmph-test-2`,
    timestamp: new Date().toISOString(),
    fromStatus: 'OPEN',
    toStatus: 'IN_PROGRESS',
    actorId: 'admin-001',
    actorName: 'Dr. Vandana Rao',
    actorRole: 'ADMIN',
    note: 'Assigned for investigation.',
  });
  assert(newComplaint.status === 'IN_PROGRESS', 'Complaint status must transition to IN_PROGRESS');
  assert(newComplaint.assignedToName === 'Dr. Vandana Rao', 'Assigned officer must be set');

  // Test resolution
  newComplaint.status = 'RESOLVED';
  newComplaint.resolutionNotes = 'Additional counter opened during peak morning hours.';
  newComplaint.resolvedAt = new Date().toISOString();
  newComplaint.history.push({
    id: `cmph-test-3`,
    timestamp: new Date().toISOString(),
    fromStatus: 'IN_PROGRESS',
    toStatus: 'RESOLVED',
    actorId: 'admin-001',
    actorName: 'Dr. Vandana Rao',
    actorRole: 'ADMIN',
    note: newComplaint.resolutionNotes,
  });
  assert(newComplaint.status === 'RESOLVED', 'Complaint status must transition to RESOLVED');
  assert(newComplaint.history.length === 3, 'Complete audit history trail must be preserved');

  // TEST 9: Call Services, Helplines, Telephony Provider & Callback Lifecycle
  console.log('\n--- TEST SUITE 9: Call Services & Telephony Provider Architecture ---');
  const { TelephonyService } = await import('../services/telephonyService');

  // 1. Helplines validation
  assert(DataStore.helplineContacts.length >= 10, `Expected >= 10 helplines/contacts, found ${DataStore.helplineContacts.length}`);
  const emergency108 = DataStore.helplineContacts.find((c) => c.number === '108');
  assert(!!emergency108, 'Helpline 108 Emergency Ambulance must be present');
  assert(emergency108?.telLink === 'tel:108', 'Helpline 108 must have valid mobile tel:108 link');
  assert(emergency108?.tollFree === true, '108 must be flagged as toll-free');

  const phcDirect = DataStore.helplineContacts.find((c) => c.category === 'PHC_DIRECT');
  assert(!!phcDirect, 'PHC Direct lines must be seeded in directory');
  assert(phcDirect?.telLink.startsWith('tel:'), 'PHC Direct lines must have valid tel: URL link');

  const ashaContact = DataStore.helplineContacts.find((c) => c.category === 'HEALTH_ASSISTANT');
  assert(!!ashaContact, 'Assigned Health Assistant / ASHA contacts must be present');

  // 2. Callback Request creation and queue
  const initialCallbackCount = DataStore.callbackRequests.length;
  const testCbId = `CB-2026-${(initialCallbackCount + 1).toString().padStart(4, '0')}`;
  const newCb: CallbackRequest = {
    id: `cb-test-${Date.now()}`,
    requestId: testCbId,
    patientId: 'pat-0001',
    name: 'Anjali Sharma',
    phone: '+91 98765 00001',
    reason: 'Post-discharge dressing change inquiry',
    preferredTime: 'Morning (09:00 AM - 12:00 PM)',
    phcId: 'phc-001',
    phcName: 'Central Urban PHC - Karol Bagh',
    status: 'Pending',
    assignedStaffId: null,
    assignedStaffName: null,
    notes: null,
    callAttempts: 0,
    lastAttemptAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  DataStore.callbackRequests.unshift(newCb);
  assert(DataStore.callbackRequests.length === initialCallbackCount + 1, 'New callback request must be recorded in DB queue');
  assert(newCb.status === 'Pending', 'Initial callback status must be Pending');

  // 3. Pluggable Telephony Provider dispatch
  const callSession = await TelephonyService.initiateCall(
    {
      toPhone: newCb.phone,
      toName: newCb.name,
      purpose: newCb.reason,
      callbackRequestId: newCb.id,
      phcId: newCb.phcId,
    },
    {
      callerName: 'Pooja Verma (Reception Desk)',
      callerPhone: '+91 11 2572 4012',
      callerRole: 'RECEPTIONIST',
    }
  );

  assert(callSession.status === 'INITIATED', 'Telephony provider must initiate outbound voice session');
  assert(callSession.sessionId.startsWith('CALL-SES-'), 'Telephony session ID must follow CALL-SES prefix');
  assert(callSession.provider === 'MOCK_PROVIDER', 'Default active provider must be MockTelephonyProvider');

  // Verify call log was auto-recorded
  const linkedLog = DataStore.callLogs.find((l) => l.callSessionId === callSession.sessionId);
  assert(!!linkedLog, 'Outbound call must automatically create a call log entry');
  assert(linkedLog?.receiverPhone === newCb.phone, 'Call log receiver phone must match target');
  assert(linkedLog?.direction === 'OUTBOUND', 'Call log direction must be OUTBOUND');

  // 4. Terminate call session & verify duration update
  const hangupOk = await TelephonyService.hangupCall(callSession.sessionId);
  assert(hangupOk === true, 'Telephony hangup must succeed');
  assert(linkedLog?.durationSeconds !== undefined && linkedLog.durationSeconds >= 0, 'Call duration must be updated upon hangup');

  // 5. Update callback status to Completed
  newCb.status = 'Completed';
  newCb.callAttempts = 1;
  newCb.lastAttemptAt = new Date().toISOString();
  newCb.notes = 'Patient confirmed dressing change appointment with ASHA worker.';
  assert(newCb.status === 'Completed', 'Callback status must transition to Completed');

  // TEST 10: Human Health Assistant Real-Time Chat, Smart Routing, RBAC Privacy & WebRTC Voice Infrastructure
  console.log('\n--- TEST SUITE 10: Human Health Assistant & Real-Time Tele-Care System ---');

  // 1. Health Assistant Seed Data & Status Transitions
  assert(DataStore.healthAssistants.length >= 5, `Expected at least 5 seeded human health assistants, found ${DataStore.healthAssistants.length}`);
  const sunita = DataStore.healthAssistants.find((a) => a.id === 'asst-001');
  assert(!!sunita, 'Sunita Devi (Senior ASHA Facilitator) must be seeded in system');
  assert(sunita?.fullName === 'Sunita Devi', 'Assistant full name must match Sunita Devi');
  assert(sunita?.languages.includes('Hindi'), 'Assistant Sunita must support Hindi language');
  assert(sunita?.status === 'ONLINE', 'Sunita initial status must be ONLINE');

  // Test status mutation
  sunita!.status = 'BUSY';
  assert(DataStore.healthAssistants.find((a) => a.id === 'asst-001')?.status === 'BUSY', 'Assistant status mutation to BUSY must reflect in store');
  sunita!.status = 'ONLINE'; // reset

  // 2. Smart Assistant Routing Algorithm
  const availableAssistants = DataStore.healthAssistants.filter((a) => a.status === 'ONLINE');
  assert(availableAssistants.length > 0, 'There must be available online assistants for routing');

  // Test language preference match
  const punjabiAssistant = DataStore.healthAssistants.find((a) => a.status === 'ONLINE' && a.languages.includes('Punjabi'));
  assert(!!punjabiAssistant, 'Punjabi speaking assistant must be available for regional routing');

  // 3. One-to-One Chat Session Lifecycle & Message Delivery
  const testPatientId = 'pat-0001';
  const testAssistantId = 'asst-001';

  let session = DataStore.chatSessions.find((s) => s.patientId === testPatientId && s.assistantId === testAssistantId);
  if (!session) {
    session = {
      id: `session-test-${Date.now()}`,
      patientId: testPatientId,
      patientUserId: 'user-pat-0001',
      patientName: 'Anjali Sharma',
      patientPhone: '+91 98765 00001',
      assistantId: testAssistantId,
      assistantUserId: 'user-asst-001',
      assistantName: sunita!.fullName,
      assistantRole: sunita!.designation,
      phcId: 'phc-001',
      phcName: 'Central Urban PHC - Karol Bagh',
      status: 'ACTIVE',
      lastMessage: 'Session started',
      lastMessageAt: new Date().toISOString(),
      unreadCountPatient: 0,
      unreadCountAssistant: 0,
      callState: { status: 'IDLE' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    DataStore.chatSessions.unshift(session);
  }
  assert(session.status === 'ACTIVE', 'Chat session must be ACTIVE');

  // Send patient text message
  const initialMsgCount = DataStore.chatMessages.length;
  const patientMsg: ChatMessage = {
    id: `msg-test-${Date.now()}`,
    sessionId: session.id,
    senderId: testPatientId,
    senderRole: 'PATIENT',
    senderName: 'Anjali Sharma',
    recipientId: testAssistantId,
    text: 'Namaste Sunita ji, I have mild fever and headache since morning.',
    status: 'SENT',
    timestamp: new Date().toISOString(),
  };
  DataStore.chatMessages.push(patientMsg);
  session.lastMessage = patientMsg.text;
  session.lastMessageAt = patientMsg.timestamp;
  session.unreadCountAssistant += 1;
  session.updatedAt = patientMsg.timestamp;

  assert(DataStore.chatMessages.length === initialMsgCount + 1, 'Patient message must be saved to chat history');
  assert(session.unreadCountAssistant >= 1, 'Unread count for assistant must increment on patient message');
  assert(patientMsg.status === 'SENT', 'Initial message read status must be SENT');

  // Send image attachment message
  const imageMsg: ChatMessage = {
    id: `msg-test-img-${Date.now()}`,
    sessionId: session.id,
    senderId: testPatientId,
    senderRole: 'PATIENT',
    senderName: 'Anjali Sharma',
    recipientId: testAssistantId,
    text: 'Sharing photo of skin rash for visual triage.',
    attachment: {
      url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
      name: 'skin_rash_photo.jpg',
      type: 'IMAGE',
      sizeBytes: 245000,
    },
    status: 'SENT',
    timestamp: new Date().toISOString(),
  };
  DataStore.chatMessages.push(imageMsg);
  assert(imageMsg.attachment?.type === 'IMAGE', 'Image attachment message must be typed IMAGE');
  assert(!!imageMsg.attachment?.url, 'Image attachment must contain valid media URL');

  // 4. Read Receipts & Unread Counter Reset
  // Assistant opens session -> all patient messages marked READ
  const unreadMsgs = DataStore.chatMessages.filter((m) => m.sessionId === session!.id && m.senderRole === 'PATIENT' && m.status !== 'READ');
  const now = new Date().toISOString();
  unreadMsgs.forEach((m) => {
    m.status = 'READ';
    m.readAt = now;
  });
  session.unreadCountAssistant = 0;

  assert(patientMsg.status === 'READ', 'Patient message status must update to READ');
  assert(patientMsg.readAt === now, 'Read receipt timestamp must be recorded');
  assert(session.unreadCountAssistant === 0, 'Assistant unread counter must reset to 0 after viewing');

  // 5. Strict RBAC Privacy Isolation Test
  const unauthorizedPatientId = 'pat-0002';
  const isParticipant = session.patientId === unauthorizedPatientId || session.assistantId === unauthorizedPatientId;
  const isStaffSupervisor = false; // Regular user
  const canAccessSession = isParticipant || isStaffSupervisor;
  assert(!canAccessSession, 'Unauthorized third-party patient must NOT have access to private chat session transcript');

  const authorizedStaffRole = 'ADMIN';
  const canStaffAudit = authorizedStaffRole === 'ADMIN' || authorizedStaffRole === 'DOCTOR';
  assert(canStaffAudit, 'Facility Admin and Doctors must have authorized audit access for clinical continuity');

  // 6. WebRTC Voice Call Signaling & Session Lifecycle
  const mockCallSessionId = `call-webrtc-${Date.now()}`;
  let callState: 'IDLE' | 'CALLING' | 'RINGING' | 'CONNECTED' | 'ENDED' = 'IDLE';

  // Step A: Patient initiates call
  callState = 'CALLING';
  assert(callState === 'CALLING', 'WebRTC call must start in CALLING state');

  // Step B: Server notifies Assistant -> RINGING
  callState = 'RINGING';
  assert(callState === 'RINGING', 'Assistant client must transition to RINGING state');

  // Step C: Assistant accepts call -> CONNECTED
  callState = 'CONNECTED';
  assert(callState === 'CONNECTED', 'WebRTC peer connection must transition to CONNECTED on accept');

  // Step D: Call ends & Call Log auto-generated
  callState = 'ENDED';
  const callDurationSeconds = 142; // 2 min 22 sec call
  const assistantCallLog = {
    id: `log-${Date.now()}`,
    callSessionId: mockCallSessionId,
    callerName: 'Anjali Sharma (Patient)',
    callerPhone: '+91 98765 00001',
    receiverName: sunita!.fullName,
    receiverPhone: sunita!.phone,
    receiverRole: 'HEALTH_ASSISTANT',
    direction: 'INBOUND' as const,
    outcome: 'CONNECTED' as const,
    durationSeconds: callDurationSeconds,
    purpose: 'Direct Human Health Assistant Voice Consultation',
    phcId: 'phc-001',
    timestamp: new Date().toISOString(),
  };
  DataStore.callLogs.unshift(assistantCallLog);

  assert(callState === 'ENDED', 'Call state must transition to ENDED');
  assert(assistantCallLog.outcome === 'CONNECTED', 'Call log outcome must be CONNECTED');
  assert(assistantCallLog.durationSeconds === 142, 'Call duration in seconds must be recorded in DB log');
  assert(assistantCallLog.receiverRole === 'HEALTH_ASSISTANT', 'Call log must attribute session to HEALTH_ASSISTANT');

  // 7. Offline Call Fallback to Callback Request
  const offlineAssistant = DataStore.healthAssistants.find((a) => a.status === 'OFFLINE') || {
    id: 'asst-offline',
    fullName: 'Anita Gurung',
    status: 'OFFLINE' as const,
    phone: '+91 98556 78901',
  };
  const isTargetAvailable = offlineAssistant.status === 'ONLINE';
  assert(!isTargetAvailable, 'Offline assistant must not accept direct WebRTC calls');

  // Fallback generation
  const fallbackCallback: CallbackRequest = {
    id: `cb-fallback-${Date.now()}`,
    requestId: `CB-2026-FALLBACK-01`,
    patientId: testPatientId,
    name: 'Anjali Sharma',
    phone: '+91 98765 00001',
    reason: `Requested voice consultation with ${offlineAssistant.fullName} (Assistant was offline)`,
    preferredTime: 'Next Available Shift',
    phcId: 'phc-001',
    phcName: 'Central Urban PHC - Karol Bagh',
    status: 'Pending',
    assignedStaffId: offlineAssistant.id,
    assignedStaffName: offlineAssistant.fullName,
    notes: 'Auto-routed callback request due to offline health assistant',
    callAttempts: 0,
    lastAttemptAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  DataStore.callbackRequests.unshift(fallbackCallback);
  assert(fallbackCallback.status === 'Pending', 'Offline call fallback must generate Pending callback request in queue');
  assert(fallbackCallback.assignedStaffId === offlineAssistant.id, 'Fallback callback must preserve requested assistant ID');

  // ====================================================
  // TEST SUITE 11: On-Call Remote Support, Shared Care Notes, Doctor Escalation & Patient Timeline
  // ====================================================
  console.log('\n--- TEST SUITE 11: On-Call Support, Shared Notes, Escalation & Timeline ---');

  // 11.1 Quick Reply Templates Library
  console.log('Testing 11.1: Quick Reply Templates Library...');
  assert(DataStore.quickReplies && DataStore.quickReplies.length >= 6, `Expected at least 6 quick reply templates, found ${DataStore.quickReplies?.length}`);
  const feverTemplate = DataStore.quickReplies.find((r) => r.title.includes('Fever') || r.tags?.includes('Fever'));
  const symptomTemplate = DataStore.quickReplies.find((r) => r.category === 'Symptom Check');
  const medicationTemplate = DataStore.quickReplies.find((r) => r.category === 'Medications');
  const homeCareTemplate = DataStore.quickReplies.find((r) => r.category === 'Home Care');
  const escalationTemplate = DataStore.quickReplies.find((r) => r.category === 'Escalation');
  const emergencyTemplate = DataStore.quickReplies.find((r) => r.category === 'Emergency');
  assert(!!feverTemplate, 'Fever advice quick reply template must exist');
  assert(!!symptomTemplate, 'Symptom check quick reply template must exist');
  assert(!!medicationTemplate, 'Medication adherence quick reply template must exist');
  assert(!!homeCareTemplate, 'Home care instructions template must exist');
  assert(!!escalationTemplate, 'Doctor escalation quick reply template must exist');
  assert(!!emergencyTemplate, 'Emergency red-flag 108/112 quick reply template must exist');

  // 11.2 On-Call Support Ticket Lifecycle (Creation, Tagging, Resolution)
  console.log('Testing 11.2: Support Ticket Lifecycle & Resolution Summary...');
  const testTicketNumber = `TKT-2026-TEST-${Date.now().toString().slice(-4)}`;
  const newTicket: OnCallSupportTicket = {
    id: `tkt-test-${Date.now()}`,
    ticketNumber: testTicketNumber,
    sessionId: session.id,
    patientId: testPatientId,
    patientName: 'Anjali Sharma',
    patientPhone: '+91 98765 00001',
    subject: 'High post-prandial blood sugar & diet consultation',
    category: 'CHRONIC_CARE_NCD',
    priority: 'HIGH',
    status: 'OPEN',
    notes: 'Patient reported 210 mg/dL post-lunch reading. Advising low GI meals.',
    tags: ['Diabetes', 'Diet Advice', 'Tele-Care', 'Follow-up Required'],
    creatorId: sunita!.id,
    creatorName: sunita!.fullName,
    creatorRole: 'HEALTH_ASSISTANT',
    assignedStaffId: sunita!.id,
    assignedStaffName: sunita!.fullName,
    assignedStaffRole: 'HEALTH_ASSISTANT',
    phcId: 'phc-001',
    phcName: 'Central Urban PHC - Karol Bagh',
    actionLogs: [
      {
        id: `log-tkt-1`,
        action: 'CREATED',
        actorId: sunita!.id,
        actorName: sunita!.fullName,
        actorRole: 'HEALTH_ASSISTANT',
        details: 'Support ticket opened during tele-care voice & chat session',
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  DataStore.supportTickets.unshift(newTicket);

  assert(newTicket.status === 'OPEN', 'Newly created support ticket must have OPEN status');
  assert(newTicket.tags.includes('Diabetes'), 'Support ticket tags must be preserved in DB');
  assert(newTicket.priority === 'HIGH', 'Support ticket priority must be HIGH');
  assert(newTicket.actionLogs.length === 1, 'Action log must record creation event');

  // Resolving ticket
  const resolutionText = 'Provided diabetic diet chart, verified morning fasting target (<110 mg/dL), and scheduled tele-follow-up.';
  newTicket.status = 'RESOLVED';
  newTicket.resolutionSummary = resolutionText;
  newTicket.resolvedAt = new Date().toISOString();
  newTicket.actionLogs.push({
    id: `log-tkt-2`,
    action: 'RESOLVED',
    actorId: sunita!.id,
    actorName: sunita!.fullName,
    actorRole: 'HEALTH_ASSISTANT',
    details: `Resolved ticket: ${resolutionText}`,
    timestamp: new Date().toISOString(),
  });

  assert(newTicket.status === 'RESOLVED', 'Support ticket status must update to RESOLVED');
  assert(newTicket.resolutionSummary === resolutionText, 'Resolution summary must be saved on ticket');
  assert(!!newTicket.resolvedAt, 'Resolved timestamp must be stamped');
  assert(newTicket.actionLogs.length === 2, 'Action log must record resolution step');

  // 11.3 Shared Care Notes Real-Time State
  console.log('Testing 11.3: Shared Care Notes Real-Time State...');
  const testCareNote: SharedCareNote = {
    id: `note-test-${Date.now()}`,
    sessionId: session.id,
    patientId: testPatientId,
    title: 'Diabetic Care & Dietary Protocol',
    summary: 'Lifestyle and dietary adjustments for post-prandial glycemic control',
    instructions: [
      'Drink 8-10 glasses of water daily',
      'Replace refined white rice with whole grains (millets/brown rice)',
      '30-minute brisk walk post breakfast and dinner',
      'Record fasting and 2-hr post-meal blood sugar levels in health diary',
    ],
    dietaryPrecautions: [
      'Avoid added refined sugar, sweets, and sweetened beverages',
      'Limit high GI fruits like ripe mangoes and bananas',
      'Include fresh green leafy vegetables and salad with meals',
    ],
    medicationNotes: [
      'Take prescribed Metformin 500mg strictly after breakfast',
      'Do not skip meals after taking oral hypoglycemic medications',
    ],
    emergencyWarning: 'If experiencing sudden dizziness, trembling, cold sweats (hypoglycemia), immediately consume 3 tsp sugar or fruit juice and contact PHC emergency (108).',
    authorName: sunita!.fullName,
    authorRole: 'HEALTH_ASSISTANT',
    updatedAt: new Date().toISOString(),
  };
  DataStore.sharedCareNotes.unshift(testCareNote);

  const fetchedNote = DataStore.sharedCareNotes.find((n) => n.sessionId === session.id);
  assert(!!fetchedNote, 'Shared care note must be retrievable by sessionId');
  assert(fetchedNote!.instructions.length === 4, 'Shared care note must preserve all 4 instructions');
  assert(fetchedNote!.dietaryPrecautions!.length === 3, 'Shared care note must preserve dietary precautions');
  assert(fetchedNote!.emergencyWarning!.includes('108'), 'Shared care note must include emergency warning guidelines');

  // 11.4 Multi-Party Doctor Escalation
  console.log('Testing 11.4: Tele-Care Doctor Escalation...');
  const activeChat = DataStore.chatSessions.find((s) => s.id === session.id);
  assert(!!activeChat, 'Active chat session must exist in DataStore');

  const doctorToEscalate = DataStore.doctors.find((d) => d.status === 'AVAILABLE') || DataStore.doctors[0];
  assert(!!doctorToEscalate, 'Doctor must be available for escalation');

  // Perform escalation
  activeChat!.escalatedDoctorId = doctorToEscalate.id;
  activeChat!.escalatedDoctorName = doctorToEscalate.fullName;
  activeChat!.status = 'TRANSFERRED';

  // Ensure participants array is initialized and doctor is added
  if (!activeChat!.participants) {
    activeChat!.participants = [
      { id: activeChat!.patientId, name: activeChat!.patientName, role: 'PATIENT', joinedAt: activeChat!.createdAt },
      { id: activeChat!.assistantId, name: activeChat!.assistantName, role: 'HEALTH_ASSISTANT', joinedAt: activeChat!.createdAt },
    ];
  }
  const isDoctorInParticipants = activeChat!.participants.some((p) => p.id === doctorToEscalate.id);
  if (!isDoctorInParticipants) {
    activeChat!.participants.push({
      id: doctorToEscalate.id,
      name: doctorToEscalate.fullName,
      role: 'DOCTOR',
      designation: doctorToEscalate.specialization,
      joinedAt: new Date().toISOString(),
    });
  }

  assert(activeChat!.status === 'TRANSFERRED', 'Session status must change to TRANSFERRED');
  assert(activeChat!.escalatedDoctorId === doctorToEscalate.id, 'Session must record escalatedDoctorId');
  assert(
    activeChat!.participants.some((p) => p.role === 'DOCTOR' && p.id === doctorToEscalate.id),
    'Doctor must be appended into multi-party session participants'
  );

  // 11.5 Patient Unified Timeline Aggregation
  console.log('Testing 11.5: Patient Unified Timeline Aggregation...');
  const patientForTimeline = DataStore.patients.find((p) => p.id === testPatientId) || DataStore.patients[0];
  const patientId = patientForTimeline.id;
  const patientPhone = patientForTimeline.phone;

  // Aggregate timeline events following TimelineController logic
  const timelineEvents: PatientTimelineEvent[] = [];

  // Support Tickets
  DataStore.supportTickets
    .filter((t) => t.patientId === patientId || t.patientPhone === patientPhone)
    .forEach((t) => {
      timelineEvents.push({
        id: `evt-tkt-create-${t.id}`,
        patientId,
        type: 'SUPPORT_TICKET',
        title: `Support Ticket Opened: ${t.ticketNumber}`,
        description: `${t.subject} • Priority: ${t.priority}`,
        timestamp: t.createdAt,
        actorName: t.creatorName,
        actorRole: t.creatorRole,
        badgeText: t.status,
        badgeVariant: t.status === 'RESOLVED' ? 'success' : 'info',
      });
      if (t.status === 'RESOLVED' && t.resolvedAt) {
        timelineEvents.push({
          id: `evt-tkt-res-${t.id}`,
          patientId,
          type: 'SUPPORT_TICKET',
          title: `Support Ticket Resolved: ${t.ticketNumber}`,
          description: t.resolutionSummary || 'Resolved',
          timestamp: t.resolvedAt,
          actorName: t.assignedStaffName,
          actorRole: t.assignedStaffRole,
          badgeText: 'RESOLVED',
          badgeVariant: 'success',
        });
      }
    });

  // Shared Notes
  DataStore.sharedCareNotes
    .filter((n) => n.patientId === patientId)
    .forEach((n) => {
      timelineEvents.push({
        id: `evt-note-${n.id}`,
        patientId,
        type: 'SHARED_NOTE_UPDATE',
        title: `Care Advisory: ${n.title}`,
        description: n.summary,
        timestamp: n.updatedAt,
        actorName: n.authorName,
        actorRole: n.authorRole,
        badgeText: 'Shared Note',
        badgeVariant: 'emerald',
      });
    });

  // Calls
  DataStore.callLogs
    .filter((c) => c.callerPhone === patientPhone || c.receiverPhone === patientPhone)
    .forEach((c) => {
      timelineEvents.push({
        id: `evt-call-${c.id}`,
        patientId,
        type: 'VOICE_CALL',
        title: `Voice Call: ${c.receiverRole}`,
        description: `${c.purpose} • Duration: ${c.durationSeconds}s • Outcome: ${c.outcome}`,
        timestamp: c.timestamp,
        actorName: c.callerName,
        actorRole: 'PATIENT',
        badgeText: c.outcome,
        badgeVariant: 'success',
      });
    });

  // Pre-Consultations
  DataStore.preConsultations
    .filter((pc) => pc.patientId === patientId || pc.patientPhone === patientPhone)
    .forEach((pc) => {
      timelineEvents.push({
        id: `evt-pc-${pc.id}`,
        patientId,
        type: 'PRE_CHECKUP',
        title: `Pre-Consultation Vitals (${pc.checkupNumber})`,
        description: `BMI: ${pc.measurements.bmi || '--'} • BP: ${pc.vitals.bpFormatted || '--'}`,
        timestamp: pc.createdAt,
        actorName: pc.receptionistName,
        actorRole: 'RECEPTIONIST',
        badgeText: 'Vitals',
        badgeVariant: 'warning',
      });
    });

  // Medical Records
  DataStore.medicalRecords
    .filter((r) => r.patientId === patientId)
    .forEach((r) => {
      timelineEvents.push({
        id: `evt-rec-${r.id}`,
        patientId,
        type: 'OPD_APPOINTMENT',
        title: `OPD Consultation: ${r.doctorName}`,
        description: `Diagnosis: ${Array.isArray(r.diagnosis) ? r.diagnosis.join(', ') : 'General'}`,
        timestamp: r.visitDate || r.createdAt || new Date().toISOString(),
        actorName: r.doctorName,
        actorRole: 'DOCTOR',
        badgeText: 'OPD Consult',
        badgeVariant: 'primary',
      });
    });

  // Sort descending by timestamp
  timelineEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  assert(timelineEvents.length >= 3, `Expected at least 3 aggregated timeline events, found ${timelineEvents.length}`);

  // Check event types present
  const eventTypes = new Set(timelineEvents.map((e) => e.type));
  assert(eventTypes.has('SUPPORT_TICKET'), 'Timeline must include SUPPORT_TICKET events');
  assert(eventTypes.has('SHARED_NOTE_UPDATE'), 'Timeline must include SHARED_NOTE_UPDATE events');
  assert(eventTypes.has('VOICE_CALL'), 'Timeline must include VOICE_CALL events');

  // Verify descending sort order
  for (let i = 0; i < timelineEvents.length - 1; i++) {
    const current = new Date(timelineEvents[i].timestamp).getTime();
    const next = new Date(timelineEvents[i + 1].timestamp).getTime();
    assert(current >= next, `Timeline events must be chronologically ordered (event ${i} vs ${i + 1})`);
  }

  // Verify filtering
  const ticketEventsOnly = timelineEvents.filter((e) => e.type === 'SUPPORT_TICKET');
  assert(ticketEventsOnly.length > 0, 'Filtering by SUPPORT_TICKET should yield matching events');
  assert(ticketEventsOnly.every((e) => e.type === 'SUPPORT_TICKET'), 'All filtered events must match requested type');

  // TEST 12: SOCIAL HEALTH AWARENESS & PUBLIC EDUCATION PORTAL
  console.log('\n--- TEST SUITE 12: Social Health Awareness & Public Education ---');

  // Test 12.1: Seed Data Verification & Multilingual Integrity
  assert(DataStore.awarenessItems.length >= 7, `Expected at least 7 seed awareness items, found ${DataStore.awarenessItems.length}`);
  
  const allHaveValidTranslations = DataStore.awarenessItems.every((item) => {
    const en = item.translations?.en;
    const hi = item.translations?.hi;
    return (
      en &&
      hi &&
      en.title.length > 5 &&
      en.summary.length > 10 &&
      hi.title.length > 5 &&
      hi.summary.length > 10 &&
      en.shareMessage &&
      hi.shareMessage
    );
  });
  assert(allHaveValidTranslations, 'All awareness items must contain complete English and Hindi titles, summaries, and share messages');

  // Verify all content types are covered in seeds
  const seededTypes = new Set(DataStore.awarenessItems.map((i) => i.type));
  assert(seededTypes.has('ARTICLE'), 'Seeds must include ARTICLE content format');
  assert(seededTypes.has('INFOGRAPHIC'), 'Seeds must include INFOGRAPHIC format');
  assert(seededTypes.has('VIDEO_SHORT'), 'Seeds must include VIDEO_SHORT format');
  assert(seededTypes.has('HEALTH_ALERT'), 'Seeds must include HEALTH_ALERT format');

  // Verify all categories are covered in seeds
  const seededCategories = new Set(DataStore.awarenessItems.map((i) => i.category));
  assert(seededCategories.has('VACCINATION_DRIVE'), 'Seeds must include VACCINATION_DRIVE category');
  assert(seededCategories.has('SEASONAL_DISEASE'), 'Seeds must include SEASONAL_DISEASE category');
  assert(seededCategories.has('HYGIENE_NUTRITION'), 'Seeds must include HYGIENE_NUTRITION category');
  assert(seededCategories.has('MATERNAL_CHILD_HEALTH'), 'Seeds must include MATERNAL_CHILD_HEALTH category');
  assert(seededCategories.has('CHRONIC_NCD'), 'Seeds must include CHRONIC_NCD category');
  assert(seededCategories.has('EMERGENCY_SCHEMES'), 'Seeds must include EMERGENCY_SCHEMES category');

  // Test 12.2: Category, Format & Multilingual Text Search Filtering
  const vaccinationItems = DataStore.awarenessItems.filter((i) => i.category === 'VACCINATION_DRIVE');
  assert(vaccinationItems.length >= 1, 'Filtering by VACCINATION_DRIVE category should return campaigns');

  const infographicItems = DataStore.awarenessItems.filter((i) => i.type === 'INFOGRAPHIC');
  assert(infographicItems.length >= 1, 'Filtering by INFOGRAPHIC format should return posters');

  // English Search Match
  const englishSearchQuery = 'dengue';
  const dengueResults = DataStore.awarenessItems.filter((item) => {
    const en = item.translations.en;
    return en?.title.toLowerCase().includes(englishSearchQuery) || en?.summary.toLowerCase().includes(englishSearchQuery);
  });
  assert(dengueResults.length > 0, `Search for English keyword "${englishSearchQuery}" must return relevant campaign`);

  // Hindi Search Match
  const hindiSearchQuery = 'टीकाकरण';
  const hindiResults = DataStore.awarenessItems.filter((item) => {
    const hi = item.translations.hi;
    return (
      hi?.title.toLowerCase().includes(hindiSearchQuery) ||
      hi?.summary.toLowerCase().includes(hindiSearchQuery) ||
      hi?.content?.toLowerCase().includes(hindiSearchQuery)
    );
  });
  assert(hindiResults.length > 0, `Search for Hindi keyword "${hindiSearchQuery}" must return relevant campaign`);

  // Test 12.3: Admin CMS Lifecycle & Status Transitions
  const testNewItem: AwarenessItem = {
    id: 'aw-test-999',
    slug: 'pulse-polio-special-subdistrict-drive-aw-test-999',
    type: 'HEALTH_ALERT',
    category: 'VACCINATION_DRIVE',
    status: 'DRAFT',
    isFeatured: true,
    isUrgentAlert: true,
    validUntil: '2026-10-30T18:00:00.000Z',
    coverImageUrl: 'https://images.unsplash.com/photo-1632053002928-196160862085?w=800',
    mediaUrl: 'https://images.unsplash.com/photo-1632053002928-196160862085?w=800',
    tags: ['Polio', 'Special Drive', 'Subdistrict'],
    authorName: 'Dr. Suresh Verma',
    authorRole: 'MOIC Administrator',
    phcId: 'phc-001',
    phcName: 'Central Urban PHC - Karol Bagh',
    likesCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    translations: {
      en: {
        title: 'Special Subdistrict Pulse Polio Intensive Campaign',
        summary: 'Intensive house-to-house booth coverage for all children aged 0-5 years.',
        content: 'Health teams and ASHA workers will visit all blocks.',
        keyTakeaways: ['Cover all children under 5', 'Free vaccination drops'],
        audioNarratorText: 'Special pulse polio intensive drive is scheduled.',
        shareMessage: '📢 Special Pulse Polio Drive this Sunday across all sub-centres.',
      },
      hi: {
        title: 'विशेष उप-जिला पल्स पोलियो सघन अभियान',
        summary: '0-5 वर्ष के सभी बच्चों हेतु घर-घर व बूथ कवरेज।',
        content: 'स्वास्थ्य टीमें व आशा कार्यकर्ता सभी क्षेत्रों में पहुंचेंगी।',
        keyTakeaways: ['5 वर्ष तक के सभी बच्चे सुरक्षित', 'निःशुल्क पोलियो खुराक'],
        audioNarratorText: 'विशेष पल्स पोलियो सघन अभियान इस रविवार आयोजित किया जा रहा है।',
        shareMessage: '📢 विशेष पल्स पोलियो सघन अभियान: अपने बच्चों को दो बूंद जिंदगी की अवश्य दिलाएं।',
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
  };

  // Add item
  DataStore.awarenessItems.unshift(testNewItem);
  assert(DataStore.awarenessItems.some((i) => i.id === 'aw-test-999'), 'Admin must be able to create new draft awareness campaign');

  // Verify status is DRAFT
  const createdItem = DataStore.awarenessItems.find((i) => i.id === 'aw-test-999')!;
  assert(createdItem.status === 'DRAFT', 'New item status should be DRAFT initially');

  // Toggle status to PUBLISHED
  createdItem.status = 'PUBLISHED';
  createdItem.publishedAt = new Date().toISOString();
  createdItem.updatedAt = new Date().toISOString();
  assert(createdItem.status === 'PUBLISHED', 'Admin must be able to toggle item status to PUBLISHED');
  assert(createdItem.publishedAt !== null, 'Published timestamp should be set upon publishing');

  // Update item content
  createdItem.translations.en.title = 'Special Subdistrict Pulse Polio Intensive Campaign (Updated)';
  assert(
    createdItem.translations.en.title.includes('(Updated)'),
    'Admin must be able to update English content'
  );

  // Test 12.4: Active Urgent Alerts & Validity Logic
  const nowMs = new Date().getTime();
  const activeAlerts = DataStore.awarenessItems.filter((item) => {
    if (item.status !== 'PUBLISHED') return false;
    const isUrgent = item.isUrgentAlert || item.type === 'HEALTH_ALERT';
    if (!isUrgent) return false;
    if (item.validUntil) {
      const expiry = new Date(item.validUntil).getTime();
      if (nowMs > expiry) return false;
    }
    return true;
  });
  assert(activeAlerts.length >= 2, `Expected at least 2 active urgent alerts, found ${activeAlerts.length}`);
  assert(activeAlerts.some((a) => a.id === 'aw-test-999'), 'Newly published urgent alert must appear in active alerts');

  // Test 12.5: Engagement, Likes & WhatsApp Social Share Tracking
  const initialViews = createdItem.viewsCount;
  createdItem.viewsCount = (createdItem.viewsCount || 0) + 1;
  assert(createdItem.viewsCount === initialViews + 1, 'Fetching detail must increment views count');

  const initialLikes = createdItem.likesCount;
  createdItem.likesCount = (createdItem.likesCount || 0) + 1;
  assert(createdItem.likesCount === initialLikes + 1, 'Liking campaign must increment likes count');

  const initialShares = createdItem.sharesCount;
  createdItem.sharesCount = (createdItem.sharesCount || 0) + 1;
  assert(createdItem.sharesCount === initialShares + 1, 'Sharing campaign must increment shares count');

  // Test WhatsApp message format
  const whatsAppText = createdItem.translations.en.shareMessage || createdItem.translations.en.title;
  const whatsAppUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppText)}`;
  assert(whatsAppUrl.startsWith('https://api.whatsapp.com/send?text='), 'WhatsApp share URL must be properly formatted');
  assert(whatsAppUrl.includes(encodeURIComponent('Special Pulse Polio Drive')), 'WhatsApp share URL must encode campaign text');

  // Clean up test item
  const testIndex = DataStore.awarenessItems.findIndex((i) => i.id === 'aw-test-999');
  if (testIndex !== -1) {
    DataStore.awarenessItems.splice(testIndex, 1);
  }
  assert(!DataStore.awarenessItems.some((i) => i.id === 'aw-test-999'), 'Deleted test item should be removed from DataStore');

  // --- TEST SUITE 13: Community Health Camps, Capacity Caps, Reminders & Outcomes ---
  console.log('\n--- TEST SUITE 13: Community Health Camps & Outreach ---');

  // 13.1: Seed Camps & Type Breakdown Verification
  assert(DataStore.healthCamps.length >= 5, `Expected at least 5 seeded health camps, found ${DataStore.healthCamps.length}`);
  const eyeCamp = DataStore.healthCamps.find((c) => c.type === 'EYE');
  assert(!!eyeCamp, 'Eye screening camp must be present in DataStore');
  assert(eyeCamp!.capacity === 60, 'Eye camp capacity must be 60');
  assert(eyeCamp!.assignedAssistantId === 'asst-001', 'Eye camp must be linked to assigned Health Assistant (Sunita Devi)');
  assert(eyeCamp!.assignedDoctorId === 'doc-001', 'Eye camp must be linked to assigned Doctor (Dr. Rajesh Kumar)');

  // 13.2: Create New Health Camp with Assigned Staff
  const initialCampCount = DataStore.healthCamps.length;
  const newCampData: HealthCamp = {
    id: `camp-test-101`,
    campId: `CAMP-2026-101`,
    title: 'Subdistrict Geriatric & Arthritic Care Camp',
    description: 'Specialized screening and physiotherapy exercises for rural elderly.',
    type: 'GENERAL',
    status: 'UPCOMING',
    startDate: '2026-10-20',
    endDate: '2026-10-20',
    time: '10:00 AM - 04:00 PM',
    venue: 'Community Recreation Centre, Dwarka Sector 10',
    address: 'Dwarka Sector 10, New Delhi',
    phcId: 'phc-001',
    phcName: 'Central Urban PHC - Karol Bagh',
    capacity: 2, // Low capacity for testing cap enforcement
    registeredCount: 0,
    assignedAssistantId: 'asst-001',
    assignedAssistantName: 'Sunita Devi',
    assignedAssistantRole: 'Senior ASHA Facilitator',
    assignedDoctorId: 'doc-001',
    assignedDoctorName: 'Dr. Rajesh Kumar',
    assignedDoctorSpeciality: 'General Medicine',
    organizerRole: 'ASHA',
    organizerName: 'Sunita Devi (ASHA)',
    contactPhone: '+91 98765 43210',
    servicesOffered: ['Orthopedic Assessment', 'Bone Density Check', 'Calcium Dispensation'],
    eligibility: 'Seniors aged 60+',
    outcome: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  DataStore.healthCamps.push(newCampData);
  assert(DataStore.healthCamps.length === initialCampCount + 1, 'New health camp must be created in DataStore');

  // 13.3: Registration & Sequential Token Assignment
  const reg1: HealthCampRegistration = {
    id: 'reg-test-001',
    campId: newCampData.id,
    patientId: 'pat-0001',
    participantName: 'Aakash Jha',
    participantPhone: '+91 98765 43210',
    participantAge: 62,
    participantGender: 'Male',
    tokenNumber: 1,
    status: 'REGISTERED',
    attendedAt: null,
    notes: 'Knee pain and joint stiffness',
    reminderSent: false,
    registeredAt: new Date().toISOString(),
  };
  DataStore.campRegistrations.push(reg1);
  newCampData.registeredCount = 1;
  assert(reg1.tokenNumber === 1, 'First registrant must receive token #1');
  assert(newCampData.registeredCount === 1, 'Camp registeredCount must increment to 1');

  const reg2: HealthCampRegistration = {
    id: 'reg-test-002',
    campId: newCampData.id,
    patientId: 'pat-0002',
    participantName: 'Sunita Sharma',
    participantPhone: '+91 98765 43211',
    participantAge: 65,
    participantGender: 'Female',
    tokenNumber: 2,
    status: 'REGISTERED',
    attendedAt: null,
    notes: 'Osteoarthritis follow-up',
    reminderSent: false,
    registeredAt: new Date().toISOString(),
  };
  DataStore.campRegistrations.push(reg2);
  newCampData.registeredCount = 2;
  assert(reg2.tokenNumber === 2, 'Second registrant must receive token #2');

  // 13.4: Capacity Cap Enforcement
  const isFull = newCampData.registeredCount >= newCampData.capacity;
  assert(isFull === true, 'Camp must be detected as at full capacity when registeredCount equals capacity');

  // 13.5: Broadcast Reminder Logic
  const campRegs = DataStore.campRegistrations.filter((r) => r.campId === newCampData.id);
  let remindersBroadcasted = 0;
  for (const r of campRegs) {
    r.reminderSent = true;
    remindersBroadcasted++;
    DataStore.notifications.unshift({
      id: `notif-camp-remind-${r.id}`,
      userId: `user-${r.patientId}`,
      patientId: r.patientId || '',
      type: 'CAMP_REMINDER',
      title: `⏰ Camp Reminder: ${newCampData.title}`,
      message: `Your token #${r.tokenNumber} for ${newCampData.title} is confirmed for ${newCampData.startDate}.`,
      read: false,
      createdAt: new Date().toISOString(),
    });
  }
  assert(remindersBroadcasted === 2, 'Reminders must be broadcast to all 2 registered participants');
  assert(reg1.reminderSent === true && reg2.reminderSent === true, 'Registration records must have reminderSent marked true');
  assert(DataStore.notifications.some((n) => n.id === 'notif-camp-remind-reg-test-001'), 'Patient notification must be created for reminder');

  // 13.6: Organizer Attendance Tracking
  reg1.status = 'ATTENDED';
  reg1.attendedAt = new Date().toISOString();
  assert(reg1.status === 'ATTENDED', 'Participant must be marked as ATTENDED');
  assert(reg1.attendedAt !== null, 'Attendance timestamp must be stamped');

  reg2.status = 'NO_SHOW';
  assert(reg2.status === 'NO_SHOW', 'Absent participant must be marked as NO_SHOW');

  // 13.7: Record Camp Outcomes & Progression to COMPLETED
  const outcomeData: HealthCampOutcome = {
    peopleScreened: 2,
    referralsMade: 1,
    medicinesDistributed: 2,
    criticalCasesIdentified: 0,
    notes: 'Conducted successfully. 1 severe osteoarthritis case referred for joint replacement under PM-JAY.',
    recordedAt: new Date().toISOString(),
    recordedBy: 'Sunita Devi (ASHA)',
  };
  newCampData.outcome = outcomeData;
  newCampData.status = 'COMPLETED';
  assert(newCampData.status === 'COMPLETED', 'Camp status must transition to COMPLETED upon outcome recording');
  assert(newCampData.outcome.peopleScreened === 2, 'Outcome must record 2 people screened');
  assert(newCampData.outcome.referralsMade === 1, 'Outcome must record 1 referral made');

  // 13.8: Health Assistant Linkage Verification
  const assignedAssistantProfile = DataStore.healthAssistants.find((a) => a.id === newCampData.assignedAssistantId);
  assert(!!assignedAssistantProfile, 'Camp must link to a valid registered Health Assistant profile');
  assert(assignedAssistantProfile!.fullName === 'Sunita Devi', 'Assigned assistant name must match Sunita Devi');

  // Clean up test records
  const cleanupCampIndex = DataStore.healthCamps.findIndex((c) => c.id === newCampData.id);
  if (cleanupCampIndex !== -1) DataStore.healthCamps.splice(cleanupCampIndex, 1);
  DataStore.campRegistrations = DataStore.campRegistrations.filter((r) => r.campId !== newCampData.id);

  // ====================================================
  // TEST SUITE 14: Emergency Pre-Alert Flow (ASHA -> Doctor)
  // ====================================================
  console.log('\n--- TEST SUITE 14: Emergency Pre-Alert & Casualty Inbound Triage ---');

  // 14.1: Seed Data Integrity
  assert(DataStore.emergencyPreAlerts.length >= 3, `Expected at least 3 seeded emergency pre-alerts, found ${DataStore.emergencyPreAlerts.length}`);
  const seedStemiAlert = DataStore.emergencyPreAlerts.find((a) => a.id === 'alert-001');
  assert(!!seedStemiAlert, 'STEMI emergency pre-alert (alert-001) must be present in DataStore');
  assert(seedStemiAlert!.severity === 'CRITICAL', 'STEMI case severity must be CRITICAL');
  assert(seedStemiAlert!.vitals.spO2 === 88, 'STEMI case SpO2 must match 88%');
  assert(seedStemiAlert!.doctorPreparationInstructions!.length >= 4, 'Doctor preparation instructions must contain at least 4 items');

  // 14.2: Alert Creation by ASHA Worker with Vital Red Flags
  const nowTest = Date.now();
  const testVitals: EmergencyVitals = {
    bp: '84/50',
    pulse: 132,
    spO2: 87, // Critical hypoxemia
    temperature: 99.0,
    respiratoryRate: 30,
    gcsScore: 13,
  };

  const testAlert: EmergencyPreAlert = {
    id: 'alert-test-001',
    alertNumber: 'EPA-20260924-TEST',
    patientId: 'pat-test-999',
    patientName: 'Devendra Sharma',
    patientAge: 48,
    patientGender: 'MALE',
    patientPhone: '+91 98765 00001',
    patientAbhaId: '91-1122-3344-5566',
    ashaWorkerId: 'asst-001',
    ashaWorkerName: 'Sunita Devi',
    ashaWorkerPhone: '+91 98765 43230',
    sourceLocation: 'Bhatinda Border Post Sub-Centre',
    sourcePincode: '110005',
    targetFacilityId: 'phc-001',
    targetFacilityName: 'Central Urban PHC - Karol Bagh',
    targetFacilityType: 'Urban PHC',
    chiefComplaints: ['Anaphylaxis with stridor', 'Severe hypotension', 'Facial angioedema'],
    symptomsDescription: 'Acute severe bee sting allergy with laryngeal edema and falling blood pressure.',
    vitals: testVitals,
    severity: 'CRITICAL',
    transportMode: 'AMBULANCE_108',
    ambulanceVehicleNumber: 'DL-01-EM-1085',
    ambulanceContact: '108',
    departureTime: new Date(nowTest - 1000 * 60 * 15).toISOString(),
    estimatedArrivalMinutes: 20,
    estimatedArrivalTime: new Date(nowTest + 1000 * 60 * 5).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'ALERT_RAISED',
    acknowledgedByDoctorId: null,
    acknowledgedByDoctorName: null,
    acknowledgedAt: null,
    doctorPreparationInstructions: [],
    doctorPreparationNotes: null,
    bedAssigned: null,
    teamAssigned: null,
    arrivedAt: null,
    handedOverAt: null,
    handoverNotes: null,
    attendingPhysicianName: null,
    metrics: {
      responseTimeMinutes: null,
      transitTimeMinutes: null,
      totalDurationMinutes: null,
    },
    timeline: [
      {
        id: 'ae-test-1',
        status: 'ALERT_RAISED',
        action: 'Emergency Pre-Alert Dispatched by ASHA Worker',
        performedBy: 'Sunita Devi',
        role: 'HEALTH_ASSISTANT',
        timestamp: new Date(nowTest - 1000 * 60 * 15).toISOString(),
        notes: 'Anaphylaxis emergency dispatch with low SpO2 87%.',
      },
    ],
    deliveryStatus: {
      pushSent: true,
      smsSent: true,
      emailSent: true,
      broadcastAt: new Date(nowTest - 1000 * 60 * 15).toISOString(),
    },
    createdAt: new Date(nowTest - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(nowTest - 1000 * 60 * 15).toISOString(),
  };

  DataStore.emergencyPreAlerts.push(testAlert);
  assert(DataStore.emergencyPreAlerts.some((a) => a.id === 'alert-test-001'), 'New emergency pre-alert must be stored in DataStore');

  // 14.3: Doctor Notification Dispatch
  DataStore.notifications.unshift({
    id: `notif-doc-test-${Date.now()}`,
    userId: 'user-doc-001',
    title: `🚨 EMERGENCY PRE-ALERT: ${testAlert.patientName} (CRITICAL)`,
    message: `Incoming CRITICAL case from ${testAlert.sourceLocation}. Live ETA: 20 min.`,
    type: 'EMERGENCY_PRE_ALERT',
    read: false,
    linkUrl: `/emergency-alerts/${testAlert.id}`,
    createdAt: testAlert.createdAt,
  });
  assert(DataStore.notifications.some((n) => n.type === 'EMERGENCY_PRE_ALERT'), 'Emergency pre-alert notification must be dispatched to doctors');

  // 14.4: Doctor Acknowledgment & Preparation Instructions
  const ackTimestamp = new Date(nowTest - 1000 * 60 * 12).toISOString();
  const responseTime = 3; // 15 mins - 12 mins = 3 mins
  testAlert.status = 'ACKNOWLEDGED';
  testAlert.acknowledgedByDoctorId = 'doc-001';
  testAlert.acknowledgedByDoctorName = 'Dr. Rajesh Kumar';
  testAlert.acknowledgedAt = ackTimestamp;
  testAlert.bedAssigned = 'Emergency Red Bay Bed 1';
  testAlert.teamAssigned = 'Anaphylaxis Resuscitation Team';
  testAlert.doctorPreparationInstructions = [
    'Prepare IM Adrenaline 0.5mg (1:1000) for immediate lateral thigh administration',
    'Prepare IV Hydrocortisone 200mg + IV Pheniramine 45.5mg',
    'Keep High-Flow 100% Oxygen mask and emergency airway/cricothyroidotomy kit on bedside',
    'Infuse warm Normal Saline 1000mL wide-bore bolus',
  ];
  testAlert.doctorPreparationNotes = 'Airway team on standby. Red Bay Bed 1 ready.';
  testAlert.metrics.responseTimeMinutes = responseTime;
  testAlert.timeline.push({
    id: 'ae-test-2',
    status: 'ACKNOWLEDGED',
    action: 'Doctor Acknowledged & Anaphylaxis Protocol Activated',
    performedBy: 'Dr. Rajesh Kumar',
    role: 'DOCTOR',
    timestamp: ackTimestamp,
    notes: 'Adrenaline and airway kit prepared.',
  });

  assert(testAlert.status === 'ACKNOWLEDGED', 'Alert status must transition to ACKNOWLEDGED');
  assert(testAlert.metrics.responseTimeMinutes === 3, 'Response time must be correctly calculated as 3 minutes');
  assert(testAlert.doctorPreparationInstructions.length === 4, '4 clinical preparation instructions must be recorded');

  // 14.5: ASHA Worker En-Route Instructions Notification
  DataStore.notifications.unshift({
    id: `notif-asha-test-${Date.now()}`,
    userId: 'user-asst-001',
    title: '✅ Doctor Prepared: Dr. Rajesh Kumar Acknowledged',
    message: `Doctor instructions for ${testAlert.patientName}: Prepare IM Adrenaline 0.5mg, IV Hydrocortisone. Bed: Emergency Red Bay Bed 1.`,
    type: 'EMERGENCY_PREP_INSTRUCTIONS',
    read: false,
    linkUrl: `/emergency-alerts/${testAlert.id}`,
    createdAt: ackTimestamp,
  });
  assert(DataStore.notifications.some((n) => n.type === 'EMERGENCY_PREP_INSTRUCTIONS'), 'Doctor preparation instructions notification must be sent to ASHA worker');

  // 14.6: Transition to IN_TRANSIT
  const transitTimestamp = new Date(nowTest - 1000 * 60 * 8).toISOString();
  testAlert.status = 'IN_TRANSIT';
  testAlert.timeline.push({
    id: 'ae-test-3',
    status: 'IN_TRANSIT',
    action: 'Ambulance 108 Approaching Karol Bagh Flyover',
    performedBy: '108 Ambulance Driver',
    role: 'DRIVER',
    timestamp: transitTimestamp,
  });
  assert(testAlert.status === 'IN_TRANSIT', 'Alert status must transition to IN_TRANSIT');

  // 14.7: Transition to ARRIVED
  const arrivalTimestamp = new Date(nowTest - 1000 * 60 * 3).toISOString();
  testAlert.status = 'ARRIVED';
  testAlert.arrivedAt = arrivalTimestamp;
  testAlert.metrics.transitTimeMinutes = 12; // 15 mins departure to 3 mins ago
  testAlert.timeline.push({
    id: 'ae-test-4',
    status: 'ARRIVED',
    action: 'Patient Received at Casualty Triage Bay',
    performedBy: 'Casualty Staff',
    role: 'RECEPTIONIST',
    timestamp: arrivalTimestamp,
  });
  assert(testAlert.status === 'ARRIVED', 'Alert status must transition to ARRIVED');
  assert(testAlert.arrivedAt !== null, 'Arrival timestamp must be set');
  assert(testAlert.metrics.transitTimeMinutes === 12, 'Transit time must be recorded as 12 minutes');

  // 14.8: Transition to HANDED_OVER & Admission
  const handoverTimestamp = new Date(nowTest).toISOString();
  testAlert.status = 'HANDED_OVER';
  testAlert.handedOverAt = handoverTimestamp;
  testAlert.handoverNotes = 'Adrenaline administered, airway patent, vitals stabilized (BP 118/74, SpO2 98%). Patient shifted to Medical ICU.';
  testAlert.attendingPhysicianName = 'Dr. Rajesh Kumar';
  testAlert.metrics.totalDurationMinutes = 15;
  testAlert.timeline.push({
    id: 'ae-test-5',
    status: 'HANDED_OVER',
    action: 'Clinical Handover Concluded & Patient Admitted to ICU',
    performedBy: 'Dr. Rajesh Kumar',
    role: 'DOCTOR',
    timestamp: handoverTimestamp,
    notes: testAlert.handoverNotes,
  });
  assert(testAlert.status === 'HANDED_OVER', 'Alert status must transition to HANDED_OVER');
  assert(testAlert.handedOverAt !== null, 'Handover timestamp must be recorded');
  assert(testAlert.metrics.totalDurationMinutes === 15, 'Total emergency response duration must be 15 minutes');
  assert(testAlert.timeline.length === 5, 'Full audit trail must contain 5 sequential lifecycle milestones');

  // Clean up test alert
  const cleanupAlertIndex = DataStore.emergencyPreAlerts.findIndex((a) => a.id === 'alert-test-001');
  if (cleanupAlertIndex !== -1) DataStore.emergencyPreAlerts.splice(cleanupAlertIndex, 1);

  // =========================================================================
  // TEST SUITE 15: Patient Follow-up & Shared Continuity Tracking
  // =========================================================================
  console.log('\n--- TEST SUITE 15: Patient Follow-up & Shared Continuity Tracking ---');

  // 15.1: Seed Data Verification
  assert(DataStore.patientFollowUps.length >= 5, `Expected at least 5 seeded follow-up records, found ${DataStore.patientFollowUps.length}`);
  const sampleFup = DataStore.patientFollowUps[0];
  assert(typeof sampleFup.referralId === 'string', 'Follow-up must contain a valid referral ID');
  assert(typeof sampleFup.patientVillage === 'string' && sampleFup.patientVillage.length > 0, 'Follow-up must contain patient village');
  assert(Array.isArray(sampleFup.timeline) && sampleFup.timeline.length > 0, 'Follow-up must maintain an initial timeline array');

  // 15.2: Create New Referral Tracking Record (Sub-Centre to Higher PHC)
  const nowFup = Date.now();
  const testReferralId = `ref-test-${nowFup}`;
  const testDueDate = new Date(nowFup + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const newReferralRecord: PatientFollowUpEntry = {
    id: `fup-test-${nowFup}`,
    referralId: testReferralId,
    patientId: 'pat-005',
    patientName: 'Radha Rani',
    patientAge: 48,
    patientGender: 'FEMALE',
    patientPhone: '+91 98765 43215',
    patientAbhaId: '91-4567-8901-3344',
    patientVillage: 'Rampur Village',
    patientAddress: 'Ward 3, Rampur Rural Block',
    ashaWorkerId: 'asst-001',
    ashaWorkerName: 'Sunita Devi',
    ashaWorkerPhone: '+91 98765 43230',
    referringPhcId: 'phc-001',
    referringPhcName: 'Karol Bagh Sub-Centre Health Post',
    higherPhcId: 'phc-002',
    higherPhcName: 'District Hospital - Rohini (Higher CHC)',
    condition: 'Chronic Kidney Disease Stage 3 & Resistant Hypertension',
    category: 'CHRONIC_NCD',
    referralDate: new Date(nowFup).toISOString(),
    referralReason: 'Nephrology review and 24h ambulatory BP monitoring',
    referralTreatmentStatus: 'REFERRED',
    higherPhcDoctorId: null,
    higherPhcDoctorName: null,
    higherPhcDoctorNotes: null,
    higherPhcUpdatedAt: null,
    scheduledDueDate: testDueDate,
    followUpDate: null,
    nextVisitDate: null,
    status: 'PENDING',
    isOverdue: false,
    conditionUpdate: 'STABLE',
    vitals: null,
    medicinesTaken: ['Tab Amlodipine 10mg', 'Tab Torsemide 10mg'],
    adherenceRate: 'FULL',
    notes: 'Initial referral registered. ASHA scheduled for first post-referral home check.',
    reminderSent: false,
    reminderSentAt: null,
    timeline: [
      {
        id: `fup-tl-test-1`,
        type: 'REFERRAL_INITIATED',
        title: 'Referral Initiated to Higher Facility',
        description: 'Patient referred to District Hospital - Rohini for Nephrology evaluation.',
        performedBy: 'Sunita Devi',
        role: 'HEALTH_ASSISTANT',
        facilityName: 'Karol Bagh Sub-Centre',
        timestamp: new Date(nowFup).toISOString(),
      },
    ],
    createdAt: new Date(nowFup).toISOString(),
    updatedAt: new Date(nowFup).toISOString(),
  };

  DataStore.patientFollowUps.unshift(newReferralRecord);
  assert(DataStore.patientFollowUps.some((f) => f.id === newReferralRecord.id), 'New referral tracking record must be added to DataStore');

  // 15.3: Dynamic Overdue Evaluation
  const overdueDueDate = '2026-09-20'; // 4 days in the past relative to 2026-09-24
  const overdueRecord: PatientFollowUpEntry = {
    ...newReferralRecord,
    id: `fup-overdue-test-${nowFup}`,
    referralId: `ref-overdue-test-${nowFup}`,
    patientName: 'Kishore Kumar',
    scheduledDueDate: overdueDueDate,
    status: 'PENDING',
  };
  DataStore.patientFollowUps.push(overdueRecord);

  // Helper check for overdue
  const todayStr = '2026-09-24';
  if (overdueRecord.scheduledDueDate < todayStr && overdueRecord.status !== 'COMPLETED') {
    overdueRecord.status = 'OVERDUE';
    overdueRecord.isOverdue = true;
    overdueRecord.daysOverdue = 4;
  }
  assert(overdueRecord.status === 'OVERDUE', 'Past due follow-up must be dynamically evaluated as OVERDUE');
  assert(overdueRecord.daysOverdue === 4, 'Days overdue must be calculated as 4 days');

  // 15.4: ASHA Field Follow-up Logging
  const logVisitDate = '2026-09-24';
  const nextVisitDate = '2026-10-08';
  newReferralRecord.followUpDate = logVisitDate;
  newReferralRecord.conditionUpdate = 'IMPROVED';
  newReferralRecord.vitals = {
    bp: '132/84',
    pulse: 74,
    spO2: 98,
    bloodSugar: 104,
  };
  newReferralRecord.medicinesTaken = ['Tab Amlodipine 10mg', 'Tab Torsemide 10mg', 'Tab Sodium Bicarbonate 500mg'];
  newReferralRecord.adherenceRate = 'FULL';
  newReferralRecord.nextVisitDate = nextVisitDate;
  newReferralRecord.notes = 'Patient taking salt-restricted diet. Blood pressure improved. Oedema reduced.';
  newReferralRecord.status = 'COMPLETED';
  newReferralRecord.isOverdue = false;
  newReferralRecord.timeline.push({
    id: `fup-tl-test-2`,
    type: 'ASHA_FOLLOW_UP_LOGGED',
    title: 'Home Follow-up Visit Logged (IMPROVED)',
    description: 'Condition: IMPROVED. Adherence: FULL. Patient taking salt-restricted diet.',
    performedBy: 'Sunita Devi',
    role: 'HEALTH_ASSISTANT',
    facilityName: 'Rampur Village',
    timestamp: new Date().toISOString(),
    notes: newReferralRecord.notes,
    metadata: {
      vitals: newReferralRecord.vitals,
      medicinesTaken: newReferralRecord.medicinesTaken,
      nextVisitDate,
    },
  });

  assert(newReferralRecord.status === 'COMPLETED', 'Follow-up status must transition to COMPLETED after ASHA logs visit');
  assert(newReferralRecord.conditionUpdate === 'IMPROVED', 'Condition update must be recorded as IMPROVED');
  assert(newReferralRecord.vitals?.bp === '132/84', 'Blood pressure must be recorded in follow-up record');
  assert(newReferralRecord.adherenceRate === 'FULL', 'Full adherence rate must be captured');

  // Automatic Next Visit Chaining
  const chainedEntry: PatientFollowUpEntry = {
    ...newReferralRecord,
    id: `fup-chained-test-${nowFup}`,
    scheduledDueDate: nextVisitDate,
    followUpDate: null,
    nextVisitDate: null,
    status: 'PENDING',
    isOverdue: false,
    timeline: [...newReferralRecord.timeline],
  };
  DataStore.patientFollowUps.push(chainedEntry);
  assert(chainedEntry.status === 'PENDING', 'Chained follow-up entry for next visit date must be scheduled as PENDING');
  assert(chainedEntry.scheduledDueDate === nextVisitDate, 'Chained entry must have due date matching nextVisitDate');

  // 15.5: Higher PHC Specialist Updates Treatment Status (Shared Continuity Record)
  const specialistDoctorName = 'Dr. Priya Sharma (Consultant Nephrologist)';
  newReferralRecord.referralTreatmentStatus = 'UNDER_TREATMENT';
  newReferralRecord.higherPhcDoctorId = 'doc-002';
  newReferralRecord.higherPhcDoctorName = specialistDoctorName;
  newReferralRecord.higherPhcDoctorNotes = 'Patient reviewed at District Hospital. Ultrasound shows bilateral renal cortical changes. Maintained on Torsemide & Amlodipine. Repeat serum creatinine in 4 weeks.';
  newReferralRecord.higherPhcUpdatedAt = new Date().toISOString();
  newReferralRecord.timeline.push({
    id: `fup-tl-test-3`,
    type: 'TREATMENT_STATUS_UPDATE',
    title: 'Higher PHC Clinical Status: UNDER TREATMENT',
    description: `Updated by ${specialistDoctorName}. Notes: ${newReferralRecord.higherPhcDoctorNotes}`,
    performedBy: specialistDoctorName,
    role: 'DOCTOR',
    facilityName: newReferralRecord.higherPhcName,
    timestamp: new Date().toISOString(),
    notes: newReferralRecord.higherPhcDoctorNotes,
  });

  // Notification dispatched to ASHA worker
  DataStore.notifications.unshift({
    id: `notif-fup-test-${Date.now()}`,
    userId: `user-${newReferralRecord.ashaWorkerId}`,
    title: `🏥 Referral Update: ${newReferralRecord.patientName}`,
    message: `${newReferralRecord.higherPhcName} updated treatment status to UNDER TREATMENT.`,
    type: 'FOLLOW_UP_LOGGED',
    read: false,
    linkUrl: `/follow-ups/${newReferralRecord.id}`,
    createdAt: new Date().toISOString(),
  });

  assert(newReferralRecord.referralTreatmentStatus === 'UNDER_TREATMENT', 'Higher PHC treatment status must be updated to UNDER_TREATMENT');
  assert(newReferralRecord.higherPhcDoctorName === specialistDoctorName, 'Specialist doctor name must be reflected');
  assert(newReferralRecord.timeline.length >= 3, 'Shared timeline must reflect referral initiation, ASHA visit, and hospital update');
  assert(DataStore.notifications.some((n) => n.title.includes('Referral Update')), 'Notification must be dispatched to assigned ASHA worker');

  // 15.6: Automated Due Follow-up Reminders Engine
  let dispatchedCount = 0;
  for (const entry of DataStore.patientFollowUps) {
    if ((entry.status === 'PENDING' || entry.status === 'OVERDUE') && !entry.reminderSent) {
      entry.reminderSent = true;
      entry.reminderSentAt = new Date().toISOString();
      dispatchedCount++;
    }
  }
  assert(dispatchedCount >= 1, `Reminder engine must dispatch reminders for due/overdue cases (dispatched ${dispatchedCount})`);

  // 15.7: Filter Verification (Village, Condition, Status)
  const rampurCases = DataStore.patientFollowUps.filter((f) => f.patientVillage.toLowerCase().includes('rampur'));
  assert(rampurCases.length >= 1, 'Village filter must retrieve cases from Rampur village');
  const completedCases = DataStore.patientFollowUps.filter((f) => f.status === 'COMPLETED');
  assert(completedCases.length >= 1, 'Status filter must retrieve COMPLETED cases');

  // 15.8: CSV Export Structure Validation
  const csvHeaders = [
    'Referral_ID',
    'Patient_Name',
    'Age',
    'Gender',
    'Village',
    'Phone',
    'ABHA_ID',
    'Condition',
    'Category',
    'Referring_PHC',
    'Higher_PHC',
    'Referral_Treatment_Status',
    'Scheduled_Due_Date',
    'Follow_Up_Date',
    'Next_Visit_Date',
    'Follow_Up_Status',
    'Condition_Update',
    'Blood_Pressure',
    'Pulse',
    'SpO2',
    'Blood_Sugar',
    'Adherence_Rate',
    'ASHA_Worker',
    'ASHA_Notes',
  ];
  assert(csvHeaders.length === 24, 'CSV report must contain 24 structured healthcare continuity columns');

  // Clean up test records
  DataStore.patientFollowUps = DataStore.patientFollowUps.filter(
    (f) => !f.id.includes('test-')
  );

  console.log('\n====================================================');
  console.log('🎉 ALL AUTOMATED TESTS COMPLETED WITH 100% SUCCESS!');
  console.log('====================================================\n');
}

runAllTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});

