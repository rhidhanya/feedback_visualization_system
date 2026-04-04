require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const updatePasswords = async () => {
    try {
        await connectDB();
        console.log("⚙️  Connected to DB. Updating all passwords to 'password123'...");

        const users = await User.find({});
        console.log(`🔍 Found ${users.length} users.`);

        let count = 0;
        for (const user of users) {
            user.password = "password123";
            // The pre-save hook in User.js will handle the hashing
            await user.save();
            count++;
            if (count % 50 === 0) console.log(`   Processed ${count}/${users.length}...`);
        }

        console.log(`\n✅ Successfully updated passwords for ${count} users.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌ Update failed:", err.message);
        process.exit(1);
    }
};

updatePasswords();
