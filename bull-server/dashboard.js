import express from "express";
import { createBullBoard } from "@bull-board/api";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { menuParserQueue } from "../src/lib/bullmq/queue/menu-parser.js"
import { swiggyProcessorQueue } from "../src/lib/bullmq/queue/swiggy-processor.js";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
    queues: [
        new BullMQAdapter(menuParserQueue),
        new BullMQAdapter(swiggyProcessorQueue),
    ],
    serverAdapter,
});

const app = express();
app.use("/admin/queues", serverAdapter.getRouter());

app.listen(3001, () => {
    console.log(
        "📊 Bull Board dashboard running at http://localhost:3001/admin/queues"
    );
});