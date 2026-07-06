import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { enrichMenuItems } from "@/services/ai/menu-extraction";
import Document from "@/model/document";
import { menuParserJob } from "@/lib/bullmq/job/menu-parser";

export async function POST(req) {
    try {
        await dbConnect();
        const { _id, resId } = await req.json();

        if (!_id) {
            return NextResponse.json({ success: false, message: "_id is required" }, { status: 400 });
        }

        const doc = await Document.findOne({ _id });
        if (!doc) throw new Error(`Document with ID ${_id} not found`);

        const items = doc?.parsedData?.items || [];

        const enrichmentPayload = items?.map((item) => {
            return {
                id: item?.id,
                name: item?.name,
                category: item?.category,
            }
        });

        // Process enrichment via Bedrock in batches of 100
        const batchSize = 100;
        let enrichedItems = [];

        for (let i = 0; i < enrichmentPayload.length; i += batchSize) {
            const batch = enrichmentPayload.slice(i, i + batchSize);
            console.log(`[Document] Enriching batch ${i / batchSize + 1} (${batch.length} items)...`);

            const batchResult = await enrichMenuItems(batch);

            if (batchResult.error) {
                throw new Error(batchResult.message || "Failed to enrich menu items in batch");
            }

            enrichedItems = enrichedItems.concat(batchResult);
        }

        const mergedData = items.map(item => {
            const enrichedMatch = enrichedItems.find(e => e.id === item.id) || {};
            return {
                ...item,
                name: enrichedMatch.name || item.name,
                is_veg: enrichedMatch.is_veg || "VEG",
                meatTypes: enrichedMatch.meatTypes || []
            };
        });

        // Deduplicate mergedData based on item name (case-insensitive)
        const seenNames = new Set();
        const uniqueMergedData = [];
        for (const item of mergedData) {
            const nameKey = (item.name || "").toLowerCase().trim();
            if (!seenNames.has(nameKey)) {
                seenNames.add(nameKey);
                uniqueMergedData.push(item);
            }
        }

        doc.enrichedData = { items: uniqueMergedData };
        doc.status = "enrichment_complete";
        await doc.save();

        console.log(`[Document] Successfully enriched menu for resId ${resId}`);
        await menuParserJob({
            _id,
            resId: resId.toString(),
            pageNumber: 0,
            pdfUrl: "",
            percentage: 100,
            stage: "menu-analyser/normalize",
        });

        return NextResponse.json({ success: true, data: mergedData });
    } catch (error) {
        console.error("Menu parser error:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Something went wrong" },
            { status: 500 }
        );
    }
}