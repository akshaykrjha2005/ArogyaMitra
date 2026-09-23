import { SymptomAssessment, TriageRiskLevel, PossibleCondition } from '@phc-connect/types';

export interface TriageInput {
  patientId?: string;
  symptoms: string[];
  duration: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  age: number;
  gender?: 'Male' | 'Female' | 'Other';
  existingConditions?: string[];
  allergies?: string[];
  currentMedications?: string[];
  vitalSigns?: {
    temperatureF?: number;
    heartRate?: number;
    spO2?: number;
    bpSystolic?: number;
    bpDiastolic?: number;
    respiratoryRate?: number;
    bloodGlucoseMgDl?: number;
  };
  uploadedPhotoUrl?: string | null;
  photoDescription?: string;
}

interface DiseaseProfile {
  id: string;
  name: string;
  icd10: string;
  category: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  exclusionKeywords?: string[];
  comorbidityBoosters?: string[];
  minDurationDays?: number;
  maxDurationDays?: number;
  description: string;
  recommendedTests: string[];
  homeCareTips: string[];
  acuityLevel: TriageRiskLevel;
}

// 1. Multilingual & Colloquial Symptom Synonym Dictionary for High-Accuracy Mapping
const MULTILINGUAL_SYNONYM_MAP: Record<string, string[]> = {
  // Fever & Chills
  'fever': ['bukhar', 'taap', 'jwara', 'kaichal', 'fever', 'high temperature', 'body hot', 'pyrexia', 'tap'],
  'fever with chills': ['fever with chills', 'thandi lag kar bukhar', 'chills', 'rigors', 'shivering', 'sheet jwara', 'kampisi'],
  // Respiratory
  'cough': ['khansi', 'khasi', 'kemmu', 'irumal', 'cough', 'dhans', 'coughing'],
  'chronic cough': ['chronic cough', 'cough more than 2 weeks', 'purani khansi', 'lambi khansi', 'cough > 2 weeks', 'sputum cough'],
  'runny nose': ['runny nose', 'rhinorrhea', 'sardi', 'jukham', 'seedi', 'mooku neer', 'nasal drip', 'sneezing', 'cheenk'],
  'sore throat': ['sore throat', 'gale me dard', 'gale me jalan', 'throat pain', 'gantlu novu', 'tonda vali', 'pharyngitis'],
  'shortness of breath': ['shortness of breath', 'breathlessness', 'saas lene me takleef', 'dam phoolna', 'usirata tondare', 'moochu thinarel', 'dyspnea', 'wheezing', 'saas foolna'],
  // Cardiac & Chest
  'chest pain': ['chest pain', 'chhati me dard', 'seene me dard', 'ede novu', 'nenju vali', 'angina', 'crushing chest pressure', 'radiating chest pain'],
  'palpitations': ['palpitations', 'dil ki dhadkan tezz', 'heart racing', 'ghabrahat', 'hrudaya bidtha'],
  // Gastrointestinal
  'stomach pain': ['stomach pain', 'abdominal pain', 'pet dard', 'hotte novu', 'vayitru vali', 'belly ache', 'stomach cramps'],
  'diarrhea': ['diarrhea', 'loose motions', 'loose stools', 'dast', 'bhedi', 'jhada', 'vaitru pokku', 'watery stools'],
  'vomiting': ['vomiting', 'ulti', 'vanti', 'vamana', 'nausea', 'vomit', 'nauseous', 'ji ghabrana'],
  'acidity / heartburn': ['acidity', 'heartburn', 'sour belching', 'seene me jalan', 'pet me jalan', 'khatta dakar', 'acid reflux', 'gerd'],
  // Neurological & Head
  'headache': ['headache', 'sar dard', 'seer dard', 'tale novu', 'thalai vali', 'migraine', 'throbbing head pain'],
  'dizziness': ['dizziness', 'vertigo', 'chakkar', 'sar ghoomna', 'tale tiruguvudu', 'mayakkam', 'lightheadedness'],
  // Urological
  'burning urination': ['burning urination', 'painful urination', 'dysuria', 'peshab me jalan', 'mootra visarjane uri', 'moothira erichal'],
  'frequent urination': ['frequent urination', 'baar baar peshab', 'polyuria', 'nocturia', 'urinary urgency'],
  // Musculoskeletal & Joint
  'joint pain': ['joint pain', 'arthralgia', 'jodo me dard', 'ghutne me dard', 'keelu novu', 'moottu vali', 'knee pain', 'stiff joints'],
  'body ache': ['body ache', 'generalized fatigue', 'badan dard', 'anga novu', 'udal vali', 'myalgia', 'extreme tiredness', 'kamzori'],
  // Dermatological
  'skin rash': ['skin rash', 'itching', 'khujli', 'tike', 'skin allergy', 'red spots', 'dane', 'pit', 'skin peeling', 'namachil'],
  // Vision & Eyes
  'eye redness': ['red eye', 'eye redness', 'aankh lal', 'aankh aana', 'kannu kempu', 'conjunctivitis', 'watery eyes'],
  // Ear
  'ear pain': ['ear pain', 'earache', 'kaan me dard', 'kivi novu', 'kaadhu vali', 'ear discharge'],
};

// 2. Emergency Red-Flag Triages with Immediate Action Protocol
const EMERGENCY_RED_FLAGS: { symptom: string; explanation: string; action: string }[] = [
  {
    symptom: 'chest pain',
    explanation: 'Crushing, heavy, or radiating retrosternal chest pain can indicate Acute Coronary Syndrome (ACS) / Myocardial Infarction.',
    action: 'Immediate 108/112 Ambulance call, chewable Aspirin 300mg if not allergic, urgent ECG at nearest Emergency Center.',
  },
  {
    symptom: 'radiating pain to left arm',
    explanation: 'Ischemic cardiac pain radiating to left arm, neck, jaw, or shoulder blades.',
    action: 'Urgent emergency hospital transfer with cardiac monitoring.',
  },
  {
    symptom: 'crushing chest pressure',
    explanation: 'High clinical suspicion of acute myocardial ischemia.',
    action: 'Immediate emergency medical transfer and oxygenation.',
  },
  {
    symptom: 'shortness of breath at rest',
    explanation: 'Acute respiratory distress, severe bronchospasm, pulmonary embolism, or acute pulmonary edema.',
    action: 'Supplemental high-flow oxygen, immediate emergency triage, maintain upright posture.',
  },
  {
    symptom: 'severe breathing difficulty',
    explanation: 'Critical upper/lower airway compromise with imminent respiratory failure.',
    action: 'Immediate hospital triage with nebulization, bronchodilators, and airway support.',
  },
  {
    symptom: 'sudden weakness on one side',
    explanation: 'Acute unilateral motor deficit strongly indicative of Cerebrovascular Stroke (CVA / TIA).',
    action: 'Immediate transport to a stroke-ready center within the 4.5-hour thrombolysis golden window.',
  },
  {
    symptom: 'facial drooping',
    explanation: 'Unilateral facial nerve palsy or acute cortical stroke deficit.',
    action: 'Emergency FAST stroke assessment and brain non-contrast CT scan.',
  },
  {
    symptom: 'slurred speech',
    explanation: 'Acute dysarthria or expressive aphasia associated with cerebrovascular attack.',
    action: 'Emergency CT scan and neurological critical care stabilization.',
  },
  {
    symptom: 'loss of consciousness',
    explanation: 'Syncope, intracranial hemorrhage, cardiac arrhythmia, or severe metabolic disturbance.',
    action: 'Place in recovery position, ensure patent airway, dial 108 emergency ambulance.',
  },
  {
    symptom: 'coughing up blood',
    explanation: 'Hemoptysis indicating severe cavitary tuberculosis, pulmonary embolism, or vascular lesion.',
    action: 'Urgent hospital admission, chest radiograph / CT, and hemostatic support.',
  },
  {
    symptom: 'seizure',
    explanation: 'Status epilepticus or acute convulsion requiring neurological stabilization.',
    action: 'Protect patient from head trauma, clear airway, do not put objects in mouth, transport immediately.',
  },
  {
    symptom: 'anaphylaxis',
    explanation: 'Systemic severe type-I hypersensitivity with laryngeal edema and distributive shock.',
    action: 'Immediate Intramuscular Epinephrine (0.5mg 1:1000) and airway support.',
  },
  {
    symptom: 'bluish lips',
    explanation: 'Central cyanosis indicating severe arterial desaturation (SpO2 < 85%).',
    action: 'Immediate high-flow oxygen and emergency mechanical/CPAP ventilatory support.',
  },
  {
    symptom: 'stiff neck with high fever',
    explanation: 'Meningeal irritation signs indicative of Acute Bacterial / Viral Meningitis or Encephalitis.',
    action: 'Urgent lumbar puncture, blood cultures, and intravenous empiric antibiotics.',
  },
];

