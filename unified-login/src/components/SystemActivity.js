import React from 'react';
import './SystemActivity.css';

const SystemActivity = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    const icons = {
      user_created: '👤',
      user_deleted: '🗑️',
      tenant_created: '🏢',
      tenant_deleted: '🗑️',
      email_sent: '📧',
      email_failed: '❌',
      login: '🔓',
      logout: '🔒',
      settings_changed: '⚙️',
      api_call: '🔌',
      error: '⚠️'
    };
    return icons[type] || '📝';
  };

  const getActivityColor = (type) => {
    const colors = {
      user_created: 'success',
      user_deleted: 'danger',
      tenant_created: 'success',
      tenant_deleted: 'danger',
      email_sent: 'info',
      email_failed: 'danger',
      login: 'success',
      logout: 'info',
      settings_changed: 'warning',
      api_call: 'info',
      error: 'danger'
    };
    return colors[type] || 'default';
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="system-activity">
      <div className="activity-header">
        <h3>System Activity</h3>
        <a href="/activity-logs" className="view-all-link">View All</a>
      </div>

      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="empty-state">
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={index} className={`activity-item ${getActivityColor(activity.type)}`}>
              <div className="activity-icon">{getActivityIcon(activity.type)}</div>
              <div className="activity-content">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-description">{activity.description}</div>
              </div>
              <div className="activity-time">{formatTime(activity.timestamp)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SystemActivity;
