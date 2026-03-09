import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiActivity } from 'react-icons/fi';
import './ActivityFeed.css';

const ActivityFeed = ({ activities }) => {
    return (
        <div className="activity-feed">
            <div className="feed-header">
                <FiActivity /> Recent Activity
            </div>
            <div className="feed-items">
                <AnimatePresence>
                    {activities.map((item, index) => (
                        <motion.div
                            key={item.id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="feed-item"
                        >
                            <div className="item-icon">
                                <FiClock />
                            </div>
                            <div className="item-details">
                                <p className="item-text">{item.message}</p>
                                <span className="item-time">{item.time}</span>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ActivityFeed;
