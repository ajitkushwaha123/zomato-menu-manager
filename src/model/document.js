import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
    {
        resId: {
            type: String,
            required: true,
            index: true,
        },

        status: {
            type: String,
            default: "processing",
        },

        totalPages: {
            type: Number,
            default: 0,
        },

        processedPages: {
            type: Number,
            default: 0,
        },

        pages: [
            {
                pageNumber: Number,
                pdfUrl: String,
                parsedData: mongoose.Schema.Types.Mixed,
                processedAt: Date,
            },
        ],
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Document ||
    mongoose.model(
        "Document",
        DocumentSchema
    );