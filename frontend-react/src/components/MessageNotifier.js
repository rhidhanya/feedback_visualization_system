import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageSquare, FiX } from 'react-icons/fi';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './MessageNotifier.css';

const MessageNotifier = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    useEffect(() => {
        if (user && !hasChecked) {
            const checkUnread = async () => {
                try {
                    const res = await api.get('/messages/unread');
                    if (res.data.success && res.data.count > 0) {
                        setUnreadCount(res.data.count);
                        setShowPopup(true);
                        // Auto-hide after 10 seconds
                        setTimeout(() => setShowPopup(false), 10000);
                    }
                    setHasChecked(true);
                } catch (err) {
                    console.error("Failed to check unread messages", err);
                }
            };
            checkUnread();
        }
    }, [user, hasChecked]);

    if (!showPopup) return null;

    return (
        <div className="message-popup">
            <div className="popup-icon">
                <FiMessageSquare size={20} />
            </div>
            <div className="popup-content" onClick={() => { navigate('/messages'); setShowPopup(false); }}>
                <p className="popup-title">New Messages</p>
                <p className="popup-text">You have {unreadCount} unread message{unreadCount > 1 ? 's' : ''}.</p>
            </div>
            <button className="popup-close" onClick={() => setShowPopup(false)}>
                <FiX size={16} />
            </button>
        </div>
    );
};

export default MessageNotifier;
