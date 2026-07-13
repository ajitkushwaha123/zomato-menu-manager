import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { normalizeMenuHierarchy } from "@/services/ai/menu-extraction";
import Document from "@/model/document";
import { menuParserJob } from "@/lib/bullmq/job/menu-parser";

function toTitleCase(str) {
    if (!str) return "";
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}

export async function POST(req) {
    try {
        await dbConnect();
        const { _id, resId } = await req.json();

        if (!_id) {
            return NextResponse.json({ success: false, message: "_id is required" }, { status: 400 });
        }

        const doc = await Document.findOne({ _id });
        if (!doc) throw new Error(`Document with ID ${_id} not found`);

        const items = doc?.enrichedData?.items || [];

        const normalizePayload = items?.map((item) => {
            return {
                id: item?.id,
                name: item?.name,
                category: item?.category,
                is_veg: item?.is_veg
            }
        });

        const normalizedData = await normalizeMenuHierarchy(normalizePayload);

        if (normalizedData.error) {
            throw new Error(normalizedData.message || "Failed to normalize menu hierarchy");
        }

        // Merge all original rich fields (variants, base_price, meatTypes, etc) back into the structured tree
        // AND apply finalization (Title Case, Variant Sorting, Meat Types Cleanup)
        if (normalizedData.category && Array.isArray(normalizedData.category)) {
            normalizedData.category.forEach(cat => {
                cat.name = toTitleCase(cat.name);
                if (cat.sub_category && Array.isArray(cat.sub_category)) {
                    cat.sub_category.forEach(sub => {
                        sub.name = toTitleCase(sub.name);
                        if (sub.items && Array.isArray(sub.items)) {
                            sub.items = sub.items.map(treeItem => {
                                // Find the fully enriched original item (which now contains the concise, normalized name)
                                const fullItem = items.find(i => String(i.id) === String(treeItem.id)) || {};
                                
                                // Merge object
                                let merged = {
                                    ...fullItem,
                                    ...treeItem,
                                    name: toTitleCase(fullItem.name || treeItem.name)
                                };

                                // 1. Variants Normalization (sort increasing, calc base_price)
                                if (!merged.variants) {
                                    merged.variants = [];
                                } else if (Array.isArray(merged.variants) && merged.variants.length > 0) {
                                    let lowestPrice = null;

                                    merged.variants = merged.variants.map(variantGroup => {
                                        if (variantGroup.options && Array.isArray(variantGroup.options)) {
                                            // Sort options by price in ascending order
                                            variantGroup.options.sort((a, b) => Number(a.price) - Number(b.price));
                                            
                                            // Track lowest price for base_price
                                            variantGroup.options.forEach(opt => {
                                                const p = Number(opt.price);
                                                if (!isNaN(p) && (lowestPrice === null || p < lowestPrice)) {
                                                    lowestPrice = p;
                                                }
                                            });
                                        }
                                        return variantGroup;
                                    });

                                    if (lowestPrice !== null) {
                                        merged.base_price = lowestPrice;
                                    }
                                }

                                // 2. Meat Types Normalization
                                if (merged.is_veg === "VEG" || merged.is_veg === "EGG") {
                                    merged.meatTypes = [];
                                } else if (!merged.meatTypes || !Array.isArray(merged.meatTypes)) {
                                    merged.meatTypes = [];
                                } else {
                                    const validMeatSlugs = new Set([
                                        "chicken", "fish", "mutton", "goat", "lamb", "pork", 
                                        "egg", "turkey", "beef", "buffalo", "bull", "crab", 
                                        "prawn", "shrimp", "shellfish", "squid", "lobster", 
                                        "duck", "camel", "deer", "frog", "goose", "insect", 
                                        "octopus", "pigeon", "quail", "rabbit", "shark", 
                                        "veal", "venison"
                                    ]);
                                    merged.meatTypes = merged.meatTypes
                                        .map(m => String(m).toLowerCase().trim())
                                        .filter(m => validMeatSlugs.has(m));
                                }

                                return merged;
                            });
                        }
                    });
                }
            });
        }

        doc.normalizedData = normalizedData;
        doc.status = "normalization_complete";
        await doc.save();

        console.log(`[Document] Successfully normalized menu for resId ${resId}. Queueing Analyze stage...`);
        
        // Queue the final analyze/merge stage
        await menuParserJob({
            _id: doc._id,
            resId: resId.toString(),
            pageNumber: 1, // Placeholder
            pdfUrl: "completed", // Placeholder
            percentage: 100,
            stage: "menu-analyser/analyze"
        });

        return NextResponse.json({ success: true, data: normalizedData });
    } catch (error) {
        console.error("Menu parser error:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Something went wrong" },
            { status: 500 }
        );
    }
}