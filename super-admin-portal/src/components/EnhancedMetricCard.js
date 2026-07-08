import React from 'react';
import './EnhancedMetricCard.css';

const EnhancedMetricCard = ({ 
  title, 
  value, 
  trend, 
  trendPercent, 
  icon, 
  subtitle,
  sparkData = []
}) => {
  const isPositive = trendPercent >= 0;
  
  return (
    <div className="enhanced-metric-card">
      <div className="metric-header">
        <div className="metric-icon">{icon}</div>
        <div className="metric-title-section">
          <h3>{title}</h3>
          {subtitle && <p className="metric-subtitle">{subtitle}</p>}
        </div>
      </div>
      
      <div className="metric-value">{value.toLocaleString()}</div>
      
      {trendPercent !== undefined && (
        <div className={`metric-trend ${isPositive ? 'positive' : 'negative'}`}>
          <span className="trend-icon">{isPositive ? '↑' : '↓'}</span>
          <span className="trend-text">{Math.abs(trendPercent)}% {trend || 'vs last period'}</span>
        </div>
      )}
      
      {sparkData.length > 0 && (
        <div className="metric-sparkline">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none">
            <polyline
              points={sparkData.map((v, i) => `${(i / (sparkData.length - 1)) * 100},${30 - (v / Math.max(...sparkData)) * 30}`).join(' ')}
              fill="none"
              stroke={isPositive ? '#27ae60' : '#e74c3c'}
              strokeWidth="1"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default EnhancedMetricCard;
