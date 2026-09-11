import { DataStore } from '../db/dataStore';

async function main() {
  console.log('🌱 Starting PHC Connect realistic seed script...');
  DataStore.initialize();

  console.log(`✅ Seeded ${DataStore.phcs.length} Primary Health Centres (PHCs / CHCs)`);
  console.log(`✅ Seeded ${DataStore.doctors.length} Doctors across General Medicine, Pediatrics, Gynae, Dermatology, Ayush`);
  console.log(`✅ Seeded ${DataStore.pharmacists.length} Registered Pharmacists`);
  console.log(`✅ Seeded ${DataStore.admins.length} PHC Medical Officers In-Charge / Admins`);
  console.log(`✅ Seeded ${DataStore.patients.length} Registered Patients with EHRs, allergies, and comorbidities`);
  console.log(`✅ Seeded ${DataStore.medicines.length} Essential Formulary Medicines`);
  console.log(`✅ Seeded ${DataStore.inventories.length} PHC Inventory Batches`);
  console.log(`✅ Seeded ${DataStore.appointments.length} Appointments across life-cycle states`);
  console.log(`✅ Seeded ${DataStore.medicalRecords.length} Clinical Electronic Health Records`);
  console.log('🎉 Seed completed successfully!');
}

main().catch((e) => {
  console.error('Error running seed:', e);
  process.exit(1);
});
