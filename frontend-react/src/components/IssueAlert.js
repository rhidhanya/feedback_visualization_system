import React, { useState, useEffect } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import api from '../api/axios';

const IssueAlert = ({ role, domainContext, onClick }) => {
    const [openCount, setOpenCount] = useState(0);

    useEffect(() => {
        const fetchQueries = async () => {
            try {
                const res = await api.get('/queries');
                if (res.data.success) {
                    let queries = res.data.data.filter(q => q.status === "Open");

                    // Filter based on context if not admin/dean/principal
                    if (role === "domain_head" && domainContext) {
                        queries = queries.filter(q => q.domain?.toLowerCase() === domainContext.toLowerCase());
                    }

                    setOpenCount(queries.length);
                }
            } catch (err) {
                console.error("Failed to fetch open queries count", err);
            }
        };

        fetchQueries();
        // Option to add socket listener here if needed
    }, [role, domainContext]);

    if (openCount === 0) return null;

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(229, 57, 53, 0.1)',
                color: 'var(--clr-danger)',
                padding: '0.4rem 0.8rem',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: onClick ? 'pointer' : 'default',
                border: '1px solid rgba(229, 57, 53, 0.2)'
            }}
            onClick={onClick}
        >
            <FiAlertCircle size={16} />
            {openCount} Open Issue{openCount > 1 ? 's' : ''}
        </div>
    );
};

export default IssueAlert;
