import React from 'react';
import './EmailOverview.css';

const EmailOverview = ({ stats = {} }) => {
  const {
    sent = 0,
    received = 0,
    failed = 0,
    bounced = 0,
    spam = 0,
    deliveryRate = 98.5
  } = stats;

  const total = sent + received;

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
