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
                base_price: 0,
                description: "",
                is_veg: "VEG",
                is_available: true,
                variants: [],
            },
        });
    };

    return (
        <div className="flex h-full flex-1 flex-col border-x bg-background/50 backdrop-blur-xl relative">
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
                        <div className="space-y-4 pb-20">
                            {[...visibleItems]
                                .map((item) => (
                                    <MenuItemRow
                                        key={item.id}
                                        item={item}
                                        onChange={(updatedItem) =>
                                            updateCatalogue(item.id, updatedItem)
                                        }
                                        onDelete={() =>
                                            deleteItem(item.id)
                                        }
                                    />
                                ))}
                        </div>
                    );
                })()}
            </div>

            {activeSubCategoryData && (
                <Button
                    onClick={handleAddItem}
                    className="absolute bottom-6 right-6 h-12 rounded-full px-6 shadow-xl shadow-primary/20 gap-2 z-10"
                >
                    <UtensilsCrossed className="h-4 w-4" />
                    Add Item
                </Button>
            )}
        </div>
    );
}