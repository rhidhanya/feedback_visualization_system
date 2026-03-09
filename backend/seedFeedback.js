require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

// Models
const User = require("./models/User");
const Subject = require("./models/Subject");
const Domain = require("./models/Domain");
const Feedback = require("./models/Feedback");
const DomainFeedback = require("./models/DomainFeedback");

const suggestions = [
    "Improve WiFi in hostel",
    "Mess food quality can improve",
    "Transport timings need adjustment",
    "Faculty explains concepts clearly",
    "Labs need better equipment",
    "Great semester overall",
    "More practical sessions would be helpful",
    "Library needs more copies of reference books",
    "Please add more buses during peak hours",
    "The hostel rooms are well maintained",
    "Could we have more variety in the mess menu?",
    "Classrooms need better ventilation",
    "The sanitation in academic blocks is excellent"
];

// Helper to generate a random rating between min and max (inclusive)
// Biased towards higher ratings to be realistic
const getRandomRating = (min, max) => {
    const chance = Math.random();
    if (chance > 0.8) return max; // 20% max
    if (chance > 0.4) return max - 1; // 40% max-1
    if (chance > 0.1) return Math.max(min, max - 2); // 30% max-2
    return Math.max(min, Math.round(Math.random() * (max - min) + min)); // 10% random
};

const seedFeedback = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB for Seeding...");

        const students = await User.find({ role: "student" }).select("_id department semester residenceType");
        const activeSubjects = await Subject.find({ isActive: true });
        const activeDomains = await Domain.find({ isActive: true });

        console.log(`Found ${students.length} students to process.`);

        // --- Fetch Existing Records for O(1) Check ---
        console.log("Fetching existing feedbacks to avoid duplicate inserts...");
        const existingAcademic = await Feedback.find({}).select("studentId subjectId semester").lean();
        const existingDomain = await DomainFeedback.find({}).select("studentId domainSlug semester").lean();

        const academicSet = new Set(existingAcademic.map(f => `${f.studentId}_${f.subjectId}_${f.semester}`));
        const domainSet = new Set(existingDomain.map(f => `${f.studentId}_${f.domainSlug}_${f.semester}`));

        let academicCount = 0;
        let domainCount = 0;

        const academicDocsToInsert = [];
        const domainDocsToInsert = [];

        console.log("Preparing payloads in memory...");
        for (const student of students) {
            // --- 1. Academic Feedback (Subjects) ---
            const eligibleSubjects = activeSubjects.filter(sub => 
                sub.department.toString() === student.department.toString() && 
                sub.semester === student.semester
            );

            for (const subject of eligibleSubjects) {
                const key = `${student._id}_${subject._id}_${student.semester}`;
                if (!academicSet.has(key)) {
                    const addSuggestion = Math.random() > 0.7; // 30% chance for a comment

                    academicDocsToInsert.push({
                        studentId: student._id,
                        subjectId: subject._id,
                        departmentId: subject.department,
                        semester: student.semester,
                        academicYear: subject.academicYear,
                        ratings: {
                            teachingQuality: getRandomRating(2, 5),
                            communication: getRandomRating(3, 5),
                            punctuality: getRandomRating(3, 5),
                            subjectKnowledge: getRandomRating(4, 5),
                            doubtClarification: getRandomRating(2, 5)
                        },
                        comments: addSuggestion ? suggestions[Math.floor(Math.random() * suggestions.length)] : "",
                        // Auto-calculate overall rating as the model's pre-save won't run on insertMany
                        overallRating: Math.round(((getRandomRating(2, 5) + getRandomRating(3, 5) + getRandomRating(3, 5) + getRandomRating(4, 5) + getRandomRating(2, 5)) / 5) * 100) / 100
                    });
                    academicCount++;
                }
            }

            // --- 2. Domain Feedback (Mess, Transport, etc.) ---
            for (const domain of activeDomains) {
                // Check residence restrictions
                const resType = student.residenceType || 'dayscholar';
                if (domain.residenceRestriction !== 'none' && domain.residenceRestriction !== resType) {
                    continue; // Skip domain if restricted and doesn't match
                }

                // Check if already exists
                const defaultYear = "2024-25"; 
                const dKey = `${student._id}_${domain.slug}_${student.semester}`;

                if (!domainSet.has(dKey)) {
                    const answers = domain.questions.map(q => {
                        const isText = q.type === 'text';
                        return {
                            questionId: q._id,
                            questionText: q.text,
                            rating: isText ? null : getRandomRating(1, 5),
                            comment: isText && Math.random() > 0.5 ? suggestions[Math.floor(Math.random() * suggestions.length)] : ""
                        };
                    });

                    const addComment = Math.random() > 0.5;

                    const ratingAnswers = answers.filter(a => a.rating != null);
                    let overall = null;
                    if (ratingAnswers.length > 0) {
                        const sum = ratingAnswers.reduce((acc, a) => acc + a.rating, 0);
                        overall = Math.round((sum / ratingAnswers.length) * 100) / 100;
                    }

                    domainDocsToInsert.push({
                        studentId: student._id,
                        domainSlug: domain.slug,
                        semester: student.semester,
                        academicYear: defaultYear,
                        answers: answers,
                        overallRating: overall,
                        generalComment: addComment ? suggestions[Math.floor(Math.random() * suggestions.length)] : ""
                    });
                    domainCount++;
                }
            }
        }

        console.log(`Prepared ${academicDocsToInsert.length} academic feedbacks and ${domainDocsToInsert.length} domain feedbacks.`);
        
        if (academicDocsToInsert.length > 0) {
            console.log("Inserting Academic Feedbacks...");
            await Feedback.insertMany(academicDocsToInsert, { ordered: false });
        }
        
        if (domainDocsToInsert.length > 0) {
            console.log("Inserting Domain Feedbacks...");
            await DomainFeedback.insertMany(domainDocsToInsert, { ordered: false });
        }

        console.log(`\n🎉 Seeding Complete!`);
        console.log(`✅ Generated ${academicCount} new Subject Feedbacks`);
        console.log(`✅ Generated ${domainCount} new Domain Feedbacks`);
        
        mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error("Error during seeding:", error);
        mongoose.disconnect();
        process.exit(1);
    }
};

seedFeedback();
