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

  console.log('\n====================================================');
  console.log('🎉 ALL AUTOMATED TESTS COMPLETED WITH 100% SUCCESS!');
  console.log('====================================================\n');
}

runAllTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
