import { NextResponse } from "next/server";

const SEARCH_API = "https://manager.foodsnap.in/api/image/search";

function extractResults(payload) {
    if (!payload) return [];

    return (
        payload.data ||
        payload.results ||
        payload.images ||
        payload.items ||
        (Array.isArray(payload) ? payload : [])
    );
}

export async function GET(req) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const { searchParams } = new URL(req.url);

        const query = searchParams.get("q")?.trim();

        if (!query) {
            return NextResponse.json({
                success: true,
                data: [],
                query: "",
                page: 1,
                limit: 12,
                total: 0,
                hasMore: false,
                pagination: {
                    totalCount: 0,
                    currentPage: 1,
                    totalPages: 0,
                    limit: 12,
                },
            });
        }

        const page = Math.max(
            1,
            Number.parseInt(searchParams.get("page") ?? "1", 10),
        );

        const limit = Math.min(
            60,
            Math.max(1, Number.parseInt(searchParams.get("limit") ?? "12", 10)),
        );

        // Platform detection: defaults to swiggy
        const platform = searchParams.get("platform") ?? "swiggy";

        const url = new URL(SEARCH_API);

        url.searchParams.set("q", query);
        url.searchParams.set("page", String(page));
        url.searchParams.set("limit", String(limit));

        // Only pass approved=true for Zomato, skip for Swiggy
        if (platform === "zomato") {
            url.searchParams.set("approved", "true");
        }

        const response = await fetch(url.toString(), {
            signal: controller.signal,
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            console.error(
                `Search API failed: ${response.status} ${response.statusText}`,
            );

            return NextResponse.json(
                {
                    success: false,
                    message: "Search service unavailable",
                },
                {
                    status: response.status,
                },
            );
        }

        const payload = await response.json();
        const results = extractResults(payload);

        return NextResponse.json(
            {
                success: true,
                query: payload.query ?? query,
                data: results,
                page: payload.page ?? page,
                limit: payload.limit ?? limit,
                total: payload.total ?? results.length,
                hasMore: payload.hasMore ?? false,
                pagination: payload.pagination ?? {
                    totalCount: payload.total ?? results.length,
                    currentPage: payload.page ?? page,
                    totalPages: Math.ceil(
                        (payload.total ?? results.length) / (payload.limit ?? limit),
                    ),
                    limit: payload.limit ?? limit,
                },
            },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
                },
            },
        );
    } catch (error) {
        console.error("Search Route Error:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error?.name === "AbortError"
                        ? "Search request timed out"
                        : "Failed to search images",
            },
            {
                status: error?.name === "AbortError" ? 504 : 500,
            },
        );
    } finally {
        clearTimeout(timeout);
    }
}
