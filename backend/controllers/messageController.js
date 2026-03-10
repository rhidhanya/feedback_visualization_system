const Message = require("../models/Message");

// Send a message
exports.sendMessage = async (req, res, next) => {
    try {
        const { receiverRoles, receiver, subject, domainContext, text } = req.body;

        const message = await Message.create({
            sender: req.user.userId,
            senderRole: req.user.role,
            receiverRoles,
            receiver,
            major: subject, // Using 'major' if 'subject' is reserved or just following current request
            subject, 
            domainContext,
            text,
            readBy: []
        });

        // Populate sender & receiver info before emitting
        const populatedMsg = await Message.findById(message._id)
            .populate("sender", "name email")
            .populate("receiver", "name email");

        if (req.io) {
            req.io.emit("new_message", populatedMsg);
        }

        res.status(201).json({ success: true, data: populatedMsg });
    } catch (err) {
        next(err);
    }
};

// Get messages for current user
exports.getMessages = async (req, res, next) => {
    try {
        const userRole = req.user.role;
        const userDomain = req.user.assignedDomain;

        let orConditions = [
            { sender: req.user.userId }, // messages I sent
            { receiver: req.user.userId }, // messages sent specifically to me
            { 
                receiverRoles: userRole,
                $or: [
                    { receiver: { $exists: false } },
                    { receiver: null }
                ],
                // If user is faculty, only show messages from HOD or Principal
                ...(userRole === "faculty" ? { senderRole: { $in: ["hod", "principal"] } } : {})
            }
        ];

        // If user is domain_head, ensure they see messages targeted to their specific domain
        if (userRole === "domain_head" && userDomain) {
            orConditions.push({
                $and: [
                    { receiverRoles: "domain_head" },
                    { domainContext: userDomain.toLowerCase() }
                ]
            });
        }

        let query = { $or: orConditions };

        const messages = await Message.find(query)
            .populate("sender", "name email")
            .populate("receiver", "name email")
            .sort("-createdAt");

        res.json({ success: true, count: messages.length, data: messages });
    } catch (err) {
        next(err);
    }
};

// Mark as read
exports.markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const message = await Message.findById(id);

        if (!message) {
            return res.status(404).json({ success: false, message: "Message not found" });
        }

        if (!message.readBy.includes(req.user.userId)) {
            message.readBy.push(req.user.userId);
            await message.save();
        }

        res.json({ success: true, data: message });
    } catch (err) {
        next(err);
    }
};

// Get unread count
exports.getUnreadCount = async (req, res, next) => {
    try {
        const userRole = req.user.role;
        const userDomain = req.user.assignedDomain;

        let orConditions = [
            { receiver: req.user.userId },
            { 
                receiverRoles: userRole,
                $or: [
                    { receiver: { $exists: false } },
                    { receiver: null }
                ],
                ...(userRole === "faculty" ? { senderRole: { $in: ["hod", "principal"] } } : {})
            }
        ];

        if (userRole === "domain_head" && userDomain) {
            orConditions.push({
                $and: [
                    { receiverRoles: "domain_head" },
                    { domainContext: userDomain.toLowerCase() }
                ]
            });
        }

        const query = { 
            $or: orConditions,
            readBy: { $ne: req.user.userId },
            sender: { $ne: req.user.userId } // Don't count own messages as unread
        };

        const count = await Message.countDocuments(query);
        res.json({ success: true, count });
    } catch (err) {
        next(err);
    }
};
