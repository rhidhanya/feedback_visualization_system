const Department = require("../models/Department");

// ─── GET /api/departments ──────────────────────────────────────────────────
exports.getDepartments = async (req, res) => {
    try {
        const filter = req.query.active === "true" ? { isActive: true } : {};
        const departments = await Department.find(filter).sort({ name: 1 });
        res.json({ success: true, count: departments.length, data: departments });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── GET /api/departments/:id ──────────────────────────────────────────────
exports.getDepartmentById = async (req, res) => {
    try {
        const dept = await Department.findById(req.params.id);
        if (!dept) return res.status(404).json({ success: false, message: "Department not found" });
        res.json({ success: true, data: dept });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── POST /api/departments (Admin only) ────────────────────────────────────
exports.createDepartment = async (req, res) => {
    try {
        const { name, code, hodName, description } = req.body;
        if (!name || !code) {
            return res.status(400).json({ success: false, message: "Name and code are required" });
        }

        const dept = await Department.create({ name, code, hodName, description });
        res.status(201).json({ success: true, message: "Department created", data: dept });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ success: false, message: "Department name or code already exists" });
        }
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};

// ─── PUT /api/departments/:id (Admin only) ────────────────────────────────
exports.updateDepartment = async (req, res) => {
    try {
        const { name, code, hodName, description, isActive } = req.body;
        const dept = await Department.findByIdAndUpdate(
            req.params.id,
            { name, code, hodName, description, isActive },
            { new: true, runValidators: true }
        );
        if (!dept) return res.status(404).json({ success: false, message: "Department not found" });
        res.json({ success: true, message: "Department updated", data: dept });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
};
