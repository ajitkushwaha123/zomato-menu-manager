import { menuParserQueue } from "../queue/menu-parser";

export const menuParserJob = async ({
    _id,
    resId,
    pageNumber,
    pdfUrl,
    percentage,
    stage = "menu-analyser/raw"
}) => {
    try {
        console.log("_id", _id);
        console.log("resId", resId);
        console.log("pageNumber", pageNumber);
        console.log("pdfUrl", pdfUrl);
        console.log("percentage", percentage);
        console.log("stage", stage);

        const job = await menuParserQueue.add(
            "menu-page-extraction",
            {
                _id,
                resId,
                pageNumber,
                pdfUrl,
                percentage,
                stage,
            },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 5000,
                },
                removeOnComplete: 1000,
                jobId: `${resId}-${pageNumber}-${Date.now()}`,
            }
        );

        console.log(
            `✅ Page ${pageNumber} queued`
        );

        return job;
    } catch (error) {
        console.error(
            `❌ Failed to queue page ${pageNumber} and percentage ${percentage}`,
            error
        );

        throw error;
    }
};