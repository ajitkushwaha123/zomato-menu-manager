import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

export async function GET(req, { params }) {
    try {
        const { resId } = await params;

        if (!resId) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Restaurant ID is required",
                },
                { status: 400 }
            );
        }

        const result = await apiClient({
            endpoint: "/php/online_ordering/menu_edit",
            method: "GET",
            params: {
                action: "get_content_menu",
                res_id: resId,
                service_role: "DELIVERY_TAKEAWAY",
            },
        });

        if (!result?.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: result?.message || "Failed to fetch menu",
                },
                { status: result?.status || 500 }
            );
        }

        const menu =
            result?.data?.data?.menuResponse ??
            result?.data?.menuResponse ??
            null;

        return NextResponse.json(
            {
                success: true,
                message: "Menu fetched successfully",
                data: menu,
            },
            { status: 200 }
        );
    } catch (err) {
        return NextResponse.json(
            {
                success: false,
                message: err?.message || "Internal Server Error",
            },
            { status: 500 }
        );
    }
}