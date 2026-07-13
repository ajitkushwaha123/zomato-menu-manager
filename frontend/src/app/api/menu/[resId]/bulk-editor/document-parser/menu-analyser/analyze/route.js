import Document from "@/model/document";
import Menu from "@/model/menu";
import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        await dbConnect();

        const { _id, resId } = await req.json();

        if (!_id || !resId) {
            return NextResponse.json(
                { success: false, message: "_id and resId are required" },
                { status: 400 }
            );
        }

        const doc = await Document.findOne({ _id });
        if (!doc) {
            throw new Error(`Document with ID ${_id} not found`);
        }

        if (!doc.normalizedData || !Array.isArray(doc.normalizedData.category)) {
            throw new Error(`Document ${_id} does not have valid normalizedData to merge.`);
        }

        const prepareItems = (items) => items.map(item => {
            const finalPrice = item.base_price ?? item.price ?? 0;
            let minPrice = finalPrice;
            let maxPrice = finalPrice;
            
            const preparedVariants = (item.variants || []).map(v => ({
                ...v,
                property_id: `temp-${crypto.randomUUID()}`,
                options: (v.options || []).map((opt, index) => {
                    const optPrice = Number(opt.price) || 0;
                    return {
                        ...opt,
                        option_id: `temp-${crypto.randomUUID()}`,
                        price: optPrice,
                        is_default: index === 0
                    };
                })
            }));

            // Calculate min/max price from variants if they exist
            if (preparedVariants.length > 0) {
                const allPrices = [];
                preparedVariants.forEach(v => {
                    v.options.forEach(opt => {
                        if (typeof opt.price === 'number') {
                            allPrices.push(opt.price);
                        }
                    });
                });

                if (allPrices.length > 0) {
                    minPrice = Math.min(...allPrices);
                    maxPrice = Math.max(...allPrices);
                }
            }

            const newItem = {
                ...item,
                id: `temp-${crypto.randomUUID()}`,
                price: finalPrice,
                min_price: minPrice,
                max_price: maxPrice,
                description: item.description || "",
                is_available: item.is_available ?? true,
                variants: preparedVariants
            };
            delete newItem.base_price;
            return newItem;
        });

        const preparedCategories = doc.normalizedData.category.map(cat => {
            let subCategories = cat.sub_category || [];
            
            if (cat.items && cat.items.length > 0) {
                subCategories.push({
                    name: cat.name || "General",
                    items: cat.items
                });
                delete cat.items;
            }

            return {
                ...cat,
                id: `temp-${crypto.randomUUID()}`,
                sub_category: subCategories.map(sub => ({
                    ...sub,
                    id: `temp-${crypto.randomUUID()}`,
                    items: prepareItems(sub.items || [])
                }))
            };
        });

        const existingMenuDoc = await Menu.findOne({ resId });
        let existingMenu = [];
        if (existingMenuDoc && Array.isArray(existingMenuDoc.menu)) {
            existingMenu = existingMenuDoc.menu;
        }

        preparedCategories.forEach(newCat => {
            const existingCat = existingMenu.find(c => 
                c.name?.toLowerCase() === newCat.name?.toLowerCase() &&
                c.status !== 'delete' && c.status !== 'deleted'
            );
            
            if (existingCat) {
                (newCat.sub_category || []).forEach(newSub => {
                    if (!existingCat.sub_category) existingCat.sub_category = [];
                    const existingSub = existingCat.sub_category.find(s => 
                        s.name?.toLowerCase() === newSub.name?.toLowerCase() &&
                        s.status !== 'delete' && s.status !== 'deleted'
                    );

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
            { resId },
            { $set: { menu: existingMenu } },
            { upsert: true }
        );

        doc.status = "analyze_complete";
        await doc.save();

        console.log(`[Document] Successfully merged normalized data into Menu for resId ${resId}`);

        return NextResponse.json({ success: true, message: "Menu analyzed and merged successfully." });
    } catch (error) {
        console.error("Analyze error:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Something went wrong in analyze phase." },
            { status: 500 }
        );
    }
}