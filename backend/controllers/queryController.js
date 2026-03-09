const Query = require("../models/Query");
const Notification = require("../models/Notification");

// Create a new query (Student)
exports.createQuery = async (req, res, next) => {
    try {
        const { domain, subject, description } = req.body;

        const query = await Query.create({
            student: req.user.userId,
            domain: domain.toLowerCase(),
            subject,
            description,
            status: "Open"
        });

        // Optionally, create a notification for domain head
        // or let the real-time sockets handle it.
        // We'll emit a socket event if available
        if (req.io) {
            req.io.emit("new_query", query);
            req.io.to(`domain:${domain.toLowerCase()}`).emit("new_domain_query", query);
        }

        res.status(201).json({ success: true, data: query });
    } catch (err) {
        next(err);
    }
};

// Get queries (Student sees their own; others see based on role)
exports.getQueries = async (req, res, next) => {
    try {
        let filter = {};

        if (req.user.role === "student") {
            filter.student = req.user.userId;
        } else if (req.user.role === "domain_head") {
            // Domain head only sees queries for their domain
            if (req.user.assignedDomain) {
                filter.domain = req.user.assignedDomain.toLowerCase();
            }
        }
        // admin, dean, principal see all queries

        const queries = await Query.find(filter)
            .populate("student", "name email rollNumber residenceType")
            .populate("responses.responder", "name role")
            .sort("-createdAt");

        res.json({ success: true, count: queries.length, data: queries });
    } catch (err) {
        next(err);
    }
};

// Add response / update status
exports.updateQuery = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body;

        const query = await Query.findById(id);
        if (!query) {
            return res.status(404).json({ success: false, message: "Query not found" });
        }

        // Add response if provided
        if (message) {
            query.responses.push({
                responder: req.user.userId,
                responderRole: req.user.role,
                message
            });
        }

        if (status && ["Open", "In Progress", "Resolved", "Rectified"].includes(status)) {
            query.status = status;
        }

        await query.save();

        const updatedQuery = await Query.findById(id)
            .populate("student", "name email rollNumber")
            .populate("responses.responder", "name role");

        if (req.io) {
            req.io.emit("query_updated", updatedQuery);
        }

        res.json({ success: true, data: updatedQuery });
    } catch (err) {
        next(err);
    }
};
