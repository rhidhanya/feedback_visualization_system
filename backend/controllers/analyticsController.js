const Feedback = require("../models/Feedback");
const Department = require("../models/Department");
const User = require("../models/User");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");

// ─── Helper: Build match filter from query params ─────────────────────────
const buildMatchFilter = (query) => {
    const match = {};
    if (query.department) match.departmentId = new mongoose.Types.ObjectId(query.department);
    if (query.semester) match.semester = Number(query.semester);
    if (query.academicYear) match.academicYear = query.academicYear;
    return match;
};

// ─── GET /api/analytics/summary ──────────────────────────────────────────
exports.getSummary = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);

        const [result] = await Feedback.aggregate([
            { $match: match },
            {
                $facet: {
                    stats: [
                        {
                            $group: {
                                _id: null,
                                totalFeedback: { $sum: 1 },
                                avgRating: { $avg: "$overallRating" },
                                uniqueDepts: { $addToSet: "$departmentId" },
                                uniqueSubjects: { $addToSet: "$subjectId" },
                            },
                        },
                    ],
                    positive: [
                        { $match: { overallRating: { $gte: 4 } } },
                        { $count: "count" }
                    ],
                    low: [
                        { $match: { overallRating: { $lt: 2.5 } } },
                        { $count: "count" }
                    ]
                }
            },
            {
                $project: {
                    totalFeedback: { $arrayElemAt: ["$stats.totalFeedback", 0] },
                    avgRating: { $arrayElemAt: ["$stats.avgRating", 0] },
                    uniqueDepts: { $arrayElemAt: ["$stats.uniqueDepts", 0] },
                    uniqueSubjects: { $arrayElemAt: ["$stats.uniqueSubjects", 0] },
                    positiveCount: { $ifNull: [{ $arrayElemAt: ["$positive.count", 0] }, 0] },
                    lowRatingCount: { $ifNull: [{ $arrayElemAt: ["$low.count", 0] }, 0] }
                }
            }
        ]);

        const deptCount = await Department.countDocuments({ isActive: true });
        const totalStudents = await User.countDocuments({ role: "student", isActive: true });

        res.json({
            success: true,
            data: {
                totalFeedback: result?.totalFeedback || 0,
                avgRating: result?.avgRating ? Math.round(result.avgRating * 100) / 100 : 0,
                // for backward compatibility
                avgOverallRating: result?.avgRating ? Math.round(result.avgRating * 100) / 100 : 0,
                activeDepartments: result?.uniqueDepts?.length || 0,
                totalDepartments: deptCount,
                totalStudents,
                subjectsRated: result?.uniqueSubjects?.length || 0,
                positiveCount: result?.positiveCount || 0,
                lowRatingCount: result?.lowRatingCount || 0
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/by-faculty ───────────────────────────────────────
exports.getByFaculty = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);

        const data = await Feedback.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectId",
                    foreignField: "_id",
                    as: "subject",
                },
            },
            { $unwind: "$subject" },
            {
                $group: {
                    _id: "$subject.facultyName",
                    avgRating: { $avg: "$overallRating" },
                    avgTeachingQuality: { $avg: "$ratings.teachingQuality" },
                    avgCommunication: { $avg: "$ratings.communication" },
                    avgPunctuality: { $avg: "$ratings.punctuality" },
                    avgSubjectKnowledge: { $avg: "$ratings.subjectKnowledge" },
                    avgDoubtClarification: { $avg: "$ratings.doubtClarification" },
                    totalFeedback: { $sum: 1 },
                    subjects: { $addToSet: "$subject.name" },
                },
            },
            {
                $project: {
                    facultyName: "$_id",
                    _id: 0,
                    avgRating: { $round: ["$avgRating", 2] },
                    avgTeachingQuality: { $round: ["$avgTeachingQuality", 2] },
                    avgCommunication: { $round: ["$avgCommunication", 2] },
                    avgPunctuality: { $round: ["$avgPunctuality", 2] },
                    avgSubjectKnowledge: { $round: ["$avgSubjectKnowledge", 2] },
                    avgDoubtClarification: { $round: ["$avgDoubtClarification", 2] },
                    totalFeedback: 1,
                    subjects: 1,
                },
            },
            { $sort: { avgRating: -1 } },
        ]);

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/by-subject ───────────────────────────────────────
exports.getBySubject = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);

        const data = await Feedback.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectId",
                    foreignField: "_id",
                    as: "subject",
                },
            },
            { $unwind: "$subject" },
            {
                $group: {
                    _id: "$subjectId",
                    subjectName: { $first: "$subject.name" },
                    subjectCode: { $first: "$subject.subjectCode" },
                    facultyName: { $first: "$subject.facultyName" },
                    semester: { $first: "$subject.semester" },
                    avgRating: { $avg: "$overallRating" },
                    totalFeedback: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 1, subjectName: 1, subjectCode: 1, facultyName: 1, semester: 1,
                    avgRating: { $round: ["$avgRating", 2] },
                    totalFeedback: 1,
                },
            },
            { $sort: { avgRating: -1 } },
        ]);

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/distribution ─────────────────────────────────────
exports.getRatingDistribution = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);

        const data = await Feedback.aggregate([
            { $match: match },
            { $group: { _id: { $floor: "$overallRating" }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        data.forEach(d => { if (d._id >= 1 && d._id <= 5) distribution[d._id] = d.count; });

        res.json({ success: true, data: distribution });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/trend ─────────────────────────────────────────────
exports.getSemesterTrend = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);

        const data = await Feedback.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { semester: "$semester", academicYear: "$academicYear" },
                    avgRating: { $avg: "$overallRating" },
                    totalFeedback: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    semester: "$_id.semester",
                    academicYear: "$_id.academicYear",
                    label: { $concat: ["Sem ", { $toString: "$_id.semester" }, " (", { $ifNull: ["$_id.academicYear", "N/A"] }, ")"] },
                    avgRating: { $round: ["$avgRating", 2] },
                    totalFeedback: 1,
                },
            },
            { $sort: { academicYear: 1, semester: 1 } },
        ]);

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/by-department ────────────────────────────────────
// Avg rating + feedback count per department
exports.getByDepartment = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);

        const data = await Feedback.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "dept",
                },
            },
            { $unwind: "$dept" },
            {
                $group: {
                    _id: "$departmentId",
                    deptName: { $first: "$dept.name" },
                    deptCode: { $first: "$dept.code" },
                    cluster: { $first: "$dept.cluster" },
                    avgRating: { $avg: "$overallRating" },
                    avgTeachingQuality: { $avg: "$ratings.teachingQuality" },
                    avgCommunication: { $avg: "$ratings.communication" },
                    avgPunctuality: { $avg: "$ratings.punctuality" },
                    avgSubjectKnowledge: { $avg: "$ratings.subjectKnowledge" },
                    avgDoubtClarification: { $avg: "$ratings.doubtClarification" },
                    totalFeedback: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    deptName: 1, deptCode: 1, cluster: 1,
                    avgRating: { $round: ["$avgRating", 2] },
                    avgTeachingQuality: { $round: ["$avgTeachingQuality", 2] },
                    avgCommunication: { $round: ["$avgCommunication", 2] },
                    avgPunctuality: { $round: ["$avgPunctuality", 2] },
                    avgSubjectKnowledge: { $round: ["$avgSubjectKnowledge", 2] },
                    avgDoubtClarification: { $round: ["$avgDoubtClarification", 2] },
                    totalFeedback: 1,
                },
            },
            { $sort: { avgRating: -1 } },
        ]);

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/by-cluster ───────────────────────────────────────
// Avg rating per cluster (CS Cluster vs Core Cluster)
exports.getByCluster = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);

        const data = await Feedback.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "dept",
                },
            },
            { $unwind: "$dept" },
            {
                $group: {
                    _id: "$dept.cluster",
                    avgRating: { $avg: "$overallRating" },
                    avgTeachingQuality: { $avg: "$ratings.teachingQuality" },
                    avgCommunication: { $avg: "$ratings.communication" },
                    avgPunctuality: { $avg: "$ratings.punctuality" },
                    avgSubjectKnowledge: { $avg: "$ratings.subjectKnowledge" },
                    avgDoubtClarification: { $avg: "$ratings.doubtClarification" },
                    totalFeedback: { $sum: 1 },
                    departments: { $addToSet: "$dept.code" },
                },
            },
            {
                $project: {
                    _id: 0,
                    clusterName: "$_id",
                    avgRating: { $round: ["$avgRating", 2] },
                    avgTeachingQuality: { $round: ["$avgTeachingQuality", 2] },
                    avgCommunication: { $round: ["$avgCommunication", 2] },
                    avgPunctuality: { $round: ["$avgPunctuality", 2] },
                    avgSubjectKnowledge: { $round: ["$avgSubjectKnowledge", 2] },
                    avgDoubtClarification: { $round: ["$avgDoubtClarification", 2] },
                    totalFeedback: 1,
                    departments: 1,
                },
            },
            { $sort: { avgRating: -1 } },
        ]);

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/parameters ───────────────────────────────────────
// Average of each rating parameter overall (for radar chart)
exports.getParameterAverages = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);

        const [result] = await Feedback.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    teachingQuality: { $avg: "$ratings.teachingQuality" },
                    communication: { $avg: "$ratings.communication" },
                    punctuality: { $avg: "$ratings.punctuality" },
                    subjectKnowledge: { $avg: "$ratings.subjectKnowledge" },
                    doubtClarification: { $avg: "$ratings.doubtClarification" },
                    totalFeedback: { $sum: 1 },
                },
            },
        ]);

        if (!result) {
            return res.json({ success: true, data: null });
        }

        res.json({
            success: true,
            data: {
                teachingQuality: Math.round(result.teachingQuality * 100) / 100,
                communication: Math.round(result.communication * 100) / 100,
                punctuality: Math.round(result.punctuality * 100) / 100,
                subjectKnowledge: Math.round(result.subjectKnowledge * 100) / 100,
                doubtClarification: Math.round(result.doubtClarification * 100) / 100,
                totalFeedback: result.totalFeedback,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/semester-heatmap ─────────────────────────────────
// Avg rating per (department × semester) matrix — used for heatmap
exports.getSemesterHeatmap = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);

        const data = await Feedback.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentId",
                    foreignField: "_id",
                    as: "dept",
                },
            },
            { $unwind: "$dept" },
            {
                $group: {
                    _id: { deptCode: "$dept.code", semester: "$semester" },
                    deptName: { $first: "$dept.name" },
                    cluster: { $first: "$dept.cluster" },
                    avgRating: { $avg: "$overallRating" },
                    totalFeedback: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    deptCode: "$_id.deptCode",
                    semester: "$_id.semester",
                    deptName: 1, cluster: 1,
                    avgRating: { $round: ["$avgRating", 2] },
                    totalFeedback: 1,
                },
            },
            { $sort: { deptCode: 1, semester: 1 } },
        ]);

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/low-performers (kept for API compat) ─────────────
exports.getLowPerformers = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);
        const threshold = Number(req.query.threshold) || 2.5;

        const data = await Feedback.aggregate([
            { $match: match },
            {
                $lookup: { from: "subjects", localField: "subjectId", foreignField: "_id", as: "subject" },
            },
            { $unwind: "$subject" },
            {
                $group: {
                    _id: "$subject.facultyName",
                    avgRating: { $avg: "$overallRating" },
                    totalFeedback: { $sum: 1 },
                },
            },
            { $match: { avgRating: { $lt: threshold } } },
            { $project: { _id: 0, facultyName: "$_id", avgRating: { $round: ["$avgRating", 2] }, totalFeedback: 1 } },
            { $sort: { avgRating: 1 } },
        ]);

        res.json({ success: true, threshold, count: data.length, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/faculty-list ─────────────────────────────────────
// All faculty with summary stats — used for left-panel list
exports.getAllFacultySummary = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);

        const data = await Feedback.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectId",
                    foreignField: "_id",
                    as: "subject",
                },
            },
            { $unwind: "$subject" },
            {
                $group: {
                    _id: "$subject.facultyName",
                    department: { $first: "$subject.department" },
                    departmentCode: { $first: { $ifNull: ["$subject.departmentCode", ""] } },
                    avgRating: { $avg: "$overallRating" },
                    avgTeachingQuality: { $avg: "$ratings.teachingQuality" },
                    avgCommunication: { $avg: "$ratings.communication" },
                    avgPunctuality: { $avg: "$ratings.punctuality" },
                    avgSubjectKnowledge: { $avg: "$ratings.subjectKnowledge" },
                    avgDoubtClarification: { $avg: "$ratings.doubtClarification" },
                    totalFeedback: { $sum: 1 },
                    subjectsTaught: { $addToSet: "$subject.name" },
                    email: { $first: "$subject.facultyEmail" },
                },
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "department",
                    foreignField: "_id",
                    as: "dept",
                },
            },
            { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    facultyName: "$_id",
                    email: 1,
                    deptName: { $ifNull: ["$dept.name", "—"] },
                    deptCode: { $ifNull: ["$dept.code", "—"] },
                    cluster: { $ifNull: ["$dept.cluster", "—"] },
                    avgRating: { $round: ["$avgRating", 2] },
                    avgTeachingQuality: { $round: ["$avgTeachingQuality", 2] },
                    avgCommunication: { $round: ["$avgCommunication", 2] },
                    avgPunctuality: { $round: ["$avgPunctuality", 2] },
                    avgSubjectKnowledge: { $round: ["$avgSubjectKnowledge", 2] },
                    avgDoubtClarification: { $round: ["$avgDoubtClarification", 2] },
                    totalFeedback: 1,
                    subjectCount: { $size: "$subjectsTaught" },
                    subjectsTaught: 1,
                },
            },
            { $sort: { avgRating: -1 } },
        ]);

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/analytics/faculty-detail?name=<facultyName> ─────────────────
// Full breakdown for one faculty: subject-wise, semester trend, anonymous comments
exports.getFacultyDetail = async (req, res) => {
    try {
        const facultyName = req.query.name;
        const facultyId = req.query.facultyId || (req.user && req.user.role === 'faculty' ? req.user.id : null);
        const sem = req.query.semester;

        // Also support fetching by logged in faculty's name directly via auth user
        const finalFacultyName = facultyName || req.user.name;

        if (!finalFacultyName && !facultyId) {
            return res.status(400).json({ success: false, message: "Faculty ID or name is required" });
        }

        // Find all subjects taught by this faculty (for full trend)
        const Subject = require("../models/Subject");

        // Prefer filtering by accurate faculty ObjectId, fallback to string name
        let subjectQuery = {};
        if (facultyId) {
            const User = require("../models/User");
            const user = await User.findById(facultyId).lean();
            if (user && user.assignedSubjects && user.assignedSubjects.length > 0) {
                subjectQuery = { _id: { $in: user.assignedSubjects } };
            } else {
                // If no assignedSubjects, try to find subjects that reference this user ID
                subjectQuery = { $or: [{ faculty: facultyId }, { facultyName: finalFacultyName }] };
            }
        } else if (finalFacultyName) {
            subjectQuery = { facultyName: finalFacultyName };
        } else {
             return res.status(400).json({ success: false, message: "Faculty ID or name is required" });
        }

        const allSubjects = await Subject.find(subjectQuery).select("_id name subjectCode semester").lean();
        if (!allSubjects.length) {
            // Return empty structure instead of null so charts don't break
            return res.json({ 
                success: true, 
                data: {
                    facultyName: finalFacultyName || "Faculty",
                    subjectsTaught: [],
                    availableSemesters: [],
                    overall: { avgRating: 0, totalFeedback: 0 },
                    bySubject: [],
                    trend: [],
                    anonymousComments: []
                } 
            });
        }

        const allSubjectIds = allSubjects.map(s => s._id);

        let filteredSubjects = allSubjects;
        if (sem && sem !== 'All') {
            filteredSubjects = allSubjects.filter(s => s.semester === Number(sem));
        }
        const filteredSubjectIds = filteredSubjects.map(s => s._id);

        // ── Aggregation: per-subject avg (Filtered) ────────────────────────────────────
        const bySubject = await Feedback.aggregate([
            { $match: { subjectId: { $in: filteredSubjectIds } } },
            {
                $group: {
                    _id: "$subjectId",
                    avgRating: { $avg: "$overallRating" },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    avgRating: { $round: ["$avgRating", 2] },
                },
            },
        ]);

        // Join subject meta (Ensure even subjects with 0 feedback are shown)
        const subjectMap = {};
        allSubjects.forEach(s => (subjectMap[s._id.toString()] = s));
        
        const feedbackStatsMap = {};
        bySubject.forEach(row => {
            feedbackStatsMap[row._id.toString()] = row;
        });

        const subjectStats = filteredSubjects.map(s => {
            const stats = feedbackStatsMap[s._id.toString()] || { count: 0, avgRating: 0 };
            return {
                id: s._id,
                name: s.name,
                subjectCode: s.subjectCode,
                semester: s.semester,
                avgRating: stats.avgRating,
                count: stats.count
            };
        }).sort((a, b) => a.semester - b.semester);

        // ── Aggregation: semester trend (Unfiltered) ─────────────────────────────────────
        const trend = await Feedback.aggregate([
            { $match: { subjectId: { $in: allSubjectIds } } },
            {
                $group: {
                    _id: "$semester",
                    avgRating: { $avg: "$overallRating" },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
            { $project: { _id: 0, semester: "$_id", label: { $concat: ["Sem ", { $toString: "$_id" }] }, avgRating: { $round: ["$avgRating", 2] }, count: 1 } },
        ]);

        // ── Anonymous comments (Filtered) ──────
        const commentDocs = await Feedback.find(
            {
                subjectId: { $in: filteredSubjectIds },
                comments: { $exists: true, $nin: ["", null] },
            },
            { comments: 1, overallRating: 1, semester: 1, subjectId: 1, _id: 0 } // NO studentId
        )
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        // Join subject name to comment (fully anonymous — no student info)
        const comments = commentDocs.map(doc => ({
            comment: doc.comments,
            rating: doc.overallRating,
            semester: doc.semester,
            subject: subjectMap[doc.subjectId?.toString()]?.name || "—",
        }));

        // ── Overall averages (Filtered) ────────────────────────────────────────────────
        const [overallAgg] = await Feedback.aggregate([
            { $match: { subjectId: { $in: filteredSubjectIds } } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: "$overallRating" },
                    totalFeedback: { $sum: 1 },
                },
            },
        ]);

        res.json({
            success: true,
            data: {
                facultyName: finalFacultyName,
                subjectsTaught: allSubjects,
                availableSemesters: [...new Set(allSubjects.map(s => s.semester))].sort((a, b) => a - b),
                overall: {
                    avgRating: overallAgg ? Math.round(overallAgg.avgRating * 100) / 100 : 0,
                    totalFeedback: overallAgg ? overallAgg.totalFeedback : 0,
                },
                bySubject: subjectStats,
                trend,
                anonymousComments: comments,
            },
        });
    } catch (err) {
        console.error("[getFacultyDetail Error]", err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
// ─── GET /api/analytics/report ───────────────────────────────────────────
// Generate a professional PDF report and stream it as a download.
// Optional query params:
//   department  — MongoDB ObjectId to filter
//   barChart    — base64 PNG of bar chart captured from frontend
//   lineChart   — base64 PNG of line chart captured from frontend
exports.generateReport = async (req, res) => {
    try {
        const match = buildMatchFilter(req.query);
        const deptFilter = req.query.department ? { departmentId: new mongoose.Types.ObjectId(req.query.department) } : {};
        const generatedAt = new Date();

        // ── Fetch all analytics data in parallel ─────────────────────────
        const [summaryArr, deptData, subjectData, facultyData] = await Promise.all([
            // Summary
            Feedback.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: null,
                        totalFeedback: { $sum: 1 },
                        avgOverallRating: { $avg: "$overallRating" },
                        uniqueDepts: { $addToSet: "$departmentId" },
                        uniqueSubjects: { $addToSet: "$subjectId" },
                    },
                },
            ]),
            // Department-wise
            Feedback.aggregate([
                { $match: match },
                { $lookup: { from: "departments", localField: "departmentId", foreignField: "_id", as: "dept" } },
                { $unwind: "$dept" },
                {
                    $group: {
                        _id: "$departmentId",
                        deptName: { $first: "$dept.name" },
                        deptCode: { $first: "$dept.code" },
                        avgRating: { $avg: "$overallRating" },
                        totalFeedback: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, deptName: 1, deptCode: 1, avgRating: { $round: ["$avgRating", 2] }, totalFeedback: 1 } },
                { $sort: { avgRating: -1 } },
            ]),
            // Subject-wise
            Feedback.aggregate([
                { $match: match },
                { $lookup: { from: "subjects", localField: "subjectId", foreignField: "_id", as: "subject" } },
                { $unwind: "$subject" },
                {
                    $group: {
                        _id: "$subjectId",
                        subjectName: { $first: "$subject.name" },
                        subjectCode: { $first: "$subject.subjectCode" },
                        facultyName: { $first: "$subject.facultyName" },
                        avgRating: { $avg: "$overallRating" },
                        totalFeedback: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, subjectName: 1, subjectCode: 1, facultyName: 1, avgRating: { $round: ["$avgRating", 2] }, totalFeedback: 1 } },
                { $sort: { avgRating: -1 } },
            ]),
            // Faculty
            Feedback.aggregate([
                { $match: match },
                { $lookup: { from: "subjects", localField: "subjectId", foreignField: "_id", as: "subject" } },
                { $unwind: "$subject" },
                {
                    $group: {
                        _id: "$subject.facultyName",
                        avgRating: { $avg: "$overallRating" },
                        totalFeedback: { $sum: 1 },
                    },
                },
                { $project: { _id: 0, facultyName: "$_id", avgRating: { $round: ["$avgRating", 2] }, totalFeedback: 1 } },
                { $sort: { avgRating: -1 } },
            ]),
        ]);

        const summary = summaryArr[0] || { totalFeedback: 0, avgOverallRating: 0 };
        const avgRating = summary.avgOverallRating ? Math.round(summary.avgOverallRating * 100) / 100 : 0;
        const highestSubject = subjectData[0] || null;
        const lowestSubject = subjectData[subjectData.length - 1] || null;

        // ── Palette ────────────────────────────────────────────────────────
        const C = {
            cobalt: [0, 71, 171],
            teal: [8, 143, 143],
            steel: [111, 143, 175],
            lightBlue: [167, 199, 231],
            text: [15, 23, 42],
            text2: [71, 85, 105],
            text3: [148, 163, 184],
            border: [226, 232, 240],
            white: [255, 255, 255],
            bg: [245, 247, 250],
        };

        const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: "CollegePulse Analytics Report", Author: "CollegePulse Admin" } });

        // Set response headers
        const filename = `CollegePulse_Report_${generatedAt.toISOString().slice(0, 10)}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        doc.pipe(res);

        const PAGE_W = doc.page.width;
        const PAGE_H = doc.page.height;
        const MARGIN = 48;
        const CONTENT_W = PAGE_W - MARGIN * 2;

        // ── Helper fns ─────────────────────────────────────────────────────
        const rgb = (arr) => ({ r: arr[0] / 255, g: arr[1] / 255, b: arr[2] / 255 });
        const fillColor = (arr) => doc.fillColor([arr[0], arr[1], arr[2]]);
        const strokeColor = (arr) => doc.strokeColor([arr[0], arr[1], arr[2]]);

        // ── HEADER BANNER ──────────────────────────────────────────────────
        doc.rect(0, 0, PAGE_W, 110).fill([C.cobalt[0], C.cobalt[1], C.cobalt[2]]);

        // Mini logo icon (simplified bars)
        const iconX = MARGIN, iconY = 28, iconS = 52;
        doc.roundedRect(iconX, iconY, iconS, iconS, 8).fill([C.teal[0], C.teal[1], C.teal[2]]);
        // bars inside icon
        doc.fillColor("white");
        doc.rect(iconX + 8, iconY + 28, 8, 16).fill("white");
        doc.rect(iconX + 20, iconY + 22, 8, 22).fill("white");
        doc.rect(iconX + 32, iconY + 26, 10, 18).fill("white");
        // pulse line
        doc.moveTo(iconX + 4, iconY + 24)
            .lineTo(iconX + 10, iconY + 24)
            .lineTo(iconX + 13, iconY + 18)
            .lineTo(iconX + 17, iconY + 30)
            .lineTo(iconX + 20, iconY + 22)
            .lineTo(iconX + 24, iconY + 24)
            .lineTo(iconX + 48, iconY + 24)
            .strokeColor([C.lightBlue[0], C.lightBlue[1], C.lightBlue[2]])
            .lineWidth(2)
            .stroke();

        // Institution & title
        doc.fillColor("white")
            .font("Helvetica-Bold")
            .fontSize(22)
            .text("CollegePulse", iconX + iconS + 16, iconY + 4);
        doc.fillColor([C.lightBlue[0], C.lightBlue[1], C.lightBlue[2]])
            .font("Helvetica")
            .fontSize(11)
            .text("Faculty Feedback Analytics Report", iconX + iconS + 16, iconY + 30);
        doc.fillColor([C.lightBlue[0], C.lightBlue[1], C.lightBlue[2]])
            .fontSize(9.5)
            .text(`Generated: ${generatedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}  •  ${generatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`, iconX + iconS + 16, iconY + 48);

        // ── META BAR (filters applied) ─────────────────────────────────────
        doc.rect(0, 110, PAGE_W, 32)
            .fill([C.bg[0], C.bg[1], C.bg[2]]);
        doc.fillColor([C.text2[0], C.text2[1], C.text2[2]])
            .font("Helvetica")
            .fontSize(9)
            .text(`Department: ${req.query.department ? "Filtered" : "All"}     Scope: Full Institution     Report Type: Analytics Summary`, MARGIN, 121);

        let y = 158;

        // ── Helper: section heading ────────────────────────────────────────
        const sectionHead = (title, color = C.cobalt) => {
            doc.rect(MARGIN, y, CONTENT_W, 26).fill([color[0], color[1], color[2]]);
            doc.fillColor("white").font("Helvetica-Bold").fontSize(10)
                .text(title.toUpperCase(), MARGIN + 12, y + 8);
            y += 34;
        };

        // Helper: horizontal divider
        const divider = () => {
            doc.moveTo(MARGIN, y).lineTo(MARGIN + CONTENT_W, y)
                .strokeColor([C.border[0], C.border[1], C.border[2]])
                .lineWidth(0.5).stroke();
            y += 10;
        };

        // Helper: check page space
        const ensureSpace = (needed = 60) => {
            if (y + needed > PAGE_H - 40) {
                doc.addPage({ margin: 0 });
                y = MARGIN;
            }
        };

        // ── SECTION 1: KEY STATISTICS ─────────────────────────────────────
        sectionHead("Key Statistics");

        const kpis = [
            { label: "Total Responses", value: String(summary.totalFeedback) },
            { label: "Overall Avg Rating", value: `${avgRating} / 5.0` },
            { label: "Departments", value: String(deptData.length) },
            { label: "Subjects Rated", value: String(subjectData.length) },
        ];

        const kpiW = CONTENT_W / 4;
        kpis.forEach((k, i) => {
            const kx = MARGIN + i * kpiW;
            doc.rect(kx, y, kpiW - 8, 56)
                .fill([C.bg[0], C.bg[1], C.bg[2]]);
            doc.fillColor([C.cobalt[0], C.cobalt[1], C.cobalt[2]])
                .font("Helvetica-Bold").fontSize(18)
                .text(k.value, kx + 10, y + 10, { width: kpiW - 20, align: "center" });
            doc.fillColor([C.text2[0], C.text2[1], C.text2[2]])
                .font("Helvetica").fontSize(8)
                .text(k.label, kx + 10, y + 36, { width: kpiW - 20, align: "center" });
        });
        y += 68;

        if (highestSubject || lowestSubject) {
            const hlW = (CONTENT_W - 12) / 2;
            if (highestSubject) {
                doc.rect(MARGIN, y, hlW, 40).fill([224, 245, 245]);
                doc.fillColor([C.teal[0], C.teal[1], C.teal[2]]).font("Helvetica-Bold").fontSize(9)
                    .text("Highest Rated Subject", MARGIN + 10, y + 6);
                doc.font("Helvetica").fontSize(8.5).fillColor([C.text[0], C.text[1], C.text[2]])
                    .text(`${highestSubject.subjectName} (${highestSubject.subjectCode})  —  ${highestSubject.avgRating} / 5`, MARGIN + 10, y + 20, { width: hlW - 20 });
            }
            if (lowestSubject && lowestSubject !== highestSubject) {
                doc.rect(MARGIN + hlW + 12, y, hlW, 40).fill([254, 226, 226]);
                doc.fillColor([180, 30, 30]).font("Helvetica-Bold").fontSize(9)
                    .text("Lowest Rated Subject", MARGIN + hlW + 22, y + 6);
                doc.font("Helvetica").fontSize(8.5).fillColor([C.text[0], C.text[1], C.text[2]])
                    .text(`${lowestSubject.subjectName} (${lowestSubject.subjectCode})  —  ${lowestSubject.avgRating} / 5`, MARGIN + hlW + 22, y + 20, { width: hlW - 20 });
            }
            y += 52;
        }

        divider();

        // ── SECTION 2: DEPARTMENT-WISE SUMMARY ───────────────────────────
        ensureSpace(180);
        sectionHead("Department-wise Summary");

        const COL_D = [MARGIN, MARGIN + 240, MARGIN + 340, MARGIN + 430];
        const HEADS_D = ["Department", "Avg Rating", "Feedback Count", "Performance"];
        // Table header
        doc.rect(MARGIN, y, CONTENT_W, 18).fill([C.lightBlue[0], C.lightBlue[1], C.lightBlue[2]]);
        HEADS_D.forEach((h, i) => {
            doc.fillColor([C.cobalt[0], C.cobalt[1], C.cobalt[2]])
                .font("Helvetica-Bold").fontSize(8)
                .text(h, COL_D[i] + 4, y + 5);
        });
        y += 18;

        deptData.forEach((d, idx) => {
            ensureSpace(20);
            if (idx % 2 === 0) doc.rect(MARGIN, y, CONTENT_W, 18).fill([C.bg[0], C.bg[1], C.bg[2]]);
            const perf = d.avgRating >= 4.5 ? "Excellent" : d.avgRating >= 3.5 ? "Good" : d.avgRating >= 2.5 ? "Average" : "Attention";
            const vals = [`${d.deptName} (${d.deptCode})`, String(d.avgRating), String(d.totalFeedback), perf];
            vals.forEach((v, i) => {
                doc.fillColor([C.text[0], C.text[1], C.text[2]]).font("Helvetica").fontSize(8.5)
                    .text(v, COL_D[i] + 4, y + 5, { width: 120 });
            });
            y += 18;
        });
        y += 10;
        divider();

        // ── SECTION 3: SUBJECT-WISE SUMMARY (top 12) ─────────────────────
        ensureSpace(180);
        sectionHead("Subject-wise Summary (Top 12)", C.teal);

        const COL_S = [MARGIN, MARGIN + 70, MARGIN + 250, MARGIN + 370, MARGIN + 440];
        const HEADS_S = ["Code", "Subject Name", "Faculty", "Avg Rating", "Feedback"];
        doc.rect(MARGIN, y, CONTENT_W, 18).fill([224, 245, 245]);
        HEADS_S.forEach((h, i) => {
            doc.fillColor([C.teal[0], C.teal[1], C.teal[2]])
                .font("Helvetica-Bold").fontSize(8)
                .text(h, COL_S[i] + 4, y + 5);
        });
        y += 18;

        subjectData.slice(0, 12).forEach((s, idx) => {
            ensureSpace(20);
            if (idx % 2 === 0) doc.rect(MARGIN, y, CONTENT_W, 18).fill([C.bg[0], C.bg[1], C.bg[2]]);
            const vals = [s.subjectCode || "—", s.subjectName || "—", s.facultyName || "—", String(s.avgRating), String(s.totalFeedback)];
            vals.forEach((v, i) => {
                const w = [60, 175, 115, 65, 60][i];
                doc.fillColor([C.text[0], C.text[1], C.text[2]]).font("Helvetica").fontSize(8)
                    .text(v, COL_S[i] + 4, y + 5, { width: w, ellipsis: true });
            });
            y += 18;
        });
        y += 10;
        divider();

        // ── SECTION 4: CHARTS (embedded from frontend) ────────────────────
        const barChartB64 = req.query.barChart;
        const lineChartB64 = req.query.lineChart;

        if (barChartB64 || lineChartB64) {
            ensureSpace(220);
            sectionHead("Analytics Charts");

            try {
                const halfW = (CONTENT_W - 12) / 2;
                if (barChartB64) {
                    const barBuf = Buffer.from(barChartB64.replace(/^data:image\/png;base64,/, ""), "base64");
                    doc.image(barBuf, MARGIN, y, { width: halfW, height: 180 });
                    doc.fillColor([C.text2[0], C.text2[1], C.text2[2]]).font("Helvetica").fontSize(8)
                        .text("Faculty Rating Comparison", MARGIN, y + 183, { width: halfW, align: "center" });
                }
                if (lineChartB64) {
                    const lineBuf = Buffer.from(lineChartB64.replace(/^data:image\/png;base64,/, ""), "base64");
                    doc.image(lineBuf, MARGIN + halfW + 12, y, { width: halfW, height: 180 });
                    doc.fillColor([C.text2[0], C.text2[1], C.text2[2]]).font("Helvetica").fontSize(8)
                        .text("Semester Rating Trend", MARGIN + halfW + 12, y + 183, { width: halfW, align: "center" });
                }
                y += 200;
            } catch (imgErr) {
                console.warn("Chart image embed failed:", imgErr.message);
            }
        }

        // ── FOOTER on last page ────────────────────────────────────────────
        const footerY = PAGE_H - 32;
        doc.rect(0, footerY, PAGE_W, 32).fill([C.cobalt[0], C.cobalt[1], C.cobalt[2]]);
        doc.fillColor([C.lightBlue[0], C.lightBlue[1], C.lightBlue[2]])
            .font("Helvetica").fontSize(8.5)
            .text("CollegePulse  •  Confidential — For Administrative Use Only  •  All data is aggregated and anonymous.", MARGIN, footerY + 11, { align: "center", width: CONTENT_W });

        doc.end();
    } catch (err) {
        console.error("generateReport error:", err);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: "PDF generation failed", error: err.message });
        }
    }
};

// ─── GET /api/analytics/hod-stats ─────────────────────────────────────────
exports.getHodAnalytics = async (req, res) => {
    try {
        const User = require("../models/User");
        const currentUser = await User.findById(req.user.userId).lean();
        
        if (!currentUser || !currentUser.department) {
            return res.status(400).json({ success: false, message: "HOD must be assigned to a department" });
        }

        const deptObjectId = new mongoose.Types.ObjectId(currentUser.department);

        // 1. Trend: Semester-wise feedback trend
        const trend = await Feedback.aggregate([
            { $match: { departmentId: deptObjectId } },
            {
                $group: {
                    _id: "$semester",
                    avgRating: { $avg: "$overallRating" },
                    total: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    semester: "$_id",
                    avgRating: { $round: ["$avgRating", 2] },
                    total: 1,
                    _id: 0
                }
            }
        ]);

        // 2. Top performing faculty
        const topFaculty = await Feedback.aggregate([
            { $match: { departmentId: deptObjectId } },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectId",
                    foreignField: "_id",
                    as: "subject"
                }
            },
            { $unwind: "$subject" },
            {
                $group: {
                    _id: "$subject.facultyName",
                    avgRating: { $avg: "$overallRating" },
                    totalFeedback: { $sum: 1 }
                }
            },
            { $sort: { avgRating: -1 } },
            { $limit: 10 }
        ]);

        // 3. Highest rated subjects
        const highestRatedSubjects = await Feedback.aggregate([
            { $match: { departmentId: deptObjectId } },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectId",
                    foreignField: "_id",
                    as: "subject"
                }
            },
            { $unwind: "$subject" },
            {
                $group: {
                    _id: "$subjectId",
                    name: { $first: "$subject.name" },
                    code: { $first: "$subject.subjectCode" },
                    avgRating: { $avg: "$overallRating" }
                }
            },
            { $sort: { avgRating: -1 } },
            { $limit: 10 }
        ]);

        // 4. Lowest rated subjects
        const lowestRatedSubjects = await Feedback.aggregate([
            { $match: { departmentId: deptObjectId } },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectId",
                    foreignField: "_id",
                    as: "subject"
                }
            },
            { $unwind: "$subject" },
            {
                $group: {
                    _id: "$subjectId",
                    name: { $first: "$subject.name" },
                    code: { $first: "$subject.subjectCode" },
                    avgRating: { $avg: "$overallRating" }
                }
            },
            { $sort: { avgRating: 1 } },
            { $limit: 10 }
        ]);

        // 5. Yearly Trend: Academic Year-wise feedback trend
        const yearlyTrend = await Feedback.aggregate([
            { $match: { departmentId: deptObjectId } },
            {
                $group: {
                    _id: "$academicYear",
                    avgRating: { $avg: "$overallRating" },
                    total: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    year: "$_id",
                    avgRating: { $round: ["$avgRating", 2] },
                    total: 1,
                    _id: 0
                }
            }
        ]);

        // 6. Subject Comparison: Top 3 subjects specifically for comparison chart
        const subjectComparison = await Feedback.aggregate([
            { $match: { departmentId: deptObjectId } },
            {
                $lookup: {
                    from: "subjects",
                    localField: "subjectId",
                    foreignField: "_id",
                    as: "subject"
                }
            },
            { $unwind: "$subject" },
            {
                $group: {
                    _id: "$subjectId",
                    name: { $first: "$subject.name" },
                    avgRating: { $avg: "$overallRating" }
                }
            },
            { $sort: { avgRating: -1 } },
            { $limit: 3 },
            {
                $project: {
                    name: 1,
                    avgRating: { $round: ["$avgRating", 2] },
                    _id: 0
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                trend,
                yearlyTrend,
                topFaculty: topFaculty.slice(0, 5), // Only top 5 as requested
                highestRatedSubjects,
                lowestRatedSubjects,
                subjectComparison
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
