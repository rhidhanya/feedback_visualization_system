import React, { useState, useEffect, useCallback } from 'react';
import { FiSend, FiInbox, FiSearch, FiClock, FiMessageSquare, FiPlus } from 'react-icons/fi';
import api from '../api/axios';

const MessagePortal = ({ currentUserRole }) => {
    const [inbox, setInbox] = useState([]);
    const [sent, setSent] = useState([]);
    const [activeTab, setActiveTab] = useState('inbox');
    const [loading, setLoading] = useState(true);
    
    // Compose State
    const [isComposing, setIsComposing] = useState(false);
    const [recipients, setRecipients] = useState([]);
    const [selectedRecipient, setSelectedRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sending, setSending] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [fetchingMsg, setFetchingMsg] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [inRes, sentRes, recRes] = await Promise.all([
                api.get('/messages'),
                api.get('/messages/sent'),
                api.get('/messages/recipients')
            ]);
            setInbox(inRes.data.data || []);
            setSent(sentRes.data.data || []);
            setRecipients(recRes.data.data || []);
        } catch (err) {
            console.error("Failed to fetch messages", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    useEffect(() => {
        setSelectedMessage(null);
    }, [activeTab, isComposing]);
    
    const handleSelectMessage = async (msg) => {
        setFetchingMsg(true);
        try {
            const res = await api.get(`/messages/${msg._id}`);
            if (res.data.success) {
                setSelectedMessage(res.data.data);
                // If it was unread and we are high-fived to see the inbox, refresh the list to show as read
                if (activeTab === 'inbox' && !msg.isRead) {
                    fetchData();
                }
            }
        } catch (err) {
            console.error("Failed to fetch message details", err);
        } finally {
            setFetchingMsg(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!selectedRecipient || !subject || !body) return;

        setSending(true);
        try {
            await api.post('/messages', {
                recipientId: selectedRecipient,
                subject,
                body
            });
            setBody('');
            setSubject('');
            setSelectedRecipient('');
            setSearchTerm('');
            setIsComposing(false);
            fetchData();
        } catch (err) {
            console.error("Failed to send message", err);
        } finally {
            setSending(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const filteredRecipients = recipients.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeList = activeTab === 'inbox' ? inbox : sent;

    return (
        <div className="message-portal-container" style={{ display: 'flex', gap: '1.5rem', height: '600px', width: '100%', boxSizing: 'border-box', padding: '1.25rem' }}>
            {/* Sidebar / Tabs */}
            <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                    className="btn btn-primary" 
                    onClick={() => setIsComposing(true)}
                    style={{ 
                        padding: '1rem', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.75rem', 
                        marginTop: '1.25rem',
                        marginBottom: '1rem', 
                        background: 'var(--clr-primary)', 
                        color: 'white', 
                        border: 'none', 
                        fontWeight: 800, 
                        fontSize: '0.95rem',
                        letterSpacing: '0.05em',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(var(--clr-primary-rgb), 0.2)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <FiPlus size={20} /> COMPOSE
                </button>
                
                <div style={{ background: 'var(--clr-surface)', borderRadius: '16px', border: '1px solid var(--clr-border)', overflow: 'hidden', padding: '0.5rem' }}>
                    <button 
                        onClick={() => { setActiveTab('inbox'); setIsComposing(false); setSelectedMessage(null); }}
                        style={{ 
                            width: '100%', padding: '0.875rem 1rem', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.875rem',
                            borderRadius: '10px',
                            background: activeTab === 'inbox' && !isComposing ? 'var(--clr-primary-lt)' : 'transparent',
                            color: activeTab === 'inbox' && !isComposing ? 'var(--clr-primary)' : 'var(--clr-text-2)',
                            fontWeight: activeTab === 'inbox' && !isComposing ? 700 : 500,
                            cursor: 'pointer', transition: 'all 0.2s',
                            marginBottom: '0.25rem'
                        }}
                    >
                        <FiInbox size={20} /> <span style={{ fontSize: '0.95rem' }}>Inbox</span>
                        {inbox.filter(m => !m.isRead).length > 0 && (
                            <span style={{ marginLeft: 'auto', background: 'var(--clr-danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                {inbox.filter(m => !m.isRead).length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => { setActiveTab('sent'); setIsComposing(false); setSelectedMessage(null); }}
                        style={{ 
                            width: '100%', padding: '0.875rem 1rem', border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.875rem',
                            borderRadius: '10px',
                            background: activeTab === 'sent' && !isComposing ? 'var(--clr-primary-lt)' : 'transparent',
                            color: activeTab === 'sent' && !isComposing ? 'var(--clr-primary)' : 'var(--clr-text-2)',
                            fontWeight: activeTab === 'sent' && !isComposing ? 700 : 500,
                            cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        <FiSend size={20} /> <span style={{ fontSize: '0.95rem' }}>Sent Items</span>
                    </button>
                </div>
            </div>

            {/* Main View */}
            <div style={{ flex: 1, background: 'var(--clr-surface)', borderRadius: '12px', border: '1px solid var(--clr-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {isComposing ? (
                    <form onSubmit={handleSend} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', boxSizing: 'border-box' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-primary)' }}>New Message</h3>
                            <button 
                                type="button" 
                                className="btn btn-ghost" 
                                onClick={() => setIsComposing(false)} 
                                style={{ 
                                    background: 'var(--clr-bg)', 
                                    border: 'none', 
                                    color: 'var(--clr-text-3)', 
                                    cursor: 'pointer',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '0.85rem'
                                }}
                            >
                                CANCEL
                            </button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--clr-text-2)', display: 'block', marginBottom: '0.6rem' }}>Recipient</label>
                                <div style={{ position: 'relative' }}>
                                    <FiSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-3)' }} />
                                    <input 
                                        type="text" 
                                        placeholder="Search by name or role..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.875rem 0.875rem 0.875rem 2.75rem', 
                                            borderRadius: '10px', 
                                            border: '1px solid var(--clr-border)', 
                                            fontSize: '0.95rem', 
                                            outline: 'none', 
                                            boxSizing: 'border-box',
                                            transition: 'border-color 0.2s',
                                            background: '#f8fafc'
                                        }}
                                        onFocus={e => e.target.style.borderColor = 'var(--clr-primary)'}
                                        onBlur={e => e.target.style.borderColor = 'var(--clr-border)'}
                                    />
                                </div>
                                {searchTerm && !selectedRecipient && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        top: 'calc(100% + 8px)', 
                                        left: 0, 
                                        right: 0, 
                                        background: '#fff', 
                                        border: '1px solid var(--clr-border)', 
                                        borderRadius: '12px', 
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
                                        zIndex: 100, 
                                        maxHeight: '220px', 
                                        overflowY: 'auto' 
                                    }}>
                                        {filteredRecipients.length > 0 ? filteredRecipients.map(r => (
                                            <div 
                                                key={r._id} 
                                                onClick={() => { setSelectedRecipient(r._id); setSearchTerm(r.name); }}
                                                style={{ 
                                                    padding: '0.85rem 1.25rem', 
                                                    cursor: 'pointer', 
                                                    borderBottom: '1px solid #f1f5f9', 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between', 
                                                    alignItems: 'center',
                                                    transition: 'background 0.2s'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <span style={{ fontWeight: 600, color: 'var(--clr-text)' }}>{r.name}</span>
                                                <span style={{ 
                                                    fontSize: '0.7rem', 
                                                    color: 'var(--clr-primary)', 
                                                    background: 'var(--clr-primary-lt)', 
                                                    padding: '3px 10px', 
                                                    borderRadius: '6px', 
                                                    textTransform: 'uppercase',
                                                    fontWeight: 800,
                                                    letterSpacing: '0.05em'
                                                }}>{r.role}</span>
                                            </div>
                                        )) : (
                                            <div style={{ padding: '1.25rem', textAlign: 'center', color: 'var(--clr-text-3)', fontSize: '0.9rem' }}>No users found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--clr-text-2)', display: 'block', marginBottom: '0.6rem' }}>Subject</label>
                                <input 
                                    type="text" 
                                    placeholder="Brief summary of the message" 
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.875rem', 
                                        borderRadius: '10px', 
                                        border: '1px solid var(--clr-border)', 
                                        fontSize: '0.95rem', 
                                        outline: 'none', 
                                        boxSizing: 'border-box',
                                        background: '#f8fafc'
                                    }}
                                    onFocus={e => e.target.style.borderColor = 'var(--clr-primary)'}
                                    onBlur={e => e.target.style.borderColor = 'var(--clr-border)'}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--clr-text-2)', display: 'block', marginBottom: '0.6rem' }}>Message Content</label>
                            <textarea 
                                placeholder="Type your message here..."
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                style={{ 
                                    flex: 1, 
                                    padding: '1.25rem', 
                                    borderRadius: '10px', 
                                    border: '1px solid var(--clr-border)', 
                                    fontSize: '1rem', 
                                    outline: 'none', 
                                    resize: 'none', 
                                    fontFamily: 'inherit', 
                                    boxSizing: 'border-box',
                                    lineHeight: '1.6',
                                    background: '#f8fafc'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--clr-primary)'}
                                onBlur={e => e.target.style.borderColor = 'var(--clr-border)'}
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                            <button 
                                type="submit" 
                                className="btn-login-gradient" 
                                disabled={sending || !selectedRecipient} 
                                style={{ 
                                    padding: '1rem 3rem', 
                                    borderRadius: '12px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    gap: '0.75rem', 
                                    background: (sending || !selectedRecipient) ? '#94a3b8' : 'var(--clr-primary)', 
                                    color: 'white', 
                                    border: 'none', 
                                    fontWeight: 700, 
                                    fontSize: '1rem',
                                    cursor: (sending || !selectedRecipient) ? 'not-allowed' : 'pointer', 
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.2s',
                                    width: 'auto'
                                }}
                            >
                                {sending ? 'Sending...' : <><FiSend size={18} /> SEND MESSAGE</>}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--clr-border)', background: 'var(--clr-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, textTransform: 'capitalize', fontWeight: 800, fontSize: '1.1rem' }}>
                                {selectedMessage ? <><FiPlus style={{ transform: 'rotate(45deg)', cursor: 'pointer' }} onClick={() => setSelectedMessage(null)} /> Message Detail</> : activeTab}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--clr-text-3)', background: 'var(--clr-surface-2)', padding: '2px 8px', borderRadius: '4px' }}>
                                    {selectedMessage ? 'Active' : `${activeList.length} Messages`}
                                </span>
                            </div>
                        </div>
                        
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {loading || fetchingMsg ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading...</div>
                            ) : selectedMessage ? (
                                <div style={{ padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', borderBottom: '1px solid var(--clr-border)', paddingBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--clr-primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)', fontWeight: 800, fontSize: '1.25rem', border: '2px solid var(--clr-primary-20)' }}>
                                                {(activeTab === 'inbox' ? selectedMessage.sender?.name : selectedMessage.recipient?.name)?.charAt(0)}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--clr-text)' }}>{activeTab === 'inbox' ? selectedMessage.sender?.name : selectedMessage.recipient?.name}</div>
                                                <div style={{ color: 'var(--clr-text-3)', fontSize: '0.9rem', fontWeight: 600 }}>{activeTab === 'inbox' ? selectedMessage.sender?.role : selectedMessage.recipient?.role}</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-3)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <FiClock size={14} /> {formatDate(selectedMessage.createdAt)}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--clr-primary)', fontWeight: 800, marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                {activeTab === 'inbox' ? 'Received' : 'Sent'}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <h4 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--clr-text)', marginBottom: '1.5rem' }}>{selectedMessage.subject}</h4>
                                    <div style={{ fontSize: '1.05rem', color: 'var(--clr-text-2)', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                                        {selectedMessage.body}
                                    </div>

                                    {/* Redundant back button removed as global back button exists */}
                                </div>
                            ) : activeList.length === 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
                                    <FiMessageSquare size={48} style={{ marginBottom: '1rem' }} />
                                    <p>No messages found in your {activeTab}.</p>
                                </div>
                            ) : (
                                activeList.map(msg => (
                                    <div 
                                        key={msg._id} 
                                        className={`message-item ${msg.isRead ? 'read' : 'unread'}`}
                                        onClick={() => handleSelectMessage(msg)}
                                        style={{ 
                                            padding: '1.25rem', borderBottom: '1px solid var(--clr-border)', cursor: 'pointer', transition: 'all 0.2s',
                                            background: activeTab === 'inbox' && !msg.isRead ? 'rgba(var(--clr-primary-rgb), 0.05)' : 'transparent',
                                            borderLeft: activeTab === 'inbox' && !msg.isRead ? '4px solid var(--clr-primary)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--clr-primary-lt)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-primary)', fontWeight: 700, border: '1px solid var(--clr-primary-20)' }}>
                                                    {(activeTab === 'inbox' ? msg.sender?.name : msg.recipient?.name)?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, color: 'var(--clr-text)', fontSize: '0.95rem' }}>{activeTab === 'inbox' ? msg.sender?.name : msg.recipient?.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', fontWeight: 600 }}>{activeTab === 'inbox' ? msg.sender?.role : msg.recipient?.role}</div>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-3)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                                                <FiClock size={12} /> {formatDate(msg.createdAt)}
                                            </div>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--clr-text)', marginBottom: '0.35rem' }}>{msg.subject}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--clr-text-2)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{msg.body}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagePortal;
