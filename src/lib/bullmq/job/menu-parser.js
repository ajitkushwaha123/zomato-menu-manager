import { menuParserQueue } from "../queue/menu-parser";

export const menuParserJob = async ({
    resId,
    pageNumber,
    pdfUrl,
    percentage
}) => {
    try {
        console.log("resId", resId);
        console.log("pageNumber", pageNumber);
        console.log("pdfUrl", pdfUrl);
        console.log("percentage", percentage);

        const job = await menuParserQueue.add(
            "menu-page-extraction",
            {
                resId,
                pageNumber,
                pdfUrl,
                percentage,
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