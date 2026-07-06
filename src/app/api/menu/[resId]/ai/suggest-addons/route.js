import { NextResponse } from "next/server";
import { suggestAddons } from "@/services/ai/addons-suggestor";
import dbConnect from "@/lib/dbConnect";
import Menu from "@/model/menu";

export async function POST(req, { params }) {
    try {
        const { resId } = await params;

        if (!resId) {
            return NextResponse.json({ success: false, message: "Missing resId", debug_params: params }, { status: 400 });
        }

        await dbConnect();
        const resMenu = await Menu.findOne({ resId });
        const menuData = resMenu?.menu || [];

        if (!menuData || !Array.isArray(menuData) || menuData.length === 0) {
            return NextResponse.json({ success: false, message: "No menu items found for this restaurant" }, { status: 404 });
        }

        const lightweightItems = [];
        menuData.forEach(cat => {
            if (cat?.status === "delete") return;
            cat.sub_category?.forEach(sub => {
                if (sub?.status === "delete") return;
                sub.items?.forEach(item => {
                    if (item?.status === "delete") return;
                    lightweightItems.push({
                        id: item.id,
                        name: item.name,
                        category: cat.name
                    });
                });
            });
        });

        if (lightweightItems.length === 0) {
            return NextResponse.json({ success: false, message: "No active menu items available" }, { status: 400 });
        }

        const result = await suggestAddons(lightweightItems);

        return NextResponse.json({
            success: true,
            addons: result.addons || []
        });

    } catch (error) {
        console.error("Error in /ai/suggest-addons:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to suggest addons" },
            { status: 500 }
        );
    }
}
