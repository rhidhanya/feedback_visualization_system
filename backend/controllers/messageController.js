const Message = require("../models/Message");
const User = require("../models/User");

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const { recipientId, subject, body } = req.body;

        if (!recipientId || !subject || !body) {
            return res.status(400).json({ success: false, message: "Recipient, subject, and body are required" });
        }

        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ success: false, message: "Recipient not found" });
        }

        const message = await Message.create({
            sender: req.user.id,
            recipient: recipientId,
            subject,
            body,
        });

        res.status(201).json({ success: true, data: message });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// @desc    Get inbox messages
// @route   GET /api/messages
// @access  Private
exports.getInbox = async (req, res) => {
    try {
        const messages = await Message.find({ recipient: req.user.id })
            .populate("sender", "name email role")
            .sort({ createdAt: -1 });

        res.json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// @desc    Get sent messages
// @route   GET /api/messages/sent
// @access  Private
exports.getSentMessages = async (req, res) => {
    try {
        const messages = await Message.find({ sender: req.user.id })
            .populate("recipient", "name email role")
            .sort({ createdAt: -1 });

        res.json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// @desc    Get message by ID
// @route   GET /api/messages/:id
// @access  Private
exports.getMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id)
            .populate("sender", "name email role")
            .populate("recipient", "name email role");

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        // Check ownership
        if (message.sender._id.toString() !== req.user.id && message.recipient._id.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Not authorized to view this message" });
        }

        // Mark as read if recipient is viewing
        if (message.recipient._id.toString() === req.user.id && !message.isRead) {
            message.isRead = true;
            message.readAt = Date.now();
            await message.save();
        }

        res.json({ success: true, data: message });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// @desc    Get list of potential recipients (Principal, HODs, Incharges, Admin)
// @route   GET /api/messages/recipients
// @access  Private
exports.getRecipients = async (req, res) => {
    try {
        // Exclude students from general messaging for now, as per typical college internal systems
        const recipients = await User.find({ 
            role: { $in: ['admin', 'principal', 'dean', 'hod', 'domain_head'] },
            _id: { $ne: req.user.id }
        }).select("name role email assignedDomain");

        res.json({ success: true, data: recipients });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
// @desc    Get unread message count
// @route   GET /api/messages/unread
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({ 
            recipient: req.user.id, 
            isRead: false 
        });
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
