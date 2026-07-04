import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Translation resources
const resources = {
  en: {
    translation: {
      // Navigation
      inbox: 'Inbox',
      sent: 'Sent',
      drafts: 'Drafts',
      trash: 'Trash',
      compose: 'Compose',
      settings: 'Settings',
      
      // Email actions
      reply: 'Reply',
      replyAll: 'Reply All',
      forward: 'Forward',
      delete: 'Delete',
      archive: 'Archive',
      markAsRead: 'Mark as Read',
      markAsUnread: 'Mark as Unread',
      
      // Compose
      to: 'To',
      cc: 'CC',
      bcc: 'BCC',
      subject: 'Subject',
      send: 'Send',
      saveDraft: 'Save Draft',
      attach: 'Attach',
      
      // Common
      loading: 'Loading...',
      search: 'Search',
      noEmails: 'No emails found',
      error: 'An error occurred',
      success: 'Success',
      cancel: 'Cancel',
      save: 'Save',
      
      // Settings
      language: 'Language',
      theme: 'Theme',
      notifications: 'Notifications',
      signature: 'Email Signature'
    }
  },
  es: {
    translation: {
      inbox: 'Bandeja de entrada',
      sent: 'Enviados',
      drafts: 'Borradores',
      trash: 'Papelera',
      compose: 'Redactar',
      settings: 'Configuración',
      
      reply: 'Responder',
      replyAll: 'Responder a todos',
      forward: 'Reenviar',
      delete: 'Eliminar',
      archive: 'Archivar',
      markAsRead: 'Marcar como leído',
      markAsUnread: 'Marcar como no leído',
      
      to: 'Para',
      cc: 'CC',
      bcc: 'CCO',
      subject: 'Asunto',
      send: 'Enviar',
      saveDraft: 'Guardar borrador',
      attach: 'Adjuntar',
      
      loading: 'Cargando...',
      search: 'Buscar',
      noEmails: 'No se encontraron correos',
      error: 'Ocurrió un error',
      success: 'Éxito',
      cancel: 'Cancelar',
      save: 'Guardar',
      
      language: 'Idioma',
      theme: 'Tema',
      notifications: 'Notificaciones',
      signature: 'Firma de correo'
    }
  },
  de: {
    translation: {
      inbox: 'Posteingang',
      sent: 'Gesendet',
      drafts: 'Entwürfe',
      trash: 'Papierkorb',
      compose: 'Verfassen',
      settings: 'Einstellungen',
      
      reply: 'Antworten',
      replyAll: 'Allen antworten',
      forward: 'Weiterleiten',
      delete: 'Löschen',
      archive: 'Archivieren',
      markAsRead: 'Als gelesen markieren',
      markAsUnread: 'Als ungelesen markieren',
      
      to: 'An',
      cc: 'CC',
      bcc: 'BCC',
      subject: 'Betreff',
      send: 'Senden',
      saveDraft: 'Entwurf speichern',
      attach: 'Anhängen',
      
      loading: 'Laden...',
      search: 'Suchen',
      noEmails: 'Keine E-Mails gefunden',
      error: 'Ein Fehler ist aufgetreten',
      success: 'Erfolg',
      cancel: 'Abbrechen',
      save: 'Speichern',
      
      language: 'Sprache',
      theme: 'Design',
      notifications: 'Benachrichtigungen',
      signature: 'E-Mail-Signatur'
    }
  },
  fr: {
    translation: {
      inbox: 'Boîte de réception',
      sent: 'Envoyés',
      drafts: 'Brouillons',
      trash: 'Corbeille',
      compose: 'Composer',
      settings: 'Paramètres',
      
      reply: 'Répondre',
      replyAll: 'Répondre à tous',
      forward: 'Transférer',
      delete: 'Supprimer',
      archive: 'Archiver',
      markAsRead: 'Marquer comme lu',
      markAsUnread: 'Marquer comme non lu',
      
      to: 'À',
      cc: 'CC',
      bcc: 'CCI',
      subject: 'Objet',
      send: 'Envoyer',
      saveDraft: 'Enregistrer le brouillon',
      attach: 'Joindre',
      
      loading: 'Chargement...',
      search: 'Rechercher',
      noEmails: 'Aucun e-mail trouvé',
      error: 'Une erreur s\'est produite',
      success: 'Succès',
      cancel: 'Annuler',
      save: 'Enregistrer',
      
      language: 'Langue',
      theme: 'Thème',
      notifications: 'Notifications',
      signature: 'Signature e-mail'
    }
  },
  hi: {
    translation: {
      inbox: 'इनबॉक्स',
      sent: 'भेजे गए',
      drafts: 'ड्राफ्ट',
      trash: 'कूड़ेदान',
      compose: 'लिखें',
      settings: 'सेटिंग्स',
      
      reply: 'जवाब दें',
      replyAll: 'सभी को जवाब दें',
      forward: 'आगे भेजें',
      delete: 'हटाएं',
      archive: 'संग्रहीत करें',
      markAsRead: 'पढ़ा हुआ चिह्नित करें',
      markAsUnread: 'अपठित चिह्नित करें',
      
      to: 'प्राप्तकर्ता',
      cc: 'CC',
      bcc: 'BCC',
      subject: 'विषय',
      send: 'भेजें',
      saveDraft: 'ड्राफ्ट सेव करें',
      attach: 'संलग्न करें',
      
      loading: 'लोड हो रहा है...',
      search: 'खोजें',
      noEmails: 'कोई ईमेल नहीं मिला',
      error: 'एक त्रुटि हुई',
      success: 'सफलता',
      cancel: 'रद्द करें',
      save: 'सेव करें',
      
      language: 'भाषा',
      theme: 'थीम',
      notifications: 'सूचनाएं',
      signature: 'ईमेल हस्ताक्षर'
    }
  },
  zh: {
    translation: {
      inbox: '收件箱',
      sent: '已发送',
      drafts: '草稿',
      trash: '垃圾箱',
      compose: '撰写',
      settings: '设置',
      
      reply: '回复',
      replyAll: '全部回复',
      forward: '转发',
      delete: '删除',
      archive: '存档',
      markAsRead: '标记为已读',
      markAsUnread: '标记为未读',
      
      to: '收件人',
      cc: '抄送',
      bcc: '密送',
      subject: '主题',
      send: '发送',
      saveDraft: '保存草稿',
      attach: '附件',
      
      loading: '加载中...',
      search: '搜索',
      noEmails: '未找到邮件',
      error: '发生错误',
      success: '成功',
      cancel: '取消',
      save: '保存',
      
      language: '语言',
      theme: '主题',
      notifications: '通知',
      signature: '邮件签名'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;