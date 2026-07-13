import { useMemo } from "react";
import AllItemsList from "../item-view/all-items-list";
import PriceEditor from "./views/PriceEditor";
import DescriptionEditor from "./views/DescriptionEditor";
import ImageEditor from "./views/ImageEditor";
import UploadMenuEditor from "./views/UploadMenuEditor";
import TransferMenuEditor from "./views/TransferMenuEditor";
import StructureEditor from "./views/StructureEditor";
import AddonsBuilder from "./views/AddonsBuilder";
import ExportImagesEditor from "./views/ExportImagesEditor";
import HoldItemsEditor from "./views/HoldItemsEditor";

export default function BulkEditorRouter({ 
    activeBulkMode, 
    menuData, 
    updateItem, 
    deleteItem, 
    moveItem 
}) {
    const filteredMenuData = useMemo(() => {
        if (!Array.isArray(menuData)) return [];
        return menuData
            .filter(c => c.status !== 'delete' && c.status !== 'deleted')
            .map(cat => ({
                ...cat,
                sub_category: (cat.sub_category || [])
                    .filter(s => s.status !== 'delete' && s.status !== 'deleted')
                    .map(sub => ({
                        ...sub,
                        items: (sub.items || [])
                            .filter(i => i.status !== 'delete' && i.status !== 'deleted')
                            .map(item => ({
                                ...item,
                                variants: (item.variants || []).filter(v => v.status !== 'delete' && v.status !== 'deleted')
                            }))
                    }))
            }));
    }, [menuData]);

    const allItems = useMemo(() => {
        return filteredMenuData.flatMap(cat => 
            (cat.sub_category || []).flatMap(sub => 
                (sub.items || []).map(item => ({
                    ...item,
                    _parentSubCategoryId: sub.id,
                    _parentSubCategoryName: sub.name,
                    _parentCategoryName: cat.name
                }))
            )
        );
    }, [filteredMenuData]);

    switch (activeBulkMode) {
        case "PRICE":
            return <PriceEditor allItems={allItems} updateItem={updateItem} />;
        case "DESCRIPTION":
            return <DescriptionEditor allItems={allItems} updateItem={updateItem} />;
        case "IMAGE":
            return <ImageEditor allItems={allItems} updateItem={updateItem} />;
        case "UPLOAD":
            return <UploadMenuEditor />;
        case "TRANSFER":
            return <TransferMenuEditor />;
        case "STRUCTURE":
            return <StructureEditor menuData={filteredMenuData} />;
        case "ADDONS":
            return <AddonsBuilder />;
        case "HOLD_ITEMS":
            return <HoldItemsEditor allItems={allItems} updateItem={updateItem} deleteItem={deleteItem} categories={filteredMenuData} />;
        case "EXPORT_IMAGES":
            return <ExportImagesEditor allItems={allItems} />;
        case "FULL":
        default:
            return (
                <AllItemsList 
                    menuData={filteredMenuData}
                    updateItem={updateItem}
                    deleteItem={deleteItem}
                    moveItem={moveItem}
                />
            );
    }
}
