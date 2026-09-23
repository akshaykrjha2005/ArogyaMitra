import React, { useState, useEffect } from 'react';
import {
  Pill,
  AlertTriangle,
  Package,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Calendar,
  Send,
  Building2,
  History,
} from 'lucide-react';
import { MedicineInventory, MedicineTransaction, MedicineCategory } from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  pharmacistId: string;
  activeTab?: 'inventory' | 'dispense' | 'alerts';
  onSelectTab?: (tab: 'inventory' | 'dispense' | 'alerts') => void;
}

export const PharmacistDashboard: React.FC<Props> = ({ pharmacistId, activeTab = 'inventory', onSelectTab }) => {
  const [metrics, setMetrics] = useState<any>({
    totalMedicines: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringSoonCount: 0,
  });
  const [inventories, setInventories] = useState<MedicineInventory[]>([]);
  const [transactions, setTransactions] = useState<MedicineTransaction[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<MedicineInventory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<MedicineInventory | null>(null);

  // Dispense Form State
  const [dispenseQty, setDispenseQty] = useState('1');
  const [patientIdInput, setPatientIdInput] = useState('pat-0001');
  const [patientNameInput, setPatientNameInput] = useState('Aakash Jha');
  const [dispenseNotes, setDispenseNotes] = useState('Dispensed as per Doctor Prescription');
  const [dispensing, setDispensing] = useState(false);
  const [notice, setNotice] = useState('');

  // Add Medicine State
  const [medName, setMedName] = useState('');
  const [medGeneric, setMedGeneric] = useState('');
  const [medCategory, setMedCategory] = useState<MedicineCategory>('Analgesic / Antipyretic');
  const [medStrength, setMedStrength] = useState('500mg');
  const [medForm, setMedForm] = useState('Tablet');
  const [medQty, setMedQty] = useState('200');
  const [medMinStock, setMedMinStock] = useState('50');
  const [medBatch, setMedBatch] = useState(`BAT-2026-${Math.floor(Math.random() * 800 + 100)}`);
  const [medExpiry, setMedExpiry] = useState('2028-12-31');

  useEffect(() => {
    loadPharmacistData();
  }, [pharmacistId]);

  useEffect(() => {
    if (activeTab === 'alerts') {
      setStatusFilter('low');
    } else if (activeTab === 'dispense') {
      setIsDispenseModalOpen(true);
    } else if (activeTab === 'inventory') {
      setStatusFilter('all');
    }
  }, [activeTab]);

  const loadPharmacistData = async () => {
    try {
      const [overRes, txRes] = await Promise.all([
        apiClient.get('/pharmacist/overview'),
        apiClient.get('/pharmacist/transactions'),
      ]);

      if (overRes.success) {
        setMetrics(overRes.metrics);
        setInventories(overRes.inventories || []);
        setLowStockAlerts(overRes.lowStockAlerts || []);
      }
      if (txRes.success) {
        setTransactions(txRes.transactions || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInventory) return;
    setDispensing(true);

    try {
      const res = await apiClient.post('/pharmacist/dispense', {
        inventoryId: selectedInventory.id,
        quantity: Number(dispenseQty),
        patientId: patientIdInput,
        patientName: patientNameInput,
        notes: dispenseNotes,
      });

      if (res.success) {
        setNotice(res.message);
        setTimeout(() => setNotice(''), 4000);
        setIsDispenseModalOpen(false);
        loadPharmacistData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDispensing(false);
    }
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/pharmacist/inventory', {
        name: medName,
        genericName: medGeneric,
        category: medCategory,
        strength: medStrength,
        form: medForm,
        quantity: Number(medQty),
        minimumStockLevel: Number(medMinStock),
        batchNumber: medBatch,
        expiryDate: medExpiry,
      });

      if (res.success) {
        setNotice('New medicine batch added to inventory!');
        setTimeout(() => setNotice(''), 4000);
        setIsAddModalOpen(false);
        loadPharmacistData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = inventories.filter((i) => {
    const matchesSearch =
      i.medicine.name.toLowerCase().includes(search.toLowerCase()) ||
      i.medicine.genericName.toLowerCase().includes(search.toLowerCase()) ||
      i.batchNumber.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (categoryFilter !== 'all' && i.medicine.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
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
            background: 'linear-gradient(135deg, #00897b, #004d40)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Pill size={26} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
              PHC Central Pharmacy & Dispensary
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b' }}>
              Essential Drug Formulary Management, Expiry Tracking & Real-time Dispensing
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={16} /> Add Medicine Batch
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div>
            <span className="stat-label">Total Stocked Medicines</span>
            <div className="stat-val">{metrics.totalMedicines}</div>
          </div>
          <div className="stat-icon" style={{ background: '#e0f2f1', color: '#00897b' }}>
            <Package size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">In Adequate Stock</span>
            <div className="stat-val" style={{ color: '#16a34a' }}>{metrics.inStockCount}</div>
          </div>
          <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Low Stock Alerts</span>
            <div className="stat-val" style={{ color: '#ea580c' }}>{metrics.lowStockCount}</div>
          </div>
          <div className="stat-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
            <TrendingDown size={22} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <span className="stat-label">Out of Stock Batches</span>
            <div className="stat-val" style={{ color: '#dc2626' }}>{metrics.outOfStockCount}</div>
          </div>
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {notice && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 18px', color: '#15803d', fontWeight: 700, fontSize: '13px' }}>
          ✓ {notice}
        </div>
      )}

      {/* Low Stock Urgent Reorder Banner */}
      {lowStockAlerts.length > 0 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: '14px',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={18} color="#d97706" />
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#92400e' }}>
              Low Stock Reorder Alerts ({lowStockAlerts.length} Medicines Below Minimum Threshold)
            </h4>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lowStockAlerts.map((inv) => (
              <span
                key={inv.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #fed7aa',
                  color: '#c2410c',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                {inv.medicine.name}: <strong>{inv.quantity} left</strong> (Min: {inv.minimumStockLevel})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            placeholder="Search inventory by medicine name, generic salt, batch number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              background: '#ffffff',
            }}
          />
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
        >
          <option value="all">All Stock Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="table-container">
        <div className="table-header">
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
            Formulary Stock List ({filtered.length} Items)
          </h3>
        </div>

        <table>
          <thead>
            <tr>
              <th>Medicine Name & Strength</th>
              <th>Category</th>
              <th>Batch #</th>
              <th>Expiry Date</th>
              <th>Current Stock</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => (
              <tr key={inv.id}>
                <td>
                  <strong style={{ fontSize: '13px', color: '#1e293b' }}>{inv.medicine.name}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>
                    {inv.medicine.genericName} • {inv.medicine.form}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '11px', color: '#00796b', background: '#e0f2f1', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                    {inv.medicine.category}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700 }}>
                  {inv.batchNumber}
                </td>
                <td style={{ fontSize: '12px', color: '#475569' }}>
                  {inv.expiryDate}
                </td>
                <td>
                  <strong style={{ fontSize: '14px', color: inv.quantity <= inv.minimumStockLevel ? '#dc2626' : '#1e293b' }}>
                    {inv.quantity} units
                  </strong>
                  <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>
                    Min: {inv.minimumStockLevel}
                  </span>
                </td>
                <td>
                  <span
                    className={`badge-dash ${
                      inv.status === 'In Stock'
                        ? 'available'
                        : inv.status === 'Low Stock'
                        ? 'busy'
                        : 'offline'
                    }`}
                  >
                    ● {inv.status}
                  </span>
                </td>
                <td>
                  <button
                    disabled={inv.quantity === 0}
                    onClick={() => {
                      setSelectedInventory(inv);
                      setIsDispenseModalOpen(true);
                    }}
                    style={{
                      background: inv.quantity > 0 ? '#1976d2' : '#cbd5e1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: inv.quantity > 0 ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Send size={12} /> Dispense
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dispense Modal */}
      {isDispenseModalOpen && selectedInventory && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ padding: '24px', maxWidth: '440px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
              Dispense Medicine
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              {selectedInventory.medicine.name} (Batch: {selectedInventory.batchNumber})
            </p>

            <form onSubmit={handleDispense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Quantity to Dispense (Available: {selectedInventory.quantity})
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedInventory.quantity}
                  required
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Patient Name
                </label>
                <input
                  type="text"
                  required
                  value={patientNameInput}
                  onChange={(e) => setPatientNameInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Notes / Prescription Reference
                </label>
                <input
                  type="text"
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsDispenseModalOpen(false)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispensing}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {dispensing ? 'Recording...' : 'Confirm & Deduct'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Medicine Batch Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>
              Add New Medicine Batch to Inventory
            </h3>

            <form onSubmit={handleAddMedicine} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Medicine Commercial Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol Tablets IP 500mg"
                    value={medName}
                    onChange={(e) => setMedName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Generic Salt Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol"
                    value={medGeneric}
                    onChange={(e) => setMedGeneric(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Therapeutic Category
                  </label>
                  <select
                    value={medCategory}
                    onChange={(e) => setMedCategory(e.target.value as any)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: 'white' }}
                  >
                    <option value="Analgesic / Antipyretic">Analgesic / Antipyretic</option>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Antihypertensive">Antihypertensive</option>
                    <option value="Antihistamine">Antihistamine</option>
                    <option value="Antacid / GI">Antacid / GI</option>
                    <option value="Vitamin / Supplement">Vitamin / Supplement</option>
                    <option value="Emergency & Resuscitation">Emergency & Resuscitation</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Initial Stock Units
                  </label>
                  <input
                    type="number"
                    required
                    value={medQty}
                    onChange={(e) => setMedQty(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Batch Number
                  </label>
                  <input
                    type="text"
                    required
                    value={medBatch}
                    onChange={(e) => setMedBatch(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={medExpiry}
                    onChange={(e) => setMedExpiry(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Save to Formulary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
