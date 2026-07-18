import { NextResponse } from "next/server";

const MATCH_API = "https://manager.foodsnap.in/api/image/match";

/**
 * POST /api/image/match
 * Body: { title, category, sub_category, food_type }
 *
 * Proxies to manager.foodsnap.in/api/image/match and returns
 * matched images ranked by semantic relevance.
 */
export async function POST(req) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        const body = await req.json();

        const { title, category, sub_category, food_type } = body;

        if (!title) {
            return NextResponse.json(
                { success: false, message: "title is required" },
                { status: 400 }
            );
        }

        const response = await fetch(MATCH_API, {
            method: "POST",
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                title,
                category: category || null,
                sub_category: sub_category || null,
                food_type: food_type || null,
            }),
        });

        if (!response.ok) {
            console.error(
                `Image Match API failed: ${response.status} ${response.statusText}`
            );
            return NextResponse.json(
                { success: false, message: "Image match service unavailable" },
                { status: response.status }
            );
        }

        const payload = await response.json();

        // Normalise the results array — handle various response shapes
        const results =
            payload.data ||
            payload.results ||
            payload.images ||
            payload.items ||
            (Array.isArray(payload) ? payload : []);

        return NextResponse.json(
            {
                success: true,
                data: results,
                total: payload.total ?? results.length,
            },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
                },
            }
        );
    } catch (error) {
        console.error("Image Match Route Error:", error);
        return NextResponse.json(
            {
                success: false,
                message:
                    error?.name === "AbortError"
                        ? "Image match request timed out"
                        : "Failed to match images",
            },
            { status: error?.name === "AbortError" ? 504 : 500 }
        );
    } finally {
        clearTimeout(timeout);
    }
}
