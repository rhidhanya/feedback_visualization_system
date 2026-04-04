require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Department = require("../models/Department");

const hods = [
    { name: "HOD CSE", email: "hod.cse@bitsathy.in", code: "CSE", hodId: "CSH01" },
    { name: "HOD IT", email: "hod.it@bitsathy.in", code: "IT", hodId: "ITH01" },
    { name: "HOD CSBS", email: "hod.csbs@bitsathy.in", code: "CSBS", hodId: "CBH01" },
    { name: "HOD MECH", email: "hod.mech@bitsathy.in", code: "MECH", hodId: "MEH01" },
    { name: "HOD ECE", email: "hod.ece@bitsathy.in", code: "ECE", hodId: "ECH01" },
    { name: "HOD EEE", email: "hod.eee@bitsathy.in", code: "EEE", hodId: "EEH01" },
    { name: "HOD BIOTECH", email: "hod.biotech@bitsathy.in", code: "BIOTECH", hodId: "BTH01" },
    { name: "HOD AGRI", email: "hod.agri@bitsathy.in", code: "AGRI", hodId: "AGH01" },
];

async function seedHods() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for HOD re-seeding...");

        for (const data of hods) {
            const dept = await Department.findOne({ code: data.code });
            if (!dept) {
                console.log(`Department ${data.code} not found, skipping.`);
                continue;
            }

            // Remove existing HOD for this department to avoid conflicts
            await User.deleteMany({ role: "hod", department: dept._id });
            // Also ensure email is unique
            await User.deleteMany({ email: data.email.toLowerCase() });

            await User.create({
                name: data.name,
                email: data.email.toLowerCase(),
                password: "password123",
                role: "hod",
                department: dept._id,
                hodId: data.hodId,
                isActive: true
            });

            await Department.findByIdAndUpdate(dept._id, { hodName: data.name });
            console.log(`✅ HOD for ${data.code} seeded successfully.`);
        }

        console.log("HOD re-seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Error seeding HODs:", err);
        process.exit(1);
    }
}

seedHods();
