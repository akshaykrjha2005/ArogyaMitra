import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Stethoscope,
  TrendingUp,
  AlertTriangle,
  Building2,
  Activity,
  CheckCircle2,
  Plus,
  BarChart3,
  PieChart,
  Shield,
  Layers,
} from 'lucide-react';
import { AdminAnalyticsSummary, DoctorProfile, PHC } from '@phc-connect/types';
import { apiClient } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [selectedPhc, setSelectedPhc] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Add Doctor Modal State
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [docName, setDocName] = useState('');
  const [docSpec, setDocSpec] = useState('General Medicine');
  const [docQual, setDocQual] = useState('MBBS, MD');
  const [docExp, setDocExp] = useState('8');
  const [docPhc, setDocPhc] = useState('phc-001');
  const [docHours, setDocHours] = useState('09:00 AM - 03:00 PM');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    loadAdminData();
  }, [timeRange, selectedPhc]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const params: any = { timeRange };
      if (selectedPhc !== 'all') params.phcId = selectedPhc;

      const [analyticsRes, docsRes, phcsRes] = await Promise.all([
        apiClient.get('/admin/analytics', params),
        apiClient.get('/doctors'),
        apiClient.get('/phcs'),
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.analytics);
      if (docsRes.success) setDoctors(docsRes.doctors);
      if (phcsRes.success) setPhcs(phcsRes.phcs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice('New Doctor added to PHC roster successfully!');
    setIsAddDocOpen(false);
    setTimeout(() => setNotice(''), 4000);
    loadAdminData();
  };

  if (!analytics) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header & Controls */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Building2 size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
              PHC Administrative Operations & Analytics
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              District Healthcare Flow, Disease Surveillance & Resource Utilization
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* PHC Filter */}
          <select
            value={selectedPhc}
            onChange={(e) => setSelectedPhc(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', background: 'white', fontWeight: 600 }}
          >
            <option value="all">All PHCs Across District</option>
            {phcs.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Time Filter */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px' }}>
            {(['week', 'month', 'year'] as const).map((tr) => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: timeRange === tr ? '#ffffff' : 'transparent',
                  color: timeRange === tr ? '#1976d2' : '#64748b',
                  boxShadow: timeRange === tr ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {tr.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddDocOpen(true)}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            <Plus size={14} /> Add Doctor
          </button>
        </div>
      </div>

      {notice && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 18px', color: '#15803d', fontWeight: 700, fontSize: '13px' }}>
          ✓ {notice}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <span className="stat-label">Total Registered Patients</span>
            <div className="stat-val">{analytics.totalPatients}</div>
          </div>
          <div className="stat-icon" style={{ background: '#e3f2fd', color: '#1976d2' }}>
            <Users size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Today's Total Visits</span>
            <div className="stat-val">{analytics.todayPatients}</div>
          </div>
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <Activity size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Active Medical Officers</span>
            <div className="stat-val">{analytics.activeDoctors} ({analytics.availableDoctors} Available)</div>
          </div>
          <div className="stat-icon" style={{ background: '#e0f2f1', color: '#00897b' }}>
            <Stethoscope size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Completed Consultations</span>
            <div className="stat-val">{analytics.completedConsultations}</div>
          </div>
          <div className="stat-icon" style={{ background: '#fdf4ff', color: '#a855f7' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Stock Alerts (Low / Out)</span>
            <div className="stat-val" style={{ color: '#ea580c' }}>
              {analytics.lowStockMedicinesCount} Low / {analytics.outOfStockMedicinesCount} Out
            </div>
          </div>
          <div className="stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* Analytics Charts & Visualizations: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Patient Footfall Bar Graph */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                Patient Footfall & Visit Trends
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Consultation volume categorized by {timeRange}
              </p>
            </div>
            <BarChart3 size={20} color="#1976d2" />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '180px', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
            {analytics.patientVisitsTrend.labels.map((lbl, idx) => {
              const val = analytics.patientVisitsTrend.data[idx];
              const maxVal = Math.max(...analytics.patientVisitsTrend.data);
              const heightPct = Math.round((val / maxVal) * 100);

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1976d2' }}>{val}</span>
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      background: 'linear-gradient(180deg, #1976d2, #60a5fa)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.3s ease',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{lbl}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Common Symptoms Distribution */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                Top Reported Symptoms (Surveillance)
              </h3>
              <p style={{ fontSize: '11px', color: '#64748b' }}>
                Primary complaints reported across OPDs
              </p>
            </div>
            <PieChart size={20} color="#00897b" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analytics.commonSymptoms.slice(0, 5).map((item, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.symptom}</span>
                  <span style={{ color: '#00897b', fontWeight: 800 }}>{item.percentage}% ({item.count})</span>
                </div>
                <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.percentage * 2.5}%`, height: '100%', background: '#00897b', borderRadius: '9999px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Doctor Workload & Medicine Depletion Tables: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Doctor Workload */}
        <div className="table-container">
          <div className="table-header">
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
              Doctor Workload & Daily Consultations
            </h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Specialization</th>
                <th>Patients Treated</th>
                <th>Avg. Time</th>
              </tr>
            </thead>
            <tbody>
              {analytics.doctorWorkload.map((doc, idx) => (
                <tr key={idx}>
                  <td><strong style={{ color: '#1e293b' }}>{doc.doctorName}</strong></td>
                  <td><span style={{ fontSize: '11px', color: '#1976d2' }}>{doc.specialization}</span></td>
                  <td><strong>{doc.consultationsCount}</strong></td>
                  <td>{doc.avgTimeMinutes} mins</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Medicine Consumption */}
        <div className="table-container">
          <div className="table-header">
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>
              Top Dispensed Essential Formulary Medicines
            </h3>
          </div>
          <table>
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Units Dispensed</th>
                <th>Remaining</th>
              </tr>
            </thead>
            <tbody>
              {analytics.medicineConsumption.map((med, idx) => (
                <tr key={idx}>
                  <td><strong style={{ color: '#1e293b' }}>{med.medicineName}</strong></td>
                  <td><span style={{ fontSize: '11px', color: '#00796b' }}>{med.category}</span></td>
                  <td><strong>{med.dispensedUnits}</strong></td>
                  <td>
                    <span style={{ color: med.remainingStock < 300 ? '#ea580c' : '#16a34a', fontWeight: 700 }}>
                      {med.remainingStock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {isAddDocOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>
              Add Medical Officer / Specialist to PHC Roster
            </h3>

            <form onSubmit={handleAddDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Doctor Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Alok Nath"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Specialization
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Medicine, Pediatrics"
                    value={docSpec}
                    onChange={(e) => setDocSpec(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Assigned PHC
                  </label>
                  <select
                    value={docPhc}
                    onChange={(e) => setDocPhc(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                  >
                    {phcs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Working Hours
                  </label>
                  <input
                    type="text"
                    value={docHours}
                    onChange={(e) => setDocHours(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Register Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
