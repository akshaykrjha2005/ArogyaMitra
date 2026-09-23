import {
  User,
  PatientProfile,
  DoctorProfile,
  PharmacistProfile,
  AdminProfile,
  ReceptionistProfile,
  PreConsultationCheckup,
  PHC,
  Appointment,
  MedicalRecord,
  Medicine,
  MedicineInventory,
  MedicineTransaction,
  SymptomAssessment,
  Notification,
} from '@phc-connect/types';

export class DataStore {
  public static users: User[] = [];
  public static patients: PatientProfile[] = [];
  public static doctors: DoctorProfile[] = [];
  public static pharmacists: PharmacistProfile[] = [];
  public static admins: AdminProfile[] = [];
  public static receptionists: ReceptionistProfile[] = [];
  public static preConsultations: PreConsultationCheckup[] = [];
  public static phcs: PHC[] = [];
  public static appointments: Appointment[] = [];
  public static medicalRecords: MedicalRecord[] = [];
  public static medicines: Medicine[] = [];
  public static inventories: MedicineInventory[] = [];
  public static transactions: MedicineTransaction[] = [];
  public static symptomAssessments: SymptomAssessment[] = [];
  public static notifications: Notification[] = [];

  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;

    // 1. SEED PHCs
    this.phcs = [
      {
        id: 'phc-001',
        code: 'PHC-DL-001',
        name: 'Central Urban PHC - Karol Bagh',
        type: 'Urban PHC',
        address: 'Sector 4, Main Road, Karol Bagh',
        district: 'Central Delhi',
        state: 'Delhi',
        pincode: '110005',
        latitude: 28.6448,
        longitude: 77.1878,
        phone: '+91 11 2572 4012',
        email: 'karolbagh.phc@health.gov.in',
        openingHours: '08:00 AM - 08:00 PM (OPD)',
        emergencyServices: true,
        totalBeds: 12,
        departments: ['General Medicine', 'Pediatrics', 'Immunization', 'Pharmacy', 'Diagnostic Lab'],
      },
      {
        id: 'phc-002',
        code: 'CHC-DL-002',
        name: 'Suburban Community Health Centre - Rohini',
        type: 'Community Health Centre (CHC)',
        address: 'Sector 14, Institutional Area, Rohini',
        district: 'North West Delhi',
        state: 'Delhi',
        pincode: '110085',
        latitude: 28.7159,
        longitude: 77.1158,
        phone: '+91 11 2755 8900',
        email: 'rohini.chc@health.gov.in',
        openingHours: '24 Hours Emergency & Day OPD',
        emergencyServices: true,
        totalBeds: 30,
        departments: ['Emergency Trauma', 'General Medicine', 'Gynecology & Obstetrics', 'Pediatrics', 'Minor OT', 'X-Ray & Lab'],
      },
      {
        id: 'phc-003',
        code: 'PHC-DL-003',
        name: 'Model Rural PHC - Najafgarh',
        type: 'Rural PHC',
        address: 'Village Chowk, Najafgarh Rural Belt',
        district: 'South West Delhi',
        state: 'Delhi',
        pincode: '110043',
        latitude: 28.6139,
        longitude: 76.9827,
        phone: '+91 11 2801 3341',
        email: 'najafgarh.phc@health.gov.in',
        openingHours: '09:00 AM - 05:00 PM',
        emergencyServices: false,
        totalBeds: 6,
        departments: ['General Medicine', 'Maternal & Child Health', 'Ayush Wellness', 'Vaccination'],
      },
      {
        id: 'phc-004',
        code: 'PHC-DL-004',
        name: 'East District PHC - Laxmi Nagar',
        type: 'Urban PHC',
        address: 'Block B, Vikas Marg, Laxmi Nagar',
        district: 'East Delhi',
        state: 'Delhi',
        pincode: '110092',
        latitude: 28.6315,
        longitude: 77.2773,
        phone: '+91 11 2245 6780',
        email: 'laxminagar.phc@health.gov.in',
        openingHours: '08:30 AM - 04:30 PM',
        emergencyServices: false,
        totalBeds: 8,
        departments: ['General Medicine', 'Dermatology', 'Geriatric Care', 'Pharmacy'],
      },
      {
        id: 'phc-005',
        code: 'PHC-DL-005',
        name: 'South Extension Health Centre',
        type: 'Urban PHC',
        address: 'Ring Road, Part 1, South Extension',
        district: 'South Delhi',
        state: 'Delhi',
        pincode: '110049',
        latitude: 28.5684,
        longitude: 77.2217,
        phone: '+91 11 2461 9920',
        email: 'southext.phc@health.gov.in',
        openingHours: '08:00 AM - 06:00 PM',
        emergencyServices: true,
        totalBeds: 10,
        departments: ['Family Medicine', 'Non-Communicable Diseases (NCD)', 'Physiotherapy', 'Pathology'],
      },
    ];

