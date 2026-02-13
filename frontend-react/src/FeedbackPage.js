import { FiGrid, FiMessageSquare, FiArrowLeft, FiShield } from "react-icons/fi";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./App.css";

const API = "http://localhost:5000/api/feedback";

const FeedbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const formName = location.state?.formName;

  const [groupedComments, setGroupedComments] = useState([]);
  const [user, setUser] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    if (formName) {
      fetchComments(formName);
    }
  }, [formName]);

  const fetchComments = async (name) => {
    try {
      const res = await axios.get(
        `${API}/files/name/${encodeURIComponent(name)}`
      );

      const groups = {};

      res.data.forEach((entry) => {
        entry.responses?.forEach((r) => {
          if (r.type === "text" && r.value) {
            const dt = new Date(entry.createdAt);
            const dateKey = dt.toLocaleDateString();
            const time = dt.toLocaleTimeString();

            if (!groups[dateKey]) groups[dateKey] = [];

            groups[dateKey].push({
              text: r.value,
              time,
              ts: dt.getTime(),
            });
          }
        });
      });

      const groupedArray = Object.keys(groups)
        .map((date) => ({
          date,
          comments: groups[date].sort((a, b) => a.ts - b.ts),
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setGroupedComments(groupedArray);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setGroupedComments([]);
    }
  };

  return (
    <div className="feedback-page-container">
      {/* Header */}
      <div className="feedback-header">
        <div
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          <FiArrowLeft />
        </div>

        <div>
          <h2 style={{ marginBottom: 4 }}>
            Feedback – {formName}
          </h2>
          <div className="feedback-subtitle">
            Text responses grouped by date
          </div>
        </div>
      </div>

      {/* Feedback List */}
      {groupedComments.length === 0 ? (
        <div className="empty-state">
          No feedback available for this form.
        </div>
      ) : (
        <div className="feedback-container">
          {groupedComments.map((group) => (
            <div key={group.date} className="feedback-group">
              <div className="feedback-date">
                {group.date}
              </div>

              {group.comments.map((c, idx) => (
                <div key={idx} className="feedback-card">
                  <div className="feedback-time">
                    {c.time}
                  </div>
                  <div className="feedback-text">
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;