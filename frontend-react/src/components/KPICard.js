import React from 'react';
import './KPICard.css';

const KPICard = ({ title, value, icon: Icon, color, suffix = "" }) => {
    return (
        <div className="kpi-card" style={{ borderLeft: `4px solid ${color}` }}>
            <div className="kpi-info">
                <span className="kpi-title">{title}</span>
                <h3 className="kpi-value">
                    {value}{suffix}
                </h3>
            </div>
            <div className="kpi-icon" style={{ backgroundColor: `${color}20`, color: color }}>
                <Icon size={24} />
            </div>
        </div>
    );
};

export default KPICard;
