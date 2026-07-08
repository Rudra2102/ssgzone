import React from 'react';
import './StorageUsage.css';

const StorageUsage = ({ stats = {} }) => {
  const {
    used = 45.2,
    total = 100,
    percentage = 45.2,
    breakdown = {
      emails: 30,
      attachments: 12,
      backups: 3,
      other: 0.2
    }
  } = stats;

  const getStorageColor = (percent) => {
    if (percent < 50) return '#27ae60';
    if (percent < 80) return '#f39c12';
    return '#e74c3c';
  };

  // Circular progress chart
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="storage-usage">
      <div className="storage-header">
        <h3>Storage Usage</h3>
        <span className="storage-info">{used.toFixed(1)} GB / {total} GB</span>
      </div>

      <div className="storage-main">
        <div className="circular-chart">
          <svg viewBox="0 0 120 120" className="progress-ring">
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke="#ecf0f1"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke={getStorageColor(percentage)}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="progress-circle"
            />
            <text x="60" y="55" textAnchor="middle" fontSize="24" fontWeight="700" fill="#2c3e50">
              {percentage.toFixed(1)}%
            </text>
            <text x="60" y="75" textAnchor="middle" fontSize="12" fill="#7f8c8d">
              Used
            </text>
          </svg>
        </div>
      </div>

      <div className="storage-breakdown">
        <div className="breakdown-title">Breakdown</div>
        <div className="breakdown-items">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="breakdown-item">
              <div className="breakdown-label">
                <span className="breakdown-dot" style={{ background: getBreakdownColor(key) }}></span>
                <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              </div>
              <div className="breakdown-value">{value} GB</div>
            </div>
          ))}
        </div>
      </div>

      {percentage > 80 && (
        <div className="storage-warning">
          ⚠️ Storage usage is high. Consider upgrading or cleaning up old emails.
        </div>
      )}
    </div>
  );
};

const getBreakdownColor = (type) => {
  const colors = {
    emails: '#3498db',
    attachments: '#e74c3c',
    backups: '#f39c12',
    other: '#95a5a6'
  };
  return colors[type] || '#bdc3c7';
};

export default StorageUsage;