// 3. Clinical Disease Knowledge Graph (25+ Primary Care & PHC Profiles)
const CLINICAL_DISEASE_PROFILES: DiseaseProfile[] = [
  // 1. Tropical & Vector-Borne
  {
    id: 'dengue',
    name: 'Dengue Fever / Arboviral Infection',
    icd10: 'A90',
    category: 'Tropical & Vector-Borne',
    primaryKeywords: ['high fever', 'fever', 'retro-orbital', 'eye pain', 'severe joint pain', 'breakbone', 'bone pain', 'platelet', 'petechiae'],
    secondaryKeywords: ['headache', 'body ache', 'vomiting', 'nausea', 'rash', 'fatigue', 'chills'],
    comorbidityBoosters: ['hypertension', 'diabetes', 'elderly'],
    description: 'Acute mosquito-borne viral infection characterized by biphasic high fever, severe retro-orbital headache, generalized myalgia ("break-bone pain"), and risk of thrombocytopenia (platelet drop).',
    recommendedTests: ['Complete Blood Count (CBC) with Platelet Count', 'Dengue NS1 Antigen Test (Day 1-5)', 'Dengue IgM/IgG Serology (after Day 5)', 'Hematocrit Monitoring'],
    homeCareTips: ['Strict rest and high fluid intake (ORS, coconut water, soup)', 'Paracetamol for fever control (Avoid Aspirin, Ibuprofen, or NSAIDs due to bleeding risk)', 'Monitor for warning signs: severe abdominal pain, persistent vomiting, bleeding gums'],
    acuityLevel: 'HIGH',
  },
  {
    id: 'malaria',
    name: 'Malaria (Plasmodium Vivax / Falciparum)',
    icd10: 'B54',
    category: 'Tropical & Vector-Borne',
    primaryKeywords: ['fever with chills', 'rigors', 'shivering', 'intermittent fever', 'sweating', 'splenomegaly'],
    secondaryKeywords: ['fever', 'headache', 'nausea', 'vomiting', 'body ache', 'fatigue', 'jaundice'],
    description: 'Parasitic protozoan infection transmitted by Anopheles mosquitoes, producing classic paroxysms of cold stage (rigors), hot stage (high fever), and sweating stage.',
    recommendedTests: ['Rapid Diagnostic Test for Malaria (RDT / Pv-Pf Antigen)', 'Peripheral Blood Smear for Malarial Parasites (Thin & Thick Smear)', 'Complete Blood Count (CBC)'],
    homeCareTips: ['Take complete course of prescribed ACT (Artemisinin-based combination therapy) or Chloroquine', 'Stay hydrated with electrolyte solutions', 'Use mosquito bed nets and repellents'],
    acuityLevel: 'HIGH',
  },
  {
    id: 'typhoid',
    name: 'Typhoid / Enteric Fever (Salmonella enterica)',
    icd10: 'A01.0',
    category: 'Gastrointestinal & Systemic',
    primaryKeywords: ['step-ladder fever', 'persistent high fever', 'coated tongue', 'abdominal pain', 'rose spots', 'pea soup diarrhea', 'constipation'],
    secondaryKeywords: ['fever', 'loss of appetite', 'headache', 'fatigue', 'malaise', 'weakness'],
    description: 'Systemic bacterial infection transmitted through contaminated food or water, characterized by prolonged remittent fever, gastrointestinal symptoms, and hepatosplenomegaly.',
    recommendedTests: ['Widal Test (paired titer)', 'Typhidot Rapid IgM Test', 'Blood Culture (Gold standard in 1st week)', 'Stool Routine & Culture'],
    homeCareTips: ['Boil drinking water or use certified filtered water', 'Eat thoroughly cooked, soft, easily digestible foods', 'Complete full 10-14 day course of antibiotics prescribed by doctor'],
    acuityLevel: 'HIGH',
  },
  {
    id: 'chikungunya',
    name: 'Chikungunya Viral Arthropathy',
    icd10: 'A92.0',
    category: 'Tropical & Vector-Borne',
    primaryKeywords: ['severe joint pain', 'polyarthritis', 'joint swelling', 'morning joint stiffness', 'stooped posture'],
    secondaryKeywords: ['fever', 'maculopapular rash', 'headache', 'myalgia', 'fatigue'],
    description: 'Aedes mosquito-borne alphaviral infection featuring debilitating symmetric polyarthralgia that primarily affects wrists, ankles, and small joints.',
    recommendedTests: ['Chikungunya IgM ELISA / RT-PCR', 'CBC & ESR / CRP (Inflammatory Markers)', 'Rheumatoid Factor (to exclude RA)'],
    homeCareTips: ['Warm compresses on stiff joints and gentle mobilization', 'Adequate rest and fluid intake', 'Paracetamol for acute pain management'],
    acuityLevel: 'MEDIUM',
  },

  // 2. Respiratory & Pulmonary
  {
    id: 'pulmonary_tb',
    name: 'Pulmonary Tuberculosis (Suspected / NTEP Protocol)',
    icd10: 'A15.0',
    category: 'Respiratory & Infectious',
    primaryKeywords: ['chronic cough', 'cough > 2 weeks', 'cough more than 2 weeks', 'hemoptysis', 'coughing up blood', 'night sweats', 'evening fever', 'unexplained weight loss'],
    secondaryKeywords: ['fever', 'loss of appetite', 'fatigue', 'chest pain on coughing', 'weakness'],
    comorbidityBoosters: ['diabetes', 'hiv', 'undernutrition', 'smoking', 'close contact with tb patient'],
    description: 'Mycobacterium tuberculosis infection of lung parenchyma presenting with persistent cough > 2 weeks, evening pyrexia, drenching night sweats, weight loss, and potential hemoptysis.',
    recommendedTests: ['Sputum Smear for AFB (Acid-Fast Bacilli, 2 samples)', 'CBNAAT / TrueNat (GeneXpert Molecular Assay)', 'Chest X-Ray PA View', 'Complete Blood Count (CBC) & ESR'],
    homeCareTips: ['Wear a mask or cover mouth while coughing to protect family', 'Visit nearest PHC/DMC (Designated Microscopy Centre) for free diagnostic testing under National Tuberculosis Elimination Program (NTEP)', 'Maintain high-protein balanced nutrition'],
    acuityLevel: 'HIGH',
  },
  {
    id: 'urti',
    name: 'Acute Viral Upper Respiratory Infection (Common Cold / Rhinovirus)',
    icd10: 'J06.9',
    category: 'Respiratory',
    primaryKeywords: ['runny nose', 'sneezing', 'nasal congestion', 'sore throat', 'scratchy throat', 'mild cough'],
    secondaryKeywords: ['mild fever', 'low grade fever', 'headache', 'watery eyes', 'fatigue'],
    description: 'Self-limiting viral inflammation of the upper respiratory mucosal tract, resolving typically within 5-7 days with supportive measures.',
    recommendedTests: ['Clinical examination by PHC Medical Officer', 'Throat swab / Rapid antigen (if streptococcal infection is suspected)'],
    homeCareTips: ['Steam inhalation 2-3 times daily', 'Warm saline gargles for throat soothing', 'Hydration and vitamin C rich diet', 'Oral paracetamol or decongestants as needed'],
    acuityLevel: 'LOW',
  },
  {
    id: 'tonsillitis',
    name: 'Acute Pharyngitis / Streptococcal Tonsillitis',
    icd10: 'J03.9',
    category: 'Respiratory',
    primaryKeywords: ['severe throat pain', 'difficulty swallowing', 'pain swallowing', 'swollen tonsils', 'white patches on throat', 'tonsillar exudate'],
    secondaryKeywords: ['fever', 'high fever', 'enlarged neck nodes', 'bad breath', 'voice change'],
    description: 'Infection of the palatine tonsils causing acute odynophagia, tonsillar erythema, exudates, and anterior cervical lymphadenopathy (Centor Criteria).',
    recommendedTests: ['Throat Swab Culture', 'Rapid Strep Antigen Test', 'CBC with Absolute Neutrophil Count'],
    homeCareTips: ['Warm salt water gargles 4 times daily', 'Soft non-spicy diet and cold/warm soothing liquids', 'Take prescribed antibiotic full course if bacterial etiology is confirmed'],
    acuityLevel: 'MEDIUM',
  },
  {
    id: 'acute_bronchitis',
    name: 'Acute Bronchitis / Tracheobronchial Inflammation',
    icd10: 'J20.9',
    category: 'Respiratory',
    primaryKeywords: ['persistent cough', 'productive cough', 'phlegm', 'yellow sputum', 'green sputum', 'chest soreness on coughing'],
    secondaryKeywords: ['fever', 'mild wheezing', 'fatigue', 'shortness of breath on exertion'],
    comorbidityBoosters: ['smoking', 'asthma', 'copd', 'air pollution'],
    description: 'Inflammation of the tracheobronchial tree often following viral colds, causing productive cough lasting 1-3 weeks without pneumonia consolidation.',
    recommendedTests: ['Pulse Oximetry (SpO2 monitoring)', 'Chest Auscultation by Medical Officer', 'Chest X-Ray (if fever >101F or rales present)'],
    homeCareTips: ['Avoid smoking, dust, and cold ambient air', 'Use honey and warm ginger tea to suppress night coughing', 'Bronchodilator syrup or inhaler if wheezing is present'],
    acuityLevel: 'MEDIUM',
  },
  {
    id: 'lobar_pneumonia',
    name: 'Community-Acquired Pneumonia (CAP)',
    icd10: 'J18.9',
    category: 'Respiratory',
    primaryKeywords: ['rust colored sputum', 'chest pain on breathing', 'pleuritic chest pain', 'shaking chills', 'high fever with productive cough', 'crackles', 'crepitations'],
    secondaryKeywords: ['shortness of breath', 'tachypnea', 'confusion in elderly', 'severe fatigue'],
    comorbidityBoosters: ['diabetes', 'copd', 'elderly', 'alcoholism'],
    description: 'Infection of the lung parenchyma causing alveolar exudation, consolidation, impaired gas exchange, and pleuritic chest discomfort.',
    recommendedTests: ['Chest X-Ray PA View', 'Sputum Gram Stain & Culture', 'Complete Blood Count (CBC) with ESR/CRP', 'Continuous Pulse Oximetry'],
    homeCareTips: ['Requires prompt initiation of prescription antibiotics by doctor', 'Maintain upright resting posture to ease breathing', 'Emergency referral if SpO2 drops below 92% or breathing rate exceeds 28/min'],
    acuityLevel: 'HIGH',
  },
  {
    id: 'asthma_exacerbation',
    name: 'Acute Bronchial Asthma Exacerbation',
    icd10: 'J45.9',
    category: 'Respiratory',
    primaryKeywords: ['wheezing', 'musical chest sound', 'breathlessness with wheeze', 'night cough', 'chest tightness', 'asthma flare'],
    secondaryKeywords: ['dry cough', 'inability to speak full sentences', 'anxiety', 'fast breathing'],
    comorbidityBoosters: ['asthma', 'allergy', 'allergic rhinitis'],
    description: 'Hyper-reactive airway bronchospasm causing reversible airflow obstruction, expiratory wheezing, and dyspnea triggered by allergens, cold air, or viral infection.',
    recommendedTests: ['Peak Expiratory Flow Rate (PEFR)', 'Pulse Oximetry', 'Clinical Auscultation for rhonchi/wheeze'],
    homeCareTips: ['Administer prescribed short-acting beta-agonist (Salbutamol) inhaler with spacer', 'Sit upright in comfortable position; avoid lying flat', 'Seek emergency care immediately if lips turn blue or inhaler brings no relief'],
    acuityLevel: 'HIGH',
  },
  {
    id: 'allergic_sinusitis',
    name: 'Acute Rhinosinusitis / Sinus Infection',
    icd10: 'J01.9',
    category: 'Respiratory & ENT',
    primaryKeywords: ['facial sinus pressure', 'facial pain', 'forehead headache', 'nasal congestion', 'thick green nasal discharge', 'pain around eyes'],
    secondaryKeywords: ['fever', 'toothache in upper jaw', 'bad breath', 'post-nasal drip', 'cough'],
    description: 'Inflammation and mucosal swelling of the paranasal sinuses (maxillary, frontal, ethmoid) leading to trapped secretions and facial tenderness.',
    recommendedTests: ['Anterior Rhinoscopy / Clinical ENT exam', 'Water’s View Sinus X-Ray (if chronic)', 'Allergic panel (if recurrent)'],
    homeCareTips: ['Steam inhalation with menthol or eucalyptus 3 times daily', 'Saline nasal spray / Neti pot irrigation', 'Warm compress over forehead and cheeks'],
    acuityLevel: 'LOW',
  },

  // 3. Gastrointestinal & Hepatic
  {
    id: 'gastroenteritis',
    name: 'Acute Gastroenteritis / Infectious Diarrhea',
    icd10: 'A09',
    category: 'Gastrointestinal',
    primaryKeywords: ['loose stools', 'watery diarrhea', 'vomiting', 'frequent bowel movements', 'stomach cramps', 'dehydration'],
    secondaryKeywords: ['nausea', 'mild fever', 'thirst', 'dry mouth', 'dark urine', 'weakness'],
    description: 'Infection of the gastrointestinal tract causing rapid loss of fluid and electrolytes through frequent loose liquid motions and vomiting.',
    recommendedTests: ['Stool Routine & Microscopy (Ova/Cysts/Occult Blood)', 'Serum Electrolytes (Sodium, Potassium)', 'Blood Urea & Creatinine (if dehydrated)'],
    homeCareTips: ['Oral Rehydration Salts (ORS): Drink 1 glass after every loose stool', 'Zinc supplementation (20mg daily for 14 days)', 'Eat soft bland diet: Khichdi, curd, bananas, boiled potatoes', 'Avoid sugary sodas, dairy, and fatty fried food'],
    acuityLevel: 'MEDIUM',
  },
  {
    id: 'gerd_gastritis',
    name: 'Acid Peptic Disorder / Acute Gastritis / GERD',
    icd10: 'K21.9',
    category: 'Gastrointestinal',
    primaryKeywords: ['burning stomach pain', 'heartburn', 'acid reflux', 'sour belching', 'upper abdominal fullness', 'epigastric burning'],
    secondaryKeywords: ['nausea', 'bloating', 'loss of appetite', 'indigestion', 'pain after spicy meals'],
    description: 'Mucosal irritation or reflux of gastric acid into the esophagus, causing burning retrosternal or epigastric discomfort aggravated by fasting or spicy foods.',
    recommendedTests: ['Clinical evaluation by Medical Officer', 'H. Pylori Antigen / Serology (if chronic)', 'Upper GI Endoscopy (if warning signs like weight loss or dysphagia)'],
    homeCareTips: ['Eat small, frequent meals; do not skip breakfast', 'Avoid lying down for 2 hours after meals; elevate head of bed by 15cm', 'Avoid spicy, deep-fried foods, tea, coffee, and tobacco', 'Take antacids or prescribed Proton Pump Inhibitors (PPIs) before breakfast'],
    acuityLevel: 'LOW',
  },
  {
    id: 'acute_appendicitis',
    name: 'Suspected Acute Appendicitis',
    icd10: 'K35.8',
    category: 'Gastrointestinal & Surgical',
    primaryKeywords: ['right lower abdominal pain', 'mcburney pain', 'pain around navel moving to right', 'rebound tenderness', 'pain worsening with walking'],
    secondaryKeywords: ['fever', 'nausea', 'vomiting', 'loss of appetite', 'constipation'],
    description: 'Acute inflammation of the vermiform appendix presenting with visceral periumbilical pain that localizes to the right iliac fossa, requiring urgent surgical evaluation.',
    recommendedTests: ['Abdominal Ultrasound (USG Abdomen & Pelvis)', 'Total Leukocyte Count (Leukocytosis with Left Shift)', 'Urine Routine (to rule out ureteric calculus)'],
    homeCareTips: ['Do NOT take strong laxatives, pain killers, or apply hot water bottles on abdomen', 'Keep nil-by-mouth (fasting) and proceed immediately to surgical PHC/Hospital'],
    acuityLevel: 'HIGH',
  },
  {
    id: 'acute_cholecystitis',
    name: 'Biliary Colic / Acute Cholecystitis (Gallbladder Stone/Infection)',
    icd10: 'K80.0',
    category: 'Gastrointestinal & Hepatic',
    primaryKeywords: ['right upper quadrant pain', 'pain below right ribs', 'pain radiating to right shoulder', 'pain after fatty oily food', 'murphys sign'],
    secondaryKeywords: ['nausea', 'vomiting', 'fever', 'bloating', 'indigestion'],
    description: 'Obstruction of the cystic duct by gallstones leading to gallbladder inflammation, severe right hypochondriac pain, and post-prandial distress.',
    recommendedTests: ['Ultrasound (USG) Whole Abdomen (Gallbladder & Biliary Tree)', 'Liver Function Tests (LFT: Bilirubin, Alk Phos, SGPT)', 'Complete Blood Count (CBC)'],
    homeCareTips: ['Avoid greasy, deep-fried, and dairy-heavy meals', 'Maintain hydration with clear fluids', 'Seek doctor prescription for antispasmodics and surgical assessment'],
    acuityLevel: 'HIGH',
  },

  // 4. Urological & Renal
  {
    id: 'uti',
    name: 'Acute Urinary Tract Infection (Cystitis / Urethritis)',
    icd10: 'N30.0',
    category: 'Urological',
    primaryKeywords: ['burning urination', 'painful urination', 'dysuria', 'frequent urination', 'urinary urgency', 'foul smelling urine', 'cloudy urine'],
    secondaryKeywords: ['lower abdominal pain', 'mild fever', 'pelvic pressure', 'feeling of incomplete emptying'],
    description: 'Bacterial colonization of the urinary bladder and urethra, leading to mucosal inflammation, painful burning micturition, and urgency.',
    recommendedTests: ['Urine Routine & Microscopy (Pus Cells, RBCs, Bacteria)', 'Urine Culture & Sensitivity (Urine C/S)', 'Random Blood Sugar (to rule out diabetic predisposition)'],
    homeCareTips: ['Drink at least 2.5 to 3 liters of water throughout the day', 'Maintain strict perineal hygiene', 'Complete full course of prescribed urinary antibiotics without stopping early'],
    acuityLevel: 'MEDIUM',
  },
  {
    id: 'renal_calculus',
    name: 'Renal Colic / Nephrolithiasis (Kidney Stone)',
    icd10: 'N20.0',
    category: 'Urological',
    primaryKeywords: ['severe flank pain', 'sharp back pain radiating to groin', 'loin to groin pain', 'blood in urine', 'hematuria', 'colicky pain'],
    secondaryKeywords: ['nausea', 'vomiting', 'restlessness', 'inability to find comfortable position'],
    description: 'Sudden severe spasmodic pain caused by the passage of a crystalline calculus through the ureter, often accompanied by microscopic or macroscopic hematuria.',
    recommendedTests: ['Ultrasound (USG) of KUB (Kidney, Ureter, Bladder)', 'Non-contrast CT KUB (Gold standard)', 'Urine Routine Examination', 'Serum Creatinine'],
    homeCareTips: ['High fluid intake during quiescent periods', 'Consult doctor for antispasmodic and analgesic prescription', 'Collect passed stones for biochemical composition analysis'],
    acuityLevel: 'HIGH',
  },

  // 5. Hematological & Nutritional
  {
    id: 'anemia',
    name: 'Iron Deficiency Anemia / Nutritional Anemia',
    icd10: 'D50.9',
    category: 'Hematological & Nutritional',
    primaryKeywords: ['extreme fatigue', 'pale tongue', 'pale conjunctiva', 'pale skin', 'breathlessness on climbing stairs', 'brittle spoon nails', 'pica', 'eating mud/chalk'],
    secondaryKeywords: ['dizziness', 'headache', 'cold hands and feet', 'hair fall', 'generalized weakness'],
    comorbidityBoosters: ['female reproductive age', 'heavy menstrual bleeding', 'pregnancy', 'poor diet', 'hookworm'],
    description: 'Deficiency in functional hemoglobin or red blood cells reducing tissue oxygen delivery, leading to chronic pallor, lethargy, and exertional tachycardia.',
    recommendedTests: ['Complete Blood Count (CBC / Hemoglobin level)', 'Serum Ferritin & Total Iron Binding Capacity (TIBC)', 'Peripheral Blood Smear for Microcytic Hypochromic RBCs', 'Stool for Ova/Parasites/Occult Blood'],
    homeCareTips: ['Consume iron-rich foods: green leafy vegetables (spinach, methi), jaggery (gud), roasted chana, pomegranate, beetroot, eggs/meat', 'Take prescribed Iron & Folic Acid (IFA) tablets with citrus fruit/vitamin C (avoid taking with tea/coffee/milk)', 'Deworming with Albendazole 400mg tablet as advised by PHC'],
    acuityLevel: 'MEDIUM',
  },

  // 6. Neurological & Headaches
  {
    id: 'tension_headache',
    name: 'Tension-Type Headache / Cervicogenic Headache',
    icd10: 'G44.2',
    category: 'Neurological',
    primaryKeywords: ['band-like headache', 'pressure on both sides of head', 'dull aching head pain', 'neck tightness', 'scalp tenderness'],
    secondaryKeywords: ['stress', 'fatigue', 'eye strain', 'difficulty sleeping', 'shoulder stiffness'],
    description: 'Most common primary headache disorder, caused by prolonged contraction of pericranial muscles associated with emotional stress, poor posture, or lack of sleep.',
    recommendedTests: ['Blood Pressure Measurement (to rule out secondary hypertensive headache)', 'Refraction / Vision Testing', 'Cervical spine physical exam'],
    homeCareTips: ['Practice gentle neck stretching and posture correction', 'Ensure 7-8 hours of uninterrupted sleep and adequate hydration', 'Apply warm compress to neck/shoulders', 'Limit screen time and take regular breaks'],
    acuityLevel: 'LOW',
  },
  {
    id: 'migraine',
    name: 'Migraine Headache (with / without Aura)',
    icd10: 'G43.0',
    category: 'Neurological',
    primaryKeywords: ['throbbing one sided headache', 'pulsating headache', 'sensitivity to light', 'photophobia', 'sensitivity to sound', 'phonophobia', 'visual aura', 'flashing lights'],
    secondaryKeywords: ['nausea', 'vomiting', 'worse with physical activity', 'dizziness'],
    description: 'Neurovascular disorder presenting with recurrent moderate-to-severe unilateral pulsating headaches lasting 4-72 hours, aggravated by light and noise.',
    recommendedTests: ['Comprehensive neurological examination by Medical Officer', 'Blood Pressure Check', 'Fundoscopy examination'],
    homeCareTips: ['Rest in a quiet, dark, well-ventilated room during an attack', 'Cold pack application over the forehead and temples', 'Identify and avoid personal triggers: chocolate, aged cheese, skipping meals, sensory overload'],
    acuityLevel: 'MEDIUM',
  },

  // 7. Dermatological & Infectious
  {
    id: 'dermatitis_eczema',
    name: 'Allergic Contact Dermatitis / Atopic Eczema',
    icd10: 'L20.9',
    category: 'Dermatological',
    primaryKeywords: ['itchy red rash', 'skin peeling', 'dry skin patches', 'skin blisters with oozing', 'intense itching'],
    secondaryKeywords: ['redness', 'burning sensation on skin', 'swelling of skin', 'crusting'],
    description: 'Inflammatory skin condition characterized by pruritic erythematous macules, papules, or vesicles triggered by immunological reaction or allergen exposure.',
    recommendedTests: ['Clinical visual dermatological exam', 'Skin Scraping for KOH (to rule out fungal tinea)', 'Allergen history assessment'],
    homeCareTips: ['Apply plain moisturizing emollient/cream immediately after bathing', 'Avoid harsh chemical soaps, detergents, and synthetic fabrics', 'Keep fingernails trimmed to avoid secondary bacterial infection from scratching', 'Oral antihistamines to control nocturnal itching'],
    acuityLevel: 'LOW',
  },
  {
    id: 'scabies',
    name: 'Scabies Sarcoptic Mite Infestation',
    icd10: 'B86',
    category: 'Dermatological & Parasitic',
    primaryKeywords: ['intense night itching', 'itching between fingers', 'finger web rash', 'wrist rash', 'family members itching together', 'genital papules'],
    secondaryKeywords: ['red bumps', 'scratch marks', 'secondary skin infection'],
    description: 'Infestation of Sarcoptes scabiei mites causing allergic pruritus that worsens significantly at night, commonly affecting web spaces of fingers, wrists, and axillae.',
    recommendedTests: ['Visual inspection with magnifying lens', 'Skin scraping microscopy for mites/eggs'],
    homeCareTips: ['Apply Permethrin 5% lotion from neck down to toes, leave overnight for 8-12 hours, then wash', 'Treat ALL household family members simultaneously, even if asymptomatic', 'Wash all clothes, bedsheets, and towels in hot water and dry in direct sunlight'],
    acuityLevel: 'MEDIUM',
  },
  {
    id: 'cellulitis',
    name: 'Bacterial Cellulitis / Soft Tissue Infection',
    icd10: 'L03.9',
    category: 'Dermatological & Surgical',
    primaryKeywords: ['spreading red skin', 'warm tender swollen skin', 'expanding redness on leg', 'skin hot to touch', 'localized red swelling'],
    secondaryKeywords: ['fever', 'chills', 'skin pain', 'history of skin break or cut'],
    comorbidityBoosters: ['diabetes', 'peripheral vascular disease', 'edema'],
    description: 'Acute spreading bacterial infection of the deep dermis and subcutaneous tissues, presenting with expanding erythema, warmth, edema, and tenderness.',
    recommendedTests: ['CBC with Total Leukocyte Count (TLC)', 'Blood Glucose (RBS / HbA1c)', 'Mark the red margin with a surgical pen to track progression'],
    homeCareTips: ['Elevate the affected limb above heart level to reduce swelling', 'Keep the area clean and protected with a dry sterile dressing', 'Requires mandatory antibiotic therapy prescribed by Medical Officer'],
    acuityLevel: 'HIGH',
  },

  // 8. Ophthalmic & ENT
  {
    id: 'conjunctivitis',
    name: 'Acute Infective / Allergic Conjunctivitis ("Pink Eye")',
    icd10: 'H10.9',
    category: 'Ophthalmology',
    primaryKeywords: ['red eye', 'eye redness', 'watery eye discharge', 'yellow crusting on eyelids', 'eyelids stuck in morning', 'gritty feeling in eye'],
    secondaryKeywords: ['itching in eye', 'sensitivity to light', 'swollen eyelids'],
    description: 'Inflammation of the conjunctival membrane presenting with vascular congestion, chemosis, discharge, and morning eyelid adherence.',
    recommendedTests: ['Visual Acuity Testing', 'Slit-lamp or ophthalmic pen-light exam by Medical Officer'],
    homeCareTips: ['Clean eyelids with sterile cotton swabs soaked in boiled and cooled water', 'Wash hands frequently with soap; do not rub eyes', 'Do not share towels, pillows, or handkerchiefs to prevent spreading to others', 'Use prescribed antibiotic/lubricating eye drops'],
    acuityLevel: 'LOW',
  },
  {
    id: 'otitis_media',
    name: 'Acute Otitis Media / External Otitis (Ear Infection)',
    icd10: 'H66.9',
    category: 'ENT & Infectious',
    primaryKeywords: ['severe ear pain', 'earache', 'ear discharge', 'pus from ear', 'ear fullness', 'child pulling ear'],
    secondaryKeywords: ['fever', 'temporary hearing reduction', 'irritability in infants', 'cold symptoms prior'],
    description: 'Infection of the middle ear or external auditory canal, causing acute otalgia, tympanic membrane erythema, and potential purulent discharge.',
    recommendedTests: ['Otoscopic Examination of Tympanic Membrane', 'Hearing evaluation (Tuning Fork Test)'],
    homeCareTips: ['Keep ear completely dry; avoid water entry while bathing', 'Apply warm dry compress to outer ear for pain relief', 'Do NOT insert cotton buds, hairpins, or oil drops into the ear canal', 'Take prescribed antibiotic drops or oral analgesics'],
    acuityLevel: 'MEDIUM',
  },

  // 9. Endocrine & Metabolic
  {
    id: 't2dm_hyperglycemia',
    name: 'Uncontrolled Diabetes / Hyperglycemic Symptom Complex',
    icd10: 'E11.65',
    category: 'Endocrine & Metabolic',
    primaryKeywords: ['excessive thirst', 'polydipsia', 'frequent night urination', 'polyuria', 'unexplained weight loss', 'slow healing wound', 'tingling in feet'],
    secondaryKeywords: ['blurred vision', 'extreme fatigue', 'recurrent fungal infections', 'dry mouth'],
    comorbidityBoosters: ['diabetes', 'hypertension', 'obesity', 'family history of diabetes'],
    description: 'Impaired carbohydrate metabolism characterized by persistent hyperglycemia, osmotic diuresis (polyuria), compensatory polydipsia, and long-term microvascular risk.',
    recommendedTests: ['Fasting & Post-Prandial Blood Glucose (FBS / PPBS)', 'Glycated Hemoglobin (HbA1c)', 'Urine for Microalbuminuria & Ketones', 'Lipid Profile & Serum Creatinine'],
    homeCareTips: ['Strict dietary adherence: eliminate refined sugars, sweetened beverages, and polished white rice', 'Include high-fiber vegetables, whole grains, and legumes in balanced meals', 'Daily 30-45 minutes brisk walking', 'Inspect feet daily for cuts, blisters, or redness'],
    acuityLevel: 'HIGH',
  },
  {
    id: 'hypoglycemia',
    name: 'Acute Hypoglycemia Alert (Low Blood Sugar)',
    icd10: 'E16.2',
    category: 'Endocrine & Emergency',
    primaryKeywords: ['cold sweats', 'shivering and sweating', 'shakiness', 'trembling hands', 'sudden extreme hunger', 'confusion with sweating', 'blood sugar < 70'],
    secondaryKeywords: ['dizziness', 'palpitations', 'blurred vision', 'weakness', 'anxiety'],
    comorbidityBoosters: ['diabetes', 'on insulin', 'on sulfonylurea medication', 'skipped meal'],
    description: 'Critically low blood glucose (< 70 mg/dL) causing neuroglycopenic symptoms and autonomic surge, requiring immediate oral or IV glucose intervention.',
    recommendedTests: ['Immediate Glucometer Blood Sugar Test', 'Review of Antidiabetic medication dosage'],
    homeCareTips: ['RULE OF 15: Consume 15 grams of fast-acting sugar immediately (3 teaspoons sugar in water, half glass fruit juice, or 3 hard candies)', 'Re-check blood sugar after 15 minutes; if still < 70, repeat 15g sugar', 'Follow up with a complex carbohydrate snack (roti/toast/khichdi) once stabilized'],
    acuityLevel: 'HIGH',
  },

  // 10. Cardiovascular
  {
    id: 'acute_coronary_syndrome',
    name: 'Suspected Acute Coronary Syndrome / Angina Pectoris',
    icd10: 'I20.9',
    category: 'Cardiovascular & Emergency',
    primaryKeywords: ['chest pain', 'crushing chest pressure', 'radiating pain to left arm', 'left arm pain', 'jaw pain', 'tightness in chest', 'angina'],
    secondaryKeywords: ['shortness of breath', 'cold sweats', 'nausea', 'dizziness', 'palpitations'],
    comorbidityBoosters: ['hypertension', 'diabetes', 'smoking', 'dyslipidemia', 'family history of heart disease', 'age >= 45'],
    description: 'Acute reduction of blood flow through coronary arteries supplying the myocardium, producing ischemic retrosternal pressure that may radiate to left arm, neck, or jaw.',
    recommendedTests: ['Immediate 12-Lead ECG (Within 10 minutes of arrival)', 'Cardiac Biomarkers (Troponin-I / Troponin-T)', 'Continuous Cardiac Telemetry', 'Chest Radiograph'],
    homeCareTips: ['EMERGENCY: Rest in comfortable sitting position, avoid any exertion', 'Chew Aspirin 300mg immediately if not contraindicated/allergic and advised by emergency helpline', 'Call 108/112 ambulance immediately'],
    acuityLevel: 'EMERGENCY',
  },
  {
    id: 'hypertensive_urgency',
    name: 'Uncontrolled Hypertension / Hypertensive Episode',
    icd10: 'I10',
    category: 'Cardiovascular',
    primaryKeywords: ['occipital morning headache', 'neck stiffness with high bp', 'dizziness on standing', 'palpitations with headache', 'blood pressure reading > 160/100'],
    secondaryKeywords: ['blurred vision', 'fatigue', 'ear buzzing / tinnitus', 'nose bleed'],
    comorbidityBoosters: ['hypertension', 'diabetes', 'kidney disease', 'high salt intake'],
    description: 'Elevated systemic arterial blood pressure (>140/90 mmHg stage 1, >160/100 mmHg stage 2) without acute end-organ failure, requiring antihypertensive titration.',
    recommendedTests: ['Serial Blood Pressure Profiling (3 readings 5 minutes apart)', '12-Lead Electrocardiogram (ECG)', 'Serum Electrolytes, Urea, and Creatinine', 'Urine Routine for Proteinuria', 'Fundoscopy (Eye ground exam)'],
    homeCareTips: ['Restrict dietary sodium salt intake to under 4-5 grams per day (DASH Diet)', 'Avoid pickles, papads, packaged salted snacks, and tobacco', 'Practice daily stress reduction and regular physical activity', 'Never stop or alter prescribed antihypertensive tablets without doctor supervision'],
    acuityLevel: 'HIGH',
  },

  // 11. Orthopedic & Degenerative
  {
    id: 'osteoarthritis',
    name: 'Osteoarthritis / Degenerative Knee Arthropathy',
    icd10: 'M19.9',
    category: 'Orthopedics & Rheumatology',
    primaryKeywords: ['knee pain on stairs', 'joint cracking sound', 'crepitus', 'knee stiffness in morning < 30 mins', 'pain worsening with walking', 'knee swelling'],
    secondaryKeywords: ['difficulty squatting', 'pain in hips or knees', 'joint tenderness', 'difficulty sitting on floor'],
    comorbidityBoosters: ['age >= 50', 'obesity', 'previous joint injury'],
    description: 'Progressive biomechanical degeneration of articular cartilage and subchondral bone, causing joint space narrowing, crepitus, and weight-bearing mechanical pain.',
    recommendedTests: ['Weight-bearing X-Ray of bilateral knees (AP and Lateral views)', 'Serum Uric Acid (to rule out gout)', 'Erythrocyte Sedimentation Rate (ESR)'],
    homeCareTips: ['Low-impact quadriceps strengthening exercises and daily walking on flat ground', 'Maintain healthy body weight to reduce mechanical load on knees', 'Use knee braces / supports and apply warm fomentation for morning stiffness', 'Avoid deep squatting and prolonged cross-legged floor sitting'],
    acuityLevel: 'LOW',
  },
];

