import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import axios from "axios";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FiUpload,
  FiCheckCircle,
  FiDownload,
  FiMessageSquare,
} from "react-icons/fi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const API = "http://localhost:5000/api/feedback";

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const Dashboard = () => {
  const dashboardRef = useRef();

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [historyFiles, setHistoryFiles] = useState([]);

  const [data, setData] = useState({
    ratings: {},
    choiceData: {},
    multiData: {},
    textResponses: [],
    total: 0,
    allRatings: [],
    timeSeries: [],
  });

  /* ================= DATA PROCESSING ================= */
  const processData = useCallback((rows) => {
    if (!rows || rows.length === 0) {
      setData({
        ratings: {},
        choiceData: {},
        multiData: {},
        textResponses: [],
        total: 0,
        allRatings: [],
        timeSeries: [],
      });
      return;
    }

    const ratingMap = {};
    const allRatings = [];
    const timeMap = {};

    rows.forEach((entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString();

      entry.responses?.forEach((r) => {
        if (r.type === "rating") {
          if (!ratingMap[r.question]) ratingMap[r.question] = [];
          ratingMap[r.question].push(r.value);
          allRatings.push(r.value);

          if (!timeMap[date]) timeMap[date] = [];
          timeMap[date].push(r.value);
        }
      });
    });

    const avgRatings = {};
    Object.keys(ratingMap).forEach((q) => {
      const avg =
        ratingMap[q].reduce((a, b) => a + b, 0) /
        ratingMap[q].length;
      avgRatings[q] = Number(avg.toFixed(1));
    });

    const timeSeries = Object.keys(timeMap).map((date) => ({
      date,
      avg:
        timeMap[date].reduce((a, b) => a + b, 0) /
        timeMap[date].length,
    }));

    setData({
      ratings: avgRatings,
      total: rows.length,
      allRatings,
      timeSeries,
    });
  }, []);

  /* ================= UPLOAD ================= */
  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadMessage("Uploading...");
      await axios.post(`${API}/upload`, formData);
      setUploadMessage("Uploaded successfully");

      const res = await axios.get(`${API}/files/name/${file.name}`);
      setSelectedFileName(file.name);
      processData(res.data);
    } catch {
      setUploadMessage("Upload failed");
    }
  };

  /* ================= HISTORY ================= */
  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API}/stats`);
      setHistoryFiles(res.data);
      setShowHistory(true);
    } catch { }
  };

  const selectFile = async (fileName) => {
    const res = await axios.get(
      `${API}/files/name/${encodeURIComponent(fileName)}`
    );
    setSelectedFileName(fileName);
    processData(res.data);
    setShowHistory(false);
  };

  /* ================= PDF ================= */
  const downloadPDF = async () => {
    const canvas = await html2canvas(dashboardRef.current);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("feedback-dashboard.pdf");
  };

  const barData = {
    labels: Object.keys(data.ratings),
    datasets: [
      {
        label: "Average Rating",
        data: Object.values(data.ratings),
        backgroundColor: "#2563eb",
      },
    ],
  };

  const starCounts = [1, 2, 3, 4, 5].map(
    (star) =>
      data.allRatings.filter((v) => Math.round(v) === star).length
  );

  const doughnutData = {
    labels: ["1★", "2★", "3★", "4★", "5★"],
    datasets: [
      {
        data: starCounts,
        backgroundColor: [
          "#0a1f44",
          "#102a5c",
          "#1e3a8a",
          "#2563eb",
          "#60a5fa",
        ],
      },
    ],
  };

  return (
    <div className="main-content">
      <header className="glass-header">
        <label className="import-btn">
          <FiUpload /> Upload CSV
          <input
            type="file"
            hidden
            onChange={(e) => {
              setFile(e.target.files[0]);
              setFileName(e.target.files[0].name);
            }}
          />
        </label>

        {file && (
          <button className="process-btn" onClick={handleUpload}>
            <FiCheckCircle /> Process
          </button>
        )}

        <div className="header-right">
          <button className="secondary-btn" onClick={loadHistory}>
            <FiMessageSquare /> History
          </button>

          <button
            className="process-btn"
            onClick={downloadPDF}
            disabled={data.total === 0}
          >
            <FiDownload /> PDF
          </button>
        </div>
      </header>

      {uploadMessage && (
        <div className="message-box">{uploadMessage}</div>
      )}

      <div ref={dashboardRef}>
        {data.total === 0 ? (
          <div className="empty-state">
            <h3>No data available</h3>
            <p>Upload a CSV file to generate insights.</p>
          </div>
        ) : (
          <>
            <h2 className="dashboard-title">
              Dashboard: {selectedFileName}
            </h2>

            <div className="grid-charts">
              <div className="card">
                <h3>Average Ratings</h3>
                <div className="chart-wrapper">
                  <Bar data={barData} />
                </div>
              </div>

              <div className="card">
                <h3>Star Distribution</h3>
                <div className="chart-wrapper">
                  <Doughnut data={doughnutData} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showHistory && (
        <div
          className="modal-overlay"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Upload History</h2>

            {historyFiles.map((file) => (
              <div
                key={file._id}
                className="history-item"
                onClick={() => selectFile(file.fileName)}
              >
                {file.fileName}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
