import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import { FiSun, FiMoon, FiFileText, FiStar, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import KPICard from './components/KPICard';
import ActivityFeed from './components/ActivityFeed';
import './App.css';

const API = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const Dashboard = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [activities, setActivities] = useState([
    { message: "Dashboard initialized", time: "Just now" }
  ]);
  const [darkMode, setDarkMode] = useState(false);
  const [filters, setFilters] = useState({ courseId: '', instructorId: '' });

  useEffect(() => {
    const fetchEntities = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const cRes = await axios.get(`${API}/courses`, { headers });
        const iRes = await axios.get(`${API}/instructors`, { headers });
        setCourses(cRes.data);
        setInstructors(iRes.data);
      } catch (err) {
        console.error("Entity fetch error:", err);
      }
    };
    fetchEntities();
  }, []);

  const fetchData = async (queryStr = "") => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const summaryRes = await axios.get(`${API}/feedback/analytics/summary?${queryStr}`, { headers });
      setSummaryStats(summaryRes.data);
    } catch (err) {
      console.error("Fetch Data Error:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = io(SOCKET_URL);
    socket.on("feedback-updated", (data) => {
      setActivities(prev => [{ message: `New feedback received for a course`, time: "Just now" }, ...prev.slice(0, 9)]);
      fetchData();
    });
    return () => socket.disconnect();
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const queryStr = Object.entries(newFilters)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    fetchData(queryStr);
  };

  return (
    <div className={`main-content ${darkMode ? 'dark-mode' : ''}`}>
      <header className="glass-header">
        <div className="header-left">
          <h2>EdTech Analytics</h2>
        </div>

        <div className="header-right">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <FiSun /> : <FiMoon />}
          </button>

          <button className="secondary-btn" onClick={() => navigate("/admin/manage")}>
            Admin Management
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        <div className="dashboard-main">
          {summaryStats && (
            <div className="kpi-grid">
              <KPICard title="Total Courses" value={courses.length} icon={FiFileText} color="#334155" />
              <KPICard title="Avg Rating" value={summaryStats.avgRating?.[0]?.avg?.toFixed(1) || 0} icon={FiStar} color="var(--clr-primary)" suffix="/5" />
              <KPICard title="Completion Rate" value={82.5} icon={FiCheckCircle} color="var(--clr-primary)" suffix="%" />
              <KPICard title="Positive Sentiment" value={summaryStats.sentimentBreakdown?.find(s => s._id === 'Positive')?.count || 0} icon={FiTrendingUp} color="#8b5cf6" />
            </div>
          )}

          <div className="filter-panel card" style={{ padding: '1rem', display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <select value={filters.courseId} onChange={(e) => handleFilterChange("courseId", e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px' }}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <select value={filters.instructorId} onChange={(e) => handleFilterChange("instructorId", e.target.value)} style={{ padding: '0.5rem', borderRadius: '8px' }}>
              <option value="">All Instructors</option>
              {instructors.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
            </select>
          </div>

          <div className="grid-charts">
            {summaryStats?.sentimentBreakdown && (
              <div className="card">
                <h3>Student Sentiment</h3>
                <div style={{ height: 250 }}>
                  <Pie
                    data={{
                      labels: summaryStats.sentimentBreakdown.map(s => s._id),
                      datasets: [{
                        data: summaryStats.sentimentBreakdown.map(s => s.count),
                        backgroundColor: ["var(--clr-primary)", "#334155", "var(--clr-border)"],
                      }],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>
            )}

            {summaryStats?.categoryBreakdown && (
              <div className="card">
                <h3>Feedback by Category</h3>
                <div style={{ height: 250 }}>
                  <Bar
                    data={{
                      labels: summaryStats.categoryBreakdown.map(c => c._id),
                      datasets: [{
                        label: "Count",
                        data: summaryStats.categoryBreakdown.map(c => c.count),
                        backgroundColor: "#2563eb",
                      }],
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="dashboard-sidebar">
          <ActivityFeed activities={activities} />
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
