import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

export async function GET(req) {
    try {
        const restaurantResp = await apiClient({
            req,
            baseURL: process.env.ZOMATO_API_BASE_URL_V2,
            endpoint: "/merchant-gw/web/restaurant/get-all-minimal-lite",
            method: "GET",
        });

        console.log("restaurantResp", restaurantResp)
        // if (!restaurantResp?.loggedIn) {
        //     return NextResponse.json(
        //         {
        //             success: false,
        //             message: "Unable to login. Please try again.",
        //         },
        //         { status: 401 }
        //     );
        // }

        return NextResponse.json({
            success: true,
            data: restaurantResp,
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            {
                success: false,
                message: err?.message ?? "Internal Server Error",
            },
            { status: 500 }
        );
    }
}