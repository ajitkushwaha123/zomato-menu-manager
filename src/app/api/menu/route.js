import { NextResponse } from "next/server";
import Menu from "@/model/menu";
import dbConnect from "@/lib/dbConnect";

export async function GET() {
    try {
        await dbConnect();
        const menus = await Menu.find({}).sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            data: menus,
        });
    } catch (error) {
        console.error("Error fetching menus:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();
        const { resId, platform, name } = body;

        if (!resId || !platform) {
            return NextResponse.json(
                { success: false, message: "resId and platform are required" },
                { status: 400 }
            );
        }

        let existingMenu = await Menu.findOne({ resId, platform });

        if (existingMenu) {
            return NextResponse.json(
                { success: false, message: "Menu for this restaurant and platform already exists" },
                { status: 400 }
            );
        }

        const newMenu = await Menu.create({
            resId,
            platform,
            name,
            menu: [],
        });

        return NextResponse.json({
            success: true,
            data: newMenu,
        });
    } catch (error) {
        console.error("Error creating menu:", error);
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}
