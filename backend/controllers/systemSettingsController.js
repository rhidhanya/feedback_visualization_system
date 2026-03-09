const SystemSettings = require("../models/SystemSettings");

// Get settings
exports.getSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({});
        }
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// Update settings (Admin only)
exports.updateSettings = async (req, res) => {
    try {
        const { isFeedbackOpen, feedbackStartDate, feedbackDeadline } = req.body;
        let settings = await SystemSettings.findOne();

        if (!settings) {
            settings = new SystemSettings();
        }

        if (isFeedbackOpen !== undefined) settings.isFeedbackOpen = isFeedbackOpen;
        if (feedbackStartDate !== undefined) settings.feedbackStartDate = feedbackStartDate || null;
        if (feedbackDeadline !== undefined) settings.feedbackDeadline = feedbackDeadline || null;

        await settings.save();

        res.json({ success: true, message: "Settings updated", data: settings });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
