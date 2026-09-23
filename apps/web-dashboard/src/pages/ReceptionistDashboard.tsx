import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  UserPlus,
  HeartPulse,
  Activity,
  Thermometer,
  Wind,
  Gauge,
  Scale,
  Ruler,
  Calculator,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  X,
  Eye,
  FileCheck,
  UserCheck,
  Building2,
  Calendar,
  Clock,
  Printer,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Hash,
  HelpCircle,
} from 'lucide-react';
import {
  ReceptionistProfile,
  PatientProfile,
  PreConsultationCheckup,
  MedicalTestItem,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  receptionistId?: string;
  activeTab?: 'checkup' | 'queue' | 'patients';
  onSelectTab?: (tab: 'checkup' | 'queue' | 'patients') => void;
}

interface FormErrors {
  fullName?: string;
  age?: string;
  gender?: string;
  patientId?: string;
  bpSystolic?: string;
  bpDiastolic?: string;
  pulseRate?: string;
  bodyTemperature?: string;
  respiratoryRate?: string;
  height?: string;
  weight?: string;
}

export const ReceptionistDashboard: React.FC<Props> = ({
  receptionistId = 'rec-001',
  activeTab = 'checkup',
  onSelectTab,
}) => {
  const [tab, setTab] = useState<'checkup' | 'queue' | 'patients'>(activeTab);
  const [profile, setProfile] = useState<ReceptionistProfile | null>(null);

  // Overview stats
  const [metrics, setMetrics] = useState({
    totalToday: 0,
    waitingDoctorCount: 0,
    completedToday: 0,
    emergencyFlagsCount: 0,
    avgPreCheckMinutes: 4.2,
  });

  // Recent checkups list
  const [checkupList, setCheckupList] = useState<PreConsultationCheckup[]>([]);
  const [loading, setLoading] = useState(false);

  // Patient Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PatientProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [isNewPatientMode, setIsNewPatientMode] = useState(true);

  // Patient Details Section Form
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [patientIdCode, setPatientIdCode] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+ve');

  // Vital Signs Section Form
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [pulseRate, setPulseRate] = useState('72');
  const [bodyTemperature, setBodyTemperature] = useState('36.8');
  const [respiratoryRate, setRespiratoryRate] = useState('16');

  // Basic Measurements Section Form
  const [height, setHeight] = useState('170');
  const [weight, setWeight] = useState('68');

  // Other Medical Tests Section Form
  const [otherTestsNotes, setOtherTestsNotes] = useState('');
  const [testRows, setTestRows] = useState<MedicalTestItem[]>([
    {
      id: 'test-1',
      testName: 'SpO2 (Pulse Oximetry)',
      resultValue: '98',
      unit: '%',
      notes: 'Room Air',
    },
    {
      id: 'test-2',
      testName: 'Blood Sugar (Random)',
      resultValue: '110',
      unit: 'mg/dL',
      notes: 'Post meal',
    },
  ]);

  // Validation & UI Feedback
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [lastSavedCheckup, setLastSavedCheckup] = useState<PreConsultationCheckup | null>(null);

  // Synchronize internal tab with prop
  useEffect(() => {
    if (activeTab) setTab(activeTab);
  }, [activeTab]);

  const handleTabChange = (newTab: 'checkup' | 'queue' | 'patients') => {
    setTab(newTab);
    if (onSelectTab) onSelectTab(newTab);
  };

  // Load profile & overview on mount
  useEffect(() => {
    loadOverview();
    generateNewPatientId();
  }, [receptionistId]);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/receptionist/overview');
      if (res.success && res.metrics) {
        setMetrics({
          totalToday: res.metrics.totalToday,
          waitingDoctorCount: res.metrics.waitingDoctorCount,
          completedToday: res.metrics.completedToday,
          emergencyFlagsCount: res.metrics.emergencyFlagsCount,
          avgPreCheckMinutes: res.metrics.avgPreCheckMinutes,
        });
        setCheckupList(res.metrics.recentCheckups || []);
      }
    } catch (e) {
      console.error('Error loading receptionist overview:', e);
    } finally {
      setLoading(false);
    }
  };

  // Generate Unique Patient ID
  const generateNewPatientId = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newId = `PHC-PAT-2026-${randomNum}`;
    setPatientIdCode(newId);
    return newId;
  };

  // Live Auto-calculated BMI
  const calculateBMI = (): { value: number | null; category: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' | null } => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!h || !w || h <= 0 || w <= 0) return { value: null, category: null };
    const heightInMeters = h / 100;
    const bmiVal = parseFloat((w / (heightInMeters * heightInMeters)).toFixed(2));

    let cat: 'Underweight' | 'Normal' | 'Overweight' | 'Obese' = 'Normal';
    if (bmiVal < 18.5) cat = 'Underweight';
    else if (bmiVal < 25) cat = 'Normal';
    else if (bmiVal < 30) cat = 'Overweight';
    else cat = 'Obese';

    return { value: bmiVal, category: cat };
  };

  const bmiData = calculateBMI();

  // Search existing patients
  const handleSearchPatient = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const res = await apiClient.get('/receptionist/patients', { search: query.trim() });
      if (res.success && res.patients) {
        setSearchResults(res.patients);
      }
    } catch (err) {
      console.error('Patient search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Select patient from search dropdown
  const selectExistingPatient = (pat: PatientProfile) => {
    setSelectedPatient(pat);
    setIsNewPatientMode(false);
    setFullName(pat.fullName);
    setAge(String(pat.age));
    setGender(pat.gender);
    setPatientIdCode(pat.patientId);
    setPhone(pat.phone || '');
    setAddress(pat.address || '');
    setBloodGroup(pat.bloodGroup || 'O+ve');
    setSearchResults([]);
    setSearchQuery('');
    setErrors({});
    setSuccessMessage(null);
  };

  // Switch to New Patient Mode
  const handleSwitchToNewPatient = () => {
    setSelectedPatient(null);
    setIsNewPatientMode(true);
    setFullName('');
    setAge('');
    setGender('Male');
    setPhone('');
    setAddress('');
    setBloodGroup('O+ve');
    generateNewPatientId();
    setErrors({});
    setSuccessMessage(null);
  };

  // Add Dynamic Test Row
  const handleAddTestRow = () => {
    const newRow: MedicalTestItem = {
      id: `test-${Date.now()}`,
      testName: '',
      resultValue: '',
      unit: '',
      notes: '',
    };
    setTestRows([...testRows, newRow]);
  };

  // Update Test Row
  const handleUpdateTestRow = (id: string, field: keyof MedicalTestItem, value: string) => {
    setTestRows(
      testRows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  // Remove Test Row
  const handleRemoveTestRow = (id: string) => {
    setTestRows(testRows.filter((row) => row.id !== id));
  };

  // Check if form is dirty
  const isFormDirty = (): boolean => {
    return Boolean(
      fullName.trim() ||
      age.trim() ||
      phone.trim() ||
      address.trim() ||
      otherTestsNotes.trim() ||
      testRows.length > 0
    );
  };

  // Validate all inputs & sensible ranges
  const validateForm = (): boolean => {
    const errs: FormErrors = {};

    // 1. Patient Details Validation
    if (!fullName.trim()) {
      errs.fullName = 'Patient full name is required.';
    } else if (fullName.trim().length < 2) {
      errs.fullName = 'Please enter a valid name (at least 2 characters).';
    }

    if (!age.trim()) {
      errs.age = 'Age is required.';
    } else {
      const ageNum = Number(age);
      if (isNaN(ageNum) || ageNum < 0 || ageNum > 125) {
        errs.age = 'Enter a realistic age between 0 and 125 years.';
      }
    }

    if (!gender) {
      errs.gender = 'Gender selection is required.';
    }

    if (!patientIdCode.trim()) {
      errs.patientId = 'Patient ID is required.';
    }

    // 2. Vital Signs Range Validation
    if (bpSystolic.trim()) {
      const sysNum = Number(bpSystolic);
      if (isNaN(sysNum) || sysNum < 60 || sysNum > 260) {
        errs.bpSystolic = 'Systolic BP must be between 60 and 260 mmHg.';
      }
    }

    if (bpDiastolic.trim()) {
      const diaNum = Number(bpDiastolic);
      if (isNaN(diaNum) || diaNum < 40 || diaNum > 160) {
        errs.bpDiastolic = 'Diastolic BP must be between 40 and 160 mmHg.';
      }
    }

    if (pulseRate.trim()) {
      const pulseNum = Number(pulseRate);
      if (isNaN(pulseNum) || pulseNum < 30 || pulseNum > 220) {
        errs.pulseRate = 'Pulse rate must be between 30 and 220 bpm.';
      }
    }

    if (bodyTemperature.trim()) {
      const tempNum = Number(bodyTemperature);
      if (isNaN(tempNum) || tempNum < 32 || tempNum > 44) {
        errs.bodyTemperature = 'Temperature must be between 32°C and 44°C.';
      }
    }

    if (respiratoryRate.trim()) {
      const respNum = Number(respiratoryRate);
      if (isNaN(respNum) || respNum < 8 || respNum > 60) {
        errs.respiratoryRate = 'Respiratory rate must be between 8 and 60 breaths/min.';
      }
    }

    // 3. Basic Measurements Validation
    if (height.trim()) {
      const hNum = Number(height);
      if (isNaN(hNum) || hNum < 30 || hNum > 250) {
        errs.height = 'Height must be between 30 and 250 cm.';
      }
    }

    if (weight.trim()) {
      const wNum = Number(weight);
      if (isNaN(wNum) || wNum < 1 || wNum > 300) {
        errs.weight = 'Weight must be between 1 and 300 kg.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Open Review Dialog
  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setShowReviewModal(true);
    }
  };

  // Commit & Save Checkup to Backend
  const handleConfirmSave = async () => {
    try {
      setLoading(true);
      setShowReviewModal(false);

      const payload = {
        patientId: selectedPatient?.id || undefined,
        patientCode: patientIdCode.trim(),
        patientName: fullName.trim(),
        patientAge: Number(age),
        patientGender: gender,
        patientPhone: phone.trim() || undefined,
        patientAddress: address.trim() || undefined,
        bloodGroup,
        vitals: {
          bpSystolic: bpSystolic.trim() ? Number(bpSystolic) : undefined,
          bpDiastolic: bpDiastolic.trim() ? Number(bpDiastolic) : undefined,
          pulseRate: pulseRate.trim() ? Number(pulseRate) : undefined,
          bodyTemperature: bodyTemperature.trim() ? Number(bodyTemperature) : undefined,
          respiratoryRate: respiratoryRate.trim() ? Number(respiratoryRate) : undefined,
        },
        measurements: {
          height: height.trim() ? Number(height) : undefined,
          weight: weight.trim() ? Number(weight) : undefined,
          bmi: bmiData.value || undefined,
          bmiCategory: bmiData.category || undefined,
        },
        otherTestsNotes: otherTestsNotes.trim() || undefined,
        otherTests: testRows.filter((t) => t.testName.trim()),
      };

      const res = await apiClient.post('/receptionist/checkup', payload);

      if (res.success && res.checkup) {
        setSuccessMessage('Patient details and pre-consultation measurements saved successfully.');
        setLastSavedCheckup(res.checkup);
        loadOverview();
      } else {
        alert(res.message || 'Failed to save patient pre-consultation checkup.');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      alert(err.message || 'Network error while saving checkup.');
    } finally {
      setLoading(false);
    }
  };

  // Reset form to clean state
  const resetFormState = () => {
    setSelectedPatient(null);
    setIsNewPatientMode(true);
    setFullName('');
    setAge('');
    setGender('Male');
    setPhone('');
    setAddress('');
    setBloodGroup('O+ve');
    setBpSystolic('120');
    setBpDiastolic('80');
    setPulseRate('72');
    setBodyTemperature('36.8');
    setRespiratoryRate('16');
    setHeight('170');
    setWeight('68');
    setOtherTestsNotes('');
    setTestRows([
      { id: 'test-1', testName: 'SpO2 (Pulse Oximetry)', resultValue: '98', unit: '%', notes: 'Room Air' },
    ]);
    generateNewPatientId();
    setErrors({});
    setSuccessMessage(null);
    setShowClearConfirmModal(false);
    setShowCancelConfirmModal(false);
  };

  // Clear Form handler
  const handleClearClick = () => {
    if (isFormDirty()) {
      setShowClearConfirmModal(true);
    } else {
      resetFormState();
    }
  };

  // Cancel handler
  const handleCancelClick = () => {
    if (isFormDirty()) {
      setShowCancelConfirmModal(true);
    } else {
      resetFormState();
    }
  };

  return (
    <div className="dash-content">
      {/* Top Header Card */}
      <div className="reception-header-card">
        <div className="reception-header-left">
          <div className="reception-icon-glow">
            <ClipboardList size={28} />
          </div>
          <div>
            <div className="reception-pill-tag">
              <ShieldCheck size={13} />
              <span>OPD FRONT DESK • TRIAGE & PRE-CONSULTATION INTAKE</span>
            </div>
            <h1 className="reception-main-title">
              Patient Registration & Pre-Consultation Check-Up
            </h1>
            <p className="reception-main-sub">
              Record vitals, compute live BMI, and prepare patient records before doctor consultation.
            </p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="reception-tab-nav">
          <button
            type="button"
            className={`rec-tab-btn ${tab === 'checkup' ? 'active' : ''}`}
            onClick={() => handleTabChange('checkup')}
          >
            <UserPlus size={16} />
            <span>New Pre-Check</span>
          </button>

          <button
            type="button"
            className={`rec-tab-btn ${tab === 'queue' ? 'active' : ''}`}
            onClick={() => handleTabChange('queue')}
          >
            <Clock size={16} />
            <span>Live OPD Queue ({metrics.waitingDoctorCount})</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-left">
            <span className="stat-label">Total Pre-Checks Today</span>
            <span className="stat-val">{metrics.totalToday}</span>
            <span className="stat-trend positive">🟢 Front desk operational</span>
          </div>
          <div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <ClipboardList size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-left">
            <span className="stat-label">Waiting for OPD Doctor</span>
            <span className="stat-val" style={{ color: '#0284c7' }}>
              {metrics.waitingDoctorCount}
            </span>
            <span className="stat-trend neutral">Queued for Consultation</span>
          </div>
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-left">
            <span className="stat-label">Consultations Completed</span>
            <span className="stat-val" style={{ color: '#16a34a' }}>
              {metrics.completedToday}
            </span>
            <span className="stat-trend positive">Treated & Dispensed</span>
          </div>
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-left">
            <span className="stat-label">Vitals Flag Alerts</span>
            <span className="stat-val" style={{ color: metrics.emergencyFlagsCount > 0 ? '#dc2626' : '#64748b' }}>
              {metrics.emergencyFlagsCount}
            </span>
            <span className="stat-trend warning">High BP / Severe Vitals</span>
          </div>
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="reception-success-banner" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="success-icon-badge">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#065f46' }}>
                {successMessage}
              </h3>
              <p style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                Patient <strong>{lastSavedCheckup?.patientName}</strong> ({lastSavedCheckup?.patientCode}) is now queued for OPD Medical Officer with Token assigned.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn-print-slip"
              onClick={() => window.print()}
            >
              <Printer size={15} /> Print Pre-Check Slip
            </button>
            <button
              type="button"
              className="btn-next-patient"
              onClick={resetFormState}
            >
              + Next Patient
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: PRE-CONSULTATION CHECKUP FORM */}
      {tab === 'checkup' && (
        <form onSubmit={handleOpenReview} className="checkup-form-container">
          {/* STEP 1: PATIENT DETAILS SECTION */}
          <div className="form-card-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <div className="section-badge-num">1</div>
                <div>
                  <h2 className="section-title">Patient Details</h2>
                  <p className="section-subtitle">Search registered patient records or onboard a new walk-in patient.</p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="patient-mode-toggle">
                <button
                  type="button"
                  className={`mode-btn ${isNewPatientMode ? 'active' : ''}`}
                  onClick={handleSwitchToNewPatient}
                >
                  <UserPlus size={14} /> New Patient
                </button>
                <button
                  type="button"
                  className={`mode-btn ${!isNewPatientMode ? 'active' : ''}`}
                  onClick={() => setIsNewPatientMode(false)}
                >
                  <Search size={14} /> Existing Patient
                </button>
              </div>
            </div>

            {/* Patient Search Bar (Always available or prominent) */}
            <div className="search-patient-bar-wrap">
              <div className="search-input-box">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search existing patients by Full Name, 10-digit Phone, or Patient ID (e.g. Aakash, 9876543210, PHC-PAT-2026-0001)..."
                  value={searchQuery}
                  onChange={(e) => handleSearchPatient(e.target.value)}
                  className="patient-search-input"
                />
                {searching && <Activity className="animate-spin" size={16} color="#0284c7" />}
              </div>

              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="search-dropdown-menu">
                  <div className="search-dropdown-header">
                    <span>Found {searchResults.length} matching patients:</span>
                    <button type="button" onClick={() => setSearchResults([])} className="close-dropdown-btn">
                      <X size={14} />
                    </button>
                  </div>
                  {searchResults.map((pat) => (
                    <div
                      key={pat.id}
                      className="search-result-row"
                      onClick={() => selectExistingPatient(pat)}
                    >
                      <div className="search-avatar">{pat.fullName[0]}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a' }}>{pat.fullName}</span>
                          <span className="badge-dash available" style={{ fontSize: '10px' }}>{pat.patientId}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {pat.age} yrs • {pat.gender} • Phone: {pat.phone} • Blood: {pat.bloodGroup || 'N/A'}
                        </div>
                      </div>
                      <button type="button" className="btn-select-pat">
                        Select →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fields Grid */}
            <div className="form-grid-3">
              {/* Full Name */}
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="pat-name">
                  <span>Full Name *</span>
                </label>
                <input
                  id="pat-name"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                  }}
                  className={`input-field-dash ${errors.fullName ? 'input-error' : ''}`}
                />
                {errors.fullName && <span className="error-inline">{errors.fullName}</span>}
              </div>

              {/* Age */}
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="pat-age">
                  <span>Age (Years) *</span>
                </label>
                <input
                  id="pat-age"
                  type="number"
                  required
                  min="0"
                  max="125"
                  placeholder="e.g. 34"
                  value={age}
                  onChange={(e) => {
                    setAge(e.target.value);
                    if (errors.age) setErrors({ ...errors, age: undefined });
                  }}
                  className={`input-field-dash ${errors.age ? 'input-error' : ''}`}
                />
                {errors.age && <span className="error-inline">{errors.age}</span>}
              </div>

              {/* Gender */}
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="pat-gender">
                  <span>Gender *</span>
                </label>
                <select
                  id="pat-gender"
                  required
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="input-field-dash select-dash"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <span className="error-inline">{errors.gender}</span>}
              </div>

              {/* Patient ID Code */}
              <div className="form-group-dash">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label-dash" htmlFor="pat-id-code">
                    <span>Patient ID *</span>
                  </label>
                  {isNewPatientMode && (
                    <button
                      type="button"
                      onClick={generateNewPatientId}
                      className="btn-text-action"
                    >
                      <Sparkles size={12} /> Auto-Generate ID
                    </button>
                  )}
                </div>
                <div className="input-with-icon">
                  <Hash size={16} className="input-prefix-icon" />
                  <input
                    id="pat-id-code"
                    type="text"
                    required
                    readOnly={!isNewPatientMode}
                    value={patientIdCode}
                    onChange={(e) => setPatientIdCode(e.target.value)}
                    placeholder="e.g. PHC-PAT-2026-0042"
                    className="input-field-dash"
                    style={{ paddingLeft: '34px', background: !isNewPatientMode ? '#f1f5f9' : '#ffffff' }}
                  />
                </div>
                {errors.patientId && <span className="error-inline">{errors.patientId}</span>}
              </div>

              {/* Phone */}
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="pat-phone">
                  <span>Contact Mobile Number</span>
                </label>
                <input
                  id="pat-phone"
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field-dash"
                />
              </div>

              {/* Blood Group */}
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="pat-blood">
                  <span>Blood Group</span>
                </label>
                <select
                  id="pat-blood"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="input-field-dash select-dash"
                >
                  <option value="A+ve">A+ (A Positive)</option>
                  <option value="A-ve">A- (A Negative)</option>
                  <option value="B+ve">B+ (B Positive)</option>
                  <option value="B-ve">B- (B Negative)</option>
                  <option value="AB+ve">AB+ (AB Positive)</option>
                  <option value="AB-ve">AB- (AB Negative)</option>
                  <option value="O+ve">O+ (O Positive)</option>
                  <option value="O-ve">O- (O Negative)</option>
                </select>
              </div>
            </div>
          </div>

          {/* STEP 2: BASIC VITAL SIGNS SECTION */}
          <div className="form-card-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <div className="section-badge-num" style={{ background: '#0284c7' }}>2</div>
                <div>
                  <h2 className="section-title">Basic Vital Signs</h2>
                  <p className="section-subtitle">Record baseline hemodynamic vitals before doctor consultation (all units labeled).</p>
                </div>
              </div>
            </div>

            <div className="form-grid-4">
              {/* Blood Pressure Systolic / Diastolic */}
              <div className="form-group-dash form-col-span-2">
                <label className="form-label-dash">
                  <HeartPulse size={15} style={{ color: '#dc2626' }} />
                  <span>Blood Pressure (Systolic / Diastolic)</span>
                  <span className="unit-tag">mmHg</span>
                </label>
                <div className="bp-input-group">
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      placeholder="Systolic (e.g. 120)"
                      value={bpSystolic}
                      onChange={(e) => {
                        setBpSystolic(e.target.value);
                        if (errors.bpSystolic) setErrors({ ...errors, bpSystolic: undefined });
                      }}
                      className={`input-field-dash ${errors.bpSystolic ? 'input-error' : ''}`}
                    />
                    <span className="sub-input-label">Systolic</span>
                  </div>
                  <span className="bp-divider">/</span>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      placeholder="Diastolic (e.g. 80)"
                      value={bpDiastolic}
                      onChange={(e) => {
                        setBpDiastolic(e.target.value);
                        if (errors.bpDiastolic) setErrors({ ...errors, bpDiastolic: undefined });
                      }}
                      className={`input-field-dash ${errors.bpDiastolic ? 'input-error' : ''}`}
                    />
                    <span className="sub-input-label">Diastolic</span>
                  </div>
                </div>
                {(errors.bpSystolic || errors.bpDiastolic) && (
                  <span className="error-inline">{errors.bpSystolic || errors.bpDiastolic}</span>
                )}
              </div>

              {/* Pulse Rate */}
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="pat-pulse">
                  <Activity size={15} style={{ color: '#2563eb' }} />
                  <span>Pulse Rate</span>
                  <span className="unit-tag">bpm</span>
                </label>
                <div className="input-unit-wrap">
                  <input
                    id="pat-pulse"
                    type="number"
                    placeholder="e.g. 72"
                    value={pulseRate}
                    onChange={(e) => {
                      setPulseRate(e.target.value);
                      if (errors.pulseRate) setErrors({ ...errors, pulseRate: undefined });
                    }}
                    className={`input-field-dash ${errors.pulseRate ? 'input-error' : ''}`}
                  />
                  <span className="input-unit-label">bpm</span>
                </div>
                {errors.pulseRate && <span className="error-inline">{errors.pulseRate}</span>}
              </div>

              {/* Body Temperature */}
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="pat-temp">
                  <Thermometer size={15} style={{ color: '#f59e0b' }} />
                  <span>Body Temperature</span>
                  <span className="unit-tag">°C</span>
                </label>
                <div className="input-unit-wrap">
                  <input
                    id="pat-temp"
                    type="number"
                    step="0.1"
                    placeholder="e.g. 36.8"
                    value={bodyTemperature}
                    onChange={(e) => {
                      setBodyTemperature(e.target.value);
                      if (errors.bodyTemperature) setErrors({ ...errors, bodyTemperature: undefined });
                    }}
                    className={`input-field-dash ${errors.bodyTemperature ? 'input-error' : ''}`}
                  />
                  <span className="input-unit-label">°C</span>
                </div>
                {errors.bodyTemperature && <span className="error-inline">{errors.bodyTemperature}</span>}
              </div>

              {/* Respiratory Rate */}
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="pat-resp">
                  <Wind size={15} style={{ color: '#0d9488' }} />
                  <span>Respiratory Rate</span>
                  <span className="unit-tag">breaths/min</span>
                </label>
                <div className="input-unit-wrap">
                  <input
                    id="pat-resp"
                    type="number"
                    placeholder="e.g. 16"
                    value={respiratoryRate}
                    onChange={(e) => {
                      setRespiratoryRate(e.target.value);
                      if (errors.respiratoryRate) setErrors({ ...errors, respiratoryRate: undefined });
                    }}
                    className={`input-field-dash ${errors.respiratoryRate ? 'input-error' : ''}`}
                  />
                  <span className="input-unit-label">/min</span>
                </div>
                {errors.respiratoryRate && <span className="error-inline">{errors.respiratoryRate}</span>}
              </div>
            </div>
          </div>

          {/* STEP 3: BASIC MEASUREMENTS & LIVE BMI SECTION */}
          <div className="form-card-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <div className="section-badge-num" style={{ background: '#0d9488' }}>3</div>
                <div>
                  <h2 className="section-title">Basic Anthropometric Measurements</h2>
                  <p className="section-subtitle">Height, weight and automated real-time Body Mass Index (BMI) calculation.</p>
                </div>
              </div>
            </div>

            <div className="form-grid-3">
              {/* Height */}
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="pat-height">
                  <Ruler size={15} style={{ color: '#0284c7' }} />
                  <span>Height</span>
                  <span className="unit-tag">cm</span>
                </label>
                <div className="input-unit-wrap">
                  <input
                    id="pat-height"
                    type="number"
                    step="0.5"
                    placeholder="e.g. 170"
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                      if (errors.height) setErrors({ ...errors, height: undefined });
                    }}
                    className={`input-field-dash ${errors.height ? 'input-error' : ''}`}
                  />
                  <span className="input-unit-label">cm</span>
                </div>
                {errors.height && <span className="error-inline">{errors.height}</span>}
              </div>

              {/* Weight */}
              <div className="form-group-dash">
                <label className="form-label-dash" htmlFor="pat-weight">
                  <Scale size={15} style={{ color: '#059669' }} />
                  <span>Weight</span>
                  <span className="unit-tag">kg</span>
                </label>
                <div className="input-unit-wrap">
                  <input
                    id="pat-weight"
                    type="number"
                    step="0.5"
                    placeholder="e.g. 68"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      if (errors.weight) setErrors({ ...errors, weight: undefined });
                    }}
                    className={`input-field-dash ${errors.weight ? 'input-error' : ''}`}
                  />
                  <span className="input-unit-label">kg</span>
                </div>
                {errors.weight && <span className="error-inline">{errors.weight}</span>}
              </div>

              {/* Read-Only Auto-calculated BMI */}
              <div className="form-group-dash">
                <label className="form-label-dash">
                  <Calculator size={15} style={{ color: '#7c3aed' }} />
                  <span>Body Mass Index (BMI) [Read-Only]</span>
                  <span className="unit-tag">kg/m²</span>
                </label>
                <div className="bmi-display-card">
                  <div className="bmi-val-big">
                    {bmiData.value !== null ? `${bmiData.value}` : '—'}
                  </div>
                  {bmiData.category && (
                    <span className={`bmi-badge ${bmiData.category.toLowerCase()}`}>
                      {bmiData.category}
                    </span>
                  )}
                  <span className="bmi-formula-note">Formula: Weight (kg) / Height (m)²</span>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 4: OTHER MEDICAL TESTS SECTION */}
          <div className="form-card-section">
            <div className="section-header">
              <div className="section-title-wrap">
                <div className="section-badge-num" style={{ background: '#7c3aed' }}>4</div>
                <div>
                  <h2 className="section-title">Other Medical Tests & Clinical Notes</h2>
                  <p className="section-subtitle">Record point-of-care rapid diagnostic results (Blood Sugar, SpO2, Hemoglobin) or general notes.</p>
                </div>
              </div>

              <button
                type="button"
                className="btn-add-test-row"
                onClick={handleAddTestRow}
              >
                <Plus size={15} /> + Add Test
              </button>
            </div>

            {/* Dynamic Test Rows Table */}
            <div className="test-rows-container">
              {testRows.length === 0 ? (
                <div className="empty-tests-state">
                  <HelpCircle size={20} color="#94a3b8" />
                  <span>No point-of-care test rows added. Click "+ Add Test" to record Blood Sugar, SpO2, or Urine Albumin.</span>
                </div>
              ) : (
                <div className="test-rows-list">
                  {testRows.map((row, idx) => (
                    <div key={row.id} className="test-row-item">
                      <div className="test-col-name">
                        <label className="sub-label">Test Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Blood Sugar, SpO₂, Hemoglobin"
                          value={row.testName}
                          onChange={(e) => handleUpdateTestRow(row.id, 'testName', e.target.value)}
                          className="input-field-dash input-compact"
                        />
                      </div>

                      <div className="test-col-val">
                        <label className="sub-label">Result / Value</label>
                        <input
                          type="text"
                          placeholder="e.g. 110, 98"
                          value={row.resultValue}
                          onChange={(e) => handleUpdateTestRow(row.id, 'resultValue', e.target.value)}
                          className="input-field-dash input-compact"
                        />
                      </div>

                      <div className="test-col-unit">
                        <label className="sub-label">Unit (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. mg/dL, %, g/dL"
                          value={row.unit || ''}
                          onChange={(e) => handleUpdateTestRow(row.id, 'unit', e.target.value)}
                          className="input-field-dash input-compact"
                        />
                      </div>

                      <div className="test-col-notes">
                        <label className="sub-label">Notes (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Fasting, Post Prandial, Room Air"
                          value={row.notes || ''}
                          onChange={(e) => handleUpdateTestRow(row.id, 'notes', e.target.value)}
                          className="input-field-dash input-compact"
                        />
                      </div>

                      <button
                        type="button"
                        className="btn-delete-test-row"
                        onClick={() => handleRemoveTestRow(row.id)}
                        title="Remove this test"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Free Text Notes Area */}
            <div className="form-group-dash" style={{ marginTop: '16px' }}>
              <label className="form-label-dash" htmlFor="pat-notes">
                <span>Other Medical Tests / Notes</span>
              </label>
              <textarea
                id="pat-notes"
                rows={3}
                placeholder="Write here..."
                value={otherTestsNotes}
                onChange={(e) => setOtherTestsNotes(e.target.value)}
                className="input-field-dash textarea-dash"
              />
            </div>
          </div>

          {/* STEP 5: ACTIONS & SUBMISSION BAR */}
          <div className="form-actions-footer">
            <div className="actions-left">
              <button
                type="button"
                className="btn-action-cancel"
                onClick={handleCancelClick}
              >
                <X size={16} /> Cancel
              </button>

              <button
                type="button"
                className="btn-action-clear"
                onClick={handleClearClick}
              >
                <RotateCcw size={16} /> Clear Form
              </button>
            </div>

            <div className="actions-right">
              <button
                type="submit"
                disabled={loading}
                className="btn-action-save"
              >
                <FileCheck size={18} />
                <span>Save Patient Details</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: LIVE OPD QUEUE */}
      {tab === 'queue' && (
        <div className="table-container">
          <div className="table-header">
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Pre-Checked In Patients (OPD Queue)
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Patients with recorded vital signs and measurements awaiting Doctor consultation.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ background: '#0284c7' }}
              onClick={() => handleTabChange('checkup')}
            >
              <UserPlus size={16} /> + New Patient Pre-Check
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Checkup #</th>
                <th>Patient Details</th>
                <th>Vitals (BP / Pulse / Temp)</th>
                <th>Height / Weight / BMI</th>
                <th>Other Tests</th>
                <th>Assigned Doctor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {checkupList.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                    No checkups recorded today. Click "+ New Patient Pre-Check" to register patient vitals.
                  </td>
                </tr>
              ) : (
                checkupList.map((chk) => (
                  <tr key={chk.id}>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0284c7' }}>{chk.checkupNumber}</span>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(chk.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{chk.patientName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {chk.patientAge} yrs • {chk.patientGender} • {chk.patientCode}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                        {chk.vitals?.bpFormatted || `${chk.vitals?.bpSystolic}/${chk.vitals?.bpDiastolic} mmHg`}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Pulse: {chk.vitals?.pulseRate || '—'} bpm • Temp: {chk.vitals?.bodyTemperature || '—'} °C
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>
                        {chk.measurements?.height || '—'} cm / {chk.measurements?.weight || '—'} kg
                      </div>
                      {chk.measurements?.bmi && (
                        <span className={`badge-dash ${chk.measurements?.bmiCategory?.toLowerCase() || 'available'}`} style={{ fontSize: '10px', marginTop: '2px' }}>
                          BMI {chk.measurements.bmi} ({chk.measurements.bmiCategory || 'Normal'})
                        </span>
                      )}
                    </td>
                    <td>
                      {chk.otherTests && chk.otherTests.length > 0 ? (
                        <div style={{ fontSize: '11px', color: '#334155' }}>
                          {chk.otherTests.map((t) => `${t.testName}: ${t.resultValue} ${t.unit || ''}`).join(', ')}
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>None</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>
                        {chk.doctorName || 'Dr. Rajesh Verma'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-dash ${chk.status === 'COMPLETED' ? 'available' : chk.status === 'IN_CONSULTATION' ? 'busy' : 'offline'}`}>
                        {chk.status === 'WAITING_FOR_DOCTOR' ? '⏳ Waiting for OPD' : chk.status === 'IN_CONSULTATION' ? '🩺 In OPD Room' : '✅ Completed'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* REVIEW SUMMARY MODAL */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-card" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-dash">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="modal-icon-badge">
                  <FileCheck size={22} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                    Review Patient Pre-Consultation Summary
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    Please verify all entered measurements before queueing patient for doctor consultation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowReviewModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="review-modal-content">
              {/* Patient Meta Review */}
              <div className="review-section-box">
                <div className="review-section-title">
                  <UserCheck size={16} color="#0284c7" />
                  <span>Patient Identity</span>
                </div>
                <div className="review-grid-2">
                  <div><strong>Name:</strong> {fullName}</div>
                  <div><strong>Age / Gender:</strong> {age} Years / {gender}</div>
                  <div><strong>Patient ID:</strong> {patientIdCode}</div>
                  <div><strong>Phone:</strong> {phone || 'Not Provided'}</div>
                  <div><strong>Blood Group:</strong> {bloodGroup}</div>
                  <div><strong>Address:</strong> {address || 'Local Resident'}</div>
                </div>
              </div>

              {/* Vitals Review */}
              <div className="review-section-box">
                <div className="review-section-title">
                  <HeartPulse size={16} color="#dc2626" />
                  <span>Vital Signs</span>
                </div>
                <div className="review-grid-2">
                  <div><strong>Blood Pressure:</strong> {bpSystolic}/{bpDiastolic} mmHg</div>
                  <div><strong>Pulse Rate:</strong> {pulseRate} bpm</div>
                  <div><strong>Body Temperature:</strong> {bodyTemperature} °C</div>
                  <div><strong>Respiratory Rate:</strong> {respiratoryRate} breaths/min</div>
                </div>
              </div>

              {/* Measurements Review */}
              <div className="review-section-box">
                <div className="review-section-title">
                  <Scale size={16} color="#059669" />
                  <span>Anthropometric Measurements</span>
                </div>
                <div className="review-grid-2">
                  <div><strong>Height:</strong> {height} cm</div>
                  <div><strong>Weight:</strong> {weight} kg</div>
                  <div>
                    <strong>Calculated BMI:</strong> {bmiData.value || 'N/A'} kg/m² ({bmiData.category || 'Normal'})
                  </div>
                </div>
              </div>

              {/* Other Tests Review */}
              <div className="review-section-box">
                <div className="review-section-title">
                  <ClipboardList size={16} color="#7c3aed" />
                  <span>Other Medical Tests & Notes</span>
                </div>
                {testRows.filter((t) => t.testName.trim()).length > 0 ? (
                  <div className="review-test-list">
                    {testRows
                      .filter((t) => t.testName.trim())
                      .map((t) => (
                        <div key={t.id} className="review-test-chip">
                          <strong>{t.testName}:</strong> {t.resultValue} {t.unit || ''} {t.notes ? `(${t.notes})` : ''}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>No point-of-care test rows entered.</div>
                )}
                {otherTestsNotes.trim() && (
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '8px', fontStyle: 'italic' }}>
                    "{otherTestsNotes.trim()}"
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions-footer">
              <button
                type="button"
                className="btn-action-cancel"
                onClick={() => setShowReviewModal(false)}
              >
                ← Back to Edit
              </button>

              <button
                type="button"
                disabled={loading}
                className="btn-action-save"
                onClick={handleConfirmSave}
              >
                {loading ? 'Saving...' : 'Confirm & Save Patient Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR CONFIRMATION MODAL */}
      {showClearConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowClearConfirmModal(false)}>
          <div className="modal-card" style={{ maxWidth: '420px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#d97706', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Clear Form Data?</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '20px' }}>
              You have entered patient details and measurements. Are you sure you want to clear all entered fields?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-action-cancel"
                onClick={() => setShowClearConfirmModal(false)}
              >
                No, Keep Data
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#dc2626' }}
                onClick={resetFormState}
              >
                Yes, Clear Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowCancelConfirmModal(false)}>
          <div className="modal-card" style={{ maxWidth: '420px', padding: '24px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626', marginBottom: '12px' }}>
              <AlertCircle size={24} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Discard Changes?</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '20px' }}>
              Are you sure you want to cancel? Any unsaved measurements for this patient will be lost.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-action-cancel"
                onClick={() => setShowCancelConfirmModal(false)}
              >
                Stay on Form
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#dc2626' }}
                onClick={resetFormState}
              >
                Discard & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
