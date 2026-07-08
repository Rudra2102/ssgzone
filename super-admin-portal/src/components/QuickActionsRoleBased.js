import React from 'react';
import { useNavigate } from 'react-router-dom';
import PermissionWrapper from './PermissionWrapper';
import '../components/QuickActions.css';

const QuickActions = ({ role }) => {
  const navigate = useNavigate();

  const allActions = {
    super_admin: [
      { id: 1, label: 'Compose Email', icon: '✉️', path: '/compose' },
      { id: 2, label: 'Create Campaign', icon: '📢', path: '/campaigns' },
      { id: 3, label: 'Add Tenant', icon: '🏢', path: '/tenants/new' },
      { id: 4, label: 'Add User', icon: '👤', path: '/users/new' },
      { id: 5, label: 'Create Template', icon: '📝', path: '/templates/new' },
      { id: 6, label: 'View Reports', icon: '📊', path: '/reports' },
      { id: 7, label: 'System Settings', icon: '⚙️', path: '/settings' },
      { id: 8, label: 'Audit Logs', icon: '📋', path: '/audit-logs' }
    ],
    admin: [
      { id: 1, label: 'Compose Email', icon: '✉️', path: '/compose' },
      { id: 3, label: 'Add Tenant', icon: '🏢', path: '/tenants/new' },
      { id: 4, label: 'Add User', icon: '👤', path: '/users/new' },
      { id: 5, label: 'Create Template', icon: '📝', path: '/templates/new' },
      { id: 6, label: 'View Reports', icon: '📊', path: '/reports' },
      { id: 9, label: 'Billing', icon: '💳', path: '/billing' }
    ],
    tenant: [
      { id: 1, label: 'Compose Email', icon: '✉️', path: '/compose' },
      { id: 4, label: 'Add User', icon: '👤', path: '/users/new' },
      { id: 5, label: 'Create Template', icon: '📝', path: '/templates/new' },
      { id: 10, label: 'Internal Chat', icon: '💬', path: '/chat' },
      { id: 11, label: 'Settings', icon: '⚙️', path: '/settings' }
    ],
    user: [
      { id: 1, label: 'Compose Email', icon: '✉️', path: '/compose' },
      { id: 12, label: 'Inbox', icon: '📬', path: '/inbox' },
      { id: 10, label: 'Chat', icon: '💬', path: '/chat' },
      { id: 11, label: 'Settings', icon: '⚙️', path: '/settings' }
    ]
  };

  const actions = allActions[role] || allActions.user;

  return (
    <div className="quick-actions-container">
      <div className="actions-grid">
        {actions.map((action) => (
          <button
            key={action.id}
            className="action-card"
            onClick={() => navigate(action.path)}
          >
            <div className="action-icon">{action.icon}</div>
            <div className="action-label">{action.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
