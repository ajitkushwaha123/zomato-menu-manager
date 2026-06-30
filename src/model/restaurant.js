import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema(
    {
        resId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: false,
        },
        platform: {
            type: String,
            default: "swiggy",
            enum: ['swiggy', 'zomato', "auto"],
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Restaurant ||
    mongoose.model("Restaurant", RestaurantSchema);