    // 2. SEED USERS & DOCTORS
    const doctorSeedData = [
      {
        docId: 'doc-001',
        userId: 'user-doc-001',
        doctorId: 'PHC-DOC-101',
        name: 'Dr. Rajesh Verma',
        email: 'dr.verma@phc.gov.in',
        phone: '+91 98111 00101',
        qualification: 'MBBS, MD (General Medicine)',
        specialization: 'General Medicine',
        exp: 12,
        phcId: 'phc-001',
        hours: '08:30 AM - 02:30 PM',
        status: 'AVAILABLE' as const,
        room: 'OPD Room 1',
      },
      {
        docId: 'doc-002',
        userId: 'user-doc-002',
        doctorId: 'PHC-DOC-102',
        name: 'Dr. Priya Sharma',
        email: 'dr.priya@phc.gov.in',
        phone: '+91 98111 00102',
        qualification: 'MBBS, DCH (Pediatrics)',
        specialization: 'Pediatrics',
        exp: 8,
        phcId: 'phc-001',
        hours: '09:00 AM - 03:00 PM',
        status: 'AVAILABLE' as const,
        room: 'OPD Room 3 (Child Health)',
      },
      {
        docId: 'doc-003',
        userId: 'user-doc-003',
        doctorId: 'PHC-DOC-103',
        name: 'Dr. Ananya Iyer',
        email: 'dr.ananya@phc.gov.in',
        phone: '+91 98111 00103',
        qualification: 'MBBS, MS (Obstetrics & Gynaecology)',
        specialization: 'Gynecology & Obstetrics',
        exp: 10,
        phcId: 'phc-002',
        hours: '08:00 AM - 04:00 PM',
        status: 'AVAILABLE' as const,
        room: 'MCH Block Room 102',
      },
      {
        docId: 'doc-004',
        userId: 'user-doc-004',
        doctorId: 'PHC-DOC-104',
        name: 'Dr. Amit Deshmukh',
        email: 'dr.amit@phc.gov.in',
        phone: '+91 98111 00104',
        qualification: 'MBBS, MEM (Emergency Medicine)',
        specialization: 'Emergency Medicine',
        exp: 9,
        phcId: 'phc-002',
        hours: '24x7 Shift Rotation',
        status: 'AVAILABLE' as const,
        room: 'Emergency Triage Bay',
      },
      {
        docId: 'doc-005',
        userId: 'user-doc-005',
        doctorId: 'PHC-DOC-105',
        name: 'Dr. Sunita Patel',
        email: 'dr.sunita@phc.gov.in',
        phone: '+91 98111 00105',
        qualification: 'MBBS, MD (Community Medicine)',
        specialization: 'Community Medicine & Public Health',
        exp: 14,
        phcId: 'phc-003',
        hours: '09:00 AM - 04:00 PM',
        status: 'AVAILABLE' as const,
        room: 'Consultation Room 1',
      },
      {
        docId: 'doc-006',
        userId: 'user-doc-006',
        doctorId: 'PHC-DOC-106',
        name: 'Dr. Meenakshi Sundaram',
        email: 'dr.meenakshi@phc.gov.in',
        phone: '+91 98111 00106',
        qualification: 'BAMS, MD (Ayurveda / Integrative Care)',
        specialization: 'Ayush & Integrative Medicine',
        exp: 7,
        phcId: 'phc-003',
        hours: '10:00 AM - 04:00 PM',
        status: 'BUSY' as const,
        room: 'Ayush Wellness Room',
      },
      {
        docId: 'doc-007',
        userId: 'user-doc-007',
        doctorId: 'PHC-DOC-107',
        name: 'Dr. Vikram Malhotra',
        email: 'dr.vikram@phc.gov.in',
        phone: '+91 98111 00107',
        qualification: 'MBBS, DVD (Dermatology)',
        specialization: 'Dermatology & Skin',
        exp: 11,
        phcId: 'phc-004',
        hours: '09:00 AM - 02:00 PM',
        status: 'AVAILABLE' as const,
        room: 'Specialist Clinic Room 2',
      },
      {
        docId: 'doc-008',
        userId: 'user-doc-008',
        doctorId: 'PHC-DOC-108',
        name: 'Dr. Arvind Swaminathan',
        email: 'dr.arvind@phc.gov.in',
        phone: '+91 98111 00108',
        qualification: 'MBBS (General Practitioner)',
        specialization: 'General Medicine',
        exp: 6,
        phcId: 'phc-004',
        hours: '08:30 AM - 03:30 PM',
        status: 'AVAILABLE' as const,
        room: 'OPD Room 1',
      },
      {
        docId: 'doc-009',
        userId: 'user-doc-009',
        doctorId: 'PHC-DOC-109',
        name: 'Dr. Rohan Saxena',
        email: 'dr.rohan@phc.gov.in',
        phone: '+91 98111 00109',
        qualification: 'MBBS, DNB (Family Medicine)',
        specialization: 'Family Medicine & NCDs',
        exp: 13,
        phcId: 'phc-005',
        hours: '08:00 AM - 02:00 PM',
        status: 'AVAILABLE' as const,
        room: 'Room 101',
      },
      {
        docId: 'doc-010',
        userId: 'user-doc-010',
        doctorId: 'PHC-DOC-110',
        name: 'Dr. Neha Kapoor',
        email: 'dr.neha@phc.gov.in',
        phone: '+91 98111 00110',
        qualification: 'MBBS, MD (Internal Medicine)',
        specialization: 'Internal Medicine',
        exp: 15,
        phcId: 'phc-005',
        hours: '12:00 PM - 06:00 PM',
        status: 'BUSY' as const,
        room: 'Room 104',
      },
    ];

