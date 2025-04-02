import React from 'react';

const HealthIcon = ({ type, active, onClick }) => {
  let icon = '🌞';
  let label = '最高';
  let className = 'excellent';
  
  if (type === 'good') {
    icon = '☀️';
    label = '良い';
    className = 'good';
  } else if (type === 'average') {
    icon = '☁️';
    label = '普通';
    className = 'average';
  } else if (type === 'fair') {
    icon = '🌥️';
    label = 'まあまあ';
    className = 'fair';
  } else if (type === 'poor') {
    icon = '🌧️';
    label = '悪い';
    className = 'poor';
  }
  
  return (
    <div 
      className={`statusIcon ${className} ${active ? 'active' : ''}`} 
      onClick={() => onClick(type)}
    >
      <div style={{ fontSize: '52px' }}>{icon}</div>
      <span className="labelText">{label}</span>
    </div>
  );
};

export default HealthIcon;