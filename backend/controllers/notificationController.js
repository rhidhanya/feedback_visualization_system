const Notification = require("../models/Notification");
const IssueStatus = require("../models/IssueStatus");
const User = require("../models/User");

// POST /api/notifications — admin creates a notification for a domain head
exports.createNotification = async (req, res) => {
    try {
        const { toUserId, domain, type, title, message, feedbackRef } = req.body;

        if (!toUserId || !domain || !title || !message) {
            return res.status(400).json({ success: false, message: "toUserId, domain, title, message are required" });
        }

        const notif = await Notification.create({
            fromUserId: req.user.userId,
            toUserId, domain,
            type: type || "admin_alert",
            title, message,
            feedbackRef: feedbackRef || undefined,
        });

        // Auto-create issue if feedback referenced
        if (feedbackRef) {
            await IssueStatus.create({
                notificationId: notif._id,
                feedbackRef, domain,
                status: "Pending",
            });
        }

        // Real-time notification
        if (req.io) req.io.to(`domain:${domain}`).emit("newNotification", { domain });

        const populated = await Notification.findById(notif._id)
            .populate("fromUserId", "name role")
            .populate("toUserId", "name role");

        res.status(201).json({ success: true, message: "Notification sent", data: populated });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// GET /api/notifications/my — domain head fetches their notifications
exports.getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ toUserId: req.user.userId })
            .populate("fromUserId", "name role")
            .populate("feedbackRef")
            .sort({ createdAt: -1 });
        res.json({ success: true, count: notifications.length, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// GET /api/notifications?domain=transport — admin views all  
exports.getAllNotifications = async (req, res) => {
    try {
        const filter = {};
        if (req.query.domain) filter.domain = req.query.domain;
        const notifications = await Notification.find(filter)
            .populate("fromUserId", "name role")
            .populate("toUserId", "name role")
            .populate("feedbackRef")
            .sort({ createdAt: -1 });
        res.json({ success: true, count: notifications.length, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// PUT /api/notifications/:id/read
exports.markRead = async (req, res) => {
    try {
        const notif = await Notification.findOneAndUpdate(
            { _id: req.params.id, toUserId: req.user.userId },
            { isRead: true },
            { new: true }
        );
        if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
        res.json({ success: true, data: notif });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
