
const mongoose = require("mongoose");
require("dotenv").config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require("../models/User");
    const Subject = require("../models/Subject");

    const ctDeptId = "69bbb110d9272ca0ee15effc";

    const facultyList = [
      { name: "Prof. Deepika Srinivas", email: "deepika.srinivas@bitsathy.in" },
      { name: "Prof. Rajan Selvam", email: "rajan.selvam@bitsathy.in" },
      { name: "Prof. Vimala Devi", email: "vimala.devi@bitsathy.in" },
      { name: "Prof. Anjali Mehta", email: "anjali.mehta@bitsathy.in" },
      { name: "Prof. Sangeetha Mohan", email: "sangeetha.mohan@bitsathy.in" },
      { name: "Prof. Vijay Kumar", email: "vijay.kumar@bitsathy.in" }
    ];

    const facultyDocs = [];

    for (const f of facultyList) {
      let user = await User.findOne({ email: f.email });
      if (!user) {
        user = await User.create({
          name: f.name,
          email: f.email,
          password: "password123", // Default password
          role: "faculty",
          department: ctDeptId,
          isActive: true
        });
        console.log(`Created faculty: ${f.name}`);
      } else {
        console.log(`Faculty already exists: ${f.name}`);
        user.name = f.name;
        user.department = ctDeptId;
        await user.save();
      }
      facultyDocs.push(user);
    }

    const subjects = await Subject.find({ department: ctDeptId }).sort({ semester: 1 });
    console.log(`Total subjects found for CT: ${subjects.length}`);

    // Assign subjects to faculty roughly evenly by semester
    for (const sub of subjects) {
      let facultyIndex = 0;
      if (sub.semester <= 2) facultyIndex = 0; // Deepika
      else if (sub.semester <= 4) facultyIndex = 1; // Rajan
      else if (sub.semester <= 5) facultyIndex = 2; // Vimala
      else if (sub.semester <= 6) facultyIndex = 3; // Anjali
      else if (sub.semester <= 7) facultyIndex = 4; // Sangeetha
      else facultyIndex = 5; // Vijay (Sem 8 and others)

      const assignedFaculty = facultyDocs[facultyIndex];
      
      sub.faculty = assignedFaculty._id;
      sub.facultyName = assignedFaculty.name;
      await sub.save();

      // Ensure user has this subject in assignedSubjects if not already
      if (!assignedFaculty.assignedSubjects.includes(sub._id)) {
        assignedFaculty.assignedSubjects.push(sub._id);
      }
    }

    // Save all faculty with updated subjects
    for (const f of facultyDocs) {
      await f.save();
    }

    console.log("Faculty assignment completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error during script execution:", err);
    process.exit(1);
  }
}

run();
