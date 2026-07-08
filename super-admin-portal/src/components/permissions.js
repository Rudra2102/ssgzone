// Permission matrix for all roles
const PERMISSIONS = {
  super_admin: {
    dashboard: {
      view: true,
      viewAllMetrics: true,
      viewAllTenants: true,
      viewAllUsers: true,
      viewAllAdmins: true
    },
    admins: {
      create: true,
      read: true,
      update: true,
      delete: true,
      grantFeatures: true
    },
    tenants: {
      create: true,
      read: true,
      update: true,
      delete: true,
      grantFeatures: true,
      viewAll: true
    },
    users: {
      create: true,
      read: true,
      update: true,
      delete: true,
      viewAll: true
    },
    settings: {
      system: true,
      branding: true,
      billing: true,
      security: true
    },
    communication: {
      viewAllChats: true,
      viewAllEmails: true,
      accessAuditLogs: true
    }
  },
  admin: {
    dashboard: {
      view: true,
      viewAllMetrics: false,
      viewOwnTenants: true,
      viewOwnUsers: true,
      viewAllAdmins: false
    },
    tenants: {
      create: true,
      read: true,
      update: true,
      delete: false,
      grantFeatures: true,
      viewAll: false,
      viewOwn: true
    },
    users: {
      create: true,
      read: true,
      update: true,
      delete: false,
      viewAll: false,
      viewOwn: true
    },
    settings: {
      system: false,
      branding: false,
      billing: true,
      security: false
    },
    communication: {
      viewAllChats: false,
      viewOwnChats: true,
      viewAllEmails: false,
      viewOwnEmails: true,
      accessAuditLogs: false
    }
  },
  tenant: {
    dashboard: {
      view: true,
      viewAllMetrics: false,
      viewOwnUsers: true,
      viewAllUsers: false
    },
    users: {
      create: true,
      read: true,
      update: true,
      delete: false,
      viewAll: false,
      viewOwn: true
    },
    email: {
      compose: true,
      send: true,
      manage: true,
      templates: true
    },
    communication: {
      internalChat: true,
      adminChat: true,
      viewOwnChats: true,
      viewAllChats: false
    },
    settings: {
      own: true,
      system: false
    }
  },
  user: {
    dashboard: {
      view: true,
      viewOwnData: true,
      viewAllData: false
    },
    email: {
      compose: true,
      send: true,
      manage: true,
      templates: false
    },
    communication: {
      internalChat: true,
      viewOwnChats: true,
      viewAllChats: false
    },
    settings: {
      own: true,
      system: false
    }
  }
};

export default PERMISSIONS;
