const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
    {
        isFeedbackOpen: {
            type: Boolean,
            default: false,
        },
        feedbackStartDate: {
            type: Date,
            default: null,
        },
        feedbackDeadline: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
