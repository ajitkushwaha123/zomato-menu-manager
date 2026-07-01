import { NextResponse } from "next/server";
import { uploadToS3 } from "@/services/s3";
import Document from "@/model/document";
import dbConnect from "@/lib/dbConnect";
import { menuParserJob } from "@/lib/bullmq/job/menu-parser";

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { resId } = await params;
        
        if (!resId) {
            return NextResponse.json({ success: false, message: "resId is required" }, { status: 400 });
        }

        const formData = await req.formData();
        const files = formData.getAll("files");

        if (!files || files.length === 0) {
            return NextResponse.json({ success: false, message: "No files uploaded" }, { status: 400 });
        }

        let pageCount = 0;
        const uploadPromises = [];

        // Pre-create the document in DB
        const document = await Document.findOneAndUpdate(
            { resId },
            { 
                resId, 
                status: "processing", 
                totalPages: 0, 
                processedPages: 0, 
                pages: [] 
            },
            { upsert: true, new: true }
        );

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const mimeType = file.type || "unknown";
            console.log(`Received file with mimeType: ${mimeType}, size: ${buffer.length}`);

            if (mimeType.startsWith("image/") || mimeType === "application/octet-stream") {
                pageCount++;
                let extension = "jpg";
                if (mimeType.includes("png")) extension = "png";
                else if (mimeType.includes("jpeg")) extension = "jpg";
                else if (mimeType.includes("webp")) extension = "webp";
                
                const currentPage = pageCount;
                // Upload image to S3
                const uploadPromise = uploadToS3({
                    file: buffer,
                    folder: `menus/${resId}/pages`,
                    fileName: `page-${currentPage}.${extension}`,
                }).then(s3Result => ({
                    pageNumber: currentPage,
                    pdfUrl: s3Result.url
                }));
                uploadPromises.push(uploadPromise);
            }
        }

        // Wait for all S3 uploads
        const uploadedPages = await Promise.all(uploadPromises);
        
        // Push pages to Document model
        document.totalPages = uploadedPages.length;
        document.pages = uploadedPages.map(p => ({
            pageNumber: p.pageNumber,
            pdfUrl: p.pdfUrl,
            status: "pending"
        }));
        await document.save();

        // Queue bullmq jobs
        for (const page of uploadedPages) {
            await menuParserJob({
                resId,
                pageNumber: page.pageNumber,
                pdfUrl: page.pdfUrl,
                percentage: 0
            });
        }

        return NextResponse.json({
            success: true,
            message: `Queued ${uploadedPages.length} images for processing`,
            documentId: document._id
        }, { status: 200 });

    } catch (error) {
        console.error("Error in upload route:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to process upload" },
            { status: 500 }
        );
    }
}
