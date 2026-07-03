import Menu from "@/model/menu"
import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

const getDeliveryPrice = (variantPrices = []) => {
    const match =
        variantPrices.find(
            (p) => p?.service?.toLowerCase() === "delivery"
        ) || variantPrices[0];

    return match?.price ?? match?.basePrice ?? 0;
};

const buildCatalogueLookup = (catalogueWrappers = []) => {
    const map = new Map();

    catalogueWrappers.forEach((wrapper) => {
        const catalogueId = wrapper?.catalogue?.catalogueId;
        if (catalogueId) map.set(catalogueId, wrapper);
    });

    return map;
};

const getPriceRange = (variantWrappers = []) => {
    const prices = variantWrappers
        .map((vw) => getDeliveryPrice(vw?.variantPrices))
        .filter((p) => typeof p === "number" && p > 0);

    if (prices.length === 0) {
        return { price: 0, min_price: 0, max_price: 0 };
    }

    return {
        price: prices[0],
        min_price: Math.min(...prices),
        max_price: Math.max(...prices),
    };
};

const parseItemVariants = (catalogueWrapper) => {
    const propertyWrappers = catalogueWrapper?.cataloguePropertyWrappers || [];
    const variantWrappers = catalogueWrapper?.variantWrappers || [];

    if (propertyWrappers.length === 0) return [];
    const propertyValueToVariant = new Map();

    variantWrappers.forEach((variantWrapper) => {
        const variantId = variantWrapper?.variant?.variantId || "";
        const price = getDeliveryPrice(variantWrapper?.variantPrices);

        (variantWrapper?.variantPropertyValues || []).forEach((vpv) => {
            if (vpv?.propertyValueId) {
                propertyValueToVariant.set(vpv.propertyValueId, {
                    variantId,
                    price,
                });
            }
        });
    });

    return propertyWrappers
        .map((propertyWrapper) => {
            const property = propertyWrapper?.catalogueProperty;
            if (!property) return null;

            const values =
                propertyWrapper?.cataloguePropertyValues ||
                property?.propertyValues ||
                [];

            return {
                property_name: property?.name || "",
                property_id: property?.propertyId || "",

                options: values.map((value, index) => {
                    const matched =
                        propertyValueToVariant.get(value?.propertyValueId) ||
                        {};

                    return {
                        option_name: value?.value || "",
                        option_id: value?.propertyValueId || "",
                        variant_id: matched?.variantId || "",
                        price: matched?.price || 0,
                        is_default: (value?.order ?? index + 1) === 1,
                    };
                }),
            };
        })
        .filter(Boolean);
};

const buildItem = (catalogueWrapper) => {
    const catalogue = catalogueWrapper?.catalogue || {};
    const tags = catalogueWrapper?.catalogueTags || [];
    const { price, min_price, max_price } = getPriceRange(
        catalogueWrapper?.variantWrappers
    );

    return {
        id: catalogue?.catalogueId || "",
        temp_id: catalogue?.tempReferenceId || "",
        name: catalogue?.name || "",
        description: catalogue?.description || "",
        price,
        min_price,
        max_price,
        is_veg: tags.includes("egg") ? "EGG" : tags.includes("non-veg") ? "NON_VEG" : "VEG",
        packing_charges: 0,
        media: catalogue?.media || [],
        variants: parseItemVariants(catalogueWrapper),
        meatTypes: catalogue?.meatTypes
    };
};

export const parseZomatoCatalogueMenu = (data) => {
    const categoryWrappers = data?.categoryWrappers || [];
    const catalogueWrappers = data?.catalogueWrappers || [];
    const catalogueLookup = buildCatalogueLookup(catalogueWrappers);

    return categoryWrappers.map((categoryWrapper) => {
        const category = categoryWrapper?.category || {};
        const subCategoryWrappers = categoryWrapper?.subCategoryWrappers || [];

        return {
            id: category?.categoryId || "",
            temp_id: "",
            name: category?.name || "",

            sub_category: subCategoryWrappers.map((subWrapper) => {
                const subCategory = subWrapper?.subCategory || {};
                const entities = subWrapper?.subCategoryEntities || [];

                const items = entities
                    .filter((entity) => entity?.entityType === "catalogue")
                    .map((entity) => catalogueLookup.get(entity?.entityId))
                    .filter(Boolean)
                    .map(buildItem);

                return {
                    id: subCategory?.subCategoryId || "",
                    temp_id: "",
                    name: subCategory?.name?.trim() || "nota",
                    items,
                };
            }),
        };
    });
};

export async function GET(req, { params }) {
    try {
        await dbConnect();
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

        const menu =
            result?.data?.data?.menuResponse ??
            result?.data?.menuResponse ??
            null;

        const parsedMenu = parseZomatoCatalogueMenu(menu);
        const savedMenu = await Menu.findOneAndUpdate(
            { resId, platform: "zomato" },
            { resId, platform: "zomato", menu: parsedMenu, updatedAt: new Date() },
            { new: true, upsert: true }
        );

        console.log("savedMenu", savedMenu)
        return NextResponse.json(
            {
                success: true,
                message: "Menu fetched successfully",
                data: savedMenu,
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