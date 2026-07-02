import { NextResponse } from "next/server";
import Menu from "@/model/menu";
import crypto from "crypto";
import dbConnect from "@/lib/dbConnect";

function regenerateIds(obj) {
    if (Array.isArray(obj)) {
        return obj.map(regenerateIds);
    } else if (obj !== null && typeof obj === "object") {
        const newObj = {};
        for (const [key, value] of Object.entries(obj)) {
            let targetKey = key;
            
            // Rename "id" to "tempReferenceId" for media objects
            if (key === "id" && obj.mediaType) {
                targetKey = "tempReferenceId";
            }

            if (["id", "category_id", "sub_category_id", "item_id", "variant_id", "option_id", "property_id", "tempReferenceId"].includes(targetKey)) {
                newObj[targetKey] = `temp-${crypto.randomUUID()}`;
            } else {
                newObj[targetKey] = regenerateIds(value);
            }
        }
        return newObj;
    }
    return obj;
}

export const POST = async (req, { params }) => {
    try {
        await dbConnect();
        const { resId } = await params;
        const { res_id_to } = await req.json();

        if (!res_id_to) {
            return NextResponse.json(
                { message: "res_id_to is required." },
                { status: 400 }
            );
        }

        const menu = await Menu.findOne({ resId: resId });

        if (!menu) {
            return NextResponse.json(
                { message: "Menu not found." },
                { status: 404 }
            );
        }

        const originalMenu = menu?.menu || [];
        // Deep clone and regenerate all IDs
        const newMenu = regenerateIds(originalMenu);

        const menuToUpdate = await Menu.findOne({ resId: res_id_to });

        if (!menuToUpdate) {
            await Menu.create({
                resId: res_id_to,
                menu: newMenu
            });
        } else {
            menuToUpdate.menu = newMenu;
            await menuToUpdate.save();
        }

        return NextResponse.json(
            {
                message: "Menu transferred successfully.",
                data: {
                    resId,
                    res_id_to,
                },
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            {
                message: err?.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
};