import Menu from "@/model/menu"
import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import { buildZomatoMenuPayload } from "@/lib/payload/zomato/menu";

export async function POST(req, { params }) {
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

        const resMenu = await Menu.findOne({
            resId
        })

        const menuInfo = await apiClient({
            req,
            endpoint: "/php/online_ordering/menu_edit",
            method: "GET",
            params: {
                action: "get_menu_info",
                service_role: "DELIVERY_TAKEAWAY",
                res_id: resId,
            },
        });

        if (!menuInfo?.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: menuInfo?.message || "Failed to fetch menu info",
                },
                { status: menuInfo?.status || 500 }
            );
        }

        const menuVersion = menuInfo?.data?.menuVersion;

        if (!menuVersion) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Menu version not found",
                },
                { status: 400 }
            );
        }

        const result = await apiClient({
            req,
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

        console.log("result", result)

        const menu = result?.data ?? null;

        // const payload = buildZomatoMenuPayload({
        // resId,
        // menuVersion,
        // last_opened_catalogue: menu?.last_opened_catalogue || [],
        // onHoldItem: menu?.onHoldItem || [],
        // update_menu: menu
        // });

        const payload = {
            resId: String(resId),
            menuVersion,
            last_opened_catalogue: menu?.last_opened_catalogue || {},
            onHoldItems: menu?.onHoldItems || {},
            update_menu: buildZomatoMenuPayload(menu?.menuResponse, resMenu?.menu || []),
            menu: menu?.menuResponse
        }

        // return NextResponse.json(
        //     {
        //         success: true,
        //         message: "Menu updated successfully",
        //         result: payload?.update_menu,
        //         data: menu,
        //     },
        //     { status: 200 }
        // );

        const updatedMenu = await apiClient({
            req,
            endpoint: "/php/online_ordering/menu_edit",
            method: "POST",
            params: {
                action: "update_content_menu",
                service_role: "DELIVERY_TAKEAWAY",
                resId: resId
            },
            data: {
                ...payload,
            },
        });

        if (!updatedMenu?.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: updatedMenu?.message || "Menu update failed",
                },
                { status: result?.status || 500 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Menu updated successfully",
                updated_menu: updatedMenu,
                data: payload?.update_menu,
                result: result?.data,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error("MENU_UPDATE_ERROR:", err);

        return NextResponse.json(
            {
                success: false,
                message:
                    err?.response?.data?.message ||
                    err?.message ||
                    "Internal Server Error",
            },
            { status: err?.response?.status || 500 }
        );
    }
}