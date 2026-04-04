require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const testLogin = async () => {
    try {
        await connectDB();
        const email = "admin@bitsathy.in";
        const password = "password123";

        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            console.log("❌ Admin user not found!");
            process.exit(1);
        }

        const isMatch = await user.comparePassword(password);
        console.log(`🔍 Testing login for ${email} with password "${password}"`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Is active: ${user.isActive}`);
        console.log(`   Password match: ${isMatch}`);

        if (!isMatch) {
            console.log("❌ Password comparison failed!");
            // Check if it matches 'password' or 'admin123'
            const isMatchOld = await user.comparePassword("admin123");
            console.log(`   Matches 'admin123': ${isMatchOld}`);
        } else {
            console.log("✅ Password comparison successful!");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("❌ Error:", err.message);
    }
};

testLogin();
