const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const FileStat = require("./models/FileStat");

async function fixDuplicates() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    const collection = mongoose.connection.collection("filestats");

    // 1. Drop existing indexes (except _id)
    console.log("Dropping old indexes...");
    const indexes = await collection.listIndexes().toArray();
    for (const idx of indexes) {
      if (idx.name !== "_id_") {
        console.log(`Dropping index: ${idx.name}`);
        await collection.dropIndex(idx.name);
      }
    }

    // 2. Find and remove duplicate entries, keeping only the latest
    console.log("Removing duplicate entries...");
    const duplicates = await FileStat.aggregate([
      {
        $group: {
          _id: { fileName: "$fileName", userId: "$userId" },
          ids: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    for (const dup of duplicates) {
      const ids = dup.ids;
      // Keep the last one, delete the rest
      const idsToDelete = ids.slice(0, -1);
      if (idsToDelete.length > 0) {
        console.log(`Removing ${idsToDelete.length} duplicate(s) for fileName="${dup._id.fileName}"`);
        await FileStat.deleteMany({ _id: { $in: idsToDelete } });
      }
    }

    // 3. Create the compound unique index
    console.log("Creating compound unique index on (fileName, userId)...");
    await collection.createIndex(
      { fileName: 1, userId: 1 },
      { unique: true }
    );

    console.log("✅ Migration completed successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

fixDuplicates();
