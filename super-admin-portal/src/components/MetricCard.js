import React from 'react';
import '../styles/MetricCard.css';

const MetricCard = ({ title, value, subtitle, icon }) => {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <h3 className="metric-title">{title}</h3>
        <p className="metric-value">{value}</p>
        {subtitle && <p className="metric-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default MetricCard;
