"use client";
import { Button } from "@/components/ui/button";
import {
    UtensilsCrossed,
} from "lucide-react";
import MenuItemRow from "../menu-item-card";

export default function MenuItemList({
    activeSubCategoryData,
    addItem,
    updateCatalogue,
    deleteItem,
}) {

    const handleAddItem = () => {
        if (!activeSubCategoryData?.id) return;

        addItem({
            subCategoryId: activeSubCategoryData.id,
            item: {
                name: "New Item",
                price: 0,
                description: "",
                is_veg: "VEG",
                is_available: true,
                variants: [],
            },
        });
    };

    return (
        <div className="flex h-full flex-1 flex-col border-x bg-background/50 backdrop-blur-xl">
            {activeSubCategoryData && (
                <div className="flex items-center justify-between border-b bg-background px-6 py-4">
                    <div>
                        <h2 className="text-xl font-semibold">
                            {activeSubCategoryData.name || "Items"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {activeSubCategoryData.items?.length ?? 0} item
                            {(activeSubCategoryData.items?.length ?? 0) !== 1 && "s"}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={handleAddItem}
                            className="gap-2"
                        >
                            <UtensilsCrossed className="h-4 w-4" />
                            Add Item
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-3">
                {!activeSubCategoryData ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Select a subcategory to view items.
                    </div>
                ) : (() => {
                    const visibleItems = activeSubCategoryData.items?.filter(item => item.status !== 'delete' && item.status !== 'deleted') || [];
                    if (visibleItems.length === 0) {
                        return (
                            <div className="flex h-full items-center justify-center text-muted-foreground">
                                No items found. Click <b className="mx-1">Add Item</b> to create
                                one.
                            </div>
                        );
                    }
                    return (
                        <div className="space-y-4">
                            {[...visibleItems]
                                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                                .map((item) => (
                                    <MenuItemRow
                                        key={item.id}
                                        item={item}
                                        onChange={(updatedItem) =>
                                            updateCatalogue({
                                                itemId: item.id,
                                                updates: updatedItem,
                                            })
                                        }
                                        onDelete={() =>
                                            deleteItem({
                                                itemId: item.id,
                                            })
                                        }
                                />
                            ))}
                        </div>
                    );
                })()}
            </div>
        </div>
    );
}