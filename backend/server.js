const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require("compression");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const connectDB = require("./config/db");

// ─── Route Imports ─────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const systemSettingsRoutes = require("./routes/systemSettingsRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const domainRoutes = require("./routes/domainRoutes");
const domainFeedbackRoutes = require("./routes/domainFeedbackRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const issueRoutes = require("./routes/issueRoutes");
const queryRoutes = require("./routes/queryRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { seedDepartments, seedAdmin } = require("./controllers/adminController");
const { seedDomains } = require("./controllers/domainController");

const app = express();
const server = http.createServer(app);

// ─── Socket.IO setup ───────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// ─── Global Middleware ─────────────────────────────────────────────────────
// 1. GZIP compression — dramatically reduces JSON response sizes
app.use(compression({
  level: 6, // Good balance between speed and compression ratio
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Attach io to every request so controllers can emit events
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[Request] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  req.io = io;
  next();
});

// Cache-Control headers for analytics (read-only, changes rarely)
app.use('/api/analytics', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'private, max-age=60'); // 1 min browser cache
  }
  next();
});

// ─── Connect to MongoDB ────────────────────────────────────────────────────
connectDB().then(async () => {
  await seedDepartments();
  await seedAdmin();
  await seedDomains();
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api", authRoutes); // Support /api/login/... and legacy paths
app.use("/api/departments", departmentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/settings", systemSettingsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/domain-feedback", domainFeedbackRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/queries", queryRoutes);
app.use("/api/messages", messageRoutes);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running", timestamp: new Date() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    stack: err.stack,
  });
});

// ─── Socket.IO Events ──────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Domain heads join their domain room for targeted events
  socket.on("joinDomainRoom", (domainSlug) => {
    if (domainSlug) {
      socket.join(`domain:${domainSlug}`);
      console.log(`Socket ${socket.id} joined room domain:${domainSlug}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);
});
