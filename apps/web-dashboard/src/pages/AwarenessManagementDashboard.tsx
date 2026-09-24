import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Share2,
  Heart,
  Volume2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  FileText,
  Image as ImageIcon,
  Video,
  BellRing,
  ExternalLink,
  Copy,
  RefreshCw,
  Globe,
  Tag,
  Check,
  X,
  MessageCircle,
  TrendingUp,
  Award,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Play,
} from 'lucide-react';
import {
  AwarenessItem,
  AwarenessContentType,
  AwarenessCategory,
  AwarenessPublishStatus,
  UserRole,
} from '@phc-connect/types';
import { apiClient } from '../services/api';

interface Props {
  currentRole?: UserRole;
}

const CATEGORY_METADATA: Record<AwarenessCategory, { label: string; hindiLabel: string; color: string; icon: string }> = {
  VACCINATION_DRIVE: { label: 'Vaccination Drive', hindiLabel: 'टीकाकरण अभियान', color: '#0284c7', icon: '💉' },
  SEASONAL_DISEASE: { label: 'Seasonal Diseases', hindiLabel: 'मौसमी बीमारियाँ', color: '#e11d48', icon: '🦟' },
  HYGIENE_NUTRITION: { label: 'Hygiene & Nutrition', hindiLabel: 'स्वच्छता व पोषण', color: '#16a34a', icon: '🥗' },
  MATERNAL_CHILD_HEALTH: { label: 'Maternal & Child', hindiLabel: 'मातृ एवं शिशु स्वास्थ्य', color: '#9333ea', icon: '👶' },
  CHRONIC_NCD: { label: 'Lifestyle & NCDs', hindiLabel: 'जीवनशैली व गैर-संचारी रोग', color: '#d97706', icon: '❤️' },
  EMERGENCY_SCHEMES: { label: 'Govt Schemes & Aid', hindiLabel: 'सरकारी योजनाएँ व सहायता', color: '#4f46e5', icon: '🏛️' },
};

const TYPE_METADATA: Record<AwarenessContentType, { label: string; icon: any; color: string; bg: string }> = {
  ARTICLE: { label: 'Clinical Article', icon: FileText, color: '#0284c7', bg: '#e0f2fe' },
  INFOGRAPHIC: { label: 'Infographic Poster', icon: ImageIcon, color: '#16a34a', bg: '#dcfce7' },
  VIDEO_SHORT: { label: 'Video Short', icon: Video, color: '#9333ea', bg: '#f3e8ff' },
  HEALTH_ALERT: { label: 'Urgent Health Alert', icon: BellRing, color: '#e11d48', bg: '#ffe4e6' },
};

// Preset high quality cover images for quick creation
const IMAGE_PRESETS = [
  {
    name: 'Vaccination / Immunization',
    url: 'https://images.unsplash.com/photo-1632053002928-196160862085?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Mosquito / Dengue Prevention',
    url: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Maternal & Newborn Care',
    url: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Clean Water & Hand Hygiene',
    url: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Nutrition & Millets Diet',
    url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Extreme Heat & Sun Protection',
    url: 'https://images.unsplash.com/photo-1504370805625-d32c54b16100?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ayushman Bharat & Schemes',
    url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
  },
];

export const AwarenessManagementDashboard: React.FC<Props> = ({ currentRole = 'ADMIN' }) => {
  const [items, setItems] = useState<AwarenessItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTabType, setActiveTabType] = useState<AwarenessContentType | 'ALL'>('ALL');
  const [filterCategory, setFilterCategory] = useState<AwarenessCategory | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<AwarenessPublishStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<AwarenessItem | null>(null);
  const [previewLang, setPreviewLang] = useState<'en' | 'hi'>('en');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Editor Modal State (Create or Edit)
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorTab, setEditorTab] = useState<'GENERAL' | 'EN_CONTENT' | 'HI_CONTENT'>('GENERAL');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [formType, setFormType] = useState<AwarenessContentType>('ARTICLE');
  const [formCategory, setFormCategory] = useState<AwarenessCategory>('VACCINATION_DRIVE');
  const [formStatus, setFormStatus] = useState<AwarenessPublishStatus>('PUBLISHED');
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);
  const [formIsUrgent, setFormIsUrgent] = useState<boolean>(false);
  const [formValidUntil, setFormValidUntil] = useState<string>('');
  const [formCoverImageUrl, setFormCoverImageUrl] = useState<string>(IMAGE_PRESETS[0].url);
  const [formMediaUrl, setFormMediaUrl] = useState<string>('');
  const [formReadTime, setFormReadTime] = useState<number>(3);
  const [formVideoDuration, setFormVideoDuration] = useState<number>(60);
  const [formTags, setFormTags] = useState<string>('Health, Awareness, PHC');

  // English Form Fields
  const [formEnTitle, setFormEnTitle] = useState<string>('');
  const [formEnSummary, setFormEnSummary] = useState<string>('');
  const [formEnContent, setFormEnContent] = useState<string>('');
  const [formEnKeyTakeaways, setFormEnKeyTakeaways] = useState<string>('');
  const [formEnAudioText, setFormEnAudioText] = useState<string>('');
  const [formEnShareMessage, setFormEnShareMessage] = useState<string>('');

  // Hindi Form Fields
  const [formHiTitle, setFormHiTitle] = useState<string>('');
  const [formHiSummary, setFormHiSummary] = useState<string>('');
  const [formHiContent, setFormHiContent] = useState<string>('');
  const [formHiKeyTakeaways, setFormHiKeyTakeaways] = useState<string>('');
  const [formHiAudioText, setFormHiAudioText] = useState<string>('');
  const [formHiShareMessage, setFormHiShareMessage] = useState<string>('');

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/awareness', { status: 'ALL' });
      if (res.success && Array.isArray(res.items)) {
        setItems(res.items);
      }
    } catch (err) {
      console.error('Failed to fetch awareness content:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  // Metrics computation
  const metrics = useMemo(() => {
    const total = items.length;
    const published = items.filter((i) => i.status === 'PUBLISHED').length;
    const drafts = items.filter((i) => i.status === 'DRAFT').length;
    const activeAlerts = items.filter((i) => i.isUrgentAlert || i.type === 'HEALTH_ALERT').length;
    const totalViews = items.reduce((acc, curr) => acc + (curr.viewsCount || 0), 0);
    const totalShares = items.reduce((acc, curr) => acc + (curr.sharesCount || 0), 0);
    const totalLikes = items.reduce((acc, curr) => acc + (curr.likesCount || 0), 0);
    const infographics = items.filter((i) => i.type === 'INFOGRAPHIC').length;
    const videos = items.filter((i) => i.type === 'VIDEO_SHORT').length;

    return {
      total,
      published,
      drafts,
      activeAlerts,
      totalViews,
      totalShares,
      totalLikes,
      infographics,
      videos,
    };
  }, [items]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTabType !== 'ALL' && item.type !== activeTabType) return false;
      if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const enTitle = item.translations.en?.title?.toLowerCase() || '';
        const enSummary = item.translations.en?.summary?.toLowerCase() || '';
        const hiTitle = item.translations.hi?.title?.toLowerCase() || '';
        const hiSummary = item.translations.hi?.summary?.toLowerCase() || '';
        const tags = item.tags.join(' ').toLowerCase();
        const cat = item.category.toLowerCase();

        return (
          enTitle.includes(q) ||
          enSummary.includes(q) ||
          hiTitle.includes(q) ||
          hiSummary.includes(q) ||
          tags.includes(q) ||
          cat.includes(q)
        );
      }
      return true;
    });
  }, [items, activeTabType, filterCategory, filterStatus, searchQuery]);

  // Toggle publish status
  const handleTogglePublish = async (id: string, currentStatus: AwarenessPublishStatus) => {
    const nextStatus: AwarenessPublishStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
      const res = await apiClient.patch(`/awareness/${id}/publish`, { status: nextStatus });
      if (res.success && res.item) {
        setItems((prev) => prev.map((item) => (item.id === id ? res.item : item)));
        showFeedback(`Status updated to ${nextStatus}`);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Delete item
  const handleDeleteItem = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await apiClient.delete(`/awareness/${id}`);
      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        if (previewItem?.id === id) setPreviewItem(null);
        showFeedback('Awareness campaign removed successfully');
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const showFeedback = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Open creation modal with clean slate or pre-fill
  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormType('ARTICLE');
    setFormCategory('VACCINATION_DRIVE');
    setFormStatus('PUBLISHED');
    setFormIsFeatured(false);
    setFormIsUrgent(false);
    setFormValidUntil('');
    setFormCoverImageUrl(IMAGE_PRESETS[0].url);
    setFormMediaUrl('');
    setFormReadTime(3);
    setFormVideoDuration(60);
    setFormTags('Immunization, PHC Health, Child Wellness');

    // Default English
    setFormEnTitle('');
    setFormEnSummary('');
    setFormEnContent('');
    setFormEnKeyTakeaways('');
    setFormEnAudioText('');
    setFormEnShareMessage('');

    // Default Hindi
    setFormHiTitle('');
    setFormHiSummary('');
    setFormHiContent('');
    setFormHiKeyTakeaways('');
    setFormHiAudioText('');
    setFormHiShareMessage('');

    setEditorTab('GENERAL');
    setIsEditorOpen(true);
  };

  // Open edit modal for an existing item
  const handleOpenEditModal = (item: AwarenessItem) => {
    setEditingId(item.id);
    setFormType(item.type);
    setFormCategory(item.category);
    setFormStatus(item.status);
    setFormIsFeatured(item.isFeatured);
    setFormIsUrgent(item.isUrgentAlert);
    setFormValidUntil(item.validUntil || '');
    setFormCoverImageUrl(item.coverImageUrl || IMAGE_PRESETS[0].url);
    setFormMediaUrl(item.mediaUrl || '');
    setFormReadTime(item.readTimeMinutes || 3);
    setFormVideoDuration(item.videoDurationSeconds || 60);
    setFormTags(item.tags.join(', '));

    // English
    setFormEnTitle(item.translations.en?.title || '');
    setFormEnSummary(item.translations.en?.summary || '');
    setFormEnContent(item.translations.en?.content || '');
    setFormEnKeyTakeaways(item.translations.en?.keyTakeaways?.join('\n') || '');
    setFormEnAudioText(item.translations.en?.audioNarratorText || '');
    setFormEnShareMessage(item.translations.en?.shareMessage || '');

    // Hindi
    setFormHiTitle(item.translations.hi?.title || '');
    setFormHiSummary(item.translations.hi?.summary || '');
    setFormHiContent(item.translations.hi?.content || '');
    setFormHiKeyTakeaways(item.translations.hi?.keyTakeaways?.join('\n') || '');
    setFormHiAudioText(item.translations.hi?.audioNarratorText || '');
    setFormHiShareMessage(item.translations.hi?.shareMessage || '');

    setEditorTab('GENERAL');
    setIsEditorOpen(true);
  };

  // Pre-fill helper templates
  const handleApplyPresetTemplate = (presetType: 'PULSE_POLIO' | 'DENGUE_ALERT' | 'NUTRITION_MILLETS') => {
    if (presetType === 'PULSE_POLIO') {
      setFormType('HEALTH_ALERT');
      setFormCategory('VACCINATION_DRIVE');
      setFormIsUrgent(true);
      setFormIsFeatured(true);
      setFormCoverImageUrl(IMAGE_PRESETS[0].url);
      setFormTags('Polio, Immunization, Free Vaccine, PHC Drive');
      setFormEnTitle('National Pulse Polio Immunization Drive: 0-5 Years');
      setFormEnSummary('Two drops of life for every child under 5 years at all Anganwadi & PHC booths this Sunday.');
      setFormEnContent('The National Immunization Day ensures every child receives oral polio drops to maintain total eradication. Bring your child between 8:00 AM and 5:00 PM. No registration required.');
      setFormEnKeyTakeaways('Administer 2 drops to all children under 5\nAvailable free across all PHC sub-centres\nProtect your child against paralytic polio');
      setFormEnAudioText('Important public health alert. The National Pulse Polio drive is active this Sunday. Ensure all infants and children under 5 receive polio drops at your nearest PHC.');
      setFormEnShareMessage('💉 *National Pulse Polio Drive This Sunday!* Give 2 drops of life to all children under 5 years at your nearest PHC booth. Free vaccination.');

      setFormHiTitle('राष्ट्रीय पल्स पोलियो प्रतिरक्षण अभियान: 0-5 वर्ष के बच्चों हेतु');
      setFormHiSummary("इस रविवार सभी आंगनवाड़ी व पीएचसी बूथों पर 5 वर्ष तक के सभी बच्चों को 'दो बूंद जिंदगी की' अवश्य पिलाएं।");
      setFormHiContent('राष्ट्रीय प्रतिरक्षण दिवस के तहत सभी छोटे बच्चों को पोलियो की खुराक दी जाती है ताकि देश पोलियो मुक्त रहे। सुबह 8:00 बजे से शाम 5:00 बजे तक निःशुल्क खुराक प्राप्त करें।');
      setFormHiKeyTakeaways('5 वर्ष तक के सभी बच्चों को 2 बूंद अवश्य पिलाएं\nसभी पीएचसी उप-केंद्रों व बूथों पर पूर्णतः निःशुल्क\nअपने बच्चे को पोलियो से सुरक्षित रखें');
      setFormHiAudioText('सार्वजनिक स्वास्थ्य सूचना। इस रविवार को पल्स पोलियो अभियान के तहत अपने 5 वर्ष तक के बच्चों को नजदीकी स्वास्थ्य केंद्र पर दो बूंद जिंदगी की अवश्य दिलवाएं।');
      setFormHiShareMessage('💉 *पल्स पोलियो अभियान इस रविवार!* अपने 0-5 वर्ष के सभी बच्चों को नजदीकी पीएचसी बूथ पर 2 बूंद पोलियो खुराक अवश्य दिलवाएं।');
    } else if (presetType === 'DENGUE_ALERT') {
      setFormType('INFOGRAPHIC');
      setFormCategory('SEASONAL_DISEASE');
      setFormIsUrgent(true);
      setFormCoverImageUrl(IMAGE_PRESETS[1].url);
      setFormTags('Dengue, Malaria, Monsoon, Vector Control');
      setFormEnTitle('Vector Disease Advisory: Stop Dengue & Malaria Breeding');
      setFormEnSummary('Essential monsoon precautions to eliminate stagnant water, prevent mosquito bites, and seek timely fever care.');
      setFormEnContent('Dengue mosquitoes breed in clean, stagnant water. Empty cooler water every 5 days, cover overhead tanks, and use mosquito nets.');
      setFormEnKeyTakeaways('Empty coolers & flower pots weekly\nWear full-sleeve protective clothing\nVisit PHC for free NS1 antigen blood test on fever');
      setFormEnAudioText('Monsoon health advisory. Prevent dengue and malaria by drying coolers weekly and avoiding stagnant water around your home.');
      setFormEnShareMessage('🦟 *Dengue Prevention Advisory*: Clean stagnant water from coolers weekly. In case of high fever, get free blood testing at your local PHC.');

      setFormHiTitle('वेक्टर-जनित रोग चेतावनी: डेंगू व मलेरिया से बचाव के उपाय');
      setFormHiSummary('मानसून में रुके हुए पानी को साफ रखें, पूरी आस्तीन के कपड़े पहनें और तेज बुखार पर तुरंत पीएचसी पर जांच कराएं।');
      setFormHiContent('डेंगू फैलाने वाले मच्छर साफ रुके हुए पानी में पनपते हैं। कूलर, गमलों और टायरों में पानी जमा न होने दें। बुखार होने पर खुद से दवा न लें, सरकारी अस्पताल में जांच कराएं।');
      setFormHiKeyTakeaways('हफ्ते में एक बार कूलर सुखाएं और साफ करें\nपूरी आस्तीन के कपड़े व मच्छरदानी का उपयोग करें\nतेज बुखार होने पर तुरंत पीएचसी पर निःशुल्क जांच करवाएं');
      setFormHiAudioText('मानसून स्वास्थ्य चेतावनी। डेंगू और मलेरिया से बचने के लिए घर के आसपास पानी न जमा होने दें तथा बुखार पर सरकारी अस्पताल में जांच कराएं।');
      setFormHiShareMessage('🦟 *डेंगू व मलेरिया रोकथाम*: कूलर व बर्तनों में पानी जमा न होने दें। तेज बुखार होने पर तुरंत नजदीकी पीएचसी पर निःशुल्क जांच कराएं।');
    } else if (presetType === 'NUTRITION_MILLETS') {
      setFormType('ARTICLE');
      setFormCategory('HYGIENE_NUTRITION');
      setFormCoverImageUrl(IMAGE_PRESETS[4].url);
      setFormTags('Millets, Shree Anna, Diabetes, High Fiber, Hypertension');
      setFormEnTitle('Shree Anna Millets Diet: Controlling Diabetes & Blood Pressure');
      setFormEnSummary('How Bajra, Ragi, and Jowar regulate glycemic index, reduce cholesterol, and improve gut microbiome.');
      setFormEnContent('Millets are powerhouses of dietary fiber, minerals, and complex carbohydrates with a low glycemic index, making them ideal for preventing non-communicable lifestyle conditions.');
      setFormEnKeyTakeaways('Replace refined flour with Ragi or Bajra\nHigh insoluble fiber stabilizes blood sugar spikes\nRich in calcium, iron, and magnesium');
      setFormEnAudioText('Nutrition advisory on millets. Incorporating Shree Anna like Ragi and Jowar in your daily diet helps regulate diabetes and maintain healthy blood pressure.');
      setFormEnShareMessage('🥗 *Healthy Diet with Millets*: Boost your immunity and control blood pressure by adding Ragi, Jowar, and Bajra to your family diet.');

      setFormHiTitle('श्री अन्न (मिलेट्स) आहार: मधुमेह और उच्च रक्तचाप का प्राकृतिक नियंत्रण');
      setFormHiSummary('रागी, बाजरा और ज्वार कैसे रक्त शर्करा को नियंत्रित करते हैं और कोलेस्ट्रॉल कम करने में मदद करते हैं।');
      setFormHiContent('मिलेट्स में भरपूर फाइबर और मिनरल्स होते हैं जिनका ग्लाइसेमिक इंडेक्स कम होता है। रोजाना एक समय मिलेट्स का सेवन करने से डायबिटीज और हृदय रोग का खतरा घटता है।');
      setFormHiKeyTakeaways('मैदा और परिष्कृत अनाज की जगह रागी व बाजरा अपनाएं\nउच्च फाइबर रक्त शर्करा को नियंत्रित रखता है\nकैल्शियम और आयरन से भरपूर');
      setFormHiAudioText('पोषण सलाह। अपने दैनिक भोजन में रागी, बाजरा और ज्वार को शामिल करें जिससे मधुमेह नियंत्रित रहता है और रक्तचाप सामान्य रहता है।');
      setFormHiShareMessage('🥗 *श्री अन्न मिलेट्स आहार*: अपने परिवार के आहार में रागी, बाजरा और ज्वार शामिल करें और मधुमेह व बीपी को प्राकृतिक रूप से नियंत्रित रखें।');
    }
  };

  // Submit create / update form
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEnTitle.trim() || !formHiTitle.trim()) {
      alert('Please enter titles for both English and Hindi versions.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        type: formType,
        category: formCategory,
        status: formStatus,
        isFeatured: formIsFeatured,
        isUrgentAlert: formIsUrgent,
        validUntil: formValidUntil ? formValidUntil : null,
        coverImageUrl: formCoverImageUrl,
        mediaUrl: formMediaUrl || formCoverImageUrl,
        thumbnailUrl: formCoverImageUrl,
        videoDurationSeconds: formType === 'VIDEO_SHORT' ? formVideoDuration : undefined,
        readTimeMinutes: formReadTime,
        tags: formTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        translations: {
          en: {
            title: formEnTitle,
            summary: formEnSummary,
            content: formEnContent,
            keyTakeaways: formEnKeyTakeaways
              .split('\n')
              .map((t) => t.trim())
              .filter(Boolean),
            audioNarratorText: formEnAudioText,
            shareMessage: formEnShareMessage || `📢 ${formEnTitle}\n\n${formEnSummary}`,
          },
          hi: {
            title: formHiTitle,
            summary: formHiSummary,
            content: formHiContent,
            keyTakeaways: formHiKeyTakeaways
              .split('\n')
              .map((t) => t.trim())
              .filter(Boolean),
            audioNarratorText: formHiAudioText,
            shareMessage: formHiShareMessage || `📢 ${formHiTitle}\n\n${formHiSummary}`,
          },
        },
      };

      if (editingId) {
        const res = await apiClient.put(`/awareness/${editingId}`, payload);
        if (res.success && res.item) {
          setItems((prev) => prev.map((i) => (i.id === editingId ? res.item : i)));
          setIsEditorOpen(false);
          showFeedback('Awareness campaign updated successfully');
        } else {
          alert(res.error || 'Failed to update campaign');
        }
      } else {
        const res = await apiClient.post('/awareness', payload);
        if (res.success && res.item) {
          setItems((prev) => [res.item, ...prev]);
          setIsEditorOpen(false);
          showFeedback('New awareness campaign published successfully');
        } else {
          alert(res.error || 'Failed to create campaign');
        }
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      alert(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Text to Speech playback for preview
  const handlePlayTTS = (text?: string, lang: 'en' | 'hi' = 'en') => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on your browser.');
      return;
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // Copy share text
  const handleCopyShare = (item: AwarenessItem) => {
    const text = item.translations.en?.shareMessage || item.translations.en?.summary || item.translations.en.title;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // WhatsApp share
  const handleWhatsAppShare = (item: AwarenessItem) => {
    const text = item.translations.en?.shareMessage || `${item.translations.en.title}\n\n${item.translations.en.summary}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="awareness-dashboard" style={{ padding: '24px', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Toast Feedback Notification */}
      {actionSuccessMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(5, 150, 105, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '14px',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '24px',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '240px',
            height: '240px',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={12} /> IEC & COMMUNITY HEALTH EDUCATION
              </span>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                🌐 Multilingual (EN / HI)
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>
              Social Health Awareness & Public Communication
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px', maxWidth: '680px', lineHeight: 1.5 }}>
              Publish, curate, and broadcast multimedia health advisories, vaccination schedules, disease alerts, and nutrition guidance directly to citizens and ASHA community networks.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: 'none',
                color: '#ffffff',
                padding: '11px 20px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              <Plus size={16} />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '14px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Total Campaigns</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>{metrics.total}</div>
            <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '2px' }}>{metrics.published} Published • {metrics.drafts} Drafts</div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <div style={{ fontSize: '11px', color: '#fca5a5', fontWeight: 600 }}>Active Health Alerts</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{metrics.activeAlerts}</div>
            <div style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>Live broadcast banners</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Infographics & Posters</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>{metrics.infographics}</div>
            <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '2px' }}>High-res visual guides</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Video Shorts</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>{metrics.videos}</div>
            <div style={{ fontSize: '11px', color: '#d8b4fe', marginTop: '2px' }}>Demonstration clips</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>Community Views</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#fde047', marginTop: '4px' }}>
              {metrics.totalViews.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: '#fef08a', marginTop: '2px' }}>
              {metrics.totalShares} Shares • {metrics.totalLikes} Likes
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Content Type Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              onClick={() => setActiveTabType('ALL')}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                border: activeTabType === 'ALL' ? 'none' : '1px solid #e2e8f0',
                background: activeTabType === 'ALL' ? 'linear-gradient(135deg, #0f172a, #334155)' : '#f8fafc',
                color: activeTabType === 'ALL' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Formats ({items.length})
            </button>

            {(['ARTICLE', 'INFOGRAPHIC', 'VIDEO_SHORT', 'HEALTH_ALERT'] as AwarenessContentType[]).map((typeKey) => {
              const meta = TYPE_METADATA[typeKey];
              const Icon = meta.icon;
              const count = items.filter((i) => i.type === typeKey).length;
              const isActive = activeTabType === typeKey;

              return (
                <button
                  key={typeKey}
                  onClick={() => setActiveTabType(typeKey)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    border: isActive ? 'none' : '1px solid #e2e8f0',
                    background: isActive ? meta.color : '#ffffff',
                    color: isActive ? '#ffffff' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={15} />
                  <span>{meta.label}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '9999px',
                      background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                      color: isActive ? '#ffffff' : '#64748b',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
            <button
              onClick={() => setViewMode('GRID')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'GRID' ? '#ffffff' : 'transparent',
                color: viewMode === 'GRID' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'GRID' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Grid Cards
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: viewMode === 'TABLE' ? '#ffffff' : 'transparent',
                color: viewMode === 'TABLE' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: viewMode === 'TABLE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Data Table
            </button>
          </div>
        </div>

        {/* Search & Dropdown Filters Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search campaigns by keyword, English or Hindi title, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 40px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Health Categories</option>
            {Object.entries(CATEGORY_METADATA).map(([k, meta]) => (
              <option key={k} value={k}>
                {meta.icon} {meta.label}
              </option>
            ))}
          </select>

          {/* Publish Status Dropdown */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              background: '#ffffff',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">🟢 Published Live</option>
            <option value="DRAFT">🟡 Draft Offline</option>
            <option value="ARCHIVED">⚪ Archived</option>
          </select>

          {/* Reset Filters */}
          {(searchQuery || filterCategory !== 'ALL' || filterStatus !== 'ALL' || activeTabType !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('ALL');
                setFilterStatus('ALL');
                setActiveTabType('ALL');
              }}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content View */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, fontSize: '14px' }}>Loading health awareness campaigns...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📢</div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>No awareness campaigns match filters</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px', maxWidth: '460px', margin: '6px auto 20px' }}>
            Try adjusting your search keywords, category filters, or create a brand new educational campaign.
          </p>
          <button
            onClick={handleOpenCreateModal}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Create New Campaign
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID CARDS VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredItems.map((item) => {
            const catMeta = CATEGORY_METADATA[item.category] || { label: item.category, color: '#64748b', icon: '📝' };
            const typeMeta = TYPE_METADATA[item.type] || { label: item.type, icon: FileText, color: '#0284c7' };
            const TypeIcon = typeMeta.icon;

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  borderRadius: '18px',
                  border: item.isUrgentAlert ? '2px solid #f87171' : '1px solid #e2e8f0',
                  boxShadow: item.isUrgentAlert ? '0 8px 25px rgba(239, 68, 68, 0.12)' : '0 4px 14px rgba(0, 0, 0, 0.04)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                }}
              >
                {/* Image Cover & Badges */}
                <div style={{ height: '170px', position: 'relative', background: '#0f172a', overflow: 'hidden' }}>
                  <img
                    src={item.coverImageUrl}
                    alt={item.translations.en?.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.75) 100%)',
                    }}
                  />

                  {/* Top Badges */}
                  <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span
                        style={{
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(6px)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <TypeIcon size={13} style={{ color: typeMeta.color }} />
                        <span>{typeMeta.label}</span>
                      </span>

                      {item.isUrgentAlert && (
                        <span
                          style={{
                            background: '#ef4444',
                            color: '#ffffff',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            animation: 'pulse 2s infinite',
                          }}
                        >
                          <AlertTriangle size={12} /> URGENT
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <button
                      onClick={() => handleTogglePublish(item.id, item.status)}
                      title="Click to toggle publish status"
                      style={{
                        background: item.status === 'PUBLISHED' ? '#10b981' : '#f59e0b',
                        color: '#ffffff',
                        border: 'none',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
                      <span>{item.status}</span>
                    </button>
                  </div>

                  {/* Category Pill at Bottom of Image */}
                  <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                    <span
                      style={{
                        background: `${catMeta.color}dd`,
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>{catMeta.icon}</span>
                      <span>{catMeta.label}</span>
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* English Title */}
                  <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', lineHeight: 1.35, marginBottom: '6px' }}>
                    {item.translations.en?.title}
                  </h4>

                  {/* Hindi Title Subtitle */}
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0284c7', marginBottom: '10px' }}>
                    {item.translations.hi?.title}
                  </p>

                  {/* Summary */}
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px', flex: 1 }}>
                    {item.translations.en?.summary}
                  </p>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#f1f5f9',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Metrics Footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '12px',
                      borderTop: '1px solid #f1f5f9',
                      fontSize: '12px',
                      color: '#64748b',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={13} color="#0284c7" /> {item.viewsCount || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Share2 size={13} color="#16a34a" /> {item.sharesCount || 0}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Heart size={13} color="#e11d48" /> {item.likesCount || 0}
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Action Buttons Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '6px' }}>
                    <button
                      onClick={() => {
                        setPreviewItem(item);
                        setPreviewLang('en');
                      }}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#334155',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Eye size={14} /> Preview
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(item)}
                      style={{
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#0284c7',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                      }}
                    >
                      <Edit3 size={14} /> Edit
                    </button>

                    <button
                      onClick={() => handleWhatsAppShare(item)}
                      title="Share to WhatsApp"
                      style={{
                        background: '#dcfce7',
                        border: '1px solid #bbf7d0',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        color: '#16a34a',
                        cursor: 'pointer',
                      }}
                    >
                      <MessageCircle size={15} />
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id, item.translations.en?.title)}
                      title="Delete campaign"
                      style={{
                        background: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>CAMPAIGN / TITLE</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>FORMAT & CATEGORY</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>STATUS</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>STATS</th>
                <th style={{ padding: '14px 16px', fontWeight: 700 }}>DATE</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const catMeta = CATEGORY_METADATA[item.category] || { label: item.category, color: '#64748b', icon: '📝' };
                const typeMeta = TYPE_METADATA[item.type] || { label: item.type, icon: FileText, color: '#0284c7' };
                const TypeIcon = typeMeta.icon;

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '13px',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={item.coverImageUrl}
                          alt=""
                          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{item.translations.en?.title}</div>
                          <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>{item.translations.hi?.title}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: typeMeta.color }}>
                          <TypeIcon size={14} /> {typeMeta.label}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {catMeta.icon} {catMeta.label}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => handleTogglePublish(item.id, item.status)}
                        style={{
                          background: item.status === 'PUBLISHED' ? '#dcfce7' : '#fef3c7',
                          color: item.status === 'PUBLISHED' ? '#166534' : '#92400e',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569', fontSize: '12px' }}>
                      <div>👁️ {item.viewsCount || 0} views</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        💬 {item.sharesCount || 0} shares • ❤️ {item.likesCount || 0}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px' }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setPreviewItem(item);
                            setPreviewLang('en');
                          }}
                          title="Preview"
                          style={{ padding: '6px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#334155' }}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit"
                          style={{ padding: '6px', background: '#e0f2fe', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#0284c7' }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleWhatsAppShare(item)}
                          title="WhatsApp share"
                          style={{ padding: '6px', background: '#dcfce7', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#16a34a' }}
                        >
                          <MessageCircle size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.translations.en?.title)}
                          title="Delete"
                          style={{ padding: '6px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. INTERACTIVE PREVIEW MODAL                             */}
      {/* ========================================================= */}
      {previewItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    background: '#e0f2fe',
                    color: '#0284c7',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  LIVE CITIZEN PREVIEW
                </span>

                {/* Language Switcher */}
                <div style={{ display: 'flex', background: '#e2e8f0', padding: '2px', borderRadius: '8px' }}>
                  <button
                    onClick={() => setPreviewLang('en')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: previewLang === 'en' ? '#ffffff' : 'transparent',
                      color: previewLang === 'en' ? '#0f172a' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setPreviewLang('hi')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: previewLang === 'hi' ? '#ffffff' : 'transparent',
                      color: previewLang === 'hi' ? '#0f172a' : '#64748b',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    हिंदी (Hindi)
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsPlayingAudio(false);
                  setPreviewItem(null);
                }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Reader View */}
            <div style={{ padding: '24px' }}>
              {/* Cover Image */}
              <div style={{ borderRadius: '16px', overflow: 'hidden', height: '240px', position: 'relative', marginBottom: '20px' }}>
                <img
                  src={previewItem.coverImageUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.8) 100%)',
                  }}
                />
                <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', gap: '8px' }}>
                  <span style={{ background: '#0284c7', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                    {CATEGORY_METADATA[previewItem.category]?.label}
                  </span>
                  {previewItem.isUrgentAlert && (
                    <span style={{ background: '#ef4444', color: '#ffffff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                      URGENT PUBLIC ALERT
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', lineHeight: 1.3 }}>
                {previewLang === 'hi' ? previewItem.translations.hi?.title : previewItem.translations.en?.title}
              </h2>

              {/* Author & Audio Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Authored by <strong style={{ color: '#0f172a' }}>{previewItem.authorName}</strong> ({previewItem.authorRole})
                </div>

                <button
                  onClick={() => {
                    const text = previewLang === 'hi' ? previewItem.translations.hi?.audioNarratorText : previewItem.translations.en?.audioNarratorText;
                    handlePlayTTS(text || (previewLang === 'hi' ? previewItem.translations.hi?.summary : previewItem.translations.en?.summary), previewLang);
                  }}
                  style={{
                    background: isPlayingAudio ? '#ef4444' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Volume2 size={15} />
                  <span>{isPlayingAudio ? 'Stop Narrator' : 'Listen to Audio Guide'}</span>
                </button>
              </div>

              {/* Summary */}
              <div
                style={{
                  background: '#e0f2fe',
                  borderLeft: '4px solid #0284c7',
                  padding: '14px 18px',
                  borderRadius: '0 12px 12px 0',
                  marginBottom: '20px',
                  fontSize: '14px',
                  color: '#0369a1',
                  fontWeight: 600,
                  lineHeight: 1.5,
                }}
              >
                {previewLang === 'hi' ? previewItem.translations.hi?.summary : previewItem.translations.en?.summary}
              </div>

              {/* Key Takeaways */}
              {((previewLang === 'hi' ? previewItem.translations.hi?.keyTakeaways : previewItem.translations.en?.keyTakeaways) || []).length > 0 && (
                <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                    {previewLang === 'hi' ? '📌 मुख्य स्वास्थ्य बिंदु:' : '📌 Key Takeaways & Recommendations:'}
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    {(previewLang === 'hi' ? previewItem.translations.hi?.keyTakeaways : previewItem.translations.en?.keyTakeaways)?.map((item, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Article Content */}
              <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.7, marginBottom: '24px' }}>
                <p>{previewLang === 'hi' ? previewItem.translations.hi?.content : previewItem.translations.en?.content}</p>
              </div>

              {/* WhatsApp Share Simulation Box */}
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>WhatsApp Public Broadcast Message</div>
                  <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px', maxWidth: '520px' }}>
                    {previewLang === 'hi' ? previewItem.translations.hi?.shareMessage : previewItem.translations.en?.shareMessage}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleCopyShare(previewItem)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #86efac',
                      color: '#166534',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copiedId === previewItem.id ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedId === previewItem.id ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleWhatsAppShare(previewItem)}
                    style={{
                      background: '#16a34a',
                      border: 'none',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <MessageCircle size={15} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. RICH BILINGUAL CREATION & EDIT MODAL                  */}
      {/* ========================================================= */}
      {isEditorOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '24px',
              maxWidth: '920px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {editingId ? 'Edit Health Awareness Campaign' : 'Create New Health Awareness Campaign'}
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Bilingual English & Hindi multimedia content with speech narration and WhatsApp templates.
                </p>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Quick Templates:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTemplate('PULSE_POLIO')}
                  style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0284c7', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  💉 Pulse Polio
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTemplate('DENGUE_ALERT')}
                  style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  🦟 Dengue Alert
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetTemplate('NUTRITION_MILLETS')}
                  style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#16a34a', fontSize: '11px', fontWeight: 700, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                >
                  🥗 Millets Diet
                </button>

                <button
                  onClick={() => setIsEditorOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px', marginLeft: '12px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Tabs Bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9', padding: '0 24px' }}>
              <button
                type="button"
                onClick={() => setEditorTab('GENERAL')}
                style={{
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  background: 'transparent',
                  color: editorTab === 'GENERAL' ? '#0284c7' : '#64748b',
                  borderBottom: editorTab === 'GENERAL' ? '3px solid #0284c7' : '3px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Layers size={15} /> 1. Format & Media Configuration
              </button>

              <button
                type="button"
                onClick={() => setEditorTab('EN_CONTENT')}
                style={{
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  background: 'transparent',
                  color: editorTab === 'EN_CONTENT' ? '#0284c7' : '#64748b',
                  borderBottom: editorTab === 'EN_CONTENT' ? '3px solid #0284c7' : '3px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Globe size={15} /> 2. English Content (English)
              </button>

              <button
                type="button"
                onClick={() => setEditorTab('HI_CONTENT')}
                style={{
                  padding: '12px 20px',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: 'none',
                  background: 'transparent',
                  color: editorTab === 'HI_CONTENT' ? '#0284c7' : '#64748b',
                  borderBottom: editorTab === 'HI_CONTENT' ? '3px solid #0284c7' : '3px solid transparent',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🇮🇳</span> 3. Hindi Content (हिंदी अनुवाद)
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ padding: '24px', flex: 1 }}>
                {/* TAB 1: GENERAL CONFIGURATION */}
                {editorTab === 'GENERAL' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      {/* Content Type */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Content Format
                        </label>
                        <select
                          value={formType}
                          onChange={(e) => setFormType(e.target.value as any)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        >
                          <option value="ARTICLE">📄 Clinical Article / Guide</option>
                          <option value="INFOGRAPHIC">🖼️ Infographic Poster</option>
                          <option value="VIDEO_SHORT">🎥 Video Demonstration / Short</option>
                          <option value="HEALTH_ALERT">🚨 Urgent Health Alert</option>
                        </select>
                      </div>

                      {/* Health Category */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Health Category
                        </label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value as any)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        >
                          {Object.entries(CATEGORY_METADATA).map(([k, meta]) => (
                            <option key={k} value={k}>
                              {meta.icon} {meta.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Publish Status */}
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Publish Status
                        </label>
                        <select
                          value={formStatus}
                          onChange={(e) => setFormStatus(e.target.value as any)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        >
                          <option value="PUBLISHED">🟢 Published Live</option>
                          <option value="DRAFT">🟡 Draft (Hidden)</option>
                          <option value="ARCHIVED">⚪ Archived</option>
                        </select>
                      </div>
                    </div>

                    {/* Checkboxes: Urgent Alert & Featured */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formIsUrgent}
                          onChange={(e) => setFormIsUrgent(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#ef4444' }}
                        />
                        <div>
                          <strong style={{ fontSize: '13px', color: '#ef4444' }}>🚨 Urgent Public Health Alert</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Displays top pulsating warning banner and instant push advisory.</div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formIsFeatured}
                          onChange={(e) => setFormIsFeatured(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#0284c7' }}
                        />
                        <div>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>⭐ Featured Spotlight Campaign</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Pinned to the homepage carousel on citizen mobile app.</div>
                        </div>
                      </label>
                    </div>

                    {/* Valid Until & Tags */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Valid Until (Optional for Date-Bound Drives)
                        </label>
                        <input
                          type="date"
                          value={formValidUntil ? formValidUntil.split('T')[0] : ''}
                          onChange={(e) => setFormValidUntil(e.target.value)}
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Tags (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={formTags}
                          onChange={(e) => setFormTags(e.target.value)}
                          placeholder="e.g. Polio, Immunization, Infant Care"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                        />
                      </div>
                    </div>

                    {/* Cover Image Preset Picker */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                        Cover Image Selection
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
                        {IMAGE_PRESETS.map((preset, idx) => (
                          <div
                            key={idx}
                            onClick={() => setFormCoverImageUrl(preset.url)}
                            style={{
                              borderRadius: '10px',
                              overflow: 'hidden',
                              border: formCoverImageUrl === preset.url ? '2px solid #0284c7' : '1px solid #cbd5e1',
                              cursor: 'pointer',
                              position: 'relative',
                              height: '70px',
                            }}
                          >
                            <img src={preset.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: 0, insetInline: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '10px', padding: '2px 4px', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {preset.name}
                            </div>
                          </div>
                        ))}
                      </div>

                      <input
                        type="text"
                        value={formCoverImageUrl}
                        onChange={(e) => setFormCoverImageUrl(e.target.value)}
                        placeholder="Or enter custom image URL"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: ENGLISH CONTENT */}
                {editorTab === 'EN_CONTENT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        English Campaign Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={formEnTitle}
                        onChange={(e) => setFormEnTitle(e.target.value)}
                        placeholder="e.g. National Pulse Polio Immunization Drive: 0-5 Years"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        English Summary Excerpt (Short description for cards & search)
                      </label>
                      <textarea
                        rows={2}
                        value={formEnSummary}
                        onChange={(e) => setFormEnSummary(e.target.value)}
                        placeholder="Brief 1-2 sentence overview for citizens..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        Full Guidance Body / Article Content
                      </label>
                      <textarea
                        rows={4}
                        value={formEnContent}
                        onChange={(e) => setFormEnContent(e.target.value)}
                        placeholder="Detailed clinical instructions, dosage, timings, PHC guidelines..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: 1.5 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Key Bullet Takeaways (one per line)
                        </label>
                        <textarea
                          rows={3}
                          value={formEnKeyTakeaways}
                          onChange={(e) => setFormEnKeyTakeaways(e.target.value)}
                          placeholder="Administer 2 drops to infants&#10;Available free across all PHCs&#10;Protect your child against polio"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          Audio Narrator Text (TTS Transcript for Accessibility)
                        </label>
                        <textarea
                          rows={3}
                          value={formEnAudioText}
                          onChange={(e) => setFormEnAudioText(e.target.value)}
                          placeholder="Clear spoken message read aloud to elderly & rural citizens..."
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        WhatsApp Share Message Template
                      </label>
                      <input
                        type="text"
                        value={formEnShareMessage}
                        onChange={(e) => setFormEnShareMessage(e.target.value)}
                        placeholder="Pre-composed message for 1-click WhatsApp forwarding..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                )}

                {/* TAB 3: HINDI CONTENT */}
                {editorTab === 'HI_CONTENT' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        हिंदी अभियान शीर्षक (Hindi Title) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formHiTitle}
                        onChange={(e) => setFormHiTitle(e.target.value)}
                        placeholder="उदा: राष्ट्रीय पल्स पोलियो प्रतिरक्षण अभियान: 0-5 वर्ष के बच्चों हेतु"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        हिंदी संक्षिप्त विवरण (Hindi Summary)
                      </label>
                      <textarea
                        rows={2}
                        value={formHiSummary}
                        onChange={(e) => setFormHiSummary(e.target.value)}
                        placeholder="नागरिकों हेतु 1-2 पंक्तियों का संक्षिप्त विवरण..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        सम्पूर्ण स्वास्थ्य मार्गदर्शिका व विवरण (Hindi Body Content)
                      </label>
                      <textarea
                        rows={4}
                        value={formHiContent}
                        onChange={(e) => setFormHiContent(e.target.value)}
                        placeholder="विस्तृत स्वास्थ्य दिशा-निर्देश, समय, दवा का विवरण..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: 1.5 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          मुख्य बिंदु (एक पंक्ति में एक बिंदु)
                        </label>
                        <textarea
                          rows={3}
                          value={formHiKeyTakeaways}
                          onChange={(e) => setFormHiKeyTakeaways(e.target.value)}
                          placeholder="5 वर्ष तक के सभी बच्चों को 2 बूंद अवश्य पिलाएं&#10;सभी पीएचसी पर निःशुल्क उपलब्ध&#10;अपने बच्चे को पोलियो से सुरक्षित रखें"
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          ऑडियो नैरेटर ट्रांसक्रिप्ट (हिंदी आवाज़ हेतु)
                        </label>
                        <textarea
                          rows={3}
                          value={formHiAudioText}
                          onChange={(e) => setFormHiAudioText(e.target.value)}
                          placeholder="स्पष्ट हिंदी संदेश जो ग्रामीण व वरिष्ठ नागरिकों को सुनाया जाएगा..."
                          style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                        व्हाट्सएप साझाकरण संदेश (WhatsApp Share Message in Hindi)
                      </label>
                      <input
                        type="text"
                        value={formHiShareMessage}
                        onChange={(e) => setFormHiShareMessage(e.target.value)}
                        placeholder="व्हाट्सएप पर फॉरवर्ड करने हेतु संदेश..."
                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div
                style={{
                  padding: '16px 24px',
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottomLeftRadius: '24px',
                  borderBottomRightRadius: '24px',
                }}
              >
                <div style={{ display: 'flex', gap: '8px' }}>
                  {editorTab !== 'GENERAL' && (
                    <button
                      type="button"
                      onClick={() => setEditorTab(editorTab === 'HI_CONTENT' ? 'EN_CONTENT' : 'GENERAL')}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Back
                    </button>
                  )}
                  {editorTab !== 'HI_CONTENT' && (
                    <button
                      type="button"
                      onClick={() => setEditorTab(editorTab === 'GENERAL' ? 'EN_CONTENT' : 'HI_CONTENT')}
                      style={{
                        background: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        color: '#0284c7',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>Next Section</span> <ArrowRight size={14} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    style={{
                      background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '10px 24px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isSaving ? 'Saving...' : editingId ? 'Update Campaign' : 'Publish Campaign'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AwarenessManagementDashboard;
