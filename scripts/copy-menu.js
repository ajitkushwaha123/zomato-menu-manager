import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Menu from '../src/model/menu.js';

// Load env vars
dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is missing in .env");
    }
    await mongoose.connect(process.env.MONGODB_URI);
};

const askQuestion = (query) => {
    return new Promise(resolve => rl.question(query, resolve));
};

const run = async () => {
    try {
        await connectDB();
        console.log("Connected to MongoDB.");

        const fromResId = await askQuestion("Enter 'from' resId (source): ");
        if (!fromResId) {
            throw new Error("'from' resId is required.");
        }

        const toResId = await askQuestion("Enter 'to' resId (destination): ");
        if (!toResId) {
            throw new Error("'to' resId is required.");
        }

        const fromMenuDoc = await Menu.findOne({ resId: fromResId });
        if (!fromMenuDoc || !fromMenuDoc.menu || !Array.isArray(fromMenuDoc.menu)) {
            throw new Error(`Source menu not found or invalid for resId: ${fromResId}`);
        }

        const newMenuData = fromMenuDoc.menu;

        // Generate a new temporary ID
        const generateTempId = () => `temp-${crypto.randomUUID()}`;

        // Deep copy and prepare the menu data with new temp IDs and empty media
        const prepareItems = (items) => items.map(item => {
            const preparedVariants = (item.variants || []).map(v => ({
                property_name: v.property_name,
                property_id: generateTempId(),
                options: (v.options || []).map((opt, index) => ({
                    option_name: opt.option_name,
                    price: opt.price,
                    is_default: opt.is_default || false,
                    option_id: generateTempId()
                }))
            }));

            return {
                id: generateTempId(),
                temp_id: "",
                name: item.name || "",
                description: item.description || "",
                price: item.price || 0,
                min_price: item.min_price || item.price || 0,
                max_price: item.max_price || item.price || 0,
                is_veg: item.is_veg || "VEG",
                packing_charges: item.packing_charges || 0,
                media: [],
                variants: preparedVariants,
                meatTypes: item.meatTypes || null
            };
        });

        const preparedMenuData = newMenuData.map(cat => {
            return {
                ...cat,
                id: generateTempId(),
                temp_id: "",
                sub_category: (cat.sub_category || []).map(sub => ({
                    ...sub,
                    id: generateTempId(),
                    temp_id: "",
                    items: prepareItems(sub.items || [])
                }))
            };
        });

        const toMenuDoc = await Menu.findOne({ resId: toResId });
        let existingMenu = [];
        if (toMenuDoc && Array.isArray(toMenuDoc.menu)) {
            existingMenu = toMenuDoc.menu;
        }

        // Merge logic similar to analyze route
        preparedMenuData.forEach(newCat => {
            const existingCat = existingMenu.find(c => c.name?.toLowerCase() === newCat.name?.toLowerCase());
            if (existingCat) {
                (newCat.sub_category || []).forEach(newSub => {
                    if (!existingCat.sub_category) existingCat.sub_category = [];
                    const existingSub = existingCat.sub_category.find(s => s.name?.toLowerCase() === newSub.name?.toLowerCase());

                    if (existingSub) {
                        if (!existingSub.items) existingSub.items = [];
                        existingSub.items.push(...(newSub.items || []));
                    } else {
                        existingCat.sub_category.push(newSub);
                    }
                });
            } else {
                existingMenu.push(newCat);
            }
        });

        await Menu.updateOne(
            { resId: toResId },
            { 
                $set: { 
                    menu: existingMenu,
                    name: toMenuDoc?.name || fromMenuDoc.name || `Menu ${toResId}`,
                    platform: toMenuDoc?.platform || fromMenuDoc.platform || "zomato"
                } 
            },
            { upsert: true }
        );

        console.log(`\n✅ Successfully copied/merged menu from ${fromResId} to ${toResId}`);
    } catch (err) {
        console.error("\n❌ Error processing:", err.message || err);
    } finally {
        mongoose.disconnect();
        rl.close();
        process.exit(0);
    }
};

run();
