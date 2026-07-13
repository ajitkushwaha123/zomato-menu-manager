import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { extractMenuFromImage } from "@/services/ai/menu-extraction";
import Document from "@/model/document";
import { menuParserJob } from "@/lib/bullmq/job/menu-parser";

export async function POST(req) {
    try {
        await dbConnect();
        const { _id, resId, pageNumber, pdfUrl } = await req.json();
        if (!_id || !resId || !pageNumber || !pdfUrl) {
            console.log("4000", 4000)
            console.log(_id, resId, pageNumber, pdfUrl)
            return NextResponse.json(
                { success: false, message: "resId, pageNumber and valid pdfUrl are required" },
                { status: 400 }
            );
        }

        console.log("Processing", _id, resId, pageNumber, pdfUrl)

        const fileResponse = await fetch(pdfUrl);
        if (!fileResponse.ok) {
            throw new Error(`Failed to download document asset from URL: ${pdfUrl}`);
        }
        const arrayBuffer = await fileResponse.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        const contentType = fileResponse.headers.get("content-type") || "image/jpeg";
        const extractedMenu = await extractMenuFromImage(imageBuffer, contentType);
        console.log("extractedMenu", extractedMenu);

        let doc = await Document.findOne({ _id });
        if (!doc) {
            throw new Error(`Document with ID ${_id} not found`);
        }

        const pageIndex = doc.pages.findIndex(p => p.pageNumber === Number(pageNumber));
        const newPageData = {
            pageNumber: Number(pageNumber),
            pdfUrl,
            parsedData: {
                items: extractedMenu.items,
                rawText: extractedMenu.rawText
            },
            processedAt: new Date(),
        };

        if (pageIndex > -1) {
            const isFirstTimeCompleted = !doc.pages[pageIndex].parsedData;

            doc.pages[pageIndex].parsedData = newPageData.parsedData;
            doc.pages[pageIndex].processedAt = newPageData.processedAt;
            doc.pages[pageIndex].status = "completed";

            if (isFirstTimeCompleted) {
                doc.processedPages = (doc.processedPages || 0) + 1;
            }

            doc.markModified('pages');
        } else {
            newPageData.status = "completed";
            doc.pages.push(newPageData);
            doc.processedPages = (doc.processedPages || 0) + 1;
        }

        await doc.save();

        if (doc.processedPages >= doc.totalPages) {
            doc.status = "completed";
            await doc.save();

            console.log(`[Document] All ${doc.totalPages} pages processed. Queueing Stage-2 (combine) for resId ${resId}`);
            await menuParserJob({
                _id,
                resId: resId.toString(),
                pageNumber: 0,
                pdfUrl: "",
                percentage: 100,
                stage: "menu-analyser/combine",
            });
        } else {
            const nextPageNum = Number(pageNumber) + 1;
            const nextPage = doc.pages.find(p => p.pageNumber === nextPageNum);

            if (nextPage) {
                await menuParserJob({
                    _id,
                    resId: resId.toString(),
                    pageNumber: nextPage.pageNumber,
                    pdfUrl: nextPage.pdfUrl,
                    percentage: 0,
                    stage: "menu-analyser/raw",
                });
            }
        }

        return NextResponse.json({ success: true, pageNumber, extractedMenu });
    } catch (error) {
        console.error("Menu parser error:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Something went wrong" },
            { status: 500 }
        );
    }
}