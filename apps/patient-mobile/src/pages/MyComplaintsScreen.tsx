import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Paperclip,
  ChevronRight,
  Send,
  ArrowLeft,
  X,
  Camera,
  Image as ImageIcon,
  ShieldCheck,
  User,
  Search,
  ExternalLink,
  Sparkles,
  HelpCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  Complaint,
  ComplaintCategory,
  ComplaintPriority,
  PatientProfile,
  PHC,
  AppLanguage,
  resolveTranslationObject,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  patient: PatientProfile | null;
  onNavigate: (tab: string, extra?: any) => void;
  lang: AppLanguage;
  initialOpenNewModal?: boolean;
}

const CATEGORY_ICONS: Record<ComplaintCategory, string> = {
  SERVICE_QUALITY: '🩺',
  STAFF_BEHAVIOUR: '👨‍⚕️',
  MEDICINE_AVAILABILITY: '💊',
  FACILITY_CLEANLINESS: '🏥',
  WAIT_TIME: '⏱️',
  OTHER: '📝',
};

const CATEGORY_NAMES: Record<ComplaintCategory, string> = {
  SERVICE_QUALITY: 'Service Quality',
  STAFF_BEHAVIOUR: 'Staff Behaviour',
  MEDICINE_AVAILABILITY: 'Medicine Availability',
  FACILITY_CLEANLINESS: 'Facility / Cleanliness',
  WAIT_TIME: 'Long Wait Time',
  OTHER: 'General / Other',
};

