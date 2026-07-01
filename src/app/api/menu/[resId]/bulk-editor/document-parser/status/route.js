import { NextResponse } from "next/server";
import Document from "@/model/document";
import dbConnect from "@/lib/dbConnect";

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { resId } = await params;
        
        if (!resId) {
            return NextResponse.json({ success: false, message: "resId is required" }, { status: 400 });
        }

        const document = await Document.findOne({ resId });

        if (!document) {
            return NextResponse.json({ success: false, message: "No document found" }, { status: 404 });
        }

        // Calculate progress logic (if all pages are processed, set to completed)
        if (document.status === "processing" && document.totalPages > 0 && document.processedPages >= document.totalPages) {
            document.status = "completed";
            await document.save();
        }

        return NextResponse.json({
            success: true,
            document: {
                status: document.status,
                totalPages: document.totalPages,
                processedPages: document.processedPages
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Error in status route:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to fetch status" },
            { status: 500 }
        );
    }
}
