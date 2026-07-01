import axios from "axios";
import dotenv from "dotenv";
import Redis from "ioredis";
import { Worker } from "bullmq";

dotenv.config();

if (!process.env.REDIS_URL) {
    throw new Error("Missing REDIS_URL in .env file");
}
if (!process.env.NEXT_PUBLIC_BASE_URL) {
    throw new Error("Missing NEXT_PUBLIC_BASE_URL in .env file");
}

const connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

const worker = new Worker(
    "menuParserQueue",
    async (job) => {
        console.log(`[Job ${job.id}] 🚀 Processing restaurant ${job.data.resId}`);

        const payload = job.data;
        const apiToCall = `/api/menu/${job.data.resId}/bulk-editor/document-parser/analyze`;

        const fullUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${apiToCall}`;
        console.log(`[Job ${job.id}] Calling: ${fullUrl}`);

        try {
            const { data } = await axios.post(fullUrl, payload);
            console.log(
                `[Job ${job.id}] ✅ Done using ${apiToCall}: ${data?.message || ""}`
            );
            return data;
        } catch (err) {
            console.error(`[Job ${job.id}] ❌ Error:`, err?.message || err);
            throw err;
        }
    },
    {
        connection,
        concurrency: 1,
        limiter: {
            max: 1,
            duration: 5000,
        },
    }
);

console.log("🚀 Worker started.");
worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
});
worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed: ${err?.message || err}`);
});