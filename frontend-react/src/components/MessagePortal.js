import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiMessageSquare, FiChevronLeft, FiPlus } from 'react-icons/fi';
import api from '../api/axios';

const MessagePortal = ({ currentUserRole, domainContext, availableRoles }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    // UI State for Contacts and Chat
    const [activeContact, setActiveContact] = useState(null); // null means showing contact list in mobile, or "New Message" form
    const [isComposing, setIsComposing] = useState(false);
    const messagesEndRef = useRef(null);
    
    // Compose State
    const [targetRole, setTargetRole] = useState(availableRoles[0] || '');
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [targetDomain, setTargetDomain] = useState('');
    const [departments, setDepartments] = useState([]);
    const [selectedDept, setSelectedDept] = useState('');

    const fetchMessages = useCallback(async () => {
        try {
            const res = await api.get('/messages');
            if (res.data.success) {
                setMessages(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch messages", err);
        }
    }, []);

    const fetchRecipients = useCallback(async () => {
        if (!['admin', 'principal'].includes(currentUserRole)) return;
        try {
            const res = await api.get('/users/recipients');
            if (res.data.success) {
                setRecipients(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch recipients", err);
        }
    }, [currentUserRole]);

    const fetchDepts = useCallback(async () => {
        try {
            const res = await api.get('/departments');
            if (res.data.success) setDepartments(res.data.data);
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    }, []);

    useEffect(() => {
        fetchMessages();
        fetchRecipients();
        fetchDepts();
    }, [fetchMessages, fetchRecipients, fetchDepts]);

    useEffect(() => {
        if (targetRole === 'hod' && selectedDept) {
            const hod = recipients.find(r => r.role === 'hod' && r.department?._id === selectedDept);
            if (hod) setSelectedRecipient(hod._id);
            else setSelectedRecipient('');
        }
    }, [selectedDept, targetRole, recipients]);

    // Scroll to bottom when messages update
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeContact]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() && !isComposing) return;

        try {
            // Determine API payload whether replying to activeContact or composing new
            let payload = {};

            if (isComposing) {
                if (!targetRole) return;
                payload = {
                    receiverRoles: [targetRole],
                    receiver: selectedRecipient || undefined,
                    subject: subject || undefined,
                    domainContext: targetRole === 'domain_head' && !selectedRecipient ? targetDomain : '',
                    text: newMessage
                };
            } else if (activeContact) {
                // Determine the correct receiver from activeContact
                if (activeContact.type === 'user') {
                    payload = {
                        receiverRoles: [activeContact.role],
                        receiver: activeContact.id,
                        text: newMessage
                    };
                } else if (activeContact.type === 'role') {
                    payload = {
                        receiverRoles: [activeContact.id],
                        receiver: undefined,
                        text: newMessage
                    };
                }
            }

            await api.post('/messages', payload);
            setNewMessage('');
            if (isComposing) {
                setSubject('');
                setSelectedRecipient('');
                setIsComposing(false);
            }
            fetchMessages(); // refresh list
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    // --- Message Grouping Logic ---
    // Group messages by participants to form "Contacts" threading.
    const groupedThreads = Object.values(messages.reduce((acc, msg) => {
        // Determine the "Other party"
        let threadId = '';
        let threadName = '';
        let type = 'user'; // 'user' or 'role'
        let threadRole = '';
        
        const isSentByMe = Boolean(msg.senderRole === currentUserRole && msg.sender?.email && msg.sender.email !== 'system');
        
        if (isSentByMe) {
            // Sent by me, so the "other party" is the receiver or receiver roles
            if (msg.receiver) {
                threadId = msg.receiver._id;
                threadName = msg.receiver.name || 'Unknown User';
                threadRole = msg.receiverRoles[0] || '';
            } else {
                threadId = msg.receiverRoles.join('_');
                threadName = msg.receiverRoles.map(r => r.toUpperCase()).join(', ');
                type = 'role';
                threadRole = msg.receiverRoles[0] || '';
            }
        } else {
            // Sent to me, so the "other party" is the sender
            threadId = msg.sender?._id || msg.senderRole;
            threadName = msg.sender?.name ? msg.sender.name : msg.senderRole.toUpperCase();
            threadRole = msg.senderRole;
            if (!msg.sender?._id) type = 'role';
        }

        // Add domain context to ID to isolate domain specific chats if needed
        if (msg.domainContext) {
            threadId += `_${msg.domainContext}`;
            if (type === 'role') threadName += ` (${msg.domainContext})`;
        }

        if (!acc[threadId]) {
            acc[threadId] = {
                id: threadId,
                name: threadName,
                role: threadRole,
                type,
                messages: [],
                lastMessage: msg, // they come sorted desc initially
            };
        }
        
        // Ensure chronological push
        acc[threadId].messages.unshift(msg);
        
        // Keep keeping track of the absolute last message for the sidebar preview
        if (new Date(msg.createdAt) > new Date(acc[threadId].lastMessage.createdAt)) {
            acc[threadId].lastMessage = msg;
        }

        return acc;
    }, {}));

    // Sort threads by most recent message
    groupedThreads.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    const activeThread = isComposing ? null : groupedThreads.find(t => t.id === activeContact?.id);

    // --- Format Timestamps ---
    const formatTime = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const domains = ['transport', 'mess', 'hostel', 'sanitation', 'academic'];

    return (
        <div style={{ display: 'flex', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', height: '550px' }}>
            
            {/* LEFT PANEL: Contact List */}
            <div style={{ 
                width: '320px', 
                borderRight: '1px solid #e2e8f0', 
                display: activeContact || isComposing ? 'none' : 'flex', 
                flexDirection: 'column',
                background: '#f8fafc',
                '@media (min-width: 768px)': { display: 'flex' } // Always show on desktop
            }}>
                <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FiMessageSquare size={18} color="var(--clr-primary)" />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Messages</h3>
                    </div>
                    <button 
                        onClick={() => { setIsComposing(true); setActiveContact(null); }}
                        style={{ background: 'var(--clr-primary-lt)', color: 'var(--clr-primary)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="New Message"
                    >
                        <FiPlus size={16} />
                    </button>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {groupedThreads.length === 0 ? (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                            No conversations yet.<br />Click + to start a new message.
                        </div>
                    ) : (
                        groupedThreads.map(thread => (
                            <div 
                                key={thread.id} 
                                onClick={() => { setActiveContact(thread); setIsComposing(false); }}
                                style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid #e2e8f0',
                                    cursor: 'pointer',
                                    background: activeContact?.id === thread.id ? '#eff6ff' : 'transparent',
                                    transition: 'background 0.2s',
                                    display: 'flex',
                                    gap: '0.75rem',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ 
                                    width: '40px', height: '40px', borderRadius: '50%', background: 'var(--clr-primary-lt)', 
                                    color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0
                                }}>
                                    {thread.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ overflow: 'hidden', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{thread.name}</h4>
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{formatTime(thread.lastMessage.createdAt)}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {thread.lastMessage.senderRole === currentUserRole ? 'You: ' : ''}{thread.lastMessage.text}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: Chat Area */}
            <div style={{ 
                flex: 1, 
                display: (!activeContact && !isComposing) ? 'none' : 'flex', 
                flexDirection: 'column', 
                background: '#fff',
                position: 'relative',
                '@media (min-width: 768px)': { display: 'flex' }
            }}>
                
                {(!activeContact && !isComposing) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                        <FiMessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>Select a conversation or start a new message.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff' }}>
                            <button 
                                onClick={() => { setActiveContact(null); setIsComposing(false); }}
                                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'none', '@media (max-width: 767px)': { display: 'block' } }}
                            >
                                <FiChevronLeft size={24} />
                            </button>

                            {isComposing ? (
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>New Message</h3>
                            ) : (
                                <>
                                    <div style={{ 
                                        width: '36px', height: '36px', borderRadius: '50%', background: 'var(--clr-primary-lt)', 
                                        color: 'var(--clr-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                    }}>
                                        {activeContact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{activeContact.name}</h3>
                                </>
                            )}
                        </div>

                        {/* Compose Panel Fields (if composing) */}
                        {isComposing && (
                            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Recipient Type</label>
                                        <select
                                            value={targetRole}
                                            onChange={e => { 
                                                setTargetRole(e.target.value); 
                                                setSelectedRecipient(''); 
                                                setSelectedDept('');
                                            }}
                                            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                        >
                                            <option value="">Select Role...</option>
                                            {availableRoles.map(role => <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    
                                    {['admin', 'principal', 'faculty'].includes(currentUserRole) && (targetRole === 'hod') ? (
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Select Department</label>
                                            <select
                                                value={selectedDept}
                                                onChange={e => setSelectedDept(e.target.value)}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                            >
                                                <option value="">Select Department...</option>
                                                {departments.map(d => (
                                                    <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : ['admin', 'principal'].includes(currentUserRole) && targetRole === 'domain_head' ? (
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>Target Domain</label>
                                            <select
                                                value={targetDomain}
                                                onChange={e => setTargetDomain(e.target.value)}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                required
                                            >
                                                <option value="">Select Domain...</option>
                                                {domains.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    ) : null}
                                </div>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="Subject (Optional)"
                                    style={{ width: '100%', boxSizing: 'border-box', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
                                />
                            </div>
                        )}

                        {/* Chat Messages Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc' }}>
                            {!isComposing && activeThread?.messages.map((msg, index) => {
                                const isSentByMe = Boolean(msg.senderRole === currentUserRole && msg.sender?.email && msg.sender.email !== 'system');

                                
                                return (
                                    <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSentByMe ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            background: isSentByMe ? 'var(--clr-primary)' : '#fff',
                                            color: isSentByMe ? '#fff' : '#0f172a',
                                            padding: '0.75rem 1rem', 
                                            borderRadius: isSentByMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                            border: isSentByMe ? 'none' : '1px solid #e2e8f0',
                                            maxWidth: '75%',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            position: 'relative'
                                        }}>
                                            {msg.subject && <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem', opacity: 0.9 }}>Sub: {msg.subject}</div>}
                                            <div style={{ fontSize: '0.95rem', lineHeight: 1.4, wordBreak: 'break-word' }}>{msg.text}</div>
                                            
                                            <div style={{ 
                                                fontSize: '0.65rem', 
                                                color: isSentByMe ? 'rgba(255,255,255,0.7)' : '#94a3b8', 
                                                textAlign: 'right', 
                                                marginTop: '4px',
                                                userSelect: 'none'
                                            }}>
                                                {formatTime(msg.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={sendMessage} style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <textarea
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    style={{ 
                                        flex: 1, 
                                        padding: '0.75rem 1rem', 
                                        borderRadius: '24px', 
                                        border: '1px solid #cbd5e1', 
                                        outline: 'none', 
                                        resize: 'none', 
                                        maxHeight: '120px',
                                        minHeight: '44px',
                                        fontSize: '0.95rem',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                    rows={1}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            sendMessage(e);
                                        }
                                    }}
                                />
                                <button 
                                    type="submit" 
                                    disabled={!newMessage.trim()}
                                    style={{ 
                                        background: newMessage.trim() ? 'var(--clr-primary)' : '#e2e8f0', 
                                        color: newMessage.trim() ? '#fff' : '#94a3b8', 
                                        border: 'none', 
                                        borderRadius: '50%', 
                                        width: '44px', 
                                        height: '44px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        cursor: newMessage.trim() ? 'pointer' : 'not-allowed', 
                                        flexShrink: 0,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <FiSend size={18} style={{ marginLeft: '-2px', marginTop: '2px' }} />
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default MessagePortal;
