"use client";
import MenuItemRow from "../menu-item-card";

export default function AllItemsList({ menuData, updateItem, deleteItem, moveItem }) {
    const allItems = [];
    if (Array.isArray(menuData)) {
        menuData.forEach((cat) => {
            if (cat.sub_category) {
                cat.sub_category.forEach((sub) => {
                    if (sub.items) {
                        sub.items.forEach((item) => {
                            allItems.push({
                                ...item,
                                _parentCategoryId: cat.id,
                                _parentSubCategoryId: sub.id,
                            });
                        });
                    }
                });
            }
        });
    }

    return (
        <div className="flex h-full flex-1 flex-col border-x bg-background/50 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b bg-background px-6 py-4">
                <div>
                    <h2 className="text-xl font-semibold">All Items</h2>
                    <p className="text-sm text-muted-foreground">
                        {allItems.length} total items
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {allItems.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        No items found across any categories.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {allItems
                            .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                            .map((item) => (
                                <MenuItemRow
                                    key={item.id}
                                    item={item}
                                    categories={menuData}
                                    isAllItemsView={true}
                                    onChange={(updatedItem) => {
                                        if (updatedItem._parentSubCategoryId && updatedItem._parentSubCategoryId !== item._parentSubCategoryId) {
                                            moveItem({
                                                itemId: item.id,
                                                sourceSubCategoryId: item._parentSubCategoryId,
                                                targetSubCategoryId: updatedItem._parentSubCategoryId
                                            });
                                        } else {
                                            updateItem({
                                                itemId: item.id,
                                                updates: updatedItem,
                                            });
                                        }
                                    }}
                                    onDelete={() =>
                                        deleteItem({
                                            itemId: item.id,
                                        })
                                    }
                                />
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
