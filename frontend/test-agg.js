import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/zomato-menu"; // Adjust if needed

async function run() {
    await mongoose.connect(MONGODB_URI);
    
    const pipeline = [
        { $unwind: "$menu" },
        { $unwind: { path: "$menu.sub_category", preserveNullAndEmptyArrays: false } },
        { $unwind: { path: "$menu.sub_category.items", preserveNullAndEmptyArrays: false } },
        { $limit: 1 }
    ];
    
    const res = await mongoose.connection.collection("menus").aggregate(pipeline).toArray();
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
}
run();
