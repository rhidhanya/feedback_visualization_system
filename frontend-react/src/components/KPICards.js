import React from 'react';
import CountUp from 'react-countup';
import { FiTrendingUp, FiUsers, FiStar, FiMessageSquare } from 'react-icons/fi';
import './KPICards.css';

const KPICard = ({ title, value, icon: Icon, color, suffix = "" }) => (
    <div className="kpi-card" style={{ borderLeft: `4px solid ${color}` }}>
        <div className="kpi-icon" style={{ backgroundColor: `${color}20`, color }}>
            <Icon size={24} />
        </div>
        <div className="kpi-content">
            <p className="kpi-title">{title}</p>
            <h3 className="kpi-value">
                <CountUp end={value} duration={2} decimals={suffix === "" ? 0 : 1} suffix={suffix} />
            </h3>
        </div>
    </div>
);

const KPICards = ({ stats }) => {
    const { avgRating, totalResponses, sentimentBreakdown } = stats || {};

    const positiveSent = sentimentBreakdown?.find(s => s._id === "Positive")?.count || 0;
    const totalSent = sentimentBreakdown?.reduce((acc, s) => acc + s.count, 0) || 1;
    const positiveRate = ((positiveSent / totalSent) * 100).toFixed(1);

    return (
        <div className="kpi-grid">
            <KPICard
                title="Avg Rating"
                value={avgRating?.avg || 0}
                icon={FiStar}
                color="var(--clr-primary)"
                suffix="/5"
            />
            <KPICard
                title="Total Feedback"
                value={totalResponses?.count || 0}
                icon={FiMessageSquare}
                color="#334155"
            />
            <KPICard
                title="Positive Sentiment"
                value={parseFloat(positiveRate)}
                icon={FiTrendingUp}
                color="var(--clr-primary)"
                suffix="%"
            />
            <KPICard
                title="Active Users"
                value={12} // Placeholder for mock
                icon={FiUsers}
                color="#8b5cf6"
            />
        </div>
    );
};

export default KPICards;
