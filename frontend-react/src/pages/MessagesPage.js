import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import MessagePortal from '../components/MessagePortal';
import AdminLayout from '../components/AdminLayout';
import MonitorLayout from '../components/MonitorLayout';
import DomainHeadLayout from '../components/DomainHeadLayout';

const MessagesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    if (!user) return null;

    let availableRoles = [];
    if (user.role === 'principal' || user.role === 'admin' || user.role === 'dean') availableRoles = ['hod', 'faculty', 'domain_head'];
    if (user.role === 'hod') availableRoles = ['faculty', 'principal', 'admin'];
    if (user.role === 'faculty') availableRoles = ['hod', 'principal'];
    if (user.role === 'domain_head') availableRoles = ['admin', 'principal'];

    const content = (
        <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--clr-text, #0f172a)' }}>Message Portal</h1>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--clr-text-3, #64748b)' }}>Secure communication within the institution.</p>
                </div>
            </div>
            
            <div style={{ flex: 1, minHeight: 0 }}>
                <MessagePortal 
                    currentUserRole={user.role} 
                    domainContext={user.assignedDomain} 
                    availableRoles={availableRoles} 
                />
            </div>
        </div>
    );

    // Wrap in appropriate layout
    if (user.role === 'admin' || user.role === 'hod' || user.role === 'faculty') {
        return <AdminLayout title="Messages">{content}</AdminLayout>;
    }
    if (user.role === 'principal' || user.role === 'dean') {
        return <MonitorLayout title="Messages">{content}</MonitorLayout>;
    }
    if (user.role === 'domain_head') {
        return <DomainHeadLayout title="Messages">{content}</DomainHeadLayout>;
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {content}
        </div>
    );
};

export default MessagesPage;
