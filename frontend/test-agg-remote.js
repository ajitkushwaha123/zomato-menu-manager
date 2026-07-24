import mongoose from "mongoose";

const MONGODB_URI = "mongodb+srv://ajitkushwaha3101:snehavats1404@menu-manager.yslxv8v.mongodb.net/zomato?retryWrites=true&w=majority&appName=menu-manager";

async function run() {
    await mongoose.connect(MONGODB_URI);
    
    const pipeline = [
        { $unwind: "$menu" },
        { $unwind: { path: "$menu.sub_category", preserveNullAndEmptyArrays: false } },
        { $unwind: { path: "$menu.sub_category.items", preserveNullAndEmptyArrays: false } },
        { 
            $match: { 
                "menu.sub_category.items.name": { $regex: "Paneer", $options: "i" },
            } 
        },
        { $limit: 2 }
    ];
    
    const res = await mongoose.connection.collection("menus").aggregate(pipeline).toArray();
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
}
run();
