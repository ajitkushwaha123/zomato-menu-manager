import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { extractMenuFromImage } from "@/services/ai/menu-extraction";
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

        let allItems = [];
        const sortedPages = [...doc.pages].sort((a, b) => a.pageNumber - b.pageNumber);

        for (const page of sortedPages) {
            if (page.parsedData && Array.isArray(page.parsedData.items)) {
                allItems.push(...page.parsedData.items);
            }
        }

        allItems = allItems.map((item, idx) => {
            return {
                id: String(idx + 1),
                ...item
            };
        });

        doc.parsedData = { items: allItems };
        doc.status = "combining_complete";
        await doc.save();

        console.log(`[Document] Successfully combined ${allItems.length} items. Queueing final 'analyze' stage for resId ${resId}`);

        await menuParserJob({
            _id,
            resId: resId.toString(),
            pageNumber: 0,
            pdfUrl: "",
            percentage: 100,
            stage: "menu-analyser/enrichment",
        });

        return NextResponse.json({ success: true, count: allItems.length, items: allItems });
    } catch (error) {
        console.error("Menu parser error:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Something went wrong" },
            { status: 500 }
        );
    }
}