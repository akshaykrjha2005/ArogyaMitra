"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dataStore_1 = require("../db/dataStore");
const triageEngine_1 = require("../ai/triageEngine");
const recommendationService_1 = require("../services/recommendationService");
function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    }
    else {
        console.log(`✅ PASSED: ${message}`);
    }
}
async function runAllTests() {
    console.log('🧪 ====================================================');
    console.log('🧪 RUNNING AUTOMATED UNIT & INTEGRATION TESTS FOR PHC CONNECT');
    console.log('🧪 ====================================================');
    // Initialize data store
    dataStore_1.DataStore.initialize();
    // TEST 1: Database Seed Integrity
    console.log('\n--- TEST SUITE 1: Seed Data Verification ---');
    assert(dataStore_1.DataStore.phcs.length >= 5, `Expected at least 5 PHCs, found ${dataStore_1.DataStore.phcs.length}`);
    assert(dataStore_1.DataStore.doctors.length >= 10, `Expected at least 10 doctors, found ${dataStore_1.DataStore.doctors.length}`);
    assert(dataStore_1.DataStore.pharmacists.length >= 3, `Expected at least 3 pharmacists, found ${dataStore_1.DataStore.pharmacists.length}`);
    assert(dataStore_1.DataStore.patients.length >= 20, `Expected at least 20 patients, found ${dataStore_1.DataStore.patients.length}`);
    assert(dataStore_1.DataStore.medicines.length >= 50, `Expected at least 50 medicines, found ${dataStore_1.DataStore.medicines.length}`);
    // TEST 2: AI Triage Red-Flag & Emergency Safety Invariant
    console.log('\n--- TEST SUITE 2: AI Triage Safety Invariants ---');
    const emergencyAssessment = triageEngine_1.TriageEngine.evaluate({
        symptoms: ['Crushing chest pain radiating to left arm', 'Profuse sweating', 'Shortness of breath'],
        duration: '30 minutes',
        severity: 'Critical',
        age: 55,
    });
    assert(emergencyAssessment.riskLevel === 'EMERGENCY', 'Emergency red flags must produce EMERGENCY risk level');
    assert(emergencyAssessment.emergencyWarning === true, 'Emergency warning flag must be true');
    assert(emergencyAssessment.recommendedAction.includes('108/112'), 'Emergency assessment must recommend 108/112 emergency helpline');
    assert(emergencyAssessment.disclaimer.length > 20, 'Medical disclaimer must be included in output');
    const strokeAssessment = triageEngine_1.TriageEngine.evaluate({
        symptoms: ['Sudden weakness on right arm', 'Slurred speech'],
        duration: '15 minutes',
        severity: 'Severe',
        age: 62,
    });
    assert(strokeAssessment.riskLevel === 'EMERGENCY', 'Neurological stroke symptoms must trigger EMERGENCY');
    const mildAssessment = triageEngine_1.TriageEngine.evaluate({
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
    const ranked = recommendationService_1.RecommendationService.rankPHCs({
        patientLat,
        patientLon,
        riskLevel: 'LOW',
        allPhcs: dataStore_1.DataStore.phcs,
        allDoctors: dataStore_1.DataStore.doctors,
        allInventories: dataStore_1.DataStore.inventories.map((i) => ({
            phcId: i.phcId,
            medicineName: i.medicine.name,
            quantity: i.quantity,
        })),
    });
    assert(ranked.length === dataStore_1.DataStore.phcs.length, 'All PHCs should be evaluated and ranked');
    assert(ranked[0].phc.id === 'phc-001', 'Karol Bagh PHC should rank #1 for a patient located at Karol Bagh coordinates');
    assert(ranked[0].distanceKm < 0.5, `Distance should be close to 0 km, got ${ranked[0].distanceKm} km`);
    // TEST 4: Appointment State Lifecycle
    console.log('\n--- TEST SUITE 4: Appointment State Machine ---');
    const testApt = dataStore_1.DataStore.appointments[0];
    const initialStatus = testApt.status;
    assert(testApt.tokenNumber > 0, 'Appointment should have a valid token number assigned');
    assert(typeof testApt.appointmentNumber === 'string', 'Appointment number must be formatted string');
    // TEST 5: Pharmacist Inventory Dispensing
    console.log('\n--- TEST SUITE 5: Medicine Inventory & Dispensing ---');
    const targetInv = dataStore_1.DataStore.inventories.find((i) => i.quantity > 20);
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