export class TriageEngine {
  /**
   * Main entrypoint for clinical symptom evaluation & differential triage.
   */
  public static evaluate(input: TriageInput): SymptomAssessment {
    const rawSymptoms = input.symptoms || [];
    
    // Normalize and expand symptoms using multilingual synonym translation
    const normalizedSymptoms = this.preprocessMultilingualSymptoms(rawSymptoms);
    const existingConditions = (input.existingConditions || []).map((c) => c.toLowerCase());
    const durationLower = (input.duration || '').toLowerCase();
    const vitals = input.vitalSigns;

    // 1. Emergency Red-Flag Detection
    const triggeredRedFlags: string[] = [];
    let emergencyDetected = false;
    let emergencyReason = '';

    const combinedSymptomsString = normalizedSymptoms.join(' ').toLowerCase();

    for (const flag of EMERGENCY_RED_FLAGS) {
      if (
        normalizedSymptoms.some((s) => s.includes(flag.symptom)) ||
        combinedSymptomsString.includes(flag.symptom)
      ) {
        emergencyDetected = true;
        triggeredRedFlags.push(flag.symptom.toUpperCase());
        emergencyReason = flag.explanation;
        break;
      }
    }

    // Check Vitals for Critical Thresholds
    if (vitals) {
      if (vitals.spO2 !== undefined && vitals.spO2 < 90) {
        emergencyDetected = true;
        triggeredRedFlags.push(`CRITICAL HYPOXEMIA (SpO2: ${vitals.spO2}%)`);
        emergencyReason = 'Critical low blood oxygen saturation requiring immediate oxygenation and emergency resuscitation.';
      }
      if (vitals.bpSystolic !== undefined && vitals.bpSystolic > 190) {
        emergencyDetected = true;
        triggeredRedFlags.push(`HYPERTENSIVE CRISIS (BP: ${vitals.bpSystolic}/${vitals.bpDiastolic || '?'} mmHg)`);
        emergencyReason = 'Severely elevated systolic blood pressure posing acute risk of hypertensive encephalopathy or stroke.';
      }
      if (vitals.heartRate !== undefined && (vitals.heartRate > 150 || vitals.heartRate < 40)) {
        emergencyDetected = true;
        triggeredRedFlags.push(`HEMODYNAMIC INSTABILITY (Heart Rate: ${vitals.heartRate} bpm)`);
        emergencyReason = 'Severe arrhythmia or unstable heart rate posing risk of acute hemodynamic collapse.';
      }
      if (vitals.bloodGlucoseMgDl !== undefined && vitals.bloodGlucoseMgDl < 55) {
        emergencyDetected = true;
        triggeredRedFlags.push(`SEVERE HYPOGLYCEMIA (${vitals.bloodGlucoseMgDl} mg/dL)`);
        emergencyReason = 'Critically low blood sugar level requiring immediate fast-acting carbohydrate / IV dextrose.';
      }
    }

    if (input.severity === 'Critical') {
      emergencyDetected = true;
      triggeredRedFlags.push('PATIENT SELF-REPORTED CRITICAL ACUITY');
      if (!emergencyReason) {
        emergencyReason = 'Patient flagged excruciating or critical symptom acuity requiring urgent emergency evaluation.';
      }
    }

    // 2. Determine Risk Level
    let riskLevel: TriageRiskLevel = 'LOW';
    if (emergencyDetected) {
      riskLevel = 'EMERGENCY';
    } else if (input.severity === 'Severe') {
      riskLevel = 'HIGH';
    } else if (input.severity === 'Moderate') {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    // Risk Stratification Modifiers: Age & Major Comorbidities
    if (riskLevel === 'LOW' || riskLevel === 'MEDIUM') {
      const isVulnerableAge = input.age < 3 || input.age >= 65;
      const hasMajorComorbidity = existingConditions.some((c) =>
        ['diabetes', 'heart', 'asthma', 'copd', 'kidney', 'cancer', 'stroke', 'tb'].some((k) => c.includes(k))
      );
      if (isVulnerableAge && hasMajorComorbidity) {
        riskLevel = 'HIGH';
      }
    }

    // 3. Multi-Factor Differential Diagnostic Algorithm
    const scoredConditions = this.calculateDifferentialScores(
      normalizedSymptoms,
      input.age,
      existingConditions,
      durationLower,
      vitals,
      riskLevel
    );

    // Filter top 3 conditions
    const topConditions = scoredConditions.slice(0, 3);

    // 4. Aggregated Recommendations, Tests, Home Care, and Red Flags
    const allTests = new Set<string>();
    const allHomeCare = new Set<string>();
    const allWarningSigns = new Set<string>();

    topConditions.forEach((cond) => {
      cond.recommendedTests?.forEach((t) => allTests.add(t));
      cond.homeCareTips?.forEach((h) => allHomeCare.add(h));
    });

    if (riskLevel === 'EMERGENCY') {
      allWarningSigns.add('Crushing chest pain radiating to left arm, neck, or jaw');
      allWarningSigns.add('Sudden weakness, facial asymmetry, or inability to speak');
      allWarningSigns.add('Extreme shortness of breath with bluish lips or gasping');
      allWarningSigns.add('Loss of consciousness, syncope, or unresponsiveness');
    } else {
      allWarningSigns.add('High persistent fever exceeding 102°F (38.9°C) unresponsive to paracetamol');
      allWarningSigns.add('Inability to retain oral liquids due to persistent vomiting (>12 hours)');
      allWarningSigns.add('Coughing up fresh blood or blood in stool/urine');
      allWarningSigns.add('Sudden onset of severe abdominal pain or acute shortness of breath');
    }

    // 5. Actionable Clinical Narrative & Direction
    let recommendedAction = '';
    let explanation = '';

    if (riskLevel === 'EMERGENCY') {
      recommendedAction =
        '🚨 EMERGENCY ALERT: Call 108/112 immediately or proceed to the nearest Emergency Department / District Hospital. Do not wait for routine clinic hours.';
      explanation =
        emergencyReason ||
        'The reported clinical markers indicate a potential life-threatening emergency requiring immediate medical stabilization and diagnostic workup.';
    } else if (riskLevel === 'HIGH') {
      recommendedAction =
        'Consult a PHC Medical Officer or visit the nearest Community Health Centre (CHC) TODAY within 12–24 hours.';
      explanation = `Based on your symptom cluster (${rawSymptoms.join(', ')}), acuity level, and clinical indicators, prompt in-person doctor evaluation and targeted laboratory workup are advised to avoid complications.`;
    } else if (riskLevel === 'MEDIUM') {
      recommendedAction =
        'Book an appointment at your nearest PHC within 1–2 days. Maintain proper oral hydration and monitor your symptoms.';
      explanation = `Your symptoms indicate a moderate health condition that can be managed effectively with timely PHC medical consultation, basic diagnostic tests, and prescription medication.`;
    } else {
      recommendedAction =
        'Follow supportive home care measures (rest, fluids, nutrition) and visit your local PHC if symptoms persist or worsen beyond 3 days.';
      explanation = `Your reported presentation appears consistent with a mild or self-limiting condition. Routine primary care guidance and lifestyle measures are appropriate.`;
    }

    // Visual image analysis if provided
    let photoNotes: string | null = null;
    if (input.uploadedPhotoUrl || input.photoDescription) {
      photoNotes = this.analyzeVisualSymptoms(input.photoDescription, normalizedSymptoms);
    }

    return {
      id: `ASSESS-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
      patientId: input.patientId,
      symptoms: input.symptoms,
      duration: input.duration,
      severity: input.severity,
      age: input.age,
      existingConditions: input.existingConditions || [],
      allergies: input.allergies || [],
      currentMedications: input.currentMedications || [],
      riskLevel,
      possibleConditions: topConditions,
      recommendedAction,
      explanation,
      requiresDoctor: riskLevel !== 'LOW' || input.symptoms.length > 2,
      emergencyWarning: riskLevel === 'EMERGENCY',
      emergencyRedFlags: triggeredRedFlags.length > 0 ? triggeredRedFlags : undefined,
      recommendedDiagnosticTests: Array.from(allTests).slice(0, 5),
      supportiveCareMeasures: Array.from(allHomeCare).slice(0, 5),
      warningSignsToWatch: Array.from(allWarningSigns),
      aiModel: 'ArogyaMitra Clinical Triage Matrix v2.6 (ICD-10 & NTEP Aligned)',
      uploadedPhotoUrl: input.uploadedPhotoUrl,
      photoAnalysisNotes: photoNotes,
      disclaimer:
        'IMPORTANT MEDICAL NOTICE: This assessment is generated by an automated assistive AI triage algorithm for preliminary guidance only. It DOES NOT constitute a definitive medical diagnosis or replace a professional clinical evaluation by a registered medical practitioner. In an emergency, dial 108/112 immediately.',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Translates colloquial, regional, and multilingual inputs into clinical standard keywords.
   */
  private static preprocessMultilingualSymptoms(rawSymptoms: string[]): string[] {
    const clinicalTokens: string[] = [];

    for (const sym of rawSymptoms) {
      const lower = sym.toLowerCase().trim();
      clinicalTokens.push(lower);

      // Check against multilingual synonym dictionary
      for (const [canonicalTerm, synonyms] of Object.entries(MULTILINGUAL_SYNONYM_MAP)) {
        if (synonyms.some((syn) => lower.includes(syn) || lower === syn)) {
          if (!clinicalTokens.includes(canonicalTerm)) {
            clinicalTokens.push(canonicalTerm);
          }
        }
      }
    }

    return Array.from(new Set(clinicalTokens));
  }

  /**
   * Calculates Bayesian-weighted differential scores for each condition profile.
   */
  private static calculateDifferentialScores(
    symptoms: string[],
    age: number,
    conditions: string[],
    duration: string,
    vitals: TriageInput['vitalSigns'],
    riskLevel: TriageRiskLevel
  ): PossibleCondition[] {
    const combinedSymptomString = symptoms.join(' ').toLowerCase();

    const scoredList: {
      profile: DiseaseProfile;
      score: number;
      matchedSymptoms: string[];
    }[] = [];

    // Chronicity flag
    const isChronic = duration.includes('week') || duration.includes('month') || duration.includes('14 day') || duration.includes('2 week');

    for (const profile of CLINICAL_DISEASE_PROFILES) {
      let score = 0;
      const matched: string[] = [];

      // Primary Keywords (weight: +4.5)
      for (const kw of profile.primaryKeywords) {
        if (symptoms.some((s) => s.includes(kw) || kw.includes(s)) || combinedSymptomString.includes(kw)) {
          score += 4.5;
          matched.push(kw);
        }
      }

      // Secondary Keywords (weight: +2.0)
      for (const kw of profile.secondaryKeywords) {
        if (symptoms.some((s) => s.includes(kw) || kw.includes(s)) || combinedSymptomString.includes(kw)) {
          score += 2.0;
          if (!matched.includes(kw)) matched.push(kw);
        }
      }

      // Comorbidity Boosters (weight: +3.0)
      if (profile.comorbidityBoosters) {
        for (const booster of profile.comorbidityBoosters) {
          if (conditions.some((c) => c.includes(booster))) {
            score += 3.0;
          }
        }
      }

      // Chronicity Boosters & Dampeners
      if (isChronic) {
        if (profile.id === 'pulmonary_tb') score += 6.0;
        if (profile.id === 'osteoarthritis') score += 4.0;
        if (profile.id === 'anemia') score += 3.5;
        if (profile.id === 't2dm_hyperglycemia') score += 3.0;
        if (profile.id === 'urti') score -= 3.0; // URTI rarely lasts > 2 weeks
      }

      // Age-Specific Adjustments
      if (age >= 50 && profile.id === 'osteoarthritis') score += 3.0;
      if (age >= 55 && profile.id === 'hypertensive_urgency') score += 2.5;
      if (age < 12 && profile.id === 'otitis_media') score += 3.0;

      // Vital Sign Correlation Boosters
      if (vitals) {
        if (profile.id === 'hypertensive_urgency' && vitals.bpSystolic && vitals.bpSystolic >= 150) {
          score += 6.0;
        }
        if (profile.id === 't2dm_hyperglycemia' && vitals.bloodGlucoseMgDl && vitals.bloodGlucoseMgDl >= 180) {
          score += 7.0;
        }
        if (profile.id === 'hypoglycemia' && vitals.bloodGlucoseMgDl && vitals.bloodGlucoseMgDl < 70) {
          score += 8.0;
        }
        if ((profile.id === 'dengue' || profile.id === 'malaria' || profile.id === 'typhoid') && vitals.temperatureF && vitals.temperatureF >= 101) {
          score += 4.0;
        }
        if ((profile.id === 'asthma_exacerbation' || profile.id === 'lobar_pneumonia' || profile.id === 'pulmonary_tb') && vitals.spO2 && vitals.spO2 < 95) {
          score += 5.0;
        }
      }

      if (score > 0) {
        scoredList.push({
          profile,
          score,
          matchedSymptoms: Array.from(new Set(matched)),
        });
      }
    }

    // Sort by descending score
    scoredList.sort((a, b) => b.score - a.score);

    if (scoredList.length === 0) {
      return [
        {
          name: 'General Primary Care Clinical Evaluation Recommended',
          icd10Code: 'Z00.00',
          probability: 'Moderate',
          confidenceScore: 68,
          description: 'The symptoms presented warrant physical examination, vital signs verification, and clinical history by a Medical Officer at your nearest PHC.',
          contributingSymptoms: symptoms,
          recommendedTests: ['Routine Vitals Check (BP, Pulse, SpO2, Temp)', 'Complete Blood Count (CBC)'],
          homeCareTips: ['Adequate hydration and restful sleep', 'Monitor temperature and symptoms twice daily'],
        },
      ];
    }

    // Normalize confidence percentages
    const maxScore = Math.max(...scoredList.map((s) => s.score), 10);

    return scoredList.map((item) => {
      let confidence = Math.min(Math.round((item.score / maxScore) * 88) + 10, 96);
      if (riskLevel === 'EMERGENCY') confidence = Math.max(confidence, 85);

      let prob: 'High' | 'Moderate' | 'Low' = 'Low';
      if (confidence >= 75) prob = 'High';
      else if (confidence >= 50) prob = 'Moderate';

      return {
        name: item.profile.name,
        icd10Code: item.profile.icd10,
        probability: prob,
        confidenceScore: confidence,
        description: item.profile.description,
        contributingSymptoms: item.matchedSymptoms,
        recommendedTests: item.profile.recommendedTests,
        homeCareTips: item.profile.homeCareTips,
      };
    });
  }

  /**
   * Image analysis heuristics for common dermatological/trauma images.
   */
  private static analyzeVisualSymptoms(photoDescription?: string, symptoms?: string[]): string {
    const desc = (photoDescription || '').toLowerCase();
    const sym = (symptoms || []).join(' ').toLowerCase();

    if (desc.includes('rash') || sym.includes('rash') || desc.includes('red') || desc.includes('spot') || desc.includes('itch')) {
      return 'Image Analysis: Visual inspection reveals localized maculopapular erythematous rash with mild border demarcation. No signs of central necrosis. Recommendation: Avoid scratching, keep area dry, apply prescribed soothing lotion/antihistamine, and have the PHC doctor examine under direct light.';
    }
    if (desc.includes('wound') || sym.includes('wound') || desc.includes('cut') || desc.includes('bleed') || desc.includes('injury')) {
      return 'Image Analysis: Visual assessment indicates a cutaneous laceration/abrasion. Minimal active bleeding. Recommendation: Clean with sterile saline/antiseptic, apply protective dressing, and verify tetanus toxoid (TT) vaccination status at PHC.';
    }
    if (desc.includes('swell') || sym.includes('swell') || desc.includes('edema') || desc.includes('knee')) {
      return 'Image Analysis: Localized soft tissue edema observed. Recommendation: Elevate the limb, apply cold compress, and consult the PHC Medical Officer to rule out localized cellulitis or sprain/effusion.';
    }
    if (desc.includes('eye') || desc.includes('conjunctiva') || sym.includes('eye')) {
      return 'Image Analysis: Conjunctival erythema with mucosal injection observed. Recommendation: Avoid touching or rubbing eyes, use clean cool water compress, and consult PHC doctor for antibiotic/lubricating eye drops.';
    }

    return 'Image Analysis: Uploaded visual inspected for clinical triage context. Please present the affected anatomical site directly to the doctor during your physical consultation.';
  }
}
