const DomainFeedback = require("../models/DomainFeedback");
const Domain = require("../models/Domain");
const Notification = require("../models/Notification");
const IssueStatus = require("../models/IssueStatus");
const User = require("../models/User");

// POST /api/domain-feedback — student submits
exports.submitDomainFeedback = async (req, res) => {
    try {
        const { domainSlug, answers, generalComment, semester, academicYear } = req.body;
        if (!domainSlug || !answers || !semester || !academicYear) {
            return res.status(400).json({ success: false, message: "domainSlug, answers, semester, academicYear required" });
        }

        const domain = await Domain.findOne({ slug: domainSlug, isActive: true });
        if (!domain) return res.status(404).json({ success: false, message: "Domain not found or inactive" });

        // Enforce residence restriction
        const user = await User.findById(req.user.userId);
        if (domain.residenceRestriction !== 'none') {
            const resType = user?.residenceType || 'dayscholar'; // Default to dayscholar if missing
            if (resType !== domain.residenceRestriction) {
                return res.status(403).json({
                    success: false,
                    message: `This service is only available for ${domain.residenceRestriction}s.`
                });
            }
        }

        const feedback = await DomainFeedback.create({
            studentId: req.user.userId,
            domainSlug, answers, generalComment,
            semester: Number(semester), academicYear,
        });

        // Real-time socket emission
        if (req.io) {
            req.io.emit("domainFeedbackUpdated", { domain: domainSlug });
            req.io.to(`domain:${domainSlug}`).emit("domainFeedbackUpdated", { domain: domainSlug });
        }

        // Auto-notify domain head if overall rating <= 2
        if (feedback.overallRating && feedback.overallRating <= 2) {
            try {
                const head = await User.findOne({ role: "domain_head", assignedDomain: domainSlug });
                const admin = await User.findOne({ role: "admin" });
                if (head && admin) {
                    const notif = await Notification.create({
                        fromUserId: admin._id,
                        toUserId: head._id,
                        domain: domainSlug,
                        type: "negative_feedback",
                        title: `Low Rating Alert — ${domain.name}`,
                        message: `A student submitted a ${feedback.overallRating.toFixed(1)}★ rating for ${domain.name}. Please review and take action.`,
                        feedbackRef: feedback._id,
                    });
                    await IssueStatus.create({
                        notificationId: notif._id,
                        feedbackRef: feedback._id,
                        domain: domainSlug,
                        status: "Pending",
                    });
                    if (req.io) req.io.to(`domain:${domainSlug}`).emit("newNotification", { domain: domainSlug });
                }
            } catch (notifErr) {
                console.error("Auto-notification error:", notifErr.message);
            }
        }

        res.status(201).json({ success: true, message: "Feedback submitted", data: feedback });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ success: false, message: "You have already submitted feedback for this domain this semester" });
        res.status(500).json({ success: false, message: "Server error", error: err.message, stack: err.stack });
    }
};

// GET /api/domain-feedback/my — student's own
exports.getMyDomainFeedback = async (req, res) => {
    try {
        const feedback = await DomainFeedback.find({ studentId: req.user.userId }).sort({ createdAt: -1 });
        res.json({ success: true, count: feedback.length, data: feedback });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// GET /api/domain-feedback?domain=transport — admin/head view
exports.getDomainFeedbackList = async (req, res) => {
    try {
        const filter = {};
        if (req.query.domain) filter.domainSlug = req.query.domain;

        // Domain heads can only see their own domain
        if (req.user.role === "domain_head") {
            filter.domainSlug = req.user.assignedDomain;
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [total, feedback] = await Promise.all([
            DomainFeedback.countDocuments(filter),
            DomainFeedback.find(filter)
                .populate("studentId", "name rollNumber department semester")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
        ]);
        res.json({ success: true, count: total, page, data: feedback });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// GET /api/domain-feedback/analytics/:slug
exports.getDomainAnalytics = async (req, res) => {
    try {
        const slug = req.params.slug;

        // Domain heads can only see their own
        if (req.user.role === "domain_head" && req.user.assignedDomain !== slug) {
            return res.status(403).json({ success: false, message: "You can only view analytics for your assigned domain" });
        }

        const [analyticsResult, head] = await Promise.all([
            DomainFeedback.aggregate([
                { $match: { domainSlug: slug } },
                {
                    $facet: {
                        summary: [
                            { $group: { _id: null, avgRating: { $avg: "$overallRating" }, totalFeedback: { $sum: 1 } } }
                        ],
                        negative: [
                            { $match: { overallRating: { $lte: 2 } } },
                            { $count: "count" }
                        ],
                        semesterTrend: [
                            { $group: { _id: "$semester", avgRating: { $avg: "$overallRating" }, count: { $sum: 1 } } },
                            { $sort: { _id: 1 } }
                        ],
                        questionStats: [
                            { $unwind: "$answers" },
                            { $match: { "answers.rating": { $exists: true, $ne: null } } },
                            { $group: { _id: "$answers.questionText", avgRating: { $avg: "$answers.rating" }, count: { $sum: 1 } } },
                            { $sort: { avgRating: -1 } }
                        ]
                    }
                }
            ]),
            User.findOne({ role: "domain_head", assignedDomain: slug }).select("name contact"),
        ]);

        const result = analyticsResult[0];
        const summary = result.summary[0] || { avgRating: 0, totalFeedback: 0 };
        const negativeCount = result.negative[0]?.count || 0;

        res.json({
            success: true,
            data: {
                domainSlug: slug,
                avgRating: Math.round(summary.avgRating * 100) / 100,
                totalFeedback: summary.totalFeedback,
                negativeFeedback: negativeCount,
                semesterTrend: result.semesterTrend.map(s => ({ semester: s._id, avgRating: Math.round(s.avgRating * 100) / 100, count: s.count })),
                questionStats: result.questionStats.map(q => ({ question: q._id, avgRating: Math.round(q.avgRating * 100) / 100, count: q.count })),
                domainHead: head ? { name: head.name, contact: head.contact } : null,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// GET /api/domain-feedback/analytics-all  (admin / dean / principal overview)
exports.getAllDomainAnalytics = async (req, res) => {
    try {
        const results = await DomainFeedback.aggregate([
            {
                $group: {
                    _id: "$domainSlug",
                    avgRating: { $avg: "$overallRating" },
                    totalFeedback: { $sum: 1 },
                    negativeFeedback: { $sum: { $cond: [{ $lte: ["$overallRating", 2] }, 1, 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