    for (const d of doctorSeedData) {
      this.users.push({
        id: d.userId,
        email: d.email,
        phone: d.phone,
        role: 'DOCTOR',
        fullName: d.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const phc = this.phcs.find((p) => p.id === d.phcId);
      this.doctors.push({
        id: d.docId,
        userId: d.userId,
        doctorId: d.doctorId,
        fullName: d.name,
        email: d.email,
        phone: d.phone,
        qualification: d.qualification,
        specialization: d.specialization,
        yearsOfExperience: d.exp,
        phcId: d.phcId,
        phcName: phc?.name || 'Primary Health Centre',
        workingHours: d.hours,
        status: d.status,
        roomNumber: d.room,
        avatarUrl: `https://images.unsplash.com/photo-${1559839734 + d.exp}?w=150&auto=format&fit=crop&q=80`,
        rating: 4.8 + (d.exp % 3) * 0.05,
        createdAt: new Date().toISOString(),
      });
    }

    // 3. SEED PHARMACISTS
    const pharmacistSeedData = [
      {
        pharmId: 'pharm-001',
        userId: 'user-pharm-001',
        pharmacistId: 'PHC-PHARM-201',
        name: 'Ramesh Kumar (Pharmacist)',
        email: 'pharmacist.karolbagh@phc.gov.in',
        phone: '+91 98222 00201',
        phcId: 'phc-001',
        license: 'DL-PHARM-2015-8832',
      },
      {
        pharmId: 'pharm-002',
        userId: 'user-pharm-002',
        pharmacistId: 'PHC-PHARM-202',
        name: 'Suresh Pillai (Lead Pharmacist)',
        email: 'pharmacist.rohini@phc.gov.in',
        phone: '+91 98222 00202',
        phcId: 'phc-002',
        license: 'DL-PHARM-2012-9901',
      },
      {
        pharmId: 'pharm-003',
        userId: 'user-pharm-003',
        pharmacistId: 'PHC-PHARM-203',
        name: 'Kavita Sen (Pharmacist)',
        email: 'pharmacist.najafgarh@phc.gov.in',
        phone: '+91 98222 00203',
        phcId: 'phc-003',
        license: 'DL-PHARM-2018-4412',
      },
    ];

    for (const p of pharmacistSeedData) {
      this.users.push({
        id: p.userId,
        email: p.email,
        phone: p.phone,
        role: 'PHARMACIST',
        fullName: p.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const phc = this.phcs.find((ph) => ph.id === p.phcId);
      this.pharmacists.push({
        id: p.pharmId,
        userId: p.userId,
        pharmacistId: p.pharmacistId,
        fullName: p.name,
        email: p.email,
        phone: p.phone,
        phcId: p.phcId,
        phcName: phc?.name,
        licenseNumber: p.license,
        createdAt: new Date().toISOString(),
      });
    }

    // 4. SEED ADMINS
    const adminSeedData = [
      {
        adminId: 'admin-001',
        userId: 'user-admin-001',
        name: 'Dr. Harish Chandra (MOIC)',
        email: 'admin.karolbagh@phc.gov.in',
        phone: '+91 98333 00301',
        phcId: 'phc-001',
        designation: 'Medical Officer In-Charge & PHC Administrator',
      },
      {
        adminId: 'admin-002',
        userId: 'user-admin-002',
        name: 'Dr. Shalini Mukherji (Superintendent)',
        email: 'admin.rohini@phc.gov.in',
        phone: '+91 98333 00302',
        phcId: 'phc-002',
        designation: 'Chief Medical Superintendent',
      },
    ];

    for (const a of adminSeedData) {
      this.users.push({
        id: a.userId,
        email: a.email,
        phone: a.phone,
        role: 'ADMIN',
        fullName: a.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const phc = this.phcs.find((ph) => ph.id === a.phcId);
      this.admins.push({
        id: a.adminId,
        userId: a.userId,
        fullName: a.name,
        email: a.email,
        phone: a.phone,
        phcId: a.phcId,
        phcName: phc?.name,
        designation: a.designation,
        createdAt: new Date().toISOString(),
      });
    }

    // 4b. SEED RECEPTIONISTS
    const receptionistSeedData = [
      {
        recId: 'rec-001',
        userId: 'user-rec-001',
        receptionistId: 'PHC-REC-001',
        name: 'Pooja Sharma',
        email: 'receptionist.karolbagh@phc.gov.in',
        phone: '+91 98444 00401',
        phcId: 'phc-001',
        counterNumber: 'Front Desk Counter 1',
        shift: 'Morning (08:00 AM - 02:00 PM)',
      },
      {
        recId: 'rec-002',
        userId: 'user-rec-002',
        receptionistId: 'PHC-REC-002',
        name: 'Anjali Verma',
        email: 'receptionist.rohini@phc.gov.in',
        phone: '+91 98444 00402',
        phcId: 'phc-002',
        counterNumber: 'Registration Desk A',
        shift: 'General (09:00 AM - 05:00 PM)',
      },
      {
        recId: 'rec-003',
        userId: 'user-rec-003',
        receptionistId: 'PHC-REC-003',
        name: 'Meena Rawat',
        email: 'receptionist.najafgarh@phc.gov.in',
        phone: '+91 98444 00403',
        phcId: 'phc-003',
        counterNumber: 'Rural Helpdesk 1',
        shift: 'Day Shift (09:00 AM - 04:00 PM)',
      },
    ];

    for (const r of receptionistSeedData) {
      this.users.push({
        id: r.userId,
        email: r.email,
        phone: r.phone,
        role: 'RECEPTIONIST',
        fullName: r.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const phc = this.phcs.find((ph) => ph.id === r.phcId);
      this.receptionists.push({
        id: r.recId,
        userId: r.userId,
        receptionistId: r.receptionistId,
        fullName: r.name,
        email: r.email,
        phone: r.phone,
        phcId: r.phcId,
        phcName: phc?.name || 'Primary Health Centre',
        counterNumber: r.counterNumber,
        shift: r.shift,
        createdAt: new Date().toISOString(),
      });
    }

    // 5. SEED 20 PATIENTS
    const patientRawList = [
      { name: 'Aakash Jha', age: 24, gender: 'Male' as const, phone: '+91 98765 43210', allergies: ['Penicillin'], chronic: ['Mild Bronchial Asthma'], meds: ['Salbutamol Inhaler SOS'] },
      { name: 'Sunita Devi', age: 52, gender: 'Female' as const, phone: '+91 98765 43211', allergies: ['Sulfa drugs'], chronic: ['Type 2 Diabetes', 'Hypertension'], meds: ['Metformin 500mg', 'Amlodipine 5mg'] },
      { name: 'Rohan Gupta', age: 31, gender: 'Male' as const, phone: '+91 98765 43212', allergies: [], chronic: ['Acid Reflux (GERD)'], meds: ['Pantoprazole 40mg'] },
      { name: 'Fatima Sheikh', age: 28, gender: 'Female' as const, phone: '+91 98765 43213', allergies: ['Aspirin'], chronic: [], meds: [] },
      { name: 'Gurpreet Singh', age: 45, gender: 'Male' as const, phone: '+91 98765 43214', allergies: [], chronic: ['Hypertension'], meds: ['Telmisartan 40mg'] },
      { name: 'Lalita Mehra', age: 67, gender: 'Female' as const, phone: '+91 98765 43215', allergies: ['Dust / Pollen'], chronic: ['Osteoarthritis', 'Hypothyroidism'], meds: ['Thyroxine 50mcg', 'Calcium Vitamin D3'] },
      { name: 'Vikas Sharma', age: 19, gender: 'Male' as const, phone: '+91 98765 43216', allergies: [], chronic: [], meds: [] },
      { name: 'Pooja Nair', age: 35, gender: 'Female' as const, phone: '+91 98765 43217', allergies: ['Ciprofloxacin'], chronic: ['Migraine'], meds: ['Naproxen SOS'] },
      { name: 'Mohammed Ali', age: 58, gender: 'Male' as const, phone: '+91 98765 43218', allergies: [], chronic: ['Chronic Kidney Disease Stage 2', 'Diabetes'], meds: ['Insulin Glargine', 'Torsemide'] },
      { name: 'Anita Roy', age: 42, gender: 'Female' as const, phone: '+91 98765 43219', allergies: [], chronic: ['Iron Deficiency Anemia'], meds: ['Ferrous Ascorbate Folic Acid'] },
      { name: 'Devendra Yadav', age: 63, gender: 'Male' as const, phone: '+91 98765 43220', allergies: ['Iodine contrast'], chronic: ['COPD'], meds: ['Tiotropium Inhaler'] },
      { name: 'Deepika Sen', age: 22, gender: 'Female' as const, phone: '+91 98765 43221', allergies: [], chronic: [], meds: [] },
      { name: 'Manoj Tiwari', age: 39, gender: 'Male' as const, phone: '+91 98765 43222', allergies: [], chronic: ['Fatty Liver Grade 1'], meds: ['Liv-52'] },
      { name: 'Geeta Kumari', age: 49, gender: 'Female' as const, phone: '+91 98765 43223', allergies: ['NSAIDs'], chronic: ['Rheumatoid Arthritis'], meds: ['Hydroxychloroquine 200mg'] },
      { name: 'Sanjay Rawat', age: 55, gender: 'Male' as const, phone: '+91 98765 43224', allergies: [], chronic: ['Dyslipidemia'], meds: ['Atorvastatin 10mg'] },
      { name: 'Kavita Joshi', age: 29, gender: 'Female' as const, phone: '+91 98765 43225', allergies: [], chronic: ['PCOS'], meds: ['Myo-Inositol'] },
      { name: 'Arjun Das', age: 8, gender: 'Male' as const, phone: '+91 98765 43226', allergies: ['Peanuts'], chronic: ['Childhood Eczema'], meds: ['Cetirizine Syrup SOS'] },
      { name: 'Meena Bai', age: 71, gender: 'Female' as const, phone: '+91 98765 43227', allergies: [], chronic: ['Senile Cataract', 'Hypertension'], meds: ['Amlodipine 5mg'] },
      { name: 'Rahul Chhabra', age: 33, gender: 'Male' as const, phone: '+91 98765 43228', allergies: [], chronic: [], meds: [] },
      { name: 'Shabana Khan', age: 26, gender: 'Female' as const, phone: '+91 98765 43229', allergies: [], chronic: [], meds: [] },
    ];

    patientRawList.forEach((pat, index) => {
      const pIndex = (index + 1).toString().padStart(4, '0');
      const patId = `pat-${pIndex}`;
      const userId = `user-pat-${pIndex}`;
      const uniqueCode = `PHC-PAT-2026-${pIndex}`;

      this.users.push({
        id: userId,
        email: `${pat.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: pat.phone,
        role: 'PATIENT',
        fullName: pat.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      this.patients.push({
        id: patId,
        userId: userId,
        patientId: uniqueCode,
        fullName: pat.name,
        age: pat.age,
        gender: pat.gender,
        phone: pat.phone,
        email: `${pat.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        address: `House No. ${10 + index * 3}, Near Ward ${((index % 5) + 1)}, New Delhi`,
        latitude: 28.6139 + (index % 5) * 0.02 - 0.04,
        longitude: 77.209 + (index % 4) * 0.02 - 0.03,
        emergencyContactName: `${pat.name.split(' ')[0]}'s Family Contact`,
        emergencyContactPhone: `+91 98999 ${10000 + index}`,
        emergencyContactRelation: index % 2 === 0 ? 'Spouse' : 'Parent / Sibling',
        bloodGroup: ['B+ve', 'O+ve', 'A+ve', 'AB+ve', 'O-ve'][index % 5],
        allergies: pat.allergies,
        existingConditions: pat.chronic,
        currentMedications: pat.meds,
        medicalHistoryNotes: pat.chronic.length > 0 ? `Regular outpatient follow-up recommended for ${pat.chronic.join(', ')}.` : 'No significant past surgical or inpatient hospitalizations.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // 6. SEED 50 ESSENTIAL MEDICINES
    const medicinesData: Omit<Medicine, 'id'>[] = [
      // Analgesics & Antipyretics
      { name: 'Paracetamol Tablets IP 500mg', genericName: 'Paracetamol', category: 'Analgesic / Antipyretic', strength: '500mg', form: 'Tablet', manufacturer: 'IDPL (Govt)', isEssential: true },
      { name: 'Paracetamol Syrup 120mg/5ml', genericName: 'Paracetamol', category: 'Analgesic / Antipyretic', strength: '120mg/5ml', form: 'Syrup', manufacturer: 'Karnataka Antibiotics', isEssential: true },
      { name: 'Ibuprofen Tablets 400mg', genericName: 'Ibuprofen', category: 'Analgesic / Antipyretic', strength: '400mg', form: 'Tablet', manufacturer: 'Hindustan Antibiotics', isEssential: true },
      { name: 'Diclofenac Sodium 50mg', genericName: 'Diclofenac Sodium', category: 'Analgesic / Antipyretic', strength: '50mg', form: 'Tablet', manufacturer: 'Cipla Generic', isEssential: true },
      { name: 'Diclofenac Gel 1% w/w', genericName: 'Diclofenac Diethylamine', category: 'Topical / Dermatology', strength: '1% w/w (30g)', form: 'Ointment', manufacturer: 'Zydus', isEssential: true },
      
      // Antibiotics & Antimicrobials
      { name: 'Amoxicillin Capsules 500mg', genericName: 'Amoxicillin Trihydrate', category: 'Antibiotic', strength: '500mg', form: 'Capsule', manufacturer: 'Alkem Laboratories', isEssential: true },
      { name: 'Amoxicillin + Clavulanic Acid 625mg', genericName: 'Amoxicillin and Potassium Clavulanate', category: 'Antibiotic', strength: '625mg', form: 'Tablet', manufacturer: 'Mankind Pharma', isEssential: true },
      { name: 'Azithromycin Tablets 500mg', genericName: 'Azithromycin', category: 'Antibiotic', strength: '500mg', form: 'Tablet', manufacturer: 'Sun Pharma', isEssential: true },
      { name: 'Ciprofloxacin Tablets 500mg', genericName: 'Ciprofloxacin HCl', category: 'Antibiotic', strength: '500mg', form: 'Tablet', manufacturer: 'Cadila Pharma', isEssential: true },
      { name: 'Metronidazole Tablets 400mg', genericName: 'Metronidazole', category: 'Antibiotic', strength: '400mg', form: 'Tablet', manufacturer: 'Torrent Pharma', isEssential: true },
      { name: 'Cefixime Tablets 200mg', genericName: 'Cefixime', category: 'Antibiotic', strength: '200mg', form: 'Tablet', manufacturer: 'Lupin Generics', isEssential: true },
      { name: 'Cotrimoxazole Tablets SS (80/400mg)', genericName: 'Trimethoprim + Sulfamethoxazole', category: 'Antibiotic', strength: '80/400mg', form: 'Tablet', manufacturer: 'IDPL', isEssential: true },
      { name: 'Doxycycline Capsules 100mg', genericName: 'Doxycycline Hyclate', category: 'Antibiotic', strength: '100mg', form: 'Capsule', manufacturer: 'Dr. Reddy Labs', isEssential: true },

      // Antidiabetics
      { name: 'Metformin Tablets IP 500mg', genericName: 'Metformin Hydrochloride', category: 'Antidiabetic', strength: '500mg', form: 'Tablet', manufacturer: 'USV Pharma', isEssential: true },
      { name: 'Metformin Sustained Release 1000mg', genericName: 'Metformin SR', category: 'Antidiabetic', strength: '1000mg', form: 'Tablet', manufacturer: 'Sun Pharma', isEssential: true },
      { name: 'Glimepiride Tablets 1mg', genericName: 'Glimepiride', category: 'Antidiabetic', strength: '1mg', form: 'Tablet', manufacturer: 'Sanofi India', isEssential: true },
      { name: 'Glimepiride Tablets 2mg', genericName: 'Glimepiride', category: 'Antidiabetic', strength: '2mg', form: 'Tablet', manufacturer: 'Sanofi India', isEssential: true },
      { name: 'Human Soluble Insulin Injection 40 IU/ml', genericName: 'Regular Insulin (rDNA)', category: 'Antidiabetic', strength: '40 IU/ml (10ml)', form: 'Injection', manufacturer: 'Biocon', isEssential: true },

      // Antihypertensives & Cardiac
      { name: 'Amlodipine Besylate Tablets 5mg', genericName: 'Amlodipine', category: 'Antihypertensive', strength: '5mg', form: 'Tablet', manufacturer: 'Torrent', isEssential: true },
      { name: 'Telmisartan Tablets IP 40mg', genericName: 'Telmisartan', category: 'Antihypertensive', strength: '40mg', form: 'Tablet', manufacturer: 'Glenmark', isEssential: true },
      { name: 'Enalapril Maleate Tablets 5mg', genericName: 'Enalapril', category: 'Antihypertensive', strength: '5mg', form: 'Tablet', manufacturer: 'Cadila', isEssential: true },
      { name: 'Atenolol Tablets 50mg', genericName: 'Atenolol', category: 'Antihypertensive', strength: '50mg', form: 'Tablet', manufacturer: 'Zydus', isEssential: true },
      { name: 'Hydrochlorothiazide Tablets 12.5mg', genericName: 'Hydrochlorothiazide', category: 'Antihypertensive', strength: '12.5mg', form: 'Tablet', manufacturer: 'Micro Labs', isEssential: true },
      { name: 'Atorvastatin Tablets 10mg', genericName: 'Atorvastatin Calcium', category: 'Antihypertensive', strength: '10mg', form: 'Tablet', manufacturer: 'Lupin', isEssential: true },
      { name: 'Aspirin Gastro-resistant 75mg', genericName: 'Acetylsalicylic Acid', category: 'Antihypertensive', strength: '75mg', form: 'Tablet', manufacturer: 'Bayer India', isEssential: true },

      // Antihistamines & Respiratory
      { name: 'Cetirizine Hydrochloride Tablets 10mg', genericName: 'Cetirizine HCl', category: 'Antihistamine', strength: '10mg', form: 'Tablet', manufacturer: 'Cipla', isEssential: true },
      { name: 'Cetirizine Syrup 5mg/5ml', genericName: 'Cetirizine HCl', category: 'Antihistamine', strength: '5mg/5ml', form: 'Syrup', manufacturer: 'Cipla', isEssential: true },
      { name: 'Levocetirizine Tablets 5mg', genericName: 'Levocetirizine', category: 'Antihistamine', strength: '5mg', form: 'Tablet', manufacturer: 'Mankind', isEssential: true },
      { name: 'Salbutamol Inhaler (100mcg/dose)', genericName: 'Salbutamol', category: 'Respiratory', strength: '100mcg (200 MD)', form: 'Drops', manufacturer: 'Cipla Asthalin', isEssential: true },
      { name: 'Salbutamol Respirator Solution 5mg/ml', genericName: 'Salbutamol Nebulizer Solution', category: 'Respiratory', strength: '5mg/ml', form: 'Drops', manufacturer: 'Cipla', isEssential: true },
      { name: 'Budesonide Inhaler 200mcg', genericName: 'Budesonide', category: 'Respiratory', strength: '200mcg (200 MD)', form: 'Drops', manufacturer: 'Zydus', isEssential: true },
      { name: 'Ambroxol + Guaiphenesin Cough Syrup', genericName: 'Ambroxol + Terbutaline + Guaiphenesin', category: 'Respiratory', strength: '100ml', form: 'Syrup', manufacturer: 'Abbott', isEssential: true },

      // GI & Antacids
      { name: 'Oral Rehydration Salts (ORS) WHO Formula', genericName: 'Oral Electrolytes Sachet', category: 'Antacid / GI', strength: '20.5g Sachet (1L)', form: 'Sachet', manufacturer: 'FDC Electral', isEssential: true },
      { name: 'Pantoprazole Gastro-Resistant Tablets 40mg', genericName: 'Pantoprazole Sodium', category: 'Antacid / GI', strength: '40mg', form: 'Tablet', manufacturer: 'Alkem', isEssential: true },
      { name: 'Ranitidine Hydrochloride Tablets 150mg', genericName: 'Ranitidine', category: 'Antacid / GI', strength: '150mg', form: 'Tablet', manufacturer: 'Glaxo', isEssential: true },
      { name: 'Ondansetron Tablets 4mg', genericName: 'Ondansetron', category: 'Antacid / GI', strength: '4mg', form: 'Tablet', manufacturer: 'Sun Pharma', isEssential: true },
      { name: 'Domperidone Tablets 10mg', genericName: 'Domperidone', category: 'Antacid / GI', strength: '10mg', form: 'Tablet', manufacturer: 'Torrent', isEssential: true },
      { name: 'Dicyclomine Tablets 20mg', genericName: 'Dicyclomine HCl (Antispasmodic)', category: 'Antacid / GI', strength: '20mg', form: 'Tablet', manufacturer: 'Unichem', isEssential: true },
      { name: 'Antacid Gel (Magaldrate + Simethicone)', genericName: 'Magaldrate + Simethicone', category: 'Antacid / GI', strength: '200ml Bottle', form: 'Syrup', manufacturer: 'Pfizer Mucaine', isEssential: true },

      // Vitamins & Minerals
      { name: 'Iron and Folic Acid Tablets (IFA Large)', genericName: 'Ferrous Sulfate + Folic Acid', category: 'Vitamin / Supplement', strength: '100mg Fe + 0.5mg FA', form: 'Tablet', manufacturer: 'Govt Jan Aushadhi', isEssential: true },
      { name: 'Calcium + Vitamin D3 Tablets 500mg', genericName: 'Calcium Carbonate + Cholecalciferol', category: 'Vitamin / Supplement', strength: '500mg + 250 IU', form: 'Tablet', manufacturer: 'Shelcal / Torrent', isEssential: true },
      { name: 'Vitamin B-Complex Tablets', genericName: 'B1, B2, B6, B12, Niacinamide', category: 'Vitamin / Supplement', strength: 'Fortified Therapeutic', form: 'Tablet', manufacturer: 'Pfizer Becosules', isEssential: true },
      { name: 'Vitamin C Chewable Tablets 500mg', genericName: 'Ascorbic Acid (Chewable)', category: 'Vitamin / Supplement', strength: '500mg', form: 'Tablet', manufacturer: 'Abbott Limcee', isEssential: true },
      { name: 'Zinc Sulfate Dispersible Tablets 20mg', genericName: 'Zinc Sulfate', category: 'Vitamin / Supplement', strength: '20mg', form: 'Tablet', manufacturer: 'Govt Supply', isEssential: true },

      // Topical & Dermatology
      { name: 'Povidone Iodine Ointment 5% w/w', genericName: 'Povidone Iodine (Betadine)', category: 'Topical / Dermatology', strength: '5% w/w (20g Tube)', form: 'Ointment', manufacturer: 'Win-Medicare', isEssential: true },
      { name: 'Clotrimazole Cream 1% w/w', genericName: 'Clotrimazole Antifungal', category: 'Topical / Dermatology', strength: '1% w/w (15g Tube)', form: 'Ointment', manufacturer: 'Bayer Canesten', isEssential: true },
      { name: 'Silver Sulfadiazine Burn Cream 1%', genericName: 'Silver Sulfadiazine (Burn Care)', category: 'Topical / Dermatology', strength: '1% w/w (50g)', form: 'Ointment', manufacturer: 'Cipla Silverex', isEssential: true },
      { name: 'Calamine Anti-Itch Lotion', genericName: 'Calamine + Zinc Oxide', category: 'Topical / Dermatology', strength: '100ml Lotion', form: 'Drops', manufacturer: 'Piramal', isEssential: true },

      // Emergency & Critical Care
      { name: 'Adrenaline (Epinephrine) Injection 1:1000', genericName: 'Adrenaline Tartrate (1mg/ml)', category: 'Emergency & Resuscitation', strength: '1mg/ml Ampoule', form: 'Injection', manufacturer: 'Harson Pharma', isEssential: true },
      { name: 'Atropine Sulfate Injection 0.6mg/ml', genericName: 'Atropine Sulfate', category: 'Emergency & Resuscitation', strength: '0.6mg/ml (1ml)', form: 'Injection', manufacturer: 'Troikaa', isEssential: true },
      { name: 'Hydrocortisone Sodium Succinate 100mg', genericName: 'Hydrocortisone Injection', category: 'Emergency & Resuscitation', strength: '100mg Vial', form: 'Injection', manufacturer: 'VHB Life Sciences', isEssential: true },
    ];

    this.medicines = medicinesData.map((m, idx) => ({
      ...m,
      id: `med-${(idx + 1).toString().padStart(3, '0')}`,
    }));

    // 7. SEED INVENTORY FOR EACH PHC
    this.phcs.forEach((phc) => {
      this.medicines.forEach((med, medIdx) => {
        // Vary stock levels across PHCs to simulate realistic availability, low-stock, and out-of-stock
        let baseQty = 150 + ((medIdx * 17) % 350);
        let minStock = 50;

        // Make a few items low-stock / out-of-stock deliberately for pharmacist alerts demo
        if (med.name.includes('Amoxicillin + Clavulanic') && phc.id === 'phc-001') {
          baseQty = 12; // Low stock alert!
        } else if (med.name.includes('Insulin') && phc.id === 'phc-003') {
          baseQty = 0; // Out of stock at rural PHC
        } else if (med.name.includes('Azithromycin') && phc.id === 'phc-004') {
          baseQty = 18; // Low stock alert
        } else if (med.name.includes('Adrenaline') && phc.id === 'phc-003') {
          baseQty = 5; // Critical emergency low stock
        }

        const expYear = 2027 + (medIdx % 2);
        const expMonth = ((medIdx % 12) + 1).toString().padStart(2, '0');
        const expiryDate = `${expYear}-${expMonth}-28`;

        let status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expiring Soon' = 'In Stock';
        if (baseQty === 0) status = 'Out of Stock';
        else if (baseQty <= minStock) status = 'Low Stock';

        this.inventories.push({
          id: `inv-${phc.id}-${med.id}`,
          medicineId: med.id,
          phcId: phc.id,
          medicine: med,
          quantity: baseQty,
          minimumStockLevel: minStock,
          batchNumber: `BAT-2026-${((medIdx * 31) % 900 + 100)}`,
          expiryDate,
          supplier: 'Delhi State Health Mission Central Depot',
          costPerUnit: Math.round(((medIdx % 20) * 1.5 + 2) * 10) / 10,
          status,
          updatedAt: new Date().toISOString(),
        });
      });
    });

    // 8. SEED APPOINTMENTS
    const today = new Date().toISOString().split('T')[0];
    const sampleAppointments: Omit<Appointment, 'id'>[] = [
      {
        appointmentNumber: 'APT-2026-001',
        patientId: 'pat-0001',
        patientName: 'Aakash Jha',
        patientAge: 24,
        patientGender: 'Male',
        patientPhone: '+91 98765 43210',
        doctorId: 'doc-001',
        doctorName: 'Dr. Rajesh Verma',
        doctorSpecialization: 'General Medicine',
        phcId: 'phc-001',
        phcName: 'Central Urban PHC - Karol Bagh',
        date: today,
        timeSlot: '09:30 AM',
        tokenNumber: 1,
        reasonForVisit: 'Persistent dry cough and mild throat irritation for 4 days',
        symptoms: ['Dry Cough', 'Throat Irritation', 'Mild Fatigue'],
        criticalityLevel: 'LOW',
        status: 'In Consultation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        appointmentNumber: 'APT-2026-002',
        patientId: 'pat-0002',
        patientName: 'Sunita Devi',
        patientAge: 52,
        patientGender: 'Female',
        patientPhone: '+91 98765 43211',
        doctorId: 'doc-001',
        doctorName: 'Dr. Rajesh Verma',
        doctorSpecialization: 'General Medicine',
        phcId: 'phc-001',
        phcName: 'Central Urban PHC - Karol Bagh',
        date: today,
        timeSlot: '10:00 AM',
        tokenNumber: 2,
        reasonForVisit: 'Routine Diabetic & Blood Pressure Checkup and medication refill',
        symptoms: ['Mild Dizziness', 'Increased Thirst'],
        criticalityLevel: 'MEDIUM',
        status: 'Checked In',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        appointmentNumber: 'APT-2026-003',
        patientId: 'pat-0003',
        patientName: 'Rohan Gupta',
        patientAge: 31,
        patientGender: 'Male',
        patientPhone: '+91 98765 43212',
        doctorId: 'doc-001',
        doctorName: 'Dr. Rajesh Verma',
        doctorSpecialization: 'General Medicine',
        phcId: 'phc-001',
        phcName: 'Central Urban PHC - Karol Bagh',
        date: today,
        timeSlot: '10:30 AM',
        tokenNumber: 3,
        reasonForVisit: 'Severe heartburn and epigastric burning post meals',
        symptoms: ['Acid Reflux', 'Heartburn', 'Nausea'],
        criticalityLevel: 'MEDIUM',
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        appointmentNumber: 'APT-2026-004',
        patientId: 'pat-0004',
        patientName: 'Fatima Sheikh',
        patientAge: 28,
        patientGender: 'Female',
        patientPhone: '+91 98765 43213',
        doctorId: 'doc-003',
        doctorName: 'Dr. Ananya Iyer',
        doctorSpecialization: 'Gynecology & Obstetrics',
        phcId: 'phc-002',
        phcName: 'Suburban Community Health Centre - Rohini',
        date: today,
        timeSlot: '11:00 AM',
        tokenNumber: 1,
        reasonForVisit: 'Second trimester routine antenatal checkup (ANC-2)',
        symptoms: ['Routine Antenatal Visit', 'Mild Backache'],
        criticalityLevel: 'LOW',
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        appointmentNumber: 'APT-2026-005',
        patientId: 'pat-0006',
        patientName: 'Lalita Mehra',
        patientAge: 67,
        patientGender: 'Female',
        patientPhone: '+91 98765 43215',
        doctorId: 'doc-005',
        doctorName: 'Dr. Sunita Patel',
        doctorSpecialization: 'Community Medicine & Public Health',
        phcId: 'phc-003',
        phcName: 'Model Rural PHC - Najafgarh',
        date: today,
        timeSlot: '11:30 AM',
        tokenNumber: 4,
        reasonForVisit: 'Bilateral knee joint pain and morning stiffness',
        symptoms: ['Joint Pain', 'Difficulty Walking'],
        criticalityLevel: 'LOW',
        status: 'Completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        appointmentNumber: 'APT-2026-006',
        patientId: 'pat-0008',
        patientName: 'Pooja Nair',
        patientAge: 35,
        patientGender: 'Female',
        patientPhone: '+91 98765 43217',
        doctorId: 'doc-007',
        doctorName: 'Dr. Vikram Malhotra',
        doctorSpecialization: 'Dermatology & Skin',
        phcId: 'phc-004',
        phcName: 'East District PHC - Laxmi Nagar',
        date: today,
        timeSlot: '12:00 PM',
        tokenNumber: 5,
        reasonForVisit: 'Red itchy rash on forearm after gardening',
        symptoms: ['Itchy Skin Rash', 'Erythema'],
        criticalityLevel: 'LOW',
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    sampleAppointments.forEach((apt, idx) => {
      this.appointments.push({
        ...apt,
        id: `apt-${(idx + 1).toString().padStart(3, '0')}`,
      });
    });

    // 9. SEED MEDICAL RECORDS
    this.medicalRecords.push({
      id: 'rec-001',
      recordNumber: 'REC-2026-0001',
      patientId: 'pat-0006',
      patientName: 'Lalita Mehra',
      doctorId: 'doc-005',
      doctorName: 'Dr. Sunita Patel',
      doctorSpecialization: 'Community Medicine & Public Health',
      phcId: 'phc-003',
      phcName: 'Model Rural PHC - Najafgarh',
      appointmentId: 'apt-005',
      visitDate: today,
      chiefComplaints: ['Bilateral knee joint pain for 2 weeks', 'Morning stiffness lasting ~20 minutes'],
      clinicalAssessment: 'Mild osteoarthritis of bilateral knees with crepitus on passive flexion. No active effusion or localized warmth.',
      diagnosis: ['Primary Osteoarthritis (Bilateral Knees) - Grade 2', 'Age-related Degenerative Joint Disease'],
      vitals: {
        bp: '128/82 mmHg',
        temperature: '98.4 F',
        pulse: '74 bpm',
        spO2: '98%',
        weight: '62 kg',
      },
      prescriptions: [
        {
          medicineName: 'Paracetamol Tablets IP 500mg',
          genericName: 'Paracetamol',
          dosage: '500mg',
          frequency: '1-0-1 (Twice daily after meals)',
          duration: '5 days',
          instructions: 'Take with warm water when pain arises. Avoid on empty stomach.',
        },
        {
          medicineName: 'Calcium + Vitamin D3 Tablets 500mg',
          genericName: 'Calcium Carbonate + Cholecalciferol',
          dosage: '500mg + 250 IU',
          frequency: '0-0-1 (Once daily after dinner)',
          duration: '30 days',
          instructions: 'Continue regular bone health supplementation.',
        },
        {
          medicineName: 'Diclofenac Gel 1% w/w',
          genericName: 'Diclofenac Diethylamine',
          dosage: 'Topical Application',
          frequency: 'Twice daily',
          duration: '10 days',
          instructions: 'Gently massage on both knees. Do not apply on broken skin.',
        },
      ],
      recommendedTests: ['Serum Uric Acid', 'Serum Calcium & Vitamin D3 Screen'],
      followUpDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      referralType: 'Patient Treated',
      referralDetails: 'Quadriceps isometric strengthening exercises advised. Follow-up after 2 weeks if symptoms persist.',
      doctorNotes: 'Advised knee support during prolonged standing. Patient counseled on gentle walking and weight management.',
      createdAt: new Date().toISOString(),
    });

    // 10. SEED NOTIFICATIONS
    this.notifications = [
      {
        id: 'notif-001',
        patientId: 'pat-0001',
        title: 'Appointment Ready: Dr. Rajesh Verma',
        message: 'Your consultation with Dr. Rajesh Verma (Token #1) is currently active at Central Urban PHC.',
        type: 'APPOINTMENT_CONFIRMED',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif-002',
        patientId: 'pat-0002',
        title: 'Checked In: Central Urban PHC',
        message: 'You have been checked in. Please wait in OPD Waiting Area A for Token #2.',
        type: 'APPOINTMENT_REMINDER',
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'notif-003',
        patientId: 'pat-0001',
        title: 'Medicine Restock Alert',
        message: 'Salbutamol Inhalers have been freshly restocked at Karol Bagh PHC dispensary.',
        type: 'MEDICINE_AVAILABLE',
        read: true,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'notif-004',
        patientId: 'pat-0001',
        title: 'Seasonal Health Advisory: Dengue Awareness',
        message: 'Ensure no standing water around household premises. Free dengue screening available at your local PHC.',
        type: 'HEALTH_ALERT',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    // 11. SEED PRE-CONSULTATION CHECKUPS
    this.preConsultations = [
      {
        id: 'chk-001',
        checkupNumber: 'CHK-2026-0001',
        patientId: 'pat-0001',
        patientCode: 'PHC-PAT-2026-0001',
        patientName: 'Aakash Jha',
        patientAge: 24,
        patientGender: 'Male',
        patientPhone: '+91 98765 43210',
        patientAddress: 'House No. 10, Near Ward 1, New Delhi',
        bloodGroup: 'B+ve',
        receptionistId: 'rec-001',
        receptionistName: 'Pooja Sharma',
        phcId: 'phc-001',
        phcName: 'Central Urban PHC - Karol Bagh',
        vitals: {
          bpSystolic: 120,
          bpDiastolic: 80,
          bpFormatted: '120/80 mmHg',
          pulseRate: 74,
          bodyTemperature: 36.8,
          respiratoryRate: 16,
        },
        measurements: {
          height: 175,
          weight: 68,
          bmi: 22.2,
          bmiCategory: 'Normal',
        },
        otherTestsNotes: 'Patient reports mild morning wheezing. SpO2 within normal limits on room air.',
        otherTests: [
          {
            id: 'test-001',
            testName: 'SpO2 (Pulse Oximetry)',
            resultValue: '98',
            unit: '%',
            notes: 'Room air',
          },
          {
            id: 'test-002',
            testName: 'Random Blood Sugar (RBS)',
            resultValue: '95',
            unit: 'mg/dL',
            notes: 'Post-breakfast (2 hrs)',
          },
        ],
        appointmentId: 'apt-001',
        doctorId: 'doc-001',
        doctorName: 'Dr. Rajesh Verma',
        status: 'WAITING_FOR_DOCTOR',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        updatedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'chk-002',
        checkupNumber: 'CHK-2026-0002',
        patientId: 'pat-0002',
        patientCode: 'PHC-PAT-2026-0002',
        patientName: 'Sunita Devi',
        patientAge: 52,
        patientGender: 'Female',
        patientPhone: '+91 98765 43211',
        patientAddress: 'House No. 13, Near Ward 2, New Delhi',
        bloodGroup: 'O+ve',
        receptionistId: 'rec-001',
        receptionistName: 'Pooja Sharma',
        phcId: 'phc-001',
        phcName: 'Central Urban PHC - Karol Bagh',
        vitals: {
          bpSystolic: 138,
          bpDiastolic: 88,
          bpFormatted: '138/88 mmHg',
          pulseRate: 80,
          bodyTemperature: 37.1,
          respiratoryRate: 18,
        },
        measurements: {
          height: 158,
          weight: 72,
          bmi: 28.84,
          bmiCategory: 'Overweight',
        },
        otherTestsNotes: 'Known diabetic for routine monthly follow-up and prescription renewal.',
        otherTests: [
          {
            id: 'test-003',
            testName: 'Fasting Blood Sugar (FBS)',
            resultValue: '132',
            unit: 'mg/dL',
            notes: 'Fasting 10 hrs',
          },
        ],
        appointmentId: 'apt-002',
        doctorId: 'doc-001',
        doctorName: 'Dr. Rajesh Verma',
        status: 'WAITING_FOR_DOCTOR',
        createdAt: new Date(Date.now() - 900000).toISOString(),
        updatedAt: new Date(Date.now() - 900000).toISOString(),
      },
    ];

    this.initialized = true;
  }
}
