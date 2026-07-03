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

        const document = await Document.create({
            resId,
            status: "processing",
            totalPages: 0,
            processedPages: 0,
            pages: []
        });

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

        const uploadedPages = await Promise.all(uploadPromises);

        document.totalPages = uploadedPages.length;
        document.pages = uploadedPages.map(p => ({
            pageNumber: p.pageNumber,
            pdfUrl: p.pdfUrl,
            status: "pending"
        }));
        await document.save();

        if (uploadedPages.length > 0) {
            const firstPage = uploadedPages[0];
            await menuParserJob({
                _id: document?._id,
                resId,
                pageNumber: firstPage.pageNumber,
                pdfUrl: firstPage.pdfUrl,
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
