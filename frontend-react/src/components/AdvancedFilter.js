import React from 'react';
import { FiFilter, FiSearch, FiCalendar, FiArrowRight } from 'react-icons/fi';
import './AdvancedFilter.css';

const AdvancedFilter = ({ onFilterChange, categories }) => {
    return (
        <div className="filter-panel">
            <div className="filter-section">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search keywords..."
                        onChange={(e) => onFilterChange('keyword', e.target.value)}
                    />
                </div>
            </div>

            <div className="filter-group">
                <div className="filter-item">
                    <label><FiCalendar /> Date Range</label>
                    <div className="date-inputs">
                        <input type="date" onChange={(e) => onFilterChange('startDate', e.target.value)} />
                        <FiArrowRight />
                        <input type="date" onChange={(e) => onFilterChange('endDate', e.target.value)} />
                    </div>
                </div>

                <div className="filter-item">
                    <label>Category</label>
                    <select onChange={(e) => onFilterChange('category', e.target.value)}>
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-item">
                    <label>Rating</label>
                    <select onChange={(e) => onFilterChange('minRating', e.target.value)}>
                        <option value="">Any Rating</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                        <option value="2">2+ Stars</option>
                        <option value="1">1+ Stars</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default AdvancedFilter;
