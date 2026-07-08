import React from 'react';
import './EmailOverview.css';

const EmailOverview = ({ stats = {} }) => {
  const {
    sent = 0,
    received = 0,
    failed = 0,
    bounced = 0,
    spam = 0,
    deliveryRate = 98.5,
    chartData = []
  } = stats;

  const total = sent + received;

  // Simple line chart rendering
  const renderChart = () => {
    if (chartData.length === 0) return null;
    
    const maxValue = Math.max(...chartData.map(d => Math.max(d.sent || 0, d.received || 0, d.failed || 0)));
    const width = 100 / chartData.length;
    
    return (
      <svg viewBox="0 0 1000 200" className="email-chart">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map(i => (
          <line key={`grid-${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="#ecf0f1" strokeWidth="1" />
        ))}
        
        {/* Sent line */}
        <polyline
          points={chartData.map((d, i) => `${i * (1000 / chartData.length) + 50},${200 - (d.sent / maxValue) * 180}`).join(' ')}
          fill="none"
          stroke="#27ae60"
          strokeWidth="2"
        />
        
        {/* Received line */}
        <polyline
          points={chartData.map((d, i) => `${i * (1000 / chartData.length) + 50},${200 - (d.received / maxValue) * 180}`).join(' ')}
          fill="none"
          stroke="#3498db"
          strokeWidth="2"
        />
        
        {/* Failed line */}
        <polyline
          points={chartData.map((d, i) => `${i * (1000 / chartData.length) + 50},${200 - (d.failed / maxValue) * 180}`).join(' ')}
          fill="none"
          stroke="#e74c3c"
          strokeWidth="2"
        />
      </svg>
    );
  };

  return (
    <div className="email-overview">
      <div className="overview-header">
        <h3>Email Overview</h3>
        <span className="overview-period">Today</span>
      </div>

      <div className="overview-stats">
        <div className="stat-item">
          <div className="stat-label">Sent</div>
          <div className="stat-value sent">{sent.toLocaleString()}</div>
          <div className="stat-bar">
            <div className="bar-fill sent" style={{ width: `${(sent / Math.max(total, 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Received</div>
          <div className="stat-value received">{received.toLocaleString()}</div>
          <div className="stat-bar">
            <div className="bar-fill received" style={{ width: `${(received / Math.max(total, 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Failed</div>
          <div className="stat-value failed">{failed.toLocaleString()}</div>
          <div className="stat-bar">
            <div className="bar-fill failed" style={{ width: `${(failed / Math.max(total, 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Bounced</div>
          <div className="stat-value bounced">{bounced.toLocaleString()}</div>
          <div className="stat-bar">
            <div className="bar-fill bounced" style={{ width: `${(bounced / Math.max(total, 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Spam</div>
          <div className="stat-value spam">{spam.toLocaleString()}</div>
          <div className="stat-bar">
            <div className="bar-fill spam" style={{ width: `${(spam / Math.max(total, 1)) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="chart-container">
          {renderChart()}
          <div className="chart-legend">
            <div className="legend-item"><span className="legend-dot" style={{ background: '#27ae60' }}></span>Sent</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#3498db' }}></span>Received</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#e74c3c' }}></span>Failed</div>
          </div>
        </div>
      )}

      <div className="overview-footer">
        <div className="delivery-rate">
          <span className="rate-label">Delivery Rate</span>
          <span className="rate-value">{deliveryRate}%</span>
        </div>
        <div className="rate-bar">
          <div className="rate-fill" style={{ width: `${deliveryRate}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default EmailOverview;
