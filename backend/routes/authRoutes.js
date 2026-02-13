const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const LoginSession = require("../models/LoginSession");

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: "User already exists" });
        }

        user = new User({
            name,
            email,
            password,
            role: role || "user",
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Record login session for signup
        await LoginSession.create({
            userId: user._id,
            email: user.email,
            name: user.name,
            type: "signup",
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        });

        // Create JWT Payload
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "1h" },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Login User
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        // Track Login - Update user's lastLogin and loginHistory
        user.lastLogin = new Date();
        user.loginHistory.push(new Date());
        await user.save();

        // Record login session
        await LoginSession.create({
            userId: user._id,
            email: user.email,
            name: user.name,
            type: "login",
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"]
        });

        // Create JWT Payload
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || "default_secret",
            { expiresIn: "1h" },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Get all users with stats (Admin only)
router.get("/users", async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });

        // Aggregate data for each user
        const usersWithStats = await Promise.all(users.map(async (user) => {
            const userObj = user.toObject();

            // Fetch files
            const FileStat = require("../models/FileStat"); // Ensure model is loaded
            const files = await FileStat.find({ userId: user._id }).sort({ lastUploadedAt: -1 });

            // Calculate stats
            const totalFiles = files.length;
            const totalUploads = files.reduce((acc, file) => acc + (file.uploadCount || 0), 0);
            const totalDownloads = files.reduce((acc, file) => acc + (file.downloadCount || 0), 0);

            // Fetch login history
            const sessions = await LoginSession.find({ userId: user._id }).sort({ timestamp: -1 });

            return {
                ...userObj,
                files: files || [],
                loginSessions: sessions || [],
                totalFiles,
                totalUploads,
                totalDownloads
            };
        }));

        res.json(usersWithStats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Update user status (Admin only)
router.put("/users/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({ msg: "Invalid status" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

// Delete user (Admin only)
router.delete("/users/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: "User removed" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;
