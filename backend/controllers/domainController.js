const Domain = require("../models/Domain");

// Default domain definitions with questions
const DEFAULT_DOMAINS = [
    {
        name: "Transport", slug: "transport", icon: "FiTruck",
        description: "Campus transport and shuttle services",
        questions: [
            { text: "How would you rate the punctuality of transport services?", type: "rating", required: true },
            { text: "How clean and maintained are the vehicles?", type: "rating", required: true },
            { text: "How would you rate the driver's behavior and safety?", type: "rating", required: true },
            { text: "How satisfied are you with the route coverage?", type: "rating", required: true },
            { text: "Any suggestions for improvement?", type: "text", required: false },
        ],
        residenceRestriction: "dayscholar",
    },
    {
        name: "Mess", slug: "mess", icon: "FiCoffee",
        description: "Cafeteria and mess food services",
        questions: [
            { text: "How would you rate the quality of food?", type: "rating", required: true },
            { text: "How would you rate the hygiene and cleanliness?", type: "rating", required: true },
            { text: "How satisfied are you with the menu variety?", type: "rating", required: true },
            { text: "How would you rate the service speed?", type: "rating", required: true },
            { text: "Any suggestions for improvement?", type: "text", required: false },
        ],
        residenceRestriction: "none",
    },
    {
        name: "Hostel", slug: "hostel", icon: "FiHome",
        description: "Hostel facilities and accommodation",
        questions: [
            { text: "How would you rate the room cleanliness?", type: "rating", required: true },
            { text: "How satisfied are you with water and electricity supply?", type: "rating", required: true },
            { text: "How would you rate the WiFi and internet connectivity?", type: "rating", required: true },
            { text: "How safe do you feel in the hostel premises?", type: "rating", required: true },
            { text: "Any suggestions for improvement?", type: "text", required: false },
        ],
        residenceRestriction: "hosteller",
    },
    {
        name: "Sanitation & Hygiene", slug: "sanitation", icon: "FiDroplet",
        description: "Campus cleanliness and sanitation",
        questions: [
            { text: "How clean are the washrooms?", type: "rating", required: true },
            { text: "How would you rate the campus cleanliness?", type: "rating", required: true },
            { text: "How regular is the garbage collection?", type: "rating", required: true },
            { text: "How satisfied are you with pest control measures?", type: "rating", required: true },
            { text: "Any suggestions for improvement?", type: "text", required: false },
        ],
        residenceRestriction: "none",
    },
];

// Seed domains on startup
exports.seedDomains = async () => {
    try {
        for (const dom of DEFAULT_DOMAINS) {
            await Domain.findOneAndUpdate(
                { slug: dom.slug },
                { $set: dom },
                { upsert: true, new: true }
            );
        }
        console.log("✅ Default domains seeded/updated (transport, mess, hostel, sanitation)");
    } catch (err) {
        console.error("Seed domains error:", err.message);
    }
};

// GET /api/domains
exports.getDomains = async (req, res) => {
    try {
        const filter = req.query.active === "true" ? { isActive: true } : {};
        const domains = await Domain.find(filter).sort({ name: 1 });
        res.json({ success: true, count: domains.length, data: domains });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// GET /api/domains/:slug
exports.getDomainBySlug = async (req, res) => {
    try {
        const domain = await Domain.findOne({ slug: req.params.slug });
        if (!domain) return res.status(404).json({ success: false, message: "Domain not found" });
        res.json({ success: true, data: domain });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// PUT /api/domains/:slug/questions (Admin only)
exports.updateQuestions = async (req, res) => {
    try {
        const { questions } = req.body;
        if (!questions || !Array.isArray(questions)) {
            return res.status(400).json({ success: false, message: "questions array is required" });
        }
        const domain = await Domain.findOneAndUpdate(
            { slug: req.params.slug },
            { $set: { questions } },
            { new: true, runValidators: true }
        );
        if (!domain) return res.status(404).json({ success: false, message: "Domain not found" });
        res.json({ success: true, message: "Questions updated", data: domain });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
