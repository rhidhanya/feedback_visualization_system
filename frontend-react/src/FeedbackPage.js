import { FiArrowLeft } from "react-icons/fi";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./App.css";

const API = "http://localhost:5000/api/feedback";

const FeedbackPage = () => {
  const navigate = useNavigate();
  const { formName } = useParams();

  const [textResponses, setTextResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= FETCH TEXT RESPONSES ================= */
  useEffect(() => {
    if (!formName) return;

    const fetchTextResponses = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${API}/files/name/${encodeURIComponent(formName)}`,
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          }
        );

        const allRows = res.data;

        if (!Array.isArray(allRows) || allRows.length === 0) {
          setTextResponses({});
          return;
        }

        const questionMap = {};

        allRows.forEach((entry) => {
          entry.responses?.forEach((r) => {
            if (
              (r.type === "text" || r.type === "sentence") &&
              r.value &&
              String(r.value).trim() !== ""
            ) {
              if (!questionMap[r.question]) {
                questionMap[r.question] = [];
              }
              questionMap[r.question].push(String(r.value).trim());
            }
          });
        });

        setTextResponses(questionMap);

      } catch (err) {
        console.error("Error fetching feedback:", err);
        setError("Failed to load feedback data.");
        setTextResponses({});
      } finally {
        setLoading(false);
      }
    };

    fetchTextResponses();
  }, [formName]);

  /* ================= CALCULATIONS ================= */

  const totalComments = Object.values(textResponses).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  /* ================= RENDER ================= */

  return (
    <div className="feedback-page-container">

      {/* HEADER */}
      <div className="feedback-header">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </div>

        <div>
          <h2>Text Feedback {formName}</h2>
          <div className="feedback-subtitle">
            {totalComments} total responses
          </div>
        </div>
      </div>

      {/* STATES */}
      {loading ? (
        <div className="empty-state">Loading feedback...</div>

      ) : error ? (
        <div className="empty-state error-state">
          {error}
        </div>

      ) : Object.keys(textResponses).length === 0 ? (
        <div className="empty-state">
          No sentence-type feedback found.
        </div>

      ) : (
        <div className="feedback-container">
          {Object.keys(textResponses).map((question) => (
            <div key={question} className="feedback-group">

              <h3 className="feedback-question-title">
                {question}
              </h3>

              <div className="feedback-list">
                {textResponses[question].map((comment, index) => (
                  <div key={index} className="feedback-card">
                    {comment}
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default FeedbackPage;
