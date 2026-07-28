import React, { useState, useEffect } from 'react';
import ChatPanel from './ChatPanel';

const API = 'https://api.ssgzone.in/api/v1/webmail';

export default function WebmailDashboard() {
  const [folder, setFolder] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [folderCounts, setFolderCounts] = useState({});
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState('inbox');
  const [compose, setCompose] = useState({ to: '', cc: '', bcc: '', subject: '', body_html: '' });
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarModal, setCalendarModal] = useState(null);
  const [calendarForm, setCalendarForm] = useState({ title: '', description: '', start_time: '', end_time: '', all_day: false, color: '#6366f1' });
  const [sending, setSending] = useState(false);
  const [profile, setProfile] = useState(null);
  const [videoRooms, setVideoRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateModal, setTemplateModal] = useState(null);
  const [tplForm, setTplForm] = useState({ name: '', subject: '', html_body: '', category: 'general' });
  const [tplPreview, setTplPreview] = useState(false);
  const [tplSaving, setTplSaving] = useState(false);
  const [ooo, setOoo] = useState(null);
  const [oooLoading, setOooLoading] = useState(false);
  const [oooForm, setOooForm] = useState({ subject: 'Out of Office', message: '', start_date: '', end_date: '', is_active: true });
  const [oooSaving, setOooSaving] = useState(false);
  const [oooEditing, setOooEditing] = useState(false);
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [ruleForm, setRuleForm] = useState({ name: '', condition_field: 'from', condition_operator: 'contains', condition_value: '', action_type: 'move', action_value: 'spam' });
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [applyingRules, setApplyingRules] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [signature, setSignature] = useState(null);
  const [sigForm, setSigForm] = useState({ name: 'Default', html_body: '', is_active: true });
  const [sigSaving, setSigSaving] = useState(false);
  const [sigEditing, setSigEditing] = useState(false);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [draftId, setDraftId] = useState(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [lastUnread, setLastUnread] = useState(null);
  const [toast, setToast] = useState(null);
  const [attachFiles, setAttachFiles] = useState([]);
  const [twoFAStatus, setTwoFAStatus] = useState(false);
  const [twoFASetup, setTwoFASetup] = useState(null);
  const [twoFASaving, setTwoFASaving] = useState(false);
  const [scheduledEmails, setScheduledEmails] = useState([]);
  const [scheduleAt, setScheduleAt] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');
  const [waConfigured, setWaConfigured] = useState(false);
  const [waContacts, setWaContacts] = useState([]);
  const [waMessages, setWaMessages] = useState([]);
  const [waActivePhone, setWaActivePhone] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [waSending, setWaSending] = useState(false);
  const [waContactForm, setWaContactForm] = useState({ name: '', phone: '' });
  const [waContactFormOpen, setWaContactFormOpen] = useState(false);
  const [waLoading, setWaLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifUnread, setNotifUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(null);
  const [notifPrefsOpen, setNotifPrefsOpen] = useState(false);
  const [notifPrefsSaving, setNotifPrefsSaving] = useState(false);
  const [notifPrefsForm, setNotifPrefsForm] = useState({ notify_new_email: true, notify_chat_mention: true, email_digest: false, email_digest_frequency: 'daily', sms_new_email: false, phone: '' });
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({ from_email: '', date_from: '', date_to: '', has_attachment: false, folder: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [searchActive, setSearchActive] = useState(false);
  const [labels, setLabels] = useState([]);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [labelForm, setLabelForm] = useState({ name: '', color: '#6366f1' });
  const [labelFormOpen, setLabelFormOpen] = useState(false);
  const [emailLabels, setEmailLabels] = useState({});
  const [thread, setThread] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [showThread, setShowThread] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [exportFolder, setExportFolder] = useState('inbox');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [selectedEmailIds, setSelectedEmailIds] = useState([]);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [jumpPage, setJumpPage] = useState('');

  const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
  const token = localStorage.getItem('webmail_token');
  const auth = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const warnAt = exp - 5 * 60 * 1000;
      const now = Date.now();
      if (warnAt > now) {
        const warnTimer = setTimeout(() => setSessionWarning(true), warnAt - now);
        const expTimer = setTimeout(() => { setSessionWarning(false); setSessionExpired(true); setTimeout(handleLogout, 3000); }, exp - now);
        return () => { clearTimeout(warnTimer); clearTimeout(expTimer); };
      }
    } catch {}
  }, [token]);

  const renewSession = async () => {
    try {
      const res = await fetch(`${API}/auth/refresh`, { method: 'POST', headers: auth });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('webmail_token', data.data.token);
        setSessionWarning(false);
        showToastNotification('✅ Session renewed for 8 hours');
        window.location.reload();
      }
    } catch {}
  };

  const bulkAction = async (action) => {
    if (!selectedEmailIds.length) return;
    try {
      const res = await fetch(`${API}/bulk-action`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email_ids: selectedEmailIds })
      });
      const data = await res.json();
      if (data.success) {
        setSelectedEmailIds([]);
        fetchEmails();
        fetchFolderCounts();
        showToastNotification(`✅ ${data.affected} email(s) updated`);
      } else showToastNotification('Error: ' + data.error);
    } catch (err) { showToastNotification(err.message); }
  };

  const totalPages = Math.ceil(total / 25);

  useEffect(() => {
    if (!token) { window.location.href = '/'; return; }
    fetchFolderCounts();
    fetch(`${API}/profile`, { headers: auth }).then(r => r.json()).then(d => d.success && setProfile(d.data));
    fetchVideoRooms();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (activeNav === 'inbox') { fetchEmails(); setSelectedEmailIds([]); }
  }, [folder, page, search]);

  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) SSGzone Mail` : 'SSGzone Mail';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 32; canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 32, 32);
      ctx.fillStyle = '#6366f1';
      ctx.beginPath(); ctx.arc(16, 16, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('S', 16, 17);
      if (unread > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath(); ctx.arc(26, 6, 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(unread > 9 ? '9+' : String(unread), 26, 7);
      }
      let link = document.querySelector('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.href = canvas.toDataURL();
    } catch {}
  }, [unread]);

  useEffect(() => {
    if (!token) return () => {};
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/folders/counts`, { headers: auth });
        const data = await res.json();
        if (!data.success) return;
        const currentUnread = data.data?.inbox?.unread || 0;
        if (lastUnread !== null && currentUnread > lastUnread) {
          const diff = currentUnread - lastUnread;
          showToastNotification(`📬 ${diff} new email${diff > 1 ? 's' : ''} arrived`);
          playNotifSound();
          if (activeNav === 'inbox' && folder === 'inbox') fetchEmails();
          fetchFolderCounts();
        }
        setLastUnread(currentUnread);
      } catch {}
    }, 15000);
    return () => clearInterval(interval);
  }, [lastUnread, activeNav, folder, token]);

  const playNotifSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  useEffect(() => {
    if (activeNav === 'inbox') { fetchEmails(); setSelectedEmailIds([]); }
  }, [activeNav]);

  useEffect(() => {
    if (activeNav !== 'inbox') return;
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (['INPUT','TEXTAREA','SELECT'].includes(tag) || document.activeElement?.contentEditable === 'true') return;
      if (e.key === '?') { setShowShortcutsHelp(p => !p); return; }
      if (e.key === 'Escape') {
        if (composeOpen) { setComposeOpen(false); setAttachFiles([]); }
        else if (showShortcutsHelp) setShowShortcutsHelp(false);
        else setSelectedEmail(null);
        return;
      }
      if (e.key === 'c') { setCompose({ to: '', cc: '', bcc: '', subject: '', body_html: '' }); setComposeOpen(true); return; }
      if (e.key === 'r' && selectedEmail && !composeOpen) {
        setCompose({ to: selectedEmail.from_email, subject: `Re: ${selectedEmail.subject}`, body_html: '', cc: '', bcc: '' });
        setComposeOpen(true); return;
      }
      if (e.key === 'd' && selectedEmail && !composeOpen) { deleteEmail(selectedEmail.id); return; }
      const list = searchActive ? searchResults : emails;
      const idx = list.findIndex(em => em.id === selectedEmail?.id);
      if (e.key === 'j') { const next = list[idx + 1]; if (next) openEmail(next); return; }
      if (e.key === 'k') { const prev = list[idx - 1]; if (prev) openEmail(prev); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeNav, composeOpen, selectedEmail, emails, searchActive, searchResults, showShortcutsHelp]);

  useEffect(() => {
    if (!composeOpen) return;
    const timer = setTimeout(() => {
      if (compose.subject || compose.body_html || compose.to) {
        saveDraft(compose, draftId);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [compose, composeOpen]);

  const fetchEmails = async () => {
    setLoading(true);
    setSelectedEmail(null);
    try {
      const params = new URLSearchParams({ folder, page, limit: 25 });
      if (search) params.append('search', search);
      const res = await fetch(`${API}/inbox?${params}`, { headers: auth });
      const data = await res.json();
      if (data.success) { setEmails(data.data); setTotal(data.total); setUnread(data.unread || 0); }
    } catch {}
    setLoading(false);
  };

  const fetchVideoRooms = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/video/rooms', { headers: auth });
      const data = await res.json();
      if (data.success) setVideoRooms(data.data);
    } catch {}
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await fetch(`${API}/analytics`, { headers: auth });
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch {}
    setAnalyticsLoading(false);
  };

  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const res = await fetch(`${API}/templates`, { headers: auth });
      const data = await res.json();
      if (data.success) setTemplates(data.data);
    } catch {}
    setTemplatesLoading(false);
  };

  const saveTemplate = async () => {
    if (!tplForm.name || !tplForm.subject || !tplForm.html_body) return alert('Name, subject and body required');
    setTplSaving(true);
    try {
      const isEdit = templateModal && templateModal.id;
      const url = isEdit ? `${API}/templates/${templateModal.id}` : `${API}/templates`;
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(tplForm)
      });
      const data = await res.json();
      if (data.success) {
        setTemplateModal(null);
        setTplForm({ name: '', subject: '', html_body: '', category: 'general' });
        fetchTemplates();
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    setTplSaving(false);
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/notifications?limit=20', { headers: auth });
      const data = await res.json();
      if (data.success) { setNotifications(data.data); setNotifUnread(data.unread); }
    } catch {}
  };

  const markAllNotifRead = async () => {
    await fetch('https://api.ssgzone.in/api/v1/notifications/read-all', { method: 'PATCH', headers: auth });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setNotifUnread(0);
  };

  const deleteNotif = async (id) => {
    await fetch(`https://api.ssgzone.in/api/v1/notifications/${id}`, { method: 'DELETE', headers: auth });
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const fetchNotifPrefs = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/notifications/prefs', { headers: auth });
      const data = await res.json();
      if (data.success && data.data) {
        setNotifPrefs(data.data);
        setNotifPrefsForm({
          notify_new_email: data.data.notify_new_email,
          notify_chat_mention: data.data.notify_chat_mention,
          email_digest: data.data.email_digest,
          email_digest_frequency: data.data.email_digest_frequency || 'daily',
          sms_new_email: data.data.sms_new_email,
          phone: data.data.phone || ''
        });
      }
    } catch {}
  };

  const saveNotifPrefs = async () => {
    setNotifPrefsSaving(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/notifications/prefs', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(notifPrefsForm)
      });
      const data = await res.json();
      if (data.success) { setNotifPrefs(data.data); setNotifPrefsOpen(false); showToastNotification('Preferences saved'); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
    setNotifPrefsSaving(false);
  };

  const fetchWaStatus = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/whatsapp/status', { headers: auth });
      const data = await res.json();
      if (data.success) setWaConfigured(data.configured);
    } catch {}
  };

  const fetchWaContacts = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/whatsapp/contacts', { headers: auth });
      const data = await res.json();
      if (data.success) setWaContacts(data.data);
    } catch {}
  };

  const fetchWaMessages = async (phone) => {
    setWaLoading(true);
    try {
      const res = await fetch(`https://api.ssgzone.in/api/v1/whatsapp/messages?phone=${encodeURIComponent(phone)}`, { headers: auth });
      const data = await res.json();
      if (data.success) setWaMessages(data.data);
    } catch {}
    setWaLoading(false);
  };

  const sendWaMessage = async () => {
    if (!waActivePhone || !waMessage.trim()) return;
    setWaSending(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/whatsapp/send', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: waActivePhone, message: waMessage.trim() })
      });
      const data = await res.json();
      if (data.success) { setWaMessages(prev => [...prev, data.data]); setWaMessage(''); }
      else showToastNotification('Failed: ' + data.error);
    } catch (err) { showToastNotification(err.message); }
    setWaSending(false);
  };

  const saveWaContact = async () => {
    if (!waContactForm.name || !waContactForm.phone) return alert('Name and phone required');
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/whatsapp/contacts', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(waContactForm)
      });
      const data = await res.json();
      if (data.success) {
        setWaContacts(prev => [...prev.filter(c => c.id !== data.data.id), data.data].sort((a, b) => a.name.localeCompare(b.name)));
        setWaContactForm({ name: '', phone: '' });
        setWaContactFormOpen(false);
      } else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const deleteWaContact = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    await fetch(`https://api.ssgzone.in/api/v1/whatsapp/contacts/${id}`, { method: 'DELETE', headers: auth });
    setWaContacts(prev => prev.filter(c => c.id !== id));
  };

  const saveDraft = async (composeData, existingDraftId) => {
    setDraftSaving(true);
    try {
      if (existingDraftId) {
        await fetch(`${API}/drafts/${existingDraftId}`, {
          method: 'PUT',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: composeData.subject, to: composeData.to, cc: composeData.cc, bcc: composeData.bcc, html_content: composeData.body_html, text_content: composeData.body_html })
        });
      } else {
        const res = await fetch(`${API}/drafts`, {
          method: 'POST',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject: composeData.subject, to: composeData.to, cc: composeData.cc, bcc: composeData.bcc, html_content: composeData.body_html, text_content: composeData.body_html })
        });
        const data = await res.json();
        if (data.success) setDraftId(data.data.id);
      }
    } catch {}
    setDraftSaving(false);
  };

  const fetchCalendarEvents = async (date) => {
    const d = date || calendarDate;
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
    try {
      const res = await fetch(`https://api.ssgzone.in/api/v1/calendar/events?start=${start}&end=${end}`, { headers: auth });
      const data = await res.json();
      if (data.success) setCalendarEvents(data.data);
    } catch {}
  };

  const saveCalendarEvent = async () => {
    if (!calendarForm.title || !calendarForm.start_time || !calendarForm.end_time) return alert('Title, start and end time required');
    const isEdit = calendarModal && calendarModal.id;
    const url = isEdit ? `https://api.ssgzone.in/api/v1/calendar/events/${calendarModal.id}` : 'https://api.ssgzone.in/api/v1/calendar/events';
    const method = isEdit ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(calendarForm) });
      const data = await res.json();
      if (data.success) { setCalendarModal(null); fetchCalendarEvents(); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const deleteCalendarEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await fetch(`https://api.ssgzone.in/api/v1/calendar/events/${id}`, { method: 'DELETE', headers: auth });
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    setCalendarModal(null);
  };

  const discardDraft = async (id) => {
    if (!id) return;
    try {
      await fetch(`${API}/drafts/${id}`, { method: 'DELETE', headers: auth });
    } catch {}
    setDraftId(null);
  };

  const showToastNotification = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  const fetchContacts = async (search = '') => {
    setContactsLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`https://api.ssgzone.in/api/v1/contacts${params}`, { headers: auth });
      const data = await res.json();
      if (data.success) setContacts(data.data);
    } catch {}
    setContactsLoading(false);
  };

  const saveContact = async () => {
    if (!contactForm.name || !contactForm.email) return alert('Name and email required');
    setContactSaving(true);
    try {
      const isEdit = !!editingContact;
      const url = isEdit ? `https://api.ssgzone.in/api/v1/contacts/${editingContact.id}` : 'https://api.ssgzone.in/api/v1/contacts';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      const data = await res.json();
      if (data.success) {
        setContactFormOpen(false);
        setEditingContact(null);
        setContactForm({ name: '', email: '', phone: '', company: '', notes: '' });
        fetchContacts(contactSearch);
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    setContactSaving(false);
  };

  const deleteContact = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    await fetch(`https://api.ssgzone.in/api/v1/contacts/${id}`, { method: 'DELETE', headers: auth });
    setContacts(prev => prev.filter(ct => ct.id !== id));
  };

  const fetchSignature = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/signatures', { headers: auth });
      const data = await res.json();
      if (data.success && data.data) {
        setSignature(data.data);
        setSigForm({ name: data.data.name, html_body: data.data.html_body, is_active: data.data.is_active });
      }
    } catch {}
  };

  const saveSignature = async () => {
    setSigSaving(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/signatures', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(sigForm)
      });
      const data = await res.json();
      if (data.success) { setSignature(data.data); setSigEditing(false); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
    setSigSaving(false);
  };

  const toggleSignature = async () => {
    const res = await fetch('https://api.ssgzone.in/api/v1/signatures/toggle', { method: 'PATCH', headers: auth });
    const data = await res.json();
    if (data.success) setSignature(data.data);
  };

  const fetchToSuggestions = async (q) => {
    if (!q || q.length < 2) { setToSuggestions([]); setShowToSuggestions(false); return; }
    try {
      const res = await fetch(`https://api.ssgzone.in/api/v1/contacts/suggest?q=${encodeURIComponent(q)}`, { headers: auth });
      const data = await res.json();
      if (data.success && data.data.length) { setToSuggestions(data.data); setShowToSuggestions(true); }
      else { setToSuggestions([]); setShowToSuggestions(false); }
    } catch {}
  };

  const fetchRules = async () => {
    setRulesLoading(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/rules', { headers: auth });
      const data = await res.json();
      if (data.success) setRules(data.data);
    } catch {}
    setRulesLoading(false);
  };

  const saveRule = async () => {
    if (!ruleForm.name || !ruleForm.condition_value) return alert('Name and condition value required');
    if (ruleForm.action_type === 'move' && !ruleForm.action_value) return alert('Destination folder required for move action');
    setRuleSaving(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/rules', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm)
      });
      const data = await res.json();
      if (data.success) {
        setRules(prev => [...prev, data.data]);
        setRuleFormOpen(false);
        setRuleForm({ name: '', condition_field: 'from', condition_operator: 'contains', condition_value: '', action_type: 'move', action_value: 'spam' });
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    setRuleSaving(false);
  };

  const deleteRule = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    await fetch(`https://api.ssgzone.in/api/v1/rules/${id}`, { method: 'DELETE', headers: auth });
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const toggleRule = async (id) => {
    const res = await fetch(`https://api.ssgzone.in/api/v1/rules/${id}/toggle`, { method: 'PATCH', headers: auth });
    const data = await res.json();
    if (data.success) setRules(prev => prev.map(r => r.id === id ? data.data : r));
  };

  const applyRules = async () => {
    setApplyingRules(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/rules/apply', { method: 'POST', headers: auth });
      const data = await res.json();
      if (data.success) {
        alert(`Rules applied - ${data.affected} email(s) updated`);
        fetchEmails();
        fetchFolderCounts();
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    setApplyingRules(false);
  };

  const fetchOoo = async () => {
    setOooLoading(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/autoresponder', { headers: auth });
      const data = await res.json();
      if (data.success) {
        setOoo(data.data);
        if (data.data) setOooForm({
          subject: data.data.subject,
          message: data.data.message,
          start_date: data.data.start_date ? data.data.start_date.slice(0,16) : '',
          end_date: data.data.end_date ? data.data.end_date.slice(0,16) : '',
          is_active: data.data.is_active
        });
      }
    } catch {}
    setOooLoading(false);
  };

  const saveOoo = async () => {
    if (!oooForm.message) return alert('Message required');
    setOooSaving(true);
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/autoresponder', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(oooForm)
      });
      const data = await res.json();
      if (data.success) { setOoo(data.data); setOooEditing(false); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
    setOooSaving(false);
  };

  const toggleOoo = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/autoresponder/toggle', { method: 'PATCH', headers: auth });
      const data = await res.json();
      if (data.success) setOoo(data.data);
      else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const deleteOoo = async () => {
    if (!window.confirm('Remove autoresponder?')) return;
    await fetch('https://api.ssgzone.in/api/v1/autoresponder', { method: 'DELETE', headers: auth });
    setOoo(null);
    setOooForm({ subject: 'Out of Office', message: '', start_date: '', end_date: '', is_active: true });
    setOooEditing(false);
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    await fetch(`${API}/templates/${id}`, { method: 'DELETE', headers: auth });
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const useTemplate = (tpl) => {
    setCompose({ to: '', cc: '', bcc: '', subject: tpl.subject, body_html: tpl.html_body });
    setComposeOpen(true);
  };

  const createRoom = async () => {
    try {
      const res = await fetch('https://api.ssgzone.in/api/v1/video/rooms', {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: meetingTitle || 'Quick Meeting' })
      });
      const data = await res.json();
      if (data.success) {
        setVideoRooms(prev => [data.data, ...prev]);
        setActiveRoom(data.data);
        setShowNewMeeting(false);
        setMeetingTitle('');
      }
    } catch (err) { alert(err.message); }
  };

  const endRoom = async (roomId) => {
    await fetch(`https://api.ssgzone.in/api/v1/video/rooms/${roomId}`, { method: 'DELETE', headers: auth });
    setVideoRooms(prev => prev.filter(r => r.id !== roomId));
    if (activeRoom?.id === roomId) setActiveRoom(null);
  };

  const fetchFolderCounts = async () => {
    try {
      const res = await fetch(`${API}/folders/counts`, { headers: auth });
      const data = await res.json();
      if (data.success) setFolderCounts(data.data);
    } catch {}
  };

  const openEmail = async (email) => {
    if (email.folder === 'drafts') {
      setDraftId(email.id);
      setCompose({ to: email.to_email || '', cc: email.cc_email || '', bcc: email.bcc_email || '', subject: email.subject || '', body_html: email.html_content || email.preview || '' });
      setComposeOpen(true);
      return;
    }
    if (!email.read_status) {
      await fetch(`${API}/email/${email.id}/read`, {
        method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_read: true })
      });
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, read_status: true } : e));
      setUnread(u => Math.max(0, u - 1));
    }
    const res = await fetch(`${API}/email/${email.id}`, { headers: auth });
    const data = await res.json();
    if (data.success) setSelectedEmail(data.data);
  };

  const toggleStar = async (e, emailId) => {
    e.stopPropagation();
    const res = await fetch(`${API}/email/${emailId}/star`, { method: 'PATCH', headers: auth });
    const data = await res.json();
    if (data.success) setEmails(prev => prev.map(em => em.id === emailId ? { ...em, starred: data.is_starred } : em));
  };

  const deleteEmail = async (emailId) => {
    await fetch(`${API}/email/${emailId}`, { method: 'DELETE', headers: auth });
    setEmails(prev => prev.filter(e => e.id !== emailId));
    if (selectedEmail?.id === emailId) setSelectedEmail(null);
    fetchFolderCounts();
  };

  const fetchScheduled = async () => {
    try {
      const res = await fetch(`${API}/scheduled`, { headers: auth });
      const data = await res.json();
      if (data.success) setScheduledEmails(data.data);
    } catch {}
  };

  const cancelScheduled = async (id) => {
    if (!window.confirm('Cancel this scheduled email?')) return;
    try {
      const res = await fetch(`${API}/scheduled/${id}`, { method: 'DELETE', headers: auth });
      const data = await res.json();
      if (data.success) setScheduledEmails(prev => prev.filter(e => e.id !== id));
      else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const sendEmail = async (scheduled_at_override) => {
    if (!compose.to || !compose.subject) return alert('To and Subject required');
    setSending(true);
    const currentDraftId = draftId;
    const scheduledTime = scheduled_at_override || (scheduleAt || undefined);
    try {
      let attachmentIds = [];
      if (attachFiles.length > 0) {
        const formData = new FormData();
        attachFiles.forEach(f => formData.append('files', f));
        const uploadRes = await fetch('https://api.ssgzone.in/api/v1/attachments/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) attachmentIds = uploadData.data.map(a => a.id);
      }
      const res = await fetch(`${API}/send`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: compose.to, cc: compose.cc, bcc: compose.bcc,
          subject: compose.subject,
          html_content: compose.body_html,
          text_content: compose.body_html,
          attachment_ids: attachmentIds,
          ...(scheduledTime ? { scheduled_at: new Date(scheduledTime).toISOString() } : {})
        })
      });
      const data = await res.json();
      if (data.success) {
        setComposeOpen(false);
        setCompose({ to: '', cc: '', bcc: '', subject: '', body_html: '' });
        setAttachFiles([]);
        setScheduleAt('');
        setShowSchedulePicker(false);
        if (currentDraftId) discardDraft(currentDraftId);
        if (data.scheduled_at) {
          setScheduleMsg(`📅 Email scheduled for ${new Date(data.scheduled_at).toLocaleString()}`);
          setTimeout(() => setScheduleMsg(''), 5000);
          showToastNotification(`📅 Scheduled for ${new Date(data.scheduled_at).toLocaleString()}`);
        } else {
          showToastNotification('✅ Email sent!');
        }
        if (folder === 'sent') fetchEmails();
        fetchFolderCounts();
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    setSending(false);
  };

  const fetchThread = async (email) => {
    setThreadLoading(true);
    setShowThread(false);
    try {
      const baseSubject = (email.subject || '').replace(/^(Re:|Fwd:)\s*/i, '').trim();
      const res = await fetch(`${API}/thread?subject=${encodeURIComponent(baseSubject)}&email=${encodeURIComponent(email.from_email)}`, { headers: auth });
      const data = await res.json();
      if (data.success) { setThread(data.data); setShowThread(true); }
    } catch {}
    setThreadLoading(false);
  };

  const downloadExport = async () => {
    try {
      const res = await fetch(`${API}/export?folder=${exportFolder}&format=csv`, { headers: auth });
      if (!res.ok) { alert('Export failed'); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emails_${exportFolder}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExportDropdown(false);
    } catch (err) { alert(err.message); }
  };

  const fetchLabels = async () => {
    setLabelsLoading(true);
    try {
      const res = await fetch(`${API}/labels`, { headers: auth });
      const data = await res.json();
      if (data.success) setLabels(data.data);
    } catch {}
    setLabelsLoading(false);
  };

  const saveLabel = async () => {
    if (!labelForm.name) return alert('Name required');
    try {
      const res = await fetch(`${API}/labels`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify(labelForm)
      });
      const data = await res.json();
      if (data.success) { setLabels(prev => [...prev, data.data]); setLabelForm({ name: '', color: '#6366f1' }); setLabelFormOpen(false); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const deleteLabel = async (id) => {
    if (!window.confirm('Delete this label?')) return;
    await fetch(`${API}/labels/${id}`, { method: 'DELETE', headers: auth });
    setLabels(prev => prev.filter(l => l.id !== id));
  };

  const fetchEmailLabels = async (emailId) => {
    try {
      const res = await fetch(`${API}/email/${emailId}/labels`, { headers: auth });
      const data = await res.json();
      if (data.success) setEmailLabels(prev => ({ ...prev, [emailId]: data.data }));
    } catch {}
  };

  const addLabelToEmail = async (emailId, labelId) => {
    try {
      await fetch(`${API}/email/${emailId}/labels`, {
        method: 'POST',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({ label_id: labelId })
      });
      fetchEmailLabels(emailId);
    } catch {}
  };

  const removeLabelFromEmail = async (emailId, labelId) => {
    await fetch(`${API}/email/${emailId}/labels/${labelId}`, { method: 'DELETE', headers: auth });
    setEmailLabels(prev => ({ ...prev, [emailId]: (prev[emailId] || []).filter(l => l.id !== labelId) }));
  };

  const runAdvancedSearch = async () => {
    if (!search.trim()) return alert('Enter a search query');
    try {
      const params = new URLSearchParams({ q: search });
      if (searchFilters.from_email) params.append('from_email', searchFilters.from_email);
      if (searchFilters.date_from) params.append('date_from', searchFilters.date_from);
      if (searchFilters.date_to) params.append('date_to', searchFilters.date_to);
      if (searchFilters.has_attachment) params.append('has_attachment', 'true');
      if (searchFilters.folder) params.append('folder', searchFilters.folder);
      const res = await fetch(`${API}/search?${params}`, { headers: auth });
      const data = await res.json();
      if (data.success) { setSearchResults(data.data); setSearchActive(true); setAdvancedSearch(false); }
      else alert(data.error);
    } catch (err) { alert(err.message); }
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/'; };
  const initials = (userData.full_name || userData.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const c = {
    primary: '#6366f1', primaryLight: '#eff6ff',
    danger: '#ef4444', warning: '#f59e0b',
    text: '#1f2937', textMuted: '#6b7280', border: '#e5e7eb', bg: '#f8fafc', card: '#ffffff'
  };

  const TwoFAEnableForm = () => {
    const [localCode, setLocalCode] = React.useState('');
    return (
      <div>
        <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 12 }}>Scan this QR code with Google Authenticator or Authy:</div>
        <img src={twoFASetup.qr_code} alt="QR" style={{ width: 180, height: 180, border: `1px solid ${c.border}`, borderRadius: 8, marginBottom: 12 }} />
        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 12, fontFamily: 'monospace', background: c.bg, padding: '6px 10px', borderRadius: 6 }}>Secret: {twoFASetup.secret}</div>
        <input value={localCode} onChange={e => setLocalCode(e.target.value)} maxLength={6} placeholder="Enter 6-digit code"
          style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 16, textAlign: 'center', letterSpacing: 6, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <button onClick={async () => {
          setTwoFASaving(true);
          const res = await fetch('https://api.ssgzone.in/api/v1/webmail/2fa/enable', {
            method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: localCode })
          });
          const d = await res.json();
          if (d.success) { setTwoFAStatus(true); setTwoFASetup(null); showToastNotification('✅ 2FA enabled!'); }
          else alert(d.error);
          setTwoFASaving(false);
        }} disabled={twoFASaving || localCode.length !== 6}
          style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: localCode.length !== 6 ? 0.6 : 1 }}>
          {twoFASaving ? 'Verifying...' : 'Enable 2FA'}
        </button>
      </div>
    );
  };

  const FOLDERS = [
    { id: 'inbox', label: 'Inbox', icon: '📥' },
    { id: 'sent', label: 'Sent', icon: '📤' },
    { id: 'drafts', label: 'Drafts', icon: '📝' },
    { id: 'starred', label: 'Starred', icon: '⭐' },
    { id: 'spam', label: 'Spam', icon: '⚠️' },
    { id: 'trash', label: 'Trash', icon: '🗑️' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg, fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}>

      {/* Sidebar */}
      <div style={{ width: sidebarCollapsed ? 56 : 220, minHeight: '100vh', background: c.card, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.2s', overflow: 'hidden' }}>
        <div style={{ padding: '16px 12px', borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>S</div>
          {!sidebarCollapsed && <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>SSGzone Mail</span>}
        </div>

        {!sidebarCollapsed && (
          <div style={{ padding: '12px 12px 4px' }}>
            <button onClick={() => {
              const sig = signature?.is_active ? `\n\n--\n${signature.html_body.replace(/<[^>]*>/g, '')}` : '';
    setCompose(p => ({ ...p, body_html: sig }));
              setComposeOpen(true);
            }}
              style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              ✏️ Compose
            </button>
          </div>
        )}

        <div style={{ flex: 1, padding: '8px 6px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: c.textMuted, padding: '8px 8px 4px', letterSpacing: '0.06em' }}>{!sidebarCollapsed && 'MAIL'}</div>
          {FOLDERS.map(f => {
            const count = folderCounts[f.id];
            const isActive = activeNav === 'inbox' && folder === f.id;
            return (
              <div key={f.id} onClick={() => { setActiveNav('inbox'); setFolder(f.id); setPage(1); setSearch(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 1, background: isActive ? c.primaryLight : 'transparent', color: isActive ? c.primary : c.text, fontWeight: isActive ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{f.icon}</span>
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex: 1 }}>{f.label}</span>
                    {count?.unread > 0 && <span style={{ background: c.danger, color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{count.unread}</span>}
                  </>
                )}
              </div>
            );
          })}

          <div style={{ fontSize: 10, fontWeight: 600, color: c.textMuted, padding: '12px 8px 4px', letterSpacing: '0.06em' }}>{!sidebarCollapsed && 'COLLABORATION'}</div>
          <div onClick={() => setActiveNav('chat')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'chat' ? c.primaryLight : 'transparent', color: activeNav === 'chat' ? c.primary : c.text, fontWeight: activeNav === 'chat' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>💬</span>
            {!sidebarCollapsed && <span>Team Chat</span>}
          </div>
          <div onClick={() => { setActiveNav('video'); fetchVideoRooms(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'video' ? c.primaryLight : 'transparent', color: activeNav === 'video' ? c.primary : c.text, fontWeight: activeNav === 'video' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>📹</span>
            {!sidebarCollapsed && <span>Video Calls</span>}
          </div>
          <div onClick={() => { setActiveNav('calendar'); fetchCalendarEvents(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'calendar' ? c.primaryLight : 'transparent', color: activeNav === 'calendar' ? c.primary : c.text, fontWeight: activeNav === 'calendar' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>📅</span>
            {!sidebarCollapsed && <span>Calendar</span>}
          </div>
          <div onClick={() => { setActiveNav('analytics'); fetchAnalytics(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'analytics' ? c.primaryLight : 'transparent', color: activeNav === 'analytics' ? c.primary : c.text, fontWeight: activeNav === 'analytics' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>📊</span>
            {!sidebarCollapsed && <span>Analytics</span>}
          </div>
          <div onClick={() => { setActiveNav('templates'); fetchTemplates(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'templates' ? c.primaryLight : 'transparent', color: activeNav === 'templates' ? c.primary : c.text, fontWeight: activeNav === 'templates' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>

            <span style={{ fontSize: 14 }}>📋</span>
            {!sidebarCollapsed && <span>Templates</span>}

          </div>

          <div onClick={() => { setActiveNav('contacts'); fetchContacts(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'contacts' ? c.primaryLight : 'transparent', color: activeNav === 'contacts' ? c.primary : c.text, fontWeight: activeNav === 'contacts' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>👤</span>
            {!sidebarCollapsed && <span>Contacts</span>}
          </div>
          <div onClick={() => { setActiveNav('signature'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'signature' ? c.primaryLight : 'transparent', color: activeNav === 'signature' ? c.primary : c.text, fontWeight: activeNav === 'signature' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>✍️</span>
            {!sidebarCollapsed && <span>Signature</span>}
          </div>
          <div onClick={() => { setActiveNav('rules'); fetchRules(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'rules' ? c.primaryLight : 'transparent', color: activeNav === 'rules' ? c.primary : c.text, fontWeight: activeNav === 'rules' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>⚙️</span>
            {!sidebarCollapsed && <span>Email Rules</span>}
          </div>
          <div onClick={() => { setActiveNav('whatsapp'); fetchWaStatus(); fetchWaContacts(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'whatsapp' ? c.primaryLight : 'transparent', color: activeNav === 'whatsapp' ? c.primary : c.text, fontWeight: activeNav === 'whatsapp' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>💬</span>
            {!sidebarCollapsed && <span>WhatsApp</span>}
          </div>
          <div onClick={() => { setActiveNav('scheduled'); fetchScheduled(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'scheduled' ? c.primaryLight : 'transparent', color: activeNav === 'scheduled' ? c.primary : c.text, fontWeight: activeNav === 'scheduled' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>🕐</span>
            {!sidebarCollapsed && <span>Scheduled</span>}
          </div>
          <div onClick={() => { setActiveNav('ooo'); fetchOoo(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'ooo' ? c.primaryLight : 'transparent', color: activeNav === 'ooo' ? c.primary : c.text, fontWeight: activeNav === 'ooo' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>🏖</span>
            {!sidebarCollapsed && <span>Out of Office</span>}
          </div>
          <div onClick={() => { setActiveNav('security'); fetch('https://api.ssgzone.in/api/v1/webmail/2fa/status',{headers:auth}).then(r=>r.json()).then(d=>d.success&&setTwoFAStatus(d.data.enabled)); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'security' ? c.primaryLight : 'transparent', color: activeNav === 'security' ? c.primary : c.text, fontWeight: activeNav === 'security' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>🛡️</span>
            {!sidebarCollapsed && <span>Security (2FA)</span>}
          </div>
          <div onClick={() => { setActiveNav('labels'); fetchLabels(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', background: activeNav === 'labels' ? c.primaryLight : 'transparent', color: activeNav === 'labels' ? c.primary : c.text, fontWeight: activeNav === 'labels' ? 600 : 400, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span style={{ fontSize: 14 }}>🏷️</span>
            {!sidebarCollapsed && <span>Labels</span>}
          </div>
          {!sidebarCollapsed && labels.length > 0 && (
            <div style={{ paddingLeft: 28, marginTop: 2 }}>
              {labels.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', fontSize: 12, color: c.textMuted, cursor: 'pointer' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0, display: 'inline-block' }} />
                  {l.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: 8, borderTop: `1px solid ${c.border}` }}>
          {!sidebarCollapsed && profile && (
            <div style={{ padding: '8px 10px', marginBottom: 4, borderRadius: 6, background: c.bg }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{profile.first_name} {profile.last_name}</div>
              <div style={{ fontSize: 11, color: c.textMuted }}>{profile.email}</div>
            </div>
          )}
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: 'pointer', color: c.danger, fontSize: 13, justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
            <span>🚪</span>{!sidebarCollapsed && 'Sign Out'}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ background: c.card, borderBottom: `1px solid ${c.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: c.textMuted }}>☰</button>
          <div style={{ flex: 1, maxWidth: 400, position: 'relative' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search emails..."
                style={{ flex: 1, padding: '7px 12px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: c.bg }} />
              <button onClick={() => setAdvancedSearch(p => !p)} title="Advanced Search"
                style={{ padding: '7px 10px', border: `1px solid ${advancedSearch ? c.primary : c.border}`, borderRadius: 8, background: advancedSearch ? c.primaryLight : c.bg, cursor: 'pointer', fontSize: 14, color: advancedSearch ? c.primary : c.textMuted }}>🔍</button>
              {searchActive && (
                <button onClick={() => { setSearchActive(false); setSearchResults([]); setSearch(''); }} title="Clear Search"
                  style={{ padding: '7px 10px', border: `1px solid ${c.danger}`, borderRadius: 8, background: '#fee2e2', cursor: 'pointer', fontSize: 12, color: c.danger }}>✕ Clear</button>
              )}
            </div>
            {advancedSearch && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${c.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 500, padding: 16, marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: c.text, marginBottom: 10 }}>Advanced Search</div>
                <input value={searchFilters.from_email} onChange={e => setSearchFilters(p => ({ ...p, from_email: e.target.value }))}
                  placeholder="From email"
                  style={{ width: '100%', padding: '7px 10px', border: `1px solid ${c.border}`, borderRadius: 6, fontSize: 12, marginBottom: 8, outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 3 }}>Date From</div>
                    <input type="date" value={searchFilters.date_from} onChange={e => setSearchFilters(p => ({ ...p, date_from: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', border: `1px solid ${c.border}`, borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 3 }}>Date To</div>
                    <input type="date" value={searchFilters.date_to} onChange={e => setSearchFilters(p => ({ ...p, date_to: e.target.value }))}
                      style={{ width: '100%', padding: '7px 10px', border: `1px solid ${c.border}`, borderRadius: 6, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <select value={searchFilters.folder} onChange={e => setSearchFilters(p => ({ ...p, folder: e.target.value }))}
                  style={{ width: '100%', padding: '7px 10px', border: `1px solid ${c.border}`, borderRadius: 6, fontSize: 12, marginBottom: 8, outline: 'none', background: '#fff' }}>
                  <option value="">All Folders</option>
                  {FOLDERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: c.text, marginBottom: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={searchFilters.has_attachment} onChange={e => setSearchFilters(p => ({ ...p, has_attachment: e.target.checked }))}
                    style={{ width: 14, height: 14 }} />
                  Has attachment
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={runAdvancedSearch}
                    style={{ flex: 1, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Search</button>
                  <button onClick={() => setAdvancedSearch(false)}
                    style={{ padding: '8px 14px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: c.textMuted }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setShowShortcutsHelp(true)} title="Keyboard shortcuts"
              style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 13, color: c.textMuted, padding: '4px 8px', fontWeight: 700 }}>?</button>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setNotifOpen(p => { if (!p) fetchNotifications(); return !p; })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c.textMuted, position: 'relative', padding: '4px' }}>
                🔔
                {notifUnread > 0 && (
                  <span style={{ position: 'absolute', top: 0, right: 0, background: c.danger, color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{notifUnread > 9 ? '9+' : notifUnread}</span>
                )}
              </button>
              {notifOpen && (
                <div style={{ position: 'absolute', top: '100%', right: 0, width: 340, background: '#fff', border: `1px solid ${c.border}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 500 }}>
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Notifications</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={markAllNotifRead} style={{ fontSize: 11, color: c.primary, background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
                      <button onClick={() => { setNotifPrefsOpen(true); setNotifOpen(false); fetchNotifPrefs(); }} style={{ fontSize: 11, color: c.textMuted, background: 'none', border: 'none', cursor: 'pointer' }}>⚙️ Prefs</button>
                    </div>
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 && (
                      <div style={{ padding: 24, textAlign: 'center', color: c.textMuted, fontSize: 13 }}>No notifications</div>
                    )}
                    {notifications.map(n => (
                      <div key={n.id} style={{ padding: '10px 16px', borderBottom: `1px solid ${c.border}`, background: n.is_read ? '#fff' : '#f0f4ff', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ fontSize: 18, flexShrink: 0 }}>{n.type === 'new_email' ? '✉️' : n.type === 'chat_mention' ? '💬' : '🔔'}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: c.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                          {n.body && <div style={{ fontSize: 11, color: c.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>}
                          <div style={{ fontSize: 10, color: c.textMuted, marginTop: 2 }}>{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                        <button onClick={() => deleteNotif(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: c.textMuted, flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700 }}>{initials}</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{userData.full_name || userData.email}</span>
          </div>
        </div>

        {/* Content */}
        {activeNav === 'analytics' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 4 }}>Analytics</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Your email activity overview</div>
            {analyticsLoading && <div style={{ textAlign: 'center', padding: 40, color: c.textMuted }}>Loading analytics...</div>}
            {analytics && (() => {
              const maxVol = Math.max(...analytics.volume7d.map(d => d.count), 1);
              const maxDow = Math.max(...analytics.dowActivity.map(d => d.count), 1);
              const s = analytics.stats;
              const total = parseInt(s.total) || 0;
              const unreadPct = total > 0 ? Math.round((parseInt(s.unread) / total) * 100) : 0;
              return (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      { label: 'Total Emails', value: total, icon: '✉️', color: '#6366f1' },
                      { label: 'Unread', value: s.unread || 0, icon: '📬', color: '#ef4444' },
                      { label: 'Unread %', value: unreadPct + '%', icon: '📊', color: '#f59e0b' },
                      { label: 'Sent Today', value: s.sent_today || 0, icon: '📤', color: '#10b981' },
                      { label: 'Starred', value: s.starred || 0, icon: '⭐', color: '#f59e0b' },
                    ].map(stat => (
                      <div key={stat.label} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{stat.icon}</div>
                        <div style={{ fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 11, color: c.textMuted }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>Emails Received — Last 7 Days</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                        {analytics.volume7d.map((d, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontSize: 10, color: c.textMuted }}>{d.count || ''}</div>
                            <div style={{ width: '100%', background: '#6366f1', borderRadius: '4px 4px 0 0', height: `${Math.max((d.count / maxVol) * 90, d.count > 0 ? 4 : 0)}px` }} />
                            <div style={{ fontSize: 10, color: c.textMuted }}>{d.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>Activity by Day of Week (30 days)</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                        {analytics.dowActivity.map((d, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontSize: 10, color: c.textMuted }}>{d.count || ''}</div>
                            <div style={{ width: '100%', background: '#8b5cf6', borderRadius: '4px 4px 0 0', height: `${Math.max((d.count / maxDow) * 90, d.count > 0 ? 4 : 0)}px` }} />
                            <div style={{ fontSize: 10, color: c.textMuted }}>{d.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>Folder Breakdown</div>
                      {analytics.folders.length === 0 && <div style={{ color: c.textMuted, fontSize: 13 }}>No data yet</div>}
                      {analytics.folders.map((f, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${c.border}` }}>
                          <div style={{ fontSize: 13, color: c.text, textTransform: 'capitalize' }}>{f.folder}</div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <span style={{ fontSize: 12, color: c.textMuted }}>{f.total} total</span>
                            {parseInt(f.unread) > 0 && <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{f.unread} unread</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>Top Senders</div>
                      {analytics.topSenders.length === 0 && <div style={{ color: c.textMuted, fontSize: 13 }}>No data yet</div>}
                      {analytics.topSenders.map((s, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${c.border}` }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{s.from_name || s.from_email}</div>
                            <div style={{ fontSize: 11, color: c.textMuted }}>{s.from_email}</div>
                          </div>
                          <span style={{ background: '#eff6ff', color: '#6366f1', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{s.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : activeNav === 'contacts' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Contacts</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Your personal address book</div>
              </div>
              <button onClick={() => { setContactForm({ name: '', email: '', phone: '', company: '', notes: '' }); setEditingContact(null); setContactFormOpen(true); }}
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + New Contact
              </button>
            </div>

            <input value={contactSearch} onChange={e => { setContactSearch(e.target.value); fetchContacts(e.target.value); }}
              placeholder="Search contacts..."
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />

            {contactFormOpen && (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>{editingContact ? 'Edit Contact' : 'New Contact'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <input value={contactForm.name} onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Name *" style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                  <input value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="Email *" style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                  <input value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone" style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                  <input value={contactForm.company} onChange={e => setContactForm(p => ({ ...p, company: e.target.value }))}
                    placeholder="Company" style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                </div>
                <textarea value={contactForm.notes} onChange={e => setContactForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Notes (optional)" rows={2}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveContact} disabled={contactSaving}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: contactSaving ? 'not-allowed' : 'pointer', opacity: contactSaving ? 0.7 : 1 }}>
                    {contactSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => { setContactFormOpen(false); setEditingContact(null); }}
                    style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {contactsLoading && <div style={{ color: c.textMuted, fontSize: 13, padding: 20 }}>Loading...</div>}

            {!contactsLoading && contacts.length === 0 && !contactFormOpen && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No contacts yet</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Add contacts to enable autocomplete when composing emails</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {contacts.map(contact => (
                <div key={contact.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {contact.name[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{contact.name}</div>
                        <div style={{ fontSize: 12, color: c.textMuted }}>{contact.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setContactForm({ name: contact.name, email: contact.email, phone: contact.phone || '', company: contact.company || '', notes: contact.notes || '' }); setEditingContact(contact); setContactFormOpen(true); }}
                        style={{ padding: '4px 10px', border: `1px solid ${c.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 11, color: c.text }}>Edit</button>
                      <button onClick={() => deleteContact(contact.id)}
                        style={{ padding: '4px 10px', border: `1px solid ${c.danger}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 11, color: c.danger }}>Del</button>
                    </div>
                  </div>
                  {contact.company && <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 4 }}>{contact.company}</div>}
                  {contact.phone && <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>{contact.phone}</div>}
                  <button onClick={() => { setCompose({ to: contact.email, cc: '', bcc: '', subject: '', body_html: signature?.is_active ? `\n\n--\n${signature.html_body.replace(/<[^>]*>/g, '')}` : '' }); setComposeOpen(true); }}
                    style={{ width: '100%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                    ✉️ Compose
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeNav === 'signature' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 640 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 4 }}>Email Signature</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 24 }}>Automatically appended to new emails</div>

            {!signature && !sigEditing && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✍️</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No signature set</div>
                <button onClick={() => setSigEditing(true)}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Create Signature
                </button>
              </div>
            )}

            {signature && !sigEditing && (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div onClick={toggleSignature}
                      style={{ width: 44, height: 24, borderRadius: 12, background: signature.is_active ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: signature.is_active ? 23 : 3, transition: 'left 0.2s' }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: signature.is_active ? '#10b981' : c.textMuted }}>{signature.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <button onClick={() => setSigEditing(true)}
                    style={{ padding: '7px 14px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: c.text }}>Edit</button>
                </div>
                <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: 14, fontSize: 13, color: c.text, lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: signature.html_body || '<em>Empty signature</em>' }} />
              </div>
            )}

            {sigEditing && (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{signature ? 'Edit Signature' : 'New Signature'}</div>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Name</label>
                <input value={sigForm.name} onChange={e => setSigForm(p => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Signature (HTML supported)</label>
                <textarea value={sigForm.html_body} onChange={e => setSigForm(p => ({ ...p, html_body: e.target.value }))}
                  placeholder="<p>Best regards,<br><strong>Your Name</strong><br>Your Title</p>"
                  rows={6}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div onClick={() => setSigForm(p => ({ ...p, is_active: !p.is_active }))}
                    style={{ width: 44, height: 24, borderRadius: 12, background: sigForm.is_active ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: sigForm.is_active ? 23 : 3, transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 13, color: c.text }}>Active</span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveSignature} disabled={sigSaving}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: sigSaving ? 'not-allowed' : 'pointer', opacity: sigSaving ? 0.7 : 1 }}>
                    {sigSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setSigEditing(false)}
                    style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeNav === 'rules' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Email Rules</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Auto-sort, star, or mark emails based on conditions</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={applyRules} disabled={applyingRules}
                  style={{ padding: '9px 16px', border: `1px solid ${c.border}`, borderRadius: 8, background: 'none', cursor: applyingRules ? 'not-allowed' : 'pointer', fontSize: 13, color: c.text, opacity: applyingRules ? 0.6 : 1 }}>
                  {applyingRules ? 'Applying...' : '▶ Apply to Inbox'}
                </button>
                <button onClick={() => setRuleFormOpen(true)}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + New Rule
                </button>
              </div>
            </div>

            {ruleFormOpen && (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>New Rule</div>
                <input value={ruleForm.name} onChange={e => setRuleForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Rule name *"
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <select value={ruleForm.condition_field} onChange={e => setRuleForm(p => ({ ...p, condition_field: e.target.value }))}
                    style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="from">From</option>
                    <option value="subject">Subject</option>
                    <option value="body">Body</option>
                  </select>
                  <select value={ruleForm.condition_operator} onChange={e => setRuleForm(p => ({ ...p, condition_operator: e.target.value }))}
                    style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="contains">contains</option>
                    <option value="equals">equals</option>
                    <option value="starts_with">starts with</option>
                  </select>
                  <input value={ruleForm.condition_value} onChange={e => setRuleForm(p => ({ ...p, condition_value: e.target.value }))}
                    placeholder="Value *"
                    style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <select value={ruleForm.action_type} onChange={e => setRuleForm(p => ({ ...p, action_type: e.target.value, action_value: e.target.value === 'move' ? 'spam' : '' }))}
                    style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="move">Move to folder</option>
                    <option value="star">Star</option>
                    <option value="mark_read">Mark as read</option>
                    <option value="mark_unread">Mark as unread</option>
                  </select>
                  {ruleForm.action_type === 'move' && (
                    <select value={ruleForm.action_value} onChange={e => setRuleForm(p => ({ ...p, action_value: e.target.value }))}
                      style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                      <option value="spam">Spam</option>
                      <option value="trash">Trash</option>
                      <option value="drafts">Drafts</option>
                      <option value="inbox">Inbox</option>
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveRule} disabled={ruleSaving}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: ruleSaving ? 'not-allowed' : 'pointer', opacity: ruleSaving ? 0.7 : 1 }}>
                    {ruleSaving ? 'Saving...' : 'Save Rule'}
                  </button>
                  <button onClick={() => setRuleFormOpen(false)}
                    style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {rulesLoading && <div style={{ color: c.textMuted, fontSize: 13, padding: 20 }}>Loading...</div>}

            {!rulesLoading && rules.length === 0 && !ruleFormOpen && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚙️</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No rules yet</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Create rules to automatically sort, star, or mark your emails</div>
              </div>
            )}

            {rules.map(rule => (
              <div key={rule.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div onClick={() => toggleRule(rule.id)}
                  style={{ width: 40, height: 22, borderRadius: 11, background: rule.is_active ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: rule.is_active ? 21 : 3, transition: 'left 0.2s' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{rule.name}</div>
                  <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>
                    If <strong>{rule.condition_field}</strong> {rule.condition_operator.replace('_', ' ')} "<strong>{rule.condition_value}</strong>"
                    {' → '}<strong>{rule.action_type === 'move' ? `move to ${rule.action_value}` : rule.action_type.replace('_', ' ')}</strong>
                  </div>
                </div>
                <button onClick={() => deleteRule(rule.id)}
                  style={{ padding: '6px 12px', border: `1px solid ${c.danger}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.danger }}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : activeNav === 'whatsapp' ? (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <div style={{ width: 260, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', background: c.card, flexShrink: 0 }}>
              <div style={{ padding: '14px 16px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>WhatsApp</div>
                <button onClick={() => setWaContactFormOpen(true)}
                  style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>+ Contact</button>
              </div>
              {!waConfigured && (
                <div style={{ padding: 12, background: '#fffbeb', borderBottom: `1px solid ${c.border}` }}>
                  <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, marginBottom: 2 }}>Not Configured</div>
                  <div style={{ fontSize: 11, color: '#92400e' }}>Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env</div>
                </div>
              )}
              {waContactFormOpen && (
                <div style={{ padding: 12, borderBottom: `1px solid ${c.border}`, background: c.bg }}>
                  <input value={waContactForm.name} onChange={e => setWaContactForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Name *"
                    style={{ width: '100%', padding: '7px 10px', border: `1px solid ${c.border}`, borderRadius: 6, fontSize: 12, marginBottom: 6, outline: 'none', boxSizing: 'border-box' }} />
                  <input value={waContactForm.phone} onChange={e => setWaContactForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="Phone with country code (e.g. 919876543210) *"
                    style={{ width: '100%', padding: '7px 10px', border: `1px solid ${c.border}`, borderRadius: 6, fontSize: 12, marginBottom: 6, outline: 'none', boxSizing: 'border-box' }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={saveWaContact}
                      style={{ flex: 1, background: '#25d366', color: '#fff', border: 'none', borderRadius: 6, padding: '6px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setWaContactFormOpen(false)}
                      style={{ padding: '6px 10px', border: `1px solid ${c.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.textMuted }}>Cancel</button>
                  </div>
                </div>
              )}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {waContacts.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: c.textMuted, fontSize: 12 }}>No contacts yet.<br />Add a contact to start messaging.</div>
                )}
                {waContacts.map(contact => (
                  <div key={contact.id}
                    onClick={() => { setWaActivePhone(contact.phone); fetchWaMessages(contact.phone); }}
                    style={{ padding: '10px 14px', borderBottom: `1px solid ${c.border}`, cursor: 'pointer', background: waActivePhone === contact.phone ? c.primaryLight : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: waActivePhone === contact.phone ? c.primary : c.text }}>{contact.name}</div>
                      <div style={{ fontSize: 11, color: c.textMuted }}>{contact.phone}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); deleteWaContact(contact.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: c.textMuted, padding: 2 }}>x</button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#e5ddd5' }}>
              {!waActivePhone ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>Select a contact to start messaging</div>
                    <div style={{ fontSize: 12, color: c.textMuted, marginTop: 4 }}>Messages sent via WhatsApp Business API</div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '10px 16px', background: '#075e54', color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>
                      {(waContacts.find(ct => ct.phone === waActivePhone)?.name || waActivePhone)[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{waContacts.find(ct => ct.phone === waActivePhone)?.name || waActivePhone}</div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>{waActivePhone}</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {waLoading && <div style={{ textAlign: 'center', color: c.textMuted, fontSize: 12 }}>Loading...</div>}
                    {!waLoading && waMessages.length === 0 && (
                      <div style={{ textAlign: 'center', color: c.textMuted, fontSize: 12, marginTop: 40 }}>No messages yet. Send the first message!</div>
                    )}
                    {waMessages.map(msg => (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: msg.direction === 'outbound' ? 'flex-end' : 'flex-start' }}>
                        <div style={{ maxWidth: '70%', background: msg.direction === 'outbound' ? '#dcf8c6' : '#fff', borderRadius: 8, padding: '8px 12px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                          <div style={{ fontSize: 13, color: '#1f2937', lineHeight: 1.5 }}>{msg.message_text}</div>
                          <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, textAlign: 'right' }}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {msg.direction === 'outbound' && <span style={{ marginLeft: 4 }}>{msg.status === 'sent' ? '✓' : '✓✓'}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 12px', background: '#f0f0f0', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={waMessage} onChange={e => setWaMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendWaMessage()}
                      placeholder={waConfigured ? 'Type a message...' : 'WhatsApp not configured'}
                      disabled={!waConfigured}
                      style={{ flex: 1, padding: '10px 14px', border: 'none', borderRadius: 20, fontSize: 13, outline: 'none', background: '#fff', opacity: waConfigured ? 1 : 0.6 }} />
                    <button onClick={sendWaMessage} disabled={waSending || !waConfigured || !waMessage.trim()}
                      style={{ width: 40, height: 40, borderRadius: '50%', background: waSending || !waConfigured ? '#ccc' : '#25d366', border: 'none', cursor: waSending || !waConfigured ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      &#x27A4;
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : activeNav === 'ooo' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 640 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 4 }}>Out of Office</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 24 }}>Automatically reply to incoming emails when you're away</div>

            {oooLoading && <div style={{ color: c.textMuted, fontSize: 13 }}>Loading...</div>}

            {!oooLoading && !ooo && !oooEditing && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏖</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No autoresponder set</div>
                <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Set up an out-of-office reply for when you're away</div>
                <button onClick={() => setOooEditing(true)}
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  + Set Up Autoresponder
                </button>
              </div>
            )}

            {!oooLoading && ooo && !oooEditing && (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>{ooo.subject}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div onClick={toggleOoo}
                        style={{ width: 44, height: 24, borderRadius: 12, background: ooo.is_active ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: ooo.is_active ? 23 : 3, transition: 'left 0.2s' }} />
                      </div>
                      <span style={{ fontSize: 13, color: ooo.is_active ? '#10b981' : c.textMuted, fontWeight: 600 }}>
                        {ooo.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setOooEditing(true)}
                      style={{ padding: '7px 14px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: c.text }}>Edit</button>
                    <button onClick={deleteOoo}
                      style={{ padding: '7px 14px', border: `1px solid ${c.danger}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: c.danger }}>Remove</button>
                  </div>
                </div>
                {(ooo.start_date || ooo.end_date) && (
                  <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 12 }}>
                    📅 {ooo.start_date ? new Date(ooo.start_date).toLocaleString() : 'Now'} → {ooo.end_date ? new Date(ooo.end_date).toLocaleString() : 'Indefinitely'}
                  </div>
                )}
                <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, padding: 14, fontSize: 13, color: c.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {ooo.message}
                </div>
              </div>
            )}

            {oooEditing && (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 16 }}>{ooo ? 'Edit Autoresponder' : 'New Autoresponder'}</div>

                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Subject</label>
                <input value={oooForm.subject} onChange={e => setOooForm(p => ({ ...p, subject: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }} />

                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Message *</label>
                <textarea value={oooForm.message} onChange={e => setOooForm(p => ({ ...p, message: e.target.value }))}
                  placeholder="Hi, I'm currently out of office and will return on [date]. For urgent matters, please contact [name]."
                  rows={5}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Start Date (optional)</label>
                    <input type="datetime-local" value={oooForm.start_date} onChange={e => setOooForm(p => ({ ...p, start_date: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>End Date (optional)</label>
                    <input type="datetime-local" value={oooForm.end_date} onChange={e => setOooForm(p => ({ ...p, end_date: e.target.value }))}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div onClick={() => setOooForm(p => ({ ...p, is_active: !p.is_active }))}
                    style={{ width: 44, height: 24, borderRadius: 12, background: oooForm.is_active ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: oooForm.is_active ? 23 : 3, transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 13, color: c.text }}>Activate immediately</span>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={saveOoo} disabled={oooSaving}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: oooSaving ? 'not-allowed' : 'pointer', opacity: oooSaving ? 0.7 : 1 }}>
                    {oooSaving ? 'Saving...' : '💾 Save'}
                  </button>
                  <button onClick={() => setOooEditing(false)}
                    style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 7, padding: '9px 16px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : activeNav === 'templates' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Email Templates</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Reusable email templates for quick compose</div>
              </div>
              <button onClick={() => { setTemplateModal('new'); setTplForm({ name: '', subject: '', html_body: '', category: 'general' }); setTplPreview(false); }}
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                + New Template
              </button>
            </div>
            {templatesLoading && <div style={{ textAlign: 'center', padding: 40, color: c.textMuted }}>Loading...</div>}
            {!templatesLoading && templates.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: c.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No templates yet</div>
                <div style={{ fontSize: 13 }}>Create reusable email templates to speed up your workflow</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {templates.map(tpl => (
                <div key={tpl.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{tpl.name}</div>
                      <div style={{ marginTop: 4 }}>
                        <span style={{ background: '#eff6ff', color: '#6366f1', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>{tpl.category}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: c.textMuted, fontStyle: 'italic' }}>Subject: {tpl.subject}</div>
                  <div style={{ fontSize: 12, color: c.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tpl.html_body.replace(/<[^>]*>/g, '').slice(0, 80)}...
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={() => useTemplate(tpl)}
                      style={{ flex: 1, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      ✏️ Use
                    </button>
                    <button onClick={() => { setTemplateModal(tpl); setTplForm({ name: tpl.name, subject: tpl.subject, html_body: tpl.html_body, category: tpl.category }); setTplPreview(false); }}
                      style={{ padding: '7px 12px', border: `1px solid ${c.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.text }}>Edit</button>
                    <button onClick={() => deleteTemplate(tpl.id)}
                      style={{ padding: '7px 12px', border: `1px solid ${c.danger}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.danger }}>Del</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeNav === 'chat' ? (
          <div style={{ flex: 1, overflow: 'hidden', padding: 16, display: 'flex', flexDirection: 'column' }}>
            <ChatPanel userData={userData} tenantId={userData?.tenant_id || 'demo'} />
          </div>
        ) : activeNav === 'video' ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeRoom ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '10px 16px', background: c.card, borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: c.text }}>📹 {activeRoom.title}</span>
                    <span style={{ fontSize: 11, color: c.textMuted, marginLeft: 12, fontFamily: 'monospace' }}>{activeRoom.room_name}</span>
                  </div>
                  <button onClick={() => endRoom(activeRoom.id)}
                    style={{ background: c.danger, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    ✕ End Meeting
                  </button>
                </div>
                <iframe
                  src={`https://meet.jit.si/${activeRoom.room_name}#userInfo.displayName="${encodeURIComponent((profile?.first_name || '') + ' ' + (profile?.last_name || '') || userData.email)}"&config.prejoinPageEnabled=false`}
                  style={{ flex: 1, border: 'none', width: '100%' }}
                  allow="camera; microphone; fullscreen; display-capture"
                  title="Video Meeting"
                />
              </div>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Video Calls</div>
                    <div style={{ fontSize: 13, color: c.textMuted }}>Start or join a meeting with your team</div>
                  </div>
                  <button onClick={() => setShowNewMeeting(true)}
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    + New Meeting
                  </button>
                </div>

                {showNewMeeting && (
                  <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 20, marginBottom: 20 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 12 }}>Start New Meeting</div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)}
                        placeholder="Meeting title (optional)"
                        style={{ flex: 1, padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                      <button onClick={createRoom}
                        style={{ background: c.primary, color: '#fff', border: 'none', borderRadius: 7, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Start</button>
                      <button onClick={() => setShowNewMeeting(false)}
                        style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 7, padding: '9px 14px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>Cancel</button>
                    </div>
                  </div>
                )}

                {videoRooms.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active Meetings</div>
                    {videoRooms.map(room => (
                      <div key={room.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>📹 {room.title}</div>
                          <div style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>Started by {room.host_name} · {new Date(room.started_at).toLocaleTimeString()}</div>
                          <div style={{ fontSize: 11, color: c.textMuted, fontFamily: 'monospace', marginTop: 2 }}>{room.room_name}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setActiveRoom(room)}
                            style={{ background: '#d1fae5', color: '#10b981', border: 'none', borderRadius: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Join</button>
                          <button onClick={() => window.open(`https://meet.jit.si/${room.room_name}`, '_blank')}
                            style={{ background: '#eff6ff', color: '#6366f1', border: 'none', borderRadius: 7, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>↗ New Tab</button>
                          {String(room.created_by) === String(userData.id) && (
                            <button onClick={() => endRoom(room.id)}
                              style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 7, padding: '8px 12px', fontSize: 12, cursor: 'pointer' }}>End</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {videoRooms.length === 0 && !showNewMeeting && (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: c.textMuted }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📹</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No active meetings</div>
                    <div style={{ fontSize: 13 }}>Click "New Meeting" to start a video call with your team</div>
                  </div>
                )}
              </div>
            )}
          </div>
        
        ) : activeNav === 'scheduled' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 4 }}>Scheduled Emails</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 20 }}>Emails queued to send at a future time</div>
            {scheduleMsg && <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 16 }}>{scheduleMsg}</div>}
            {scheduledEmails.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: c.textMuted }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🕐</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No scheduled emails</div>
                <div style={{ fontSize: 13 }}>Use the 🕐 Schedule button in compose to send emails later</div>
              </div>
            ) : (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead><tr style={{ background: c.bg, borderBottom: `1px solid ${c.border}` }}>
                    {['To', 'Subject', 'Scheduled For', 'Action'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: c.textMuted, fontWeight: 600, fontSize: 12 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {scheduledEmails.map((e, i) => (
                      <tr key={e.id} style={{ borderBottom: `1px solid ${c.border}` }}>
                        <td style={{ padding: '10px 14px', color: c.text }}>{e.to_email}</td>
                        <td style={{ padding: '10px 14px', color: c.text }}>{e.subject}</td>
                        <td style={{ padding: '10px 14px', color: c.textMuted }}>{new Date(e.scheduled_at).toLocaleString()}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <button onClick={() => cancelScheduled(e.id)}
                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>✕ Cancel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeNav === 'calendar' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            {(() => {
              const year = calendarDate.getFullYear();
              const month = calendarDate.getMonth();
              const firstDay = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
              const cells = [];
              for (let i = 0; i < firstDay; i++) cells.push(null);
              for (let d = 1; d <= daysInMonth; d++) cells.push(d);
              while (cells.length % 7 !== 0) cells.push(null);
              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>{monthNames[month]} {year}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { const d = new Date(year, month - 1, 1); setCalendarDate(d); fetchCalendarEvents(d); }}
                        style={{ padding: '7px 14px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13 }}>← Prev</button>
                      <button onClick={() => { const d = new Date(); setCalendarDate(d); fetchCalendarEvents(d); }}
                        style={{ padding: '7px 14px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13 }}>Today</button>
                      <button onClick={() => { const d = new Date(year, month + 1, 1); setCalendarDate(d); fetchCalendarEvents(d); }}
                        style={{ padding: '7px 14px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13 }}>Next →</button>
                    </div>
                  </div>
                  <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: c.bg }}>
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                        <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, color: c.textMuted, borderBottom: `1px solid ${c.border}` }}>{d}</div>
                      ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                      {cells.map((day, i) => {
                        const dayEvents = day ? calendarEvents.filter(e => new Date(e.start_time).getDate() === day && new Date(e.start_time).getMonth() === month) : [];
                        const isToday = day && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                        return (
                          <div key={i} onClick={() => {
                            if (!day) return;
                            const dt = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                            setCalendarForm({ title: '', description: '', start_time: `${dt}T09:00`, end_time: `${dt}T10:00`, all_day: false, color: '#6366f1' });
                            setCalendarModal('new');
                          }} style={{ minHeight: 90, padding: 6, borderRight: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`, cursor: day ? 'pointer' : 'default', background: isToday ? '#eff6ff' : 'transparent' }}>
                            {day && <div style={{ fontSize: 13, fontWeight: isToday ? 700 : 400, color: isToday ? c.primary : c.text, marginBottom: 4 }}>{day}</div>}
                            {dayEvents.slice(0, 3).map(ev => (
                              <div key={ev.id} onClick={e => { e.stopPropagation(); setCalendarForm({ title: ev.title, description: ev.description || '', start_time: ev.start_time.slice(0,16), end_time: ev.end_time.slice(0,16), all_day: ev.all_day, color: ev.color || '#6366f1' }); setCalendarModal(ev); }}
                                style={{ background: ev.color || '#6366f1', color: '#fff', borderRadius: 4, padding: '2px 6px', fontSize: 11, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ev.title}
                              </div>
                            ))}
                            {dayEvents.length > 3 && <div style={{ fontSize: 10, color: c.textMuted }}>+{dayEvents.length - 3} more</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
            {calendarModal && (
              <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: c.card, borderRadius: 12, width: 440, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{calendarModal === 'new' ? 'New Event' : 'Edit Event'}</span>
                    <button onClick={() => setCalendarModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c.textMuted }}>×</button>
                  </div>
                  <input value={calendarForm.title} onChange={e => setCalendarForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title *"
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
                  <textarea value={calendarForm.description} onChange={e => setCalendarForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description (optional)" rows={2}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 4 }}>Start</label>
                      <input type="datetime-local" value={calendarForm.start_time} onChange={e => setCalendarForm(p => ({ ...p, start_time: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: c.textMuted, display: 'block', marginBottom: 4 }}>End</label>
                      <input type="datetime-local" value={calendarForm.end_time} onChange={e => setCalendarForm(p => ({ ...p, end_time: e.target.value }))}
                        style={{ width: '100%', padding: '8px 10px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <label style={{ fontSize: 12, color: c.textMuted, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                      <input type="checkbox" checked={calendarForm.all_day} onChange={e => setCalendarForm(p => ({ ...p, all_day: e.target.checked }))} /> All day
                    </label>
                    <label style={{ fontSize: 12, color: c.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>Color
                      <input type="color" value={calendarForm.color} onChange={e => setCalendarForm(p => ({ ...p, color: e.target.value }))}
                        style={{ width: 28, height: 28, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    {calendarModal !== 'new' && (
                      <button onClick={() => deleteCalendarEvent(calendarModal.id)}
                        style={{ padding: '8px 14px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Delete</button>
                    )}
                    <button onClick={() => setCalendarModal(null)}
                      style={{ padding: '8px 16px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, color: c.textMuted }}>Cancel</button>
                    <button onClick={saveCalendarEvent}
                      style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeNav === 'labels' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 600 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c.text }}>Labels</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Organize emails with colored labels</div>
              </div>
              <button onClick={() => setLabelFormOpen(true)}
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ New Label</button>
            </div>
            {labelFormOpen && (
              <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input value={labelForm.name} onChange={e => setLabelForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Label name *"
                    style={{ flex: 1, padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: c.textMuted }}>
                    Color
                    <input type="color" value={labelForm.color} onChange={e => setLabelForm(p => ({ ...p, color: e.target.value }))}
                      style={{ width: 32, height: 32, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  </label>
                  <button onClick={saveLabel}
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setLabelFormOpen(false)}
                    style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 7, padding: '9px 12px', fontSize: 13, cursor: 'pointer', color: c.textMuted }}>Cancel</button>
                </div>
              </div>
            )}
            {labelsLoading && <div style={{ color: c.textMuted, fontSize: 13 }}>Loading...</div>}
            {!labelsLoading && labels.length === 0 && !labelFormOpen && (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏷️</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: c.text, marginBottom: 6 }}>No labels yet</div>
                <div style={{ fontSize: 13, color: c.textMuted }}>Create labels to organize your emails</div>
              </div>
            )}
            {labels.map(label => (
              <div key={label.id} style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: label.color, flexShrink: 0, display: 'inline-block' }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: c.text }}>{label.name}</span>
                <span style={{ fontSize: 11, color: c.textMuted, fontFamily: 'monospace', background: c.bg, padding: '2px 8px', borderRadius: 4 }}>{label.color}</span>
                <button onClick={() => deleteLabel(label.id)}
                  style={{ padding: '5px 10px', border: `1px solid ${c.danger}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.danger }}>Delete</button>
              </div>
            ))}
          </div>
        ) : activeNav === 'security' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 520 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c.text, marginBottom: 4 }}>Security — Two-Factor Authentication</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginBottom: 24 }}>Protect your account with an authenticator app</div>
            <div style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 28 }}>{twoFAStatus ? '🔒' : '🔓'}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: c.text }}>2FA is {twoFAStatus ? 'Enabled' : 'Disabled'}</div>
                  <div style={{ fontSize: 12, color: c.textMuted }}>{twoFAStatus ? 'Your account is protected with TOTP' : 'Enable 2FA for extra security'}</div>
                </div>
              </div>
              {!twoFAStatus && !twoFASetup && (
                <button onClick={async () => {
                  setTwoFASaving(true);
                  const res = await fetch('https://api.ssgzone.in/api/v1/webmail/2fa/setup', { method: 'POST', headers: auth });
                  const d = await res.json();
                  if (d.success) setTwoFASetup(d.data);
                  setTwoFASaving(false);
                }} disabled={twoFASaving} style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {twoFASaving ? 'Loading...' : 'Setup 2FA'}
                </button>
              )}
              {twoFASetup && <TwoFAEnableForm />}
              {twoFAStatus && (
                <button onClick={async () => {
                  if (!window.confirm('Disable 2FA?')) return;
                  const res = await fetch('https://api.ssgzone.in/api/v1/webmail/2fa/disable', { method: 'POST', headers: auth });
                  const d = await res.json();
                  if (d.success) { setTwoFAStatus(false); showToastNotification('2FA disabled'); }
                }} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Disable 2FA
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

            {/* Email list */}
            <div style={{ width: 320, borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column', background: c.card, flexShrink: 0 }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox"
                    checked={emails.length > 0 && selectedEmailIds.length === emails.length}
                    onChange={e => setSelectedEmailIds(e.target.checked ? emails.map(em => em.id) : [])}
                    style={{ width: 14, height: 14, cursor: 'pointer' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{searchActive ? 'Search Results' : FOLDERS.find(f => f.id === folder)?.label || folder}</div>
                    <div style={{ fontSize: 11, color: c.textMuted }}>
                      {searchActive ? `${searchResults.length} results` : `${total} messages${unread > 0 ? `, ${unread} unread` : ''}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button onClick={searchActive ? () => { setSearchActive(false); setSearchResults([]); setSearch(''); } : fetchEmails} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: searchActive ? c.danger : c.textMuted }}>{searchActive ? '✕' : '↻'}</button>
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => setShowExportDropdown(p => !p)} title="Export emails"
                      style={{ background: 'none', border: `1px solid ${c.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, color: c.textMuted, padding: '3px 7px' }}>⬇</button>
                    {showExportDropdown && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, background: '#fff', border: `1px solid ${c.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 200, padding: 12, width: 180, marginTop: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: c.text, marginBottom: 8 }}>Export Emails</div>
                        <select value={exportFolder} onChange={e => setExportFolder(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', border: `1px solid ${c.border}`, borderRadius: 6, fontSize: 12, marginBottom: 8, outline: 'none' }}>
                          {FOLDERS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                        <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 8 }}>Format: CSV</div>
                        <button onClick={downloadExport}
                          style={{ width: '100%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 6, padding: '7px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>⬇ Download</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bulk action bar */}
              {selectedEmailIds.length > 0 && (
                <div style={{ padding: '8px 12px', background: '#eff6ff', borderBottom: `1px solid ${c.border}`, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.primary, marginRight: 4 }}>{selectedEmailIds.length} selected</span>
                  {[['read','Mark Read'],['unread','Mark Unread'],['star','⭐ Star'],['trash','🗑 Trash'],['delete','✕ Delete']].map(([action, label]) => (
                    <button key={action} onClick={() => bulkAction(action)}
                      style={{ padding: '4px 10px', border: `1px solid ${action === 'delete' ? c.danger : c.border}`, borderRadius: 5, background: action === 'delete' ? '#fee2e2' : '#fff', color: action === 'delete' ? c.danger : c.text, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                      {label}
                    </button>
                  ))}
                  <button onClick={() => setSelectedEmailIds([])} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: c.textMuted }}>✕</button>
                </div>
              )}

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading && <div style={{ padding: 20, textAlign: 'center', color: c.textMuted, fontSize: 13 }}>Loading...</div>}
                {!loading && (searchActive ? searchResults : emails).length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: c.textMuted }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{searchActive ? '🔍' : '📭'}</div>
                    <div style={{ fontSize: 13 }}>{searchActive ? 'No results found' : `No emails in ${folder}`}</div>
                  </div>
                )}
                {(searchActive ? searchResults : emails).map(email => (
                  <div key={email.id}
                    style={{ padding: '11px 13px', borderBottom: `1px solid ${c.border}`, cursor: 'pointer', background: selectedEmail?.id === email.id ? '#eff6ff' : email.read_status ? c.card : '#fafbff', borderLeft: selectedEmail?.id === email.id ? `3px solid ${c.primary}` : '3px solid transparent', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <input type="checkbox"
                      checked={selectedEmailIds.includes(email.id)}
                      onChange={e => { e.stopPropagation(); setSelectedEmailIds(prev => e.target.checked ? [...prev, email.id] : prev.filter(id => id !== email.id)); }}
                      onClick={e => e.stopPropagation()}
                      style={{ width: 13, height: 13, marginTop: 3, cursor: 'pointer', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }} onClick={() => openEmail(email)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                        <div style={{ fontSize: 13, fontWeight: email.read_status ? 400 : 700, color: c.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 6 }}>
                          {email.from_name || email.from_email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <span onClick={e => toggleStar(e, email.id)} style={{ cursor: 'pointer', fontSize: 13, color: email.starred ? c.warning : c.border }}>★</span>
                          <span style={{ fontSize: 10, color: c.textMuted }}>{new Date(email.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: email.read_status ? 400 : 600, color: email.read_status ? c.textMuted : c.text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {email.subject || '(no subject)'}
                      </div>
                      <div style={{ fontSize: 11, color: c.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {email.preview || ''}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {total > 25 && (
                  <div style={{ padding: '10px 12px', borderTop: `1px solid ${c.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        style={{ padding: '4px 10px', border: `1px solid ${c.border}`, borderRadius: 4, background: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 12, color: c.textMuted, opacity: page === 1 ? 0.5 : 1 }}>← Prev</button>
                      <span style={{ fontSize: 12, color: c.textMuted, padding: '4px 8px' }}>Page {page} of {totalPages}</span>
                      <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                        style={{ padding: '4px 10px', border: `1px solid ${c.border}`, borderRadius: 4, background: 'none', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 12, color: c.textMuted, opacity: page >= totalPages ? 0.5 : 1 }}>Next →</button>
                    </div>
                    <div style={{ fontSize: 11, color: c.textMuted, textAlign: 'center', marginBottom: totalPages > 5 ? 6 : 0 }}>
                      Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}
                    </div>
                    {totalPages > 5 && (
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: c.textMuted }}>Jump to:</span>
                        <input type="number" min={1} max={totalPages} value={jumpPage}
                          onChange={e => setJumpPage(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { const p = Math.min(Math.max(1, parseInt(jumpPage)), totalPages); if (!isNaN(p)) { setPage(p); setJumpPage(''); } } }}
                          style={{ width: 48, padding: '3px 6px', border: `1px solid ${c.border}`, borderRadius: 4, fontSize: 11, outline: 'none', textAlign: 'center' }} />
                        <button onClick={() => { const p = Math.min(Math.max(1, parseInt(jumpPage)), totalPages); if (!isNaN(p)) { setPage(p); setJumpPage(''); } }}
                          style={{ padding: '3px 8px', border: `1px solid ${c.border}`, borderRadius: 4, background: 'none', cursor: 'pointer', fontSize: 11, color: c.text }}>Go</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Email view */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: c.bg }}>
              {!selectedEmail ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textMuted }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>✉️</div>
                    <div style={{ fontSize: 14 }}>Select an email to read</div>
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                  <div style={{ background: c.card, borderRadius: 10, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    {/* Email header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: c.text }}>{selectedEmail.subject || '(no subject)'}</h2>
                        {!showThread && (
                          <button onClick={() => fetchThread(selectedEmail)} disabled={threadLoading}
                            style={{ marginTop: 6, background: 'none', border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer', color: c.textMuted }}>
                            {threadLoading ? 'Loading...' : '💬 View thread'}
                          </button>
                        )}
                        {showThread && (
                          <button onClick={() => setShowThread(false)}
                            style={{ marginTop: 6, background: 'none', border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer', color: c.primary }}>← Back to email</button>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setCompose({ to: selectedEmail.from_email, subject: `Re: ${selectedEmail.subject}`, body_html: `\n\n--- Original message ---\n${(selectedEmail.text_content || '').slice(0, 500)}`, cc: '', bcc: '' }); setComposeOpen(true); }}
                          style={{ padding: '6px 12px', border: `1px solid ${c.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.text }}>↩ Reply</button>
                        <button onClick={() => {
                          const myEmail = profile?.email || req?.user?.email || '';
                          const allRecipients = [
                            ...(selectedEmail.to_email || '').split(','),
                            ...(selectedEmail.cc_email || '').split(',')
                          ].map(e => e.trim()).filter(e => e && e !== myEmail && e !== selectedEmail.from_email);
                          setCompose({ to: selectedEmail.from_email, subject: `Re: ${selectedEmail.subject}`, body_html: `\n\n--- Original message ---\n${(selectedEmail.text_content || '').slice(0, 500)}`, cc: allRecipients.join(', '), bcc: '' });
                          setComposeOpen(true);
                        }} style={{ padding: '6px 12px', border: `1px solid ${c.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.text }}>↩↩ Reply All</button>
                        <button onClick={() => {
                          const fwdBody = `\n\n---------- Forwarded message ----------\nFrom: ${selectedEmail.from_email}\nDate: ${new Date(selectedEmail.created_at).toLocaleString()}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.text_content || ''}`;
                          setCompose({ to: '', subject: `Fwd: ${selectedEmail.subject}`, body_html: fwdBody, cc: '', bcc: '' });
                          setComposeOpen(true);
                        }} style={{ padding: '6px 12px', border: `1px solid ${c.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.text }}>⏩ Forward</button>
                        {selectedEmail.folder !== 'spam' && (
                          <button onClick={async () => {
                            await fetch(`${API}/email/${selectedEmail.id}/spam`, { method: 'PATCH', headers: auth });
                            setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
                            setSelectedEmail(null);
                            fetchFolderCounts();
                            showToastNotification('Marked as spam');
                          }} style={{ padding: '6px 12px', border: `1px solid ${c.warning}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.warning }}>⚠ Spam</button>
                        )}
                        <button onClick={() => deleteEmail(selectedEmail.id)}
                          style={{ padding: '6px 12px', border: `1px solid ${c.danger}`, borderRadius: 6, background: 'none', cursor: 'pointer', fontSize: 12, color: c.danger }}>🗑 Delete</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, padding: '12px 0', borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}` }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                        {(selectedEmail.from_name || selectedEmail.from_email || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: c.text }}>{selectedEmail.from_name || selectedEmail.from_email}</div>
                        <div style={{ fontSize: 12, color: c.textMuted }}>{selectedEmail.from_email}</div>
                        <div style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                          To: {selectedEmail.to_email} · {new Date(selectedEmail.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {/* Thread view */}
                    {showThread && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: c.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thread ({thread.length} messages)</div>
                        {thread.map((msg, i) => (
                          <div key={msg.id} style={{ background: i % 2 === 0 ? c.bg : '#f0f4ff', border: `1px solid ${c.border}`, borderRadius: 8, padding: 14, marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                {(msg.from_email || '?')[0].toUpperCase()}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{msg.from_email}</div>
                                <div style={{ fontSize: 11, color: c.textMuted }}>To: {msg.to_email} · {new Date(msg.created_at).toLocaleString()}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 13, color: c.text, lineHeight: 1.6 }}>
                              {msg.html_content
                                ? <div dangerouslySetInnerHTML={{ __html: msg.html_content }} />
                                : <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{msg.text_content || '(empty)'}</pre>
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Unsubscribe header detection */}
                    {selectedEmail.html_content && /list-unsubscribe|unsubscribe/i.test(selectedEmail.html_content) && (
                      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '8px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: '#92400e' }}>📧 This email contains an unsubscribe option.</span>
                        <button onClick={() => {
                          const match = (selectedEmail.html_content || '').match(/href=["'](https?:\/\/[^"']*unsubscribe[^"']*)["']/i);
                          if (match) window.open(match[1], '_blank');
                          else showToastNotification('No unsubscribe link found in email body');
                        }} style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Unsubscribe</button>
                      </div>
                    )}
                    {/* Body */}
                    {!showThread && <div style={{ fontSize: 14, color: c.text, lineHeight: 1.7 }}>
                      {selectedEmail.html_content
                        ? <div dangerouslySetInnerHTML={{ __html: selectedEmail.html_content }} />
                        : <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{selectedEmail.text_content || '(empty)'}</pre>
                      }
                    </div>}
                    {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${c.border}` }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 8 }}>📎 Attachments</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {selectedEmail.attachments.map(att => (
                            <a key={att.id}
                              href={`https://api.ssgzone.in/api/v1/attachments/${att.id}?token=${token}`}
                              target="_blank" rel="noreferrer"
                              style={{ background: '#eff6ff', color: '#6366f1', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1px solid #c7d2fe' }}>
                              📎 {att.filename} ({(att.file_size / 1024).toFixed(1)}KB)
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: c.card, borderRadius: 12, width: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>Compose Email</span>
              <button onClick={() => { setComposeOpen(false); setAttachFiles([]); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c.textMuted }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input value={compose.to}
                  onChange={e => { setCompose(p => ({ ...p, to: e.target.value })); fetchToSuggestions(e.target.value); }}
                  onBlur={() => setTimeout(() => setShowToSuggestions(false), 150)}
                  placeholder="To"
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                {showToSuggestions && toSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${c.border}`, borderRadius: 7, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    {toSuggestions.map((s, i) => (
                      <div key={i} onMouseDown={() => { setCompose(p => ({ ...p, to: s.email })); setShowToSuggestions(false); }}
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: `1px solid ${c.border}` }}>
                        <span style={{ fontWeight: 600, color: c.text }}>{s.name}</span>
                        <span style={{ color: c.textMuted, marginLeft: 8 }}>{s.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {[
                { key: 'cc', placeholder: 'CC (optional)' },
                { key: 'bcc', placeholder: 'BCC (optional)' },
                { key: 'subject', placeholder: 'Subject' },
              ].map(f => (
                <input key={f.key} value={compose[f.key]} onChange={e => setCompose(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
              ))}
              {/* WYSIWYG Toolbar */}
              <div style={{ border: `1px solid ${c.border}`, borderRadius: 7, overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: '6px 8px', background: c.bg, borderBottom: `1px solid ${c.border}` }}>
                  {[
                    { cmd: 'bold', label: <b>B</b> },
                    { cmd: 'italic', label: <i>I</i> },
                    { cmd: 'underline', label: <u>U</u> },
                    { cmd: 'strikeThrough', label: <s>S</s> },
                    { cmd: 'formatBlock', val: 'H1', label: 'H1' },
                    { cmd: 'formatBlock', val: 'H2', label: 'H2' },
                    { cmd: 'insertUnorderedList', label: '\u2022 List' },
                    { cmd: 'insertOrderedList', label: '1. List' },
                    { cmd: 'indent', label: '\u2192' },
                    { cmd: 'outdent', label: '\u2190' },
                    { cmd: 'justifyLeft', label: '\u2261L' },
                    { cmd: 'justifyCenter', label: '\u2261C' },
                    { cmd: 'justifyRight', label: '\u2261R' },
                    { cmd: 'removeFormat', label: 'Tx' },
                  ].map((btn, i) => (
                    <button key={i} onMouseDown={e => { e.preventDefault(); document.execCommand(btn.cmd, false, btn.val || null); }}
                      style={{ padding: '3px 7px', border: `1px solid ${c.border}`, borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 12, minWidth: 28 }}>
                      {btn.label}
                    </button>
                  ))}
                  <button onMouseDown={e => { e.preventDefault(); const url = window.prompt('URL:'); if (url) document.execCommand('createLink', false, url); }}
                    style={{ padding: '3px 7px', border: `1px solid ${c.border}`, borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 12 }}>Link</button>
                  <button onMouseDown={e => { e.preventDefault(); document.execCommand('unlink', false, null); }}
                    style={{ padding: '3px 7px', border: `1px solid ${c.border}`, borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 12 }}>Unlink</button>
                  <label style={{ padding: '3px 7px', border: `1px solid ${c.border}`, borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>A
                    <input type="color" defaultValue="#000000" onInput={e => document.execCommand('foreColor', false, e.target.value)}
                      style={{ width: 18, height: 18, border: 'none', padding: 0, cursor: 'pointer' }} />
                  </label>
                  <label style={{ padding: '3px 7px', border: `1px solid ${c.border}`, borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>BG
                    <input type="color" defaultValue="#ffffff" onInput={e => document.execCommand('hiliteColor', false, e.target.value)}
                      style={{ width: 18, height: 18, border: 'none', padding: 0, cursor: 'pointer' }} />
                  </label>
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  ref={el => { if (el && el.innerHTML !== compose.body_html) el.innerHTML = compose.body_html || ''; }}
                  onInput={e => setCompose(p => ({ ...p, body_html: e.currentTarget.innerHTML }))}
                  style={{ minHeight: 200, maxHeight: 400, overflowY: 'auto', padding: 12, fontSize: 13, outline: 'none', lineHeight: 1.6 }}
                />
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>📎 Attachments</label>
                <input type="file" multiple onChange={e => setAttachFiles(Array.from(e.target.files))}
                  style={{ fontSize: 12, color: c.textMuted }} />
                {attachFiles.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {attachFiles.map((f, i) => (
                      <span key={i} style={{ background: '#eff6ff', color: '#6366f1', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>
                        {f.name} ({(f.size / 1024).toFixed(1)}KB)
                        <button onClick={() => setAttachFiles(prev => prev.filter((_, j) => j !== i))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', marginLeft: 4, fontSize: 12 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${c.border}` }}>
              {showSchedulePicker && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <input type="datetime-local" value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    style={{ flex: 1, padding: '7px 10px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                  <button onClick={() => { if (!scheduleAt) return alert('Pick a date/time'); sendEmail(); }}
                    disabled={sending || !scheduleAt}
                    style={{ padding: '7px 14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: !scheduleAt ? 0.6 : 1 }}>
                    📅 Schedule Send
                  </button>
                  <button onClick={() => { setShowSchedulePicker(false); setScheduleAt(''); }}
                    style={{ padding: '7px 10px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: c.textMuted }}>✕</button>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: c.textMuted }}>{draftSaving ? 'Saving draft...' : draftId ? 'Draft saved' : ''}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!showSchedulePicker && (
                    <button onClick={() => setShowSchedulePicker(true)}
                      style={{ padding: '8px 12px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 12, color: c.textMuted }}>🕐 Schedule</button>
                  )}
                  <button onClick={() => { discardDraft(draftId); setDraftId(null); setComposeOpen(false); setAttachFiles([]); setShowSchedulePicker(false); setScheduleAt(''); }}
                    style={{ padding: '8px 18px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, color: c.text }}>Cancel</button>
                  <button onClick={() => sendEmail()} disabled={sending}
                    style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, cursor: sending ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: sending ? 0.7 : 1 }}>
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Preferences Modal */}
      {notifPrefsOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>🔔 Notification Preferences</span>
              <button onClick={() => setNotifPrefsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c.textMuted }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              {[
                { key: 'notify_new_email', label: 'Notify on new email' },
                { key: 'notify_chat_mention', label: 'Notify on chat mention' },
                { key: 'email_digest', label: 'Email digest summary' },
                { key: 'sms_new_email', label: 'SMS on new email (requires Twilio)' },
              ].map(pref => (
                <div key={pref.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: c.text }}>{pref.label}</span>
                  <div onClick={() => setNotifPrefsForm(p => ({ ...p, [pref.key]: !p[pref.key] }))}
                    style={{ width: 44, height: 24, borderRadius: 12, background: notifPrefsForm[pref.key] ? '#10b981' : c.border, cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: notifPrefsForm[pref.key] ? 23 : 3, transition: 'left 0.2s' }} />
                  </div>
                </div>
              ))}
              {notifPrefsForm.email_digest && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Digest Frequency</label>
                  <select value={notifPrefsForm.email_digest_frequency} onChange={e => setNotifPrefsForm(p => ({ ...p, email_digest_frequency: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                    <option value="daily">Daily (7 AM)</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              )}
              {notifPrefsForm.sms_new_email && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: c.textMuted, marginBottom: 4, display: 'block' }}>Phone Number (with country code)</label>
                  <input value={notifPrefsForm.phone} onChange={e => setNotifPrefsForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="e.g. 919876543210"
                    style={{ width: '100%', padding: '8px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                <button onClick={() => setNotifPrefsOpen(false)}
                  style={{ padding: '8px 18px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, color: c.text }}>Cancel</button>
                <button onClick={saveNotifPrefs} disabled={notifPrefsSaving}
                  style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, cursor: notifPrefsSaving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: notifPrefsSaving ? 0.7 : 1 }}>
                  {notifPrefsSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session warning banner */}
      {sessionWarning && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#fef3c7', borderBottom: '2px solid #f59e0b', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 3000, fontSize: 13 }}>
          <span style={{ color: '#92400e', fontWeight: 600 }}>⚠️ Your session expires in 5 minutes.</span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={renewSession}
              style={{ background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Renew Session</button>
            <button onClick={() => setSessionWarning(false)}
              style={{ background: 'none', border: '1px solid #f59e0b', borderRadius: 6, padding: '5px 10px', fontSize: 12, color: '#92400e', cursor: 'pointer' }}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Session expired */}
      {sessionExpired && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#ef4444', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 3000 }}>
          Session expired. Redirecting to login...
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1f2937', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {toast}
          <span onClick={() => setToast(null)} style={{ cursor: 'pointer', marginLeft: 8, opacity: 0.7, fontSize: 16 }}>×</span>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {showShortcutsHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 380, padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>⌨️ Keyboard Shortcuts</span>
              <button onClick={() => setShowShortcutsHelp(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c.textMuted }}>×</button>
            </div>
            {[['c','Compose new email'],['r','Reply to selected email'],['d','Delete selected email'],['j','Next email'],['k','Previous email'],['Esc','Close compose / deselect'],['?','Toggle this help']].map(([key, desc]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${c.border}`, fontSize: 13 }}>
                <span style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4, padding: '2px 8px', fontFamily: 'monospace', fontWeight: 700, color: c.text }}>{key}</span>
                <span style={{ color: c.textMuted }}>{desc}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: c.textMuted, marginTop: 12 }}>Shortcuts only active in inbox view when no input is focused.</div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {templateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: c.card, borderRadius: 12, width: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: c.text }}>{templateModal === 'new' ? 'New Template' : 'Edit Template'}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setTplPreview(!tplPreview)}
                  style={{ padding: '5px 12px', border: `1px solid ${c.border}`, borderRadius: 6, background: tplPreview ? c.primaryLight : 'none', color: tplPreview ? c.primary : c.text, cursor: 'pointer', fontSize: 12 }}>
                  {tplPreview ? '✏️ Edit' : '👁 Preview'}
                </button>
                <button onClick={() => setTemplateModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: c.textMuted }}>×</button>
              </div>
            </div>
            <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
              {tplPreview ? (
                <div>
                  <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 8 }}>Subject: <strong>{tplForm.subject}</strong></div>
                  <div style={{ border: `1px solid ${c.border}`, borderRadius: 8, padding: 16, minHeight: 200, fontSize: 14, color: c.text, lineHeight: 1.7 }}
                    dangerouslySetInnerHTML={{ __html: tplForm.html_body || '<em style="color:#9ca3af">Nothing to preview</em>' }} />
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <input value={tplForm.name} onChange={e => setTplForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Template name *"
                      style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none' }} />
                    <select value={tplForm.category} onChange={e => setTplForm(p => ({ ...p, category: e.target.value }))}
                      style={{ padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}>
                      {['general', 'onboarding', 'support', 'marketing', 'notification'].map(cat => (
                        <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <input value={tplForm.subject} onChange={e => setTplForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Email subject *"
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, marginBottom: 10, outline: 'none', boxSizing: 'border-box' }} />
                  <textarea value={tplForm.html_body} onChange={e => setTplForm(p => ({ ...p, html_body: e.target.value }))}
                    placeholder="HTML body * (supports HTML tags)" rows={10}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${c.border}`, borderRadius: 7, fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                </>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${c.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setTemplateModal(null)} style={{ padding: '8px 18px', border: `1px solid ${c.border}`, borderRadius: 7, background: 'none', cursor: 'pointer', fontSize: 13, color: c.text }}>Cancel</button>
              <button onClick={saveTemplate} disabled={tplSaving}
                style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 7, cursor: tplSaving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: tplSaving ? 0.7 : 1 }}>
                {tplSaving ? 'Saving...' : '💾 Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
