const express = require("express");
const router = express.Router();
const Feedback = require("../models/Feedback");
const FileStat = require("../models/FileStat");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

/* Demo user ID for unauthenticated requests */
const DEMO_USER_ID = new mongoose.Types.ObjectId("000000000000000000000001");

/* =========================
   JWT VERIFY MIDDLEWARE
========================= */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token provided" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    );

    req.userId = decoded.user.id;
    req.userRole = decoded.user.role;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

/* =========================
   GET ALL FEEDBACK
========================= */
router.get("/", async (req, res) => {
  try {
    const data = await Feedback.find()
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET FILES BY NAME (USER-SCOPED)
========================= */
router.get("/files/name/:name", verifyToken, async (req, res) => {
  try {
    const files = await Feedback.find({
      formName: req.params.name,
      userId: req.userId
    });

    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET FILES BY DATE (USER-SCOPED)
========================= */
router.get("/files/date/:date", verifyToken, async (req, res) => {
  try {
    const selectedDate = new Date(req.params.date);

    const start = new Date(selectedDate.setHours(0, 0, 0, 0));
    const end = new Date(selectedDate.setHours(23, 59, 59, 999));

    const files = await Feedback.find({
      userId: req.userId,
      createdAt: { $gte: start, $lte: end }
    }).select("_id formName createdAt");

    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET FILES BY RANGE (USER-SCOPED)
========================= */
router.get("/files/range", verifyToken, async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to)
      return res.status(400).json({ message: "From and To required" });

    const start = new Date(from);
    start.setHours(0, 0, 0, 0);

    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    const files = await Feedback.find({
      userId: req.userId,
      createdAt: { $gte: start, $lte: end }
    }).select("_id formName createdAt");

    res.json(files);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET SINGLE FILE BY ID (USER-SCOPED)
========================= */
router.get("/file/:id", verifyToken, async (req, res) => {
  try {
    const file = await Feedback.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!file) return res.status(404).json({ message: "Not found" });

    res.json(file);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPLOAD CSV (Enhanced)
========================= */
router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  console.log("Upload request received");
  try {
    if (!req.file) {
      console.log("No file in request");
      return res.status(400).json({ message: "No file uploaded" });
    }
    console.log("File received:", req.file.originalname, "Size:", req.file.size);

    const userId = req.userId; // Use authenticated user
    console.log("User ID:", userId);

    // 1. Duplicate Check
    const existing = await FileStat.findOne({
      fileName: req.file.originalname,
      userId: userId
    });

    if (existing) {
      try { fs.unlinkSync(req.file.path); } catch (e) { }
      // 409 Conflict
      return res.status(409).json({
        message: "File already uploaded by you",
        duplicate: true
      });
    }

    const rows = [];
    let hasError = false;

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", row => rows.push(row))
      .on("error", (err) => {
        hasError = true;
        if (!res.headersSent)
          res.status(400).json({ message: "Invalid CSV format" });
        try { fs.unlinkSync(req.file.path); } catch (e) { }
      })
      .on("end", async () => {
        if (hasError) return;

        try {
          const documents = [];
          const columnMetadata = {}; // Store type info

          // First pass: Analyze columns (using first 100 rows or all)
          const sampleRows = rows.slice(0, 50);

          if (rows.length > 0) {
            const headers = Object.keys(rows[0]);
            headers.forEach(header => {
              // Guess type based on samples
              let isDate = true;
              let isNumeric = true;

              const values = sampleRows.map(r => r[header]).filter(v => v !== undefined && v !== "" && v !== null);

              if (values.length === 0) {
                // Empty column, default to text
                columnMetadata[header] = 'text';
                return;
              }

              for (const val of values) {
                const sVal = String(val).trim();
                if (isNaN(Number(sVal))) isNumeric = false;
                const d = Date.parse(sVal);
                // Date check: must be a valid date AND look like a date string (YYYY-MM-DD or MM/DD/YYYY)
                if (isNaN(d) || !/\d/.test(sVal) || Number(sVal) > 2050) isDate = false;
              }

              if (isNumeric) columnMetadata[header] = 'numeric';
              else if (isDate) columnMetadata[header] = 'date';
              else {
                // Check for categorical (few unique values)
                const unique = new Set(values);
                if (unique.size <= 10 && unique.size < values.length) columnMetadata[header] = 'categorical';
                else columnMetadata[header] = 'text';
              }
            });
          }

          rows.forEach(row => {
            const responses = [];
            let timestamp = null;

            for (let key in row) {
              let value = row[key];
              if (value === undefined || value === null) continue;
              value = String(value).trim();

              // Handle timestamp field specific override
              if (key.toLowerCase() === "timestamp") {
                const parsed = new Date(value);
                if (!isNaN(parsed.getTime())) timestamp = parsed;
              }

              if (!value) continue;

              // Determine type from metadata
              const detectedType = columnMetadata[key] || 'text';
              let type = "text";
              if (detectedType === 'numeric') type = "rating"; // Map numeric to rating for now to keep backward compat logic if needed, or just use 'numeric'
              else if (detectedType === 'date') type = "date";
              else if (detectedType === 'categorical') type = "choice";

              // Specific overrides for backward compatibility / specific formats
              const lower = value.toLowerCase();
              if (lower.startsWith("http") || lower.includes("drive.google.com") || lower.startsWith("blob:")) {
                type = "file";
              } else if ((value.includes(",") || value.includes(";")) && !/^\d+(\.\d+)?$/.test(value)) {
                const items = value.split(/[,;]\s*/).map(s => s.trim()).filter(Boolean);
                if (items.length > 1) type = "multi";
              }

              // Parse value based on type
              let finalValue = value;
              if (type === "rating" || type === "numeric") finalValue = Number(value);
              else if (type === "multi") finalValue = value.split(/[,;]\s*/).map(s => s.trim()).filter(Boolean);

              responses.push({ question: key, type: type, value: finalValue });
            }

            if (responses.length) {
              documents.push({
                userId: userId,
                formName: req.file.originalname,
                responses,
                createdAt: timestamp || new Date()
              });
            }
          });

          if (!documents.length) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
            return res.status(400).json({ message: "No valid data" });
          }

          await Feedback.insertMany(documents);

          // Convert metadata object to array
          const metadataArray = Object.keys(columnMetadata).map(k => ({
            columnName: k,
            type: columnMetadata[k],
            sampleValues: []
          }));

          await FileStat.create({
            fileName: req.file.originalname,
            userId: userId,
            uploadCount: 1,
            downloadCount: 0,
            lastUploadedAt: new Date(),
            metadata: metadataArray,
            chartConfig: {}
          });

          try { fs.unlinkSync(req.file.path); } catch (e) { }

          res.json({ message: "Upload successful", count: documents.length });

        } catch (err) {
          console.error("Error processing CSV or saving to DB:", err);
          try { fs.unlinkSync(req.file.path); } catch (e) { }
          res.status(500).json({ message: err.message });
        }
      });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   USER FILE STATS
========================= */
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const stats = await FileStat.find({ userId: userId })
      .sort({ lastUploadedAt: -1 });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/stats/download", verifyToken, async (req, res) => {
  try {
    const { fileName } = req.body;
    const userId = req.userId;

    const stat = await FileStat.findOneAndUpdate(
      { fileName, userId: userId },
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!stat)
      return res.status(404).json({ message: "Not found" });

    res.json(stat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   ADMIN CLEANUP ENDPOINT
========================= */
router.post("/admin/cleanup-old-records", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const result = await FileStat.deleteMany({
      userId: { $exists: false }
    });

    res.json({
      message: "Old records cleaned",
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   ADMIN - GET ALL STATS
========================= */
/* =========================
   ADMIN - ANALYTICS DASHBOARD
========================= */
router.get("/admin/analytics", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const User = require("../models/User"); // Lazy load

    // 1. User Stats
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    // 2. Login Frequency (Last 7 Days)
    const loginStats = await User.aggregate([
      { $unwind: "$loginHistory" },
      { $match: { loginHistory: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$loginHistory" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 3. Upload Trends (Last 7 Days)
    const uploadStats = await FileStat.aggregate([
      { $match: { lastUploadedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$lastUploadedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUsers,
      activeUsers,
      loginStats,
      uploadStats
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/admin/all-stats", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const stats = await FileStat.find()
      .populate("userId", "name email")
      .sort({ lastUploadedAt: -1 });

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET USERS WITH STATS
========================= */
router.get("/admin/users-stats", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const User = require("../models/User");
    const LoginSession = require("../models/LoginSession");

    // Get all users
    const users = await User.find().select("_id name email createdAt lastLogin role");

    // For each user, aggregate their file stats and login history
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await FileStat.find({ userId: user._id });
        const totalUploads = stats.reduce((sum, s) => sum + s.uploadCount, 0);
        const totalDownloads = stats.reduce((sum, s) => sum + s.downloadCount, 0);

        // Get login sessions for this user
        const loginSessions = await LoginSession.find({ userId: user._id }).sort({ timestamp: -1 }).limit(10);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          totalFiles: stats.length,
          totalUploads,
          totalDownloads,
          files: stats.sort((a, b) => new Date(b.lastUploadedAt) - new Date(a.lastUploadedAt)),
          loginSessions: loginSessions
        };
      })
    );

    // Sort by most recent activity
    usersWithStats.sort((a, b) => {
      const aLastActivity = a.lastLogin || a.createdAt || new Date(0);
      const bLastActivity = b.lastLogin || b.createdAt || new Date(0);
      return new Date(bLastActivity) - new Date(aLastActivity);
    });

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET LOGIN SESSIONS
========================= */
router.get("/admin/login-sessions", verifyToken, async (req, res) => {
  try {
    if (req.userRole !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const LoginSession = require("../models/LoginSession");

    // Get all login sessions sorted by most recent
    const sessions = await LoginSession.find()
      .sort({ timestamp: -1 })
      .limit(100);

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;