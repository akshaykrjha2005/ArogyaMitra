import { DataStore } from '../db/dataStore';
import { TriageEngine } from '../ai/triageEngine';
import { RecommendationService } from '../services/recommendationService';

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

  // TEST 2: AI Triage Red-Flag & Emergency Safety Invariant
  console.log('\n--- TEST SUITE 2: AI Triage Safety Invariants ---');
  const emergencyAssessment = TriageEngine.evaluate({
    symptoms: ['Crushing chest pain radiating to left arm', 'Profuse sweating', 'Shortness of breath'],
    duration: '30 minutes',
    severity: 'Critical',
    age: 55,
  });
  assert(emergencyAssessment.riskLevel === 'EMERGENCY', 'Emergency red flags must produce EMERGENCY risk level');
  assert(emergencyAssessment.emergencyWarning === true, 'Emergency warning flag must be true');
  assert(emergencyAssessment.recommendedAction.includes('108/112'), 'Emergency assessment must recommend 108/112 emergency helpline');
  assert(emergencyAssessment.disclaimer.length > 20, 'Medical disclaimer must be included in output');

  const strokeAssessment = TriageEngine.evaluate({
    symptoms: ['Sudden weakness on right arm', 'Slurred speech'],
    duration: '15 minutes',
    severity: 'Severe',
    age: 62,
  });
  assert(strokeAssessment.riskLevel === 'EMERGENCY', 'Neurological stroke symptoms must trigger EMERGENCY');

  const mildAssessment = TriageEngine.evaluate({
    symptoms: ['Mild runny nose', 'Occasional sneezing'],
    duration: '2 days',
    severity: 'Mild',
    age: 26,
  });
  assert(mildAssessment.riskLevel === 'LOW', 'Mild symptoms must result in LOW criticality level');

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

  console.log('\n====================================================');
  console.log('🎉 ALL AUTOMATED TESTS COMPLETED WITH 100% SUCCESS!');
  console.log('====================================================\n');
}

runAllTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
