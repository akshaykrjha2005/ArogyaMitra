"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dataStore_1 = require("../db/dataStore");
async function main() {
    console.log('🌱 Starting PHC Connect realistic seed script...');
    dataStore_1.DataStore.initialize();
    console.log(`✅ Seeded ${dataStore_1.DataStore.phcs.length} Primary Health Centres (PHCs / CHCs)`);
    console.log(`✅ Seeded ${dataStore_1.DataStore.doctors.length} Doctors across General Medicine, Pediatrics, Gynae, Dermatology, Ayush`);
    console.log(`✅ Seeded ${dataStore_1.DataStore.pharmacists.length} Registered Pharmacists`);
    console.log(`✅ Seeded ${dataStore_1.DataStore.admins.length} PHC Medical Officers In-Charge / Admins`);
    console.log(`✅ Seeded ${dataStore_1.DataStore.patients.length} Registered Patients with EHRs, allergies, and comorbidities`);
    console.log(`✅ Seeded ${dataStore_1.DataStore.medicines.length} Essential Formulary Medicines`);
    console.log(`✅ Seeded ${dataStore_1.DataStore.inventories.length} PHC Inventory Batches`);
    console.log(`✅ Seeded ${dataStore_1.DataStore.appointments.length} Appointments across life-cycle states`);
    console.log(`✅ Seeded ${dataStore_1.DataStore.medicalRecords.length} Clinical Electronic Health Records`);
    console.log('🎉 Seed completed successfully!');
}
main().catch((e) => {
    console.error('Error running seed:', e);
    process.exit(1);
});
