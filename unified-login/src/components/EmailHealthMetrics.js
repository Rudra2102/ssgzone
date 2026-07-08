import React from 'react';
import './EmailHealthMetrics.css';

const EmailHealthMetrics = ({ stats = {} }) => {
  const {
    uptime = 99.9,
    avgDeliveryTime = 2.3,
    spamScore = 0.8,
    dkimStatus = 'verified',
    spfStatus = 'verified',
    dmarcStatus = 'verified',
    tlsEnabled = true,
    apiHealth = 'healthy'
  } = stats;

  const getStatusColor = (status) => {
    if (status === 'verified' || status === 'healthy' || status === true) return 'success';
    if (status === 'warning') return 'warning';
    return 'danger';
  };

  const getStatusText = (status) => {
    if (status === true) return 'Enabled';
    if (status === false) return 'Disabled';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="email-health-metrics">
      <div className="health-header">
        <h3>Email Health</h3>
      </div>

      <div className="health-grid">
        <div className="health-item">
          <div className="health-label">Uptime</div>
          <div className="health-value">{uptime}%</div>
          <div className="health-bar">
            <div className="health-fill" style={{ width: `${uptime}%`, background: '#27ae60' }}></div>
          </div>
        </div>

        <div className="health-item">
          <div className="health-label">Avg Delivery Time</div>
          <div className="health-value">{avgDeliveryTime}s</div>
          <div className="health-status">
            {avgDeliveryTime < 5 ? '✓ Good' : avgDeliveryTime < 10 ? '⚠ Fair' : '✗ Slow'}
          </div>
        </div>

        <div className="health-item">
          <div className="health-label">Spam Score</div>
          <div className="health-value">{spamScore}/10</div>
          <div className="health-bar">
            <div className="health-fill" style={{ width: `${(10 - spamScore) * 10}%`, background: '#27ae60' }}></div>
          </div>
        </div>
      </div>

      <div className="health-protocols">
        <div className={`protocol-item ${getStatusColor(dkimStatus)}`}>
          <span className="protocol-icon">🔐</span>
          <span className="protocol-name">DKIM</span>
          <span className="protocol-status">{getStatusText(dkimStatus)}</span>
        </div>

        <div className={`protocol-item ${getStatusColor(spfStatus)}`}>
          <span className="protocol-icon">📋</span>
          <span className="protocol-name">SPF</span>
          <span className="protocol-status">{getStatusText(spfStatus)}</span>
        </div>

        <div className={`protocol-item ${getStatusColor(dmarcStatus)}`}>
          <span className="protocol-icon">🛡️</span>
          <span className="protocol-name">DMARC</span>
          <span className="protocol-status">{getStatusText(dmarcStatus)}</span>
        </div>

        <div className={`protocol-item ${getStatusColor(tlsEnabled)}`}>
          <span className="protocol-icon">🔒</span>
          <span className="protocol-name">TLS</span>
          <span className="protocol-status">{getStatusText(tlsEnabled)}</span>
        </div>

        <div className={`protocol-item ${getStatusColor(apiHealth)}`}>
          <span className="protocol-icon">⚡</span>
          <span className="protocol-name">API</span>
          <span className="protocol-status">{getStatusText(apiHealth)}</span>
        </div>
      </div>
    </div>
  );
};

export default EmailHealthMetrics;