export const MyComplaintsScreen: React.FC<Props> = ({
  patient,
  onNavigate,
  lang,
  initialOpenNewModal = false,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(initialOpenNewModal);
  const [submitting, setSubmitting] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Form State for New Grievance
  const [formCategory, setFormCategory] = useState<ComplaintCategory>('SERVICE_QUALITY');
  const [formPhcId, setFormPhcId] = useState<string>('phc-001');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPriority, setFormPriority] = useState<ComplaintPriority>('MEDIUM');
  const [formAttachmentUrl, setFormAttachmentUrl] = useState<string | null>(null);
  const [formAttachmentName, setFormAttachmentName] = useState<string | null>(null);

  // Translations
  const t = resolveTranslationObject(lang, {
    en: {
      title: 'Grievance & Redressal',
      subtitle: 'Official PHC Citizen Grievance Portal',
      raiseBtn: 'Raise Grievance',
      all: 'All',
      open: 'Open',
      inProgress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
      searchPlaceholder: 'Search by ID or keywords...',
      noComplaints: 'No grievances found',
      noComplaintsDesc: 'You have not submitted any complaints yet, or none match the active filter.',
      raiseFirst: 'Raise a Grievance',
      modalTitle: 'Submit a Grievance / Complaint',
      selectPhc: 'Related Health Centre (PHC)',
      selectCategory: 'Grievance Category',
      priority: 'Priority Level',
      subject: 'Subject / Summary',
      subjectPlaceholder: 'e.g., Medicine out of stock at pharmacy counter',
      description: 'Detailed Description',
      descriptionPlaceholder: 'Please provide complete details including time of visit, department, and specific issue...',
      attachPhoto: 'Attach Photo / Document (Optional)',
      uploadPhoto: 'Upload Image / Evidence',
      removePhoto: 'Remove Photo',
      submitBtn: 'Submit Grievance',
      submittingBtn: 'Submitting...',
      cancel: 'Cancel',
      statusHistory: 'Status & Action History',
      resolutionNotes: 'Official Resolution Summary',
      repliesTitle: 'Official Remarks & Communications',
      sendReply: 'Send Reply / Follow-up',
      replyPlaceholder: 'Write a reply or follow-up note...',
      trackingId: 'Tracking ID',
      filedOn: 'Filed on',
      assignedOfficer: 'Assigned Officer',
      notAssigned: 'Pending Assignment',
      viewTimeline: 'View Timeline & Details',
      quickChips: ['Medicine out of stock', 'Doctor not present during OPD', 'Long queue at counter', 'Cleanliness issue'],
    },
    hi: {
      title: 'शिकायत एवं निवारण',
      subtitle: 'पीएचसी नागरिक शिकायत निवारण पोर्टल',
      raiseBtn: 'नई शिकायत दर्ज करें',
      all: 'सभी',
      open: 'खुली',
      inProgress: 'प्रक्रियाधीन',
      resolved: 'समाधानित',
      closed: 'बंद',
      searchPlaceholder: 'आईडी या विषय द्वारा खोजें...',
      noComplaints: 'कोई शिकायत नहीं मिली',
      noComplaintsDesc: 'आपने अभी तक कोई शिकायत दर्ज नहीं की है।',
      raiseFirst: 'शिकायत दर्ज करें',
      modalTitle: 'स्वास्थ्य केंद्र से संबंधित शिकायत दर्ज करें',
      selectPhc: 'संबंधित प्राथमिक स्वास्थ्य केंद्र (PHC)',
      selectCategory: 'शिकायत श्रेणी',
      priority: 'प्राथमिकता स्तर',
      subject: 'विषय / सारांश',
      subjectPlaceholder: 'उदा. दवा काउंटर पर दवा उपलब्ध नहीं है',
      description: 'विस्तृत विवरण',
      descriptionPlaceholder: 'कृपया समय, विभाग और समस्या का पूरा विवरण दें...',
      attachPhoto: 'फोटो या दस्तावेज संलग्न करें (वैकल्पिक)',
      uploadPhoto: 'फोटो अपलोड करें',
      removePhoto: 'फोटो हटाएं',
      submitBtn: 'शिकायत सबमिट करें',
      submittingBtn: 'दर्ज हो रहा है...',
      cancel: 'रद्द करें',
      statusHistory: 'स्थिति एवं कार्रवाई का इतिहास',
      resolutionNotes: 'आधिकारिक समाधान विवरण',
      repliesTitle: 'आधिकारिक टिप्पणी व संदेश',
      sendReply: 'उत्तर / टिप्पणी भेजें',
      replyPlaceholder: 'अपनी टिप्पणी या प्रश्न लिखें...',
      trackingId: 'शिकायत संख्या (ID)',
      filedOn: 'दर्ज करने की तिथि',
      assignedOfficer: 'नियुक्त अधिकारी',
      notAssigned: 'असाइनमेंट बाकी है',
      viewTimeline: 'विवरण व स्थिति देखें',
      quickChips: ['दवा उपलब्ध नहीं है', 'डॉक्टर समय पर उपस्थित नहीं', 'काउंटर पर लंबी कतार', 'सफाई से जुड़ी समस्या'],
    },
    kn: {
      title: 'ದೂರು ಮತ್ತು ಪರಿಹಾರ',
      subtitle: 'ಪಿಹೆಚ್‌ಸಿ ನಾಗರಿಕ ಕುಂದುಕೊರತೆ ನಿವಾರಣಾ ಪೋರ್ಟಲ್',
      raiseBtn: 'ಹೊಸ ದೂರು ಸಲ್ಲಿಸಿ',
      all: 'ಎಲ್ಲವೂ',
      open: 'ತೆರೆದಿದೆ',
      inProgress: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
      resolved: 'ಪರಿಹರಿಸಲಾಗಿದೆ',
      closed: 'ಮುಚ್ಚಲಾಗಿದೆ',
      searchPlaceholder: 'ದೂರು ಸಂಖ್ಯೆ ಅಥವಾ ಕೀವರ್ಡ್ ಮೂಲಕ ಹುಡುಕಿ...',
      noComplaints: 'ಯಾವುದೇ ದೂರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
      noComplaintsDesc: 'ನೀವು ಇನ್ನೂ ಯಾವುದೇ ದೂರನ್ನು ದಾಖಲಿಸಿಲ್ಲ.',
      raiseFirst: 'ದೂರು ಸಲ್ಲಿಸಿ',
      modalTitle: 'ದೂರನ್ನು ದಾಖಲಿಸಿ',
      selectPhc: 'ಸಂಬಂಧಿತ ಆರೋಗ್ಯ ಕೇಂದ್ರ (PHC)',
      selectCategory: 'ದೂರಿನ ವರ್ಗ',
      priority: 'ಆದ್ಯತೆ ಮಟ್ಟ',
      subject: 'ವಿಷಯ / ಸಾರಾಂಶ',
      subjectPlaceholder: 'ಉದಾ: ಔಷಧ ಕೌಂಟರ್‌ನಲ್ಲಿ ಔಷಧಿ ಲಭ್ಯವಿಲ್ಲ',
      description: 'ವಿವರವಾದ ವಿವರಣೆ',
      descriptionPlaceholder: 'ದಯವಿಟ್ಟು ಭೇಟಿಯ ಸಮಯ, ವಿಭಾಗ ಮತ್ತು ಸಮಸ್ಯೆಯನ್ನು ವಿವರವಾಗಿ ಬರೆಯಿರಿ...',
      attachPhoto: 'ಫೋಟೋ ಲಗತ್ತಿಸಿ (ಐಚ್ಛಿಕ)',
      uploadPhoto: 'ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
      removePhoto: 'ಫೋಟೋ ತೆಗೆದುಹಾಕಿ',
      submitBtn: 'ದೂರು ಸಲ್ಲಿಸಿ',
      submittingBtn: 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...',
      cancel: 'ರದ್ದುಮಾಡಿ',
      statusHistory: 'ಸ್ಥಿತಿ ಮತ್ತು ಕ್ರಮಗಳ ಇತಿಹಾಸ',
      resolutionNotes: 'ಅಧಿಕೃತ ಪರಿಹಾರದ ಸಾರಾಂಶ',
      repliesTitle: 'ಅಧಿಕೃತ ಸಂವಹನಗಳು',
      sendReply: 'ಪ್ರತಿಕ್ರಿಯೆ ಕಳುಹಿಸಿ',
      replyPlaceholder: 'ನಿಮ್ಮ ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ...',
      trackingId: 'ಟ್ರ್ಯಾಕಿಂಗ್ ಐಡಿ',
      filedOn: 'ದಾಖಲಿಸಿದ ದಿನಾಂಕ',
      assignedOfficer: 'ನಿಯೋಜಿತ ಅಧಿಕಾರಿ',
      notAssigned: 'ನಿಯೋಜನೆ ಬಾಕಿ ಇದೆ',
      viewTimeline: 'ವಿವರಗಳು ಮತ್ತು ಸ್ಥಿತಿ ನೋಡಿ',
      quickChips: ['ಔಷಧಿ ಲಭ್ಯವಿಲ್ಲ', 'ವೈದ್ಯರು ಹಾಜರಿಲ್ಲ', 'ಕೌಂಟರ್‌ನಲ್ಲಿ ಉದ್ದದ ಸರತಿ ಸಾಲು', 'ಸ್ವಚ್ಛತೆಯ ಕೊರತೆ'],
    },
  });

  useEffect(() => {
    loadData();
  }, [patient]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [complaintsRes, phcsRes] = await Promise.all([
        apiClient.get('/complaints/my'),
        apiClient.get('/phcs'),
      ]);

      if (complaintsRes.success && complaintsRes.complaints) {
        setComplaints(complaintsRes.complaints);
      }
      if (phcsRes.success && phcsRes.phcs) {
        setPhcs(phcsRes.phcs);
        if (phcsRes.phcs.length > 0) {
          setFormPhcId(phcsRes.phcs[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormAttachmentUrl(reader.result as string);
        setFormAttachmentName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSamplePhoto = () => {
    // Preset evidence image for quick simulation
    setFormAttachmentUrl('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80');
    setFormAttachmentName('prescription_medicine_slip.jpg');
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formDescription.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        phcId: formPhcId,
        category: formCategory,
        subject: formSubject.trim(),
        description: formDescription.trim(),
        priority: formPriority,
        attachmentUrl: formAttachmentUrl,
        attachmentName: formAttachmentName,
      };

      const res = await apiClient.post('/complaints', payload);
      if (res.success && res.complaint) {
        setComplaints((prev) => [res.complaint, ...prev]);
        setIsNewModalOpen(false);
        // Reset form
        setFormSubject('');
        setFormDescription('');
        setFormAttachmentUrl(null);
        setFormAttachmentName(null);
        setSuccessNotice(`Grievance submitted successfully! Tracking ID: ${res.complaint.complaintId}`);
        setTimeout(() => setSuccessNotice(null), 6000);
      } else {
        alert(res.error || 'Failed to submit grievance. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedComplaint || !replyText.trim()) return;

    try {
      setReplySubmitting(true);
      const res = await apiClient.post(`/complaints/${selectedComplaint.id}/reply`, {
        message: replyText.trim(),
        isInternal: false,
      });

      if (res.success && res.reply) {
        const updated = {
          ...selectedComplaint,
          replies: [...selectedComplaint.replies, res.reply],
        };
        setSelectedComplaint(updated);
        setComplaints((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setReplyText('');
      } else {
        alert(res.error || 'Failed to send reply.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReplySubmitting(false);
    }
  };

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.complaintId.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.phcName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return {
          bg: '#fff7ed',
          color: '#c2410c',
          border: '#fdba74',
          label: 'Open / Pending',
          icon: <Clock size={12} />,
        };
      case 'IN_PROGRESS':
        return {
          bg: '#eff6ff',
          color: '#1d4ed8',
          border: '#93c5fd',
          label: 'In Progress',
          icon: <RefreshCw size={12} className="spin-slow" />,
        };
      case 'RESOLVED':
        return {
          bg: '#f0fdf4',
          color: '#15803d',
          border: '#86efac',
          label: 'Resolved',
          icon: <CheckCircle2 size={12} />,
        };
      case 'CLOSED':
        return {
          bg: '#f8fafc',
          color: '#475569',
          border: '#cbd5e1',
          label: 'Closed',
          icon: <CheckCircle2 size={12} />,
        };
      default:
        return {
          bg: '#f1f5f9',
          color: '#334155',
          border: '#cbd5e1',
          label: status,
          icon: <AlertCircle size={12} />,
        };
    }
  };

  const getPriorityBadge = (p: ComplaintPriority) => {
    switch (p) {
      case 'URGENT':
        return { bg: '#fee2e2', color: '#b91c1c', label: 'Urgent' };
      case 'HIGH':
        return { bg: '#ffedd5', color: '#c2410c', label: 'High' };
      case 'MEDIUM':
        return { bg: '#fef9c3', color: '#854d0e', label: 'Medium' };
      case 'LOW':
      default:
        return { bg: '#f1f5f9', color: '#475569', label: 'Low' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '20px' }}>
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f766e, #115e59)',
          color: 'white',
          borderRadius: '18px',
          padding: '18px 20px',
          boxShadow: '0 8px 20px rgba(15, 118, 110, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <ShieldCheck size={16} color="#5eead4" />
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', color: '#99f6e4', textTransform: 'uppercase' }}>
              Citizen Voice & Support
            </span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            {t.title}
          </h2>
          <p style={{ fontSize: '12px', color: '#ccfbf1', marginTop: '2px', opacity: 0.9 }}>
            {t.subtitle}
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          style={{
            zIndex: 2,
            background: '#ffffff',
            color: '#0f766e',
            border: 'none',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            transition: 'all 0.2s ease',
          }}
        >
          <Plus size={16} color="#0f766e" />
          <span>{t.raiseBtn}</span>
        </button>

        {/* Decorative background shape */}
        <div
          style={{
            position: 'absolute',
            right: '-20px',
            bottom: '-30px',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Success Alert Banner */}
      {successNotice && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #86efac',
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#15803d',
            fontSize: '13px',
            fontWeight: 700,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={18} color="#16a34a" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '10px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, display: 'block' }}>Total</span>
          <strong style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>{complaints.length}</strong>
        </div>

        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fed7aa',
            borderRadius: '12px',
            padding: '10px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '10px', color: '#c2410c', fontWeight: 700, display: 'block' }}>Open</span>
          <strong style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c' }}>
            {complaints.filter((c) => c.status === 'OPEN').length}
          </strong>
        </div>

        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '10px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 700, display: 'block' }}>In Progress</span>
          <strong style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb' }}>
            {complaints.filter((c) => c.status === 'IN_PROGRESS').length}
          </strong>
        </div>

        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '12px',
            padding: '10px',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '10px', color: '#15803d', fontWeight: 700, display: 'block' }}>Resolved</span>
          <strong style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>
            {complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length}
          </strong>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              outline: 'none',
              background: '#ffffff',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: t.all, count: complaints.length },
            { id: 'OPEN', label: t.open, count: complaints.filter((c) => c.status === 'OPEN').length },
            { id: 'IN_PROGRESS', label: t.inProgress, count: complaints.filter((c) => c.status === 'IN_PROGRESS').length },
            { id: 'RESOLVED', label: t.resolved, count: complaints.filter((c) => c.status === 'RESOLVED').length },
            { id: 'CLOSED', label: t.closed, count: complaints.filter((c) => c.status === 'CLOSED').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '20px',
                border: filterStatus === tab.id ? '1px solid #0f766e' : '1px solid #e2e8f0',
                background: filterStatus === tab.id ? '#0f766e' : '#ffffff',
                color: filterStatus === tab.id ? '#ffffff' : '#64748b',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  background: filterStatus === tab.id ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: filterStatus === tab.id ? '#ffffff' : '#64748b',
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 800,
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
          <RefreshCw size={24} className="spin-slow" style={{ margin: '0 auto 8px auto', display: 'block', color: '#0f766e' }} />
          Loading grievances...
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: '16px',
            padding: '36px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: '#e0f2f1',
              color: '#0f766e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
            }}
          >
            <AlertCircle size={24} />
          </div>
          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>
            {t.noComplaints}
          </h4>
          <p style={{ fontSize: '12px', color: '#64748b', maxWidth: '280px', margin: '0 auto 16px auto' }}>
            {t.noComplaintsDesc}
          </p>
          <button
            onClick={() => setIsNewModalOpen(true)}
            style={{
              background: '#0f766e',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t.raiseFirst}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredComplaints.map((c) => {
            const statusMeta = getStatusBadge(c.status);
            const prioMeta = getPriorityBadge(c.priority);
            const formattedDate = new Date(c.createdAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={c.id}
                onClick={() => setSelectedComplaint(c)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Top Row: ID, Category Icon, Status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{CATEGORY_ICONS[c.category] || '📝'}</span>
                    <strong style={{ fontSize: '13px', color: '#0f766e', fontWeight: 800, letterSpacing: '0.3px' }}>
                      {c.complaintId}
                    </strong>
                    <span
                      style={{
                        background: prioMeta.bg,
                        color: prioMeta.color,
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                      }}
                    >
                      {prioMeta.label}
                    </span>
                  </div>

                  <div
                    style={{
                      background: statusMeta.bg,
                      color: statusMeta.color,
                      border: `1px solid ${statusMeta.border}`,
                      borderRadius: '20px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {statusMeta.icon}
                    <span>{statusMeta.label}</span>
                  </div>
                </div>

                {/* Subject */}
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '4px', lineHeight: 1.3 }}>
                  {c.subject}
                </h4>

                {/* Description Snippet */}
                <p
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    lineHeight: 1.4,
                    marginBottom: '10px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {c.description}
                </p>

                {/* Bottom Meta: PHC, Date, Replies Count & Arrow */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '8px',
                    fontSize: '11px',
                    color: '#64748b',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={13} color="#0f766e" />
                    <span style={{ fontWeight: 600, color: '#334155' }}>{c.phcName}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {c.attachmentUrl && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#0284c7', fontWeight: 700 }}>
                        <Paperclip size={12} /> Photo
                      </span>
                    )}
                    <span>{formattedDate}</span>
                    <ChevronRight size={14} color="#94a3b8" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: RAISE NEW GRIEVANCE / COMPLAINT FORM                  */}
      {/* ============================================================== */}
      {isNewModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-card"
            style={{
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '20px',
              borderRadius: '20px',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: '#e0f2f1',
                    color: '#0f766e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                    {t.modalTitle}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Assigned instant tracking number</span>
                </div>
              </div>

              <button
                onClick={() => setIsNewModalOpen(false)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* PHC Centre Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.selectPhc} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={formPhcId}
                  onChange={(e) => setFormPhcId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    background: '#ffffff',
                    fontWeight: 600,
                  }}
                >
                  {phcs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.district})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Grid */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {t.selectCategory} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {(
                    [
                      'SERVICE_QUALITY',
                      'STAFF_BEHAVIOUR',
                      'MEDICINE_AVAILABILITY',
                      'FACILITY_CLEANLINESS',
                      'WAIT_TIME',
                      'OTHER',
                    ] as ComplaintCategory[]
                  ).map((cat) => {
                    const isSelected = formCategory === cat;
                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setFormCategory(cat)}
                        style={{
                          padding: '10px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0f766e' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0fdfa' : '#ffffff',
                          color: isSelected ? '#0f766e' : '#334155',
                          fontSize: '11px',
                          fontWeight: 700,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{CATEGORY_ICONS[cat]}</span>
                        <span>{CATEGORY_NAMES[cat]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.priority}
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as ComplaintPriority[]).map((p) => {
                    const isSelected = formPriority === p;
                    const pMeta = getPriorityBadge(p);
                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setFormPriority(p)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '8px',
                          border: isSelected ? `2px solid ${pMeta.color}` : '1px solid #e2e8f0',
                          background: isSelected ? pMeta.bg : '#ffffff',
                          color: isSelected ? pMeta.color : '#64748b',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          textAlign: 'center',
                          textTransform: 'uppercase',
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Template Chips */}
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Quick Suggestions:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {t.quickChips.map((chip: string, idx: number) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => {
                        setFormSubject(chip);
                        if (!formDescription) setFormDescription(`I faced an issue regarding ${chip} during my visit.`);
                      }}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        padding: '3px 8px',
                        fontSize: '10px',
                        color: '#334155',
                        cursor: 'pointer',
                      }}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject Input */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.subject} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={t.subjectPlaceholder}
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Description Input */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.description} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={t.descriptionPlaceholder}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>

              {/* Photo Upload / Attachment */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t.attachPhoto}
                </label>

                {formAttachmentUrl ? (
                  <div
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={formAttachmentUrl}
                        alt="attachment preview"
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                      />
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e293b', display: 'block' }}>
                          {formAttachmentName || 'Attached Photo'}
                        </span>
                        <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600 }}>Ready to upload</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormAttachmentUrl(null);
                        setFormAttachmentName(null);
                      }}
                      style={{
                        background: '#fee2e2',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#dc2626',
                        cursor: 'pointer',
                      }}
                    >
                      {t.removePhoto}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '10px',
                        borderRadius: '10px',
                        border: '1px dashed #cbd5e1',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0f766e',
                      }}
                    >
                      <Camera size={16} />
                      <span>{t.uploadPhoto}</span>
                      <input type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
                    </label>

                    <button
                      type="button"
                      onClick={handleSamplePhoto}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        background: '#f1f5f9',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#475569',
                        cursor: 'pointer',
                      }}
                      title="Use sample prescription / slip"
                    >
                      Demo Photo
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1.5,
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0f766e',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)',
                  }}
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="spin-slow" />
                      <span>{t.submittingBtn}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>{t.submitBtn}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: COMPLAINT DETAILS & STATUS HISTORY TIMELINE           */}
      {/* ============================================================== */}
      {selectedComplaint && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-card"
            style={{
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '20px',
              borderRadius: '20px',
              background: '#ffffff',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '18px' }}>{CATEGORY_ICONS[selectedComplaint.category]}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#0f766e',
                      background: '#e0f2f1',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {selectedComplaint.complaintId}
                  </span>
                  <span
                    style={{
                      background: getPriorityBadge(selectedComplaint.priority).bg,
                      color: getPriorityBadge(selectedComplaint.priority).color,
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '6px',
                    }}
                  >
                    {selectedComplaint.priority}
                  </span>
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  {selectedComplaint.subject}
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {selectedComplaint.phcName} • {new Date(selectedComplaint.createdAt).toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => setSelectedComplaint(null)}
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} color="#64748b" />
              </button>
            </div>

            {/* Stepper Status Progress Bar */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px 10px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                {/* Connecting track */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '20px',
                    right: '20px',
                    height: '3px',
                    background: '#e2e8f0',
                    zIndex: 1,
                  }}
                />
                {[
                  { key: 'OPEN', label: 'Registered' },
                  { key: 'IN_PROGRESS', label: 'Under Review' },
                  { key: 'RESOLVED', label: 'Resolved' },
                  { key: 'CLOSED', label: 'Closed' },
                ].map((step, idx) => {
                  const statusOrder = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
                  const currentIndex = statusOrder.indexOf(selectedComplaint.status);
                  const stepIndex = statusOrder.indexOf(step.key);
                  const isPassed = stepIndex <= currentIndex;
                  const isCurrent = step.key === selectedComplaint.status;

                  return (
                    <div
                      key={step.key}
                      style={{
                        zIndex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        width: '70px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isCurrent ? '#0f766e' : isPassed ? '#10b981' : '#e2e8f0',
                          color: isPassed ? '#ffffff' : '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          boxShadow: isCurrent ? '0 0 0 4px #ccfbf1' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {isPassed ? <CheckCircle2 size={14} /> : idx + 1}
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: isCurrent ? 800 : 600,
                          color: isCurrent ? '#0f766e' : isPassed ? '#1e293b' : '#94a3b8',
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Description & Attachment Details */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '6px' }}>
                Description
              </h4>
              <p
                style={{
                  fontSize: '13px',
                  color: '#1e293b',
                  lineHeight: 1.5,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 12px',
                }}
              >
                {selectedComplaint.description}
              </p>

              {selectedComplaint.attachmentUrl && (
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Attachment / Evidence Photo:
                  </span>
                  <a
                    href={selectedComplaint.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      border: '1px solid #bfdbfe',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    <ImageIcon size={16} />
                    <span>{selectedComplaint.attachmentName || 'View Evidence Photo'}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            {/* Resolution Box (If Resolved) */}
            {selectedComplaint.resolutionNotes && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#15803d' }}>
                    {t.resolutionNotes}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#166534', lineHeight: 1.4, margin: 0 }}>
                  {selectedComplaint.resolutionNotes}
                </p>
                {selectedComplaint.resolvedAt && (
                  <span style={{ fontSize: '10px', color: '#15803d', opacity: 0.8, display: 'block', marginTop: '4px' }}>
                    Resolved on {new Date(selectedComplaint.resolvedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Assigned Officer Info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f1f5f9',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '11px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} color="#64748b" />
                <span style={{ color: '#64748b', fontWeight: 600 }}>{t.assignedOfficer}:</span>
                <strong style={{ color: '#1e293b' }}>
                  {selectedComplaint.assignedToName || t.notAssigned}
                </strong>
              </div>
            </div>

            {/* Status History Audit Trail */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                {t.statusHistory}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedComplaint.history?.map((h) => (
                  <div
                    key={h.id}
                    style={{
                      borderLeft: '3px solid #0f766e',
                      paddingLeft: '10px',
                      paddingBottom: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                      <strong style={{ color: '#1e293b' }}>
                        {h.toStatus} • {h.actorName} ({h.actorRole})
                      </strong>
                      <span style={{ color: '#94a3b8' }}>{new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                      {h.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Replies Thread */}
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
                {t.repliesTitle} ({selectedComplaint.replies?.length || 0})
              </h4>

              {selectedComplaint.replies && selectedComplaint.replies.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {selectedComplaint.replies.map((r) => {
                    const isCitizen = r.authorId === selectedComplaint.userId;
                    return (
                      <div
                        key={r.id}
                        style={{
                          background: isCitizen ? '#f0fdfa' : '#f1f5f9',
                          border: isCitizen ? '1px solid #ccfbf1' : '1px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                          <strong style={{ color: isCitizen ? '#0f766e' : '#1e293b' }}>
                            {r.authorName} {r.authorRole !== 'PATIENT' ? `(${r.authorRole})` : ''}
                          </strong>
                          <span style={{ color: '#94a3b8' }}>
                            {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '12px', color: '#334155', margin: 0, lineHeight: 1.4 }}>
                          {r.message}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '12px' }}>
                  No messages yet. Send a query below if you have any questions.
                </p>
              )}

              {/* Reply Input Box */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder={t.replyPlaceholder}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendReply();
                  }}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={replySubmitting || !replyText.trim()}
                  style={{
                    background: '#0f766e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: replySubmitting || !replyText.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Send size={14} />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
