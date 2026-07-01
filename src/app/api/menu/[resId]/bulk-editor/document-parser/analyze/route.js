import Document from "@/model/document";
import Menu from "@/model/menu";
import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { extractMenuFromImage } from "@/services/ai/menu-extraction";

export async function POST(req) {
    try {
        await dbConnect();

        const { resId, pageNumber, pdfUrl } = await req.json();

        if (!resId || !pageNumber || !pdfUrl) {
            return NextResponse.json(
                { success: false, message: "resId, pageNumber and pdfUrl are required" },
                { status: 400 }
            );
        }

        const fileResponse = await fetch(pdfUrl);
        if (!fileResponse.ok) {
            throw new Error(`Failed to download document asset from URL: ${pdfUrl}`);
        }
        const arrayBuffer = await fileResponse.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);

        const contentType = fileResponse.headers.get("content-type") || "image/jpeg";
        const extractedMenu = await extractMenuFromImage(imageBuffer, contentType);

        let categoriesArray = [];
        if (Array.isArray(extractedMenu)) {
            categoriesArray = extractedMenu;
        } else if (extractedMenu && Array.isArray(extractedMenu.categories)) {
            categoriesArray = extractedMenu.categories;
        }

        const categoriesWithIds = categoriesArray.map(category => {
            let subCategories = category.sub_category || [];
            
            // If AI returned items directly at the category level, wrap them in a subcategory
            if (category.items && category.items.length > 0) {
                subCategories.push({
                    name: category.name || "General",
                    items: category.items
                });
                delete category.items;
            }

            return {
                ...category,
                id: `temp-${crypto.randomUUID()}`,
                sub_category: subCategories.map(sub => ({
                    ...sub,
                    id: `temp-${crypto.randomUUID()}`,
                    items: (sub.items || []).map(item => ({
                        ...item,
                        id: `temp-${crypto.randomUUID()}`,
                        variants: (item.variants || []).map(variant => ({
                            ...variant,
                            id: `temp-${crypto.randomUUID()}`,
                            options: (variant.options || []).map(opt => ({
                                ...opt,
                                id: `temp-${crypto.randomUUID()}`
                            }))
                        }))
                    }))
                }))
            };
        });

        const finalExtractedMenu = Array.isArray(extractedMenu) ? categoriesWithIds : { ...extractedMenu, categories: categoriesWithIds };

        const result = await Document.updateOne(
            { resId, "pages.pageNumber": pageNumber },
            {
                $set: {
                    "pages.$.parsedData": finalExtractedMenu,
                    "pages.$.processedAt": new Date(),
                    "pages.$.status": "completed",
                },
                $inc: { processedPages: 1 },
            }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: "Page not found in document" },
                { status: 404 }
            );
        }

        const updatedDocument = await Document.findOne({ resId });
        if (updatedDocument && updatedDocument.processedPages >= updatedDocument.totalPages) {
            const newCategories = [];

            updatedDocument.pages.forEach(page => {
                let catArray = [];
                if (Array.isArray(page.parsedData)) {
                    catArray = page.parsedData;
                } else if (page.parsedData && Array.isArray(page.parsedData.categories)) {
                    catArray = page.parsedData.categories;
                }
                newCategories.push(...catArray);
            });

            const existingMenuDoc = await Menu.findOne({ resId });
            let existingMenu = [];
            if (existingMenuDoc && Array.isArray(existingMenuDoc.menu)) {
                existingMenu = existingMenuDoc.menu;
            }

            // Deep merge newCategories into existingMenu by Name
            newCategories.forEach(newCat => {
                const existingCat = existingMenu.find(c => c.name?.toLowerCase() === newCat.name?.toLowerCase());
                if (existingCat) {
                    // Merge subcategories
                    (newCat.sub_category || []).forEach(newSub => {
                        if (!existingCat.sub_category) existingCat.sub_category = [];
                        const existingSub = existingCat.sub_category.find(s => s.name?.toLowerCase() === newSub.name?.toLowerCase());
                        
                        if (existingSub) {
                            // Merge items
                            if (!existingSub.items) existingSub.items = [];
                            existingSub.items.push(...(newSub.items || []));
                        } else {
                            // Add new subcategory
                            existingCat.sub_category.push(newSub);
                        }
                    });
                } else {
                    // Add entirely new category
                    existingMenu.push(newCat);
                }
            });

            await Menu.updateOne(
                { resId },
                { $set: { menu: existingMenu } },
                { upsert: true }
            );
        }

        return NextResponse.json({ success: true, pageNumber });
    } catch (error) {
        console.error("Menu parser error:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Something went wrong" },
            { status: 500 }
        );
    }
}