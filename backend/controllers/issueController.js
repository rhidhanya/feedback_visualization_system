const IssueStatus = require("../models/IssueStatus");

// GET /api/issues?domain=transport
exports.getIssues = async (req, res) => {
    try {
        const filter = {};
        if (req.query.domain) filter.domain = req.query.domain;
        if (req.query.status) filter.status = req.query.status;

        // Domain heads see only their domain
        if (req.user.role === "domain_head") {
            filter.domain = req.user.assignedDomain;
        }

        const issues = await IssueStatus.find(filter)
            .populate("notificationId")
            .populate("feedbackRef")
            .populate("updatedBy", "name role")
            .sort({ updatedAt: -1 });

        res.json({ success: true, count: issues.length, data: issues });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// PUT /api/issues/:id/status — domain head updates status
exports.updateIssueStatus = async (req, res) => {
    try {
        const { status, headResponse } = req.body;
        const valid = ["Pending", "In Progress", "Rectified", "Closed"];
        if (!valid.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${valid.join(", ")}` });
        }

        const issue = await IssueStatus.findById(req.params.id);
        if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

        // Domain heads can only update their own domain
        if (req.user.role === "domain_head" && issue.domain !== req.user.assignedDomain) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        issue.status = status;
        issue.updatedBy = req.user.userId;
        if (headResponse) issue.headResponse = headResponse;
        await issue.save();

        // Notify admin of status change
        if (req.io) req.io.emit("issueStatusUpdated", { domain: issue.domain, status });

        const populated = await IssueStatus.findById(issue._id)
            .populate("notificationId")
            .populate("feedbackRef")
            .populate("updatedBy", "name role");

        res.json({ success: true, message: "Issue status updated", data: populated });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// GET /api/issues/summary — overview counts by domain
exports.getIssueSummary = async (req, res) => {
    try {
        const results = await IssueStatus.aggregate([
            {
                $group: {
                    _id: { domain: "$domain", status: "$status" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.domain": 1, "_id.status": 1 } },
        ]);

        // Reshape into { domain: { Pending: n, ... } }
        const summary = {};
        results.forEach(r => {
            if (!summary[r._id.domain]) summary[r._id.domain] = {};
            summary[r._id.domain][r._id.status] = r.count;
        });

        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
