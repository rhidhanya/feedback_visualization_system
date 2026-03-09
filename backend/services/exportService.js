const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");

const exportToCSV = (data) => {
    try {
        const fields = ["courseId", "instructorId", "studentId", "createdAt", "question", "value", "sentiment", "category"];
        const flatData = [];

        data.forEach(entry => {
            entry.responses.forEach(r => {
                flatData.push({
                    courseId: entry.courseId,
                    instructorId: entry.instructorId,
                    studentId: entry.studentId,
                    createdAt: entry.createdAt,
                    question: r.question,
                    value: r.value,
                    sentiment: r.sentiment,
                    category: r.category
                });
            });
        });

        const parser = new Parser({ fields });
        return parser.parse(flatData);
    } catch (err) {
        console.error("CSV Export Error:", err);
        throw err;
    }
};

const generateSummaryPDF = (data, stream, courseName = "Course", instructorName = "Instructor") => {
    const doc = new PDFDocument();
    doc.pipe(stream);

    doc.fontSize(22).text(`EdTech Feedback Report: ${courseName}`, { align: "center" });
    doc.fontSize(14).text(`Instructor: ${instructorName}`, { align: "center" });
    doc.moveDown();

    const totalEntries = data.length;
    doc.fontSize(14).text(`Total Feedback Entries: ${totalEntries}`);
    doc.moveDown();

    let positive = 0, negative = 0, neutral = 0;
    const categoryStats = {};

    data.forEach(entry => {
        entry.responses.forEach(r => {
            if (r.sentiment === "Positive") positive++;
            else if (r.sentiment === "Negative") negative++;
            else neutral++;

            categoryStats[r.category] = (categoryStats[r.category] || 0) + 1;
        });
    });

    doc.fontSize(16).text(`Sentiment Breakdown:`);
    doc.fontSize(12).text(`- Positive: ${positive}`);
    doc.text(`- Negative: ${negative}`);
    doc.text(`- Neutral: ${neutral}`);
    doc.moveDown();

    doc.fontSize(16).text(`Category Breakdown:`);
    Object.entries(categoryStats).forEach(([cat, count]) => {
        doc.fontSize(12).text(`- ${cat}: ${count}`);
    });
    doc.moveDown();

    doc.text("Sample Feedback:");
    data.slice(0, 5).forEach((entry, i) => {
        const textSample = entry.responses.find(r => r.type === "text")?.value || "N/A";
        doc.fontSize(10).text(`${i + 1}. [${entry.createdAt.toLocaleDateString()}] ${textSample.substring(0, 100)}...`);
    });

    doc.end();
};

module.exports = { exportToCSV, generateSummaryPDF };
