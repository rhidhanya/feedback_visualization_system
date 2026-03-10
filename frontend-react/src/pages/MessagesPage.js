import React from 'react';
import { useAuth } from '../context/AuthContext';
import MessagePortal from '../components/MessagePortal';


const MessagesPage = () => {
    const { user } = useAuth();
    
    if (!user) return null;

    let availableRoles = [];
    if (user.role === 'principal' || user.role === 'admin') availableRoles = ['hod', 'faculty', 'domain_head'];
    if (user.role === 'hod') availableRoles = ['faculty', 'principal', 'admin'];
    if (user.role === 'faculty') availableRoles = ['hod', 'principal'];
    if (user.role === 'domain_head') availableRoles = ['admin', 'principal'];

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', height: 'calc(100vh - 80px)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Messages</h1>
                <p style={{ margin: '0.25rem 0 0', color: '#64748b' }}>Communicate with other institution members.</p>
            </div>
            
            {/* We override the height of MessagePortal in full-page mode by wrapping it */}
            <div style={{ height: 'calc(100% - 80px)' }}>
                <MessagePortal 
                    currentUserRole={user.role} 
                    domainContext={user.assignedDomain} 
                    availableRoles={availableRoles} 
                />
            </div>
        </div>
    );
};

export default MessagesPage;
