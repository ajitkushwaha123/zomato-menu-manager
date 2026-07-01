import { useMemo } from "react";
import AllItemsList from "../item-view/all-items-list";
import PriceEditor from "./views/PriceEditor";
import DescriptionEditor from "./views/DescriptionEditor";
import ImageEditor from "./views/ImageEditor";
import UploadMenuEditor from "./views/UploadMenuEditor";

export default function BulkEditorRouter({ 
    activeBulkMode, 
    menuData, 
    updateItem, 
    deleteItem, 
    moveItem 
}) {
    const allItems = useMemo(() => {
        if (!Array.isArray(menuData)) return [];
        return menuData.flatMap(cat => 
            (cat.sub_category || []).flatMap(sub => 
                (sub.items || []).map(item => ({
                    ...item,
                    _parentSubCategoryId: sub.id,
                    _parentSubCategoryName: sub.name,
                    _parentCategoryName: cat.name
                }))
            )
        );
    }, [menuData]);

    switch (activeBulkMode) {
        case "PRICE":
            return <PriceEditor allItems={allItems} updateItem={updateItem} />;
        case "DESCRIPTION":
            return <DescriptionEditor allItems={allItems} updateItem={updateItem} />;
        case "IMAGE":
            return <ImageEditor allItems={allItems} updateItem={updateItem} />;
        case "UPLOAD":
            return <UploadMenuEditor />;
        case "FULL":
        default:
            return (
                <AllItemsList 
                    menuData={menuData}
                    updateItem={updateItem}
                    deleteItem={deleteItem}
                    moveItem={moveItem}
                />
            );
    }
}
