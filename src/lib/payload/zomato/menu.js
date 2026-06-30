import { getUpdatedCatalogueData } from "./catalogue";
import { getUpdatedCategoryData } from "./category";

export const buildMenuEntityTaxes = (dbMenu = []) => {
    const taxes = [];
    dbMenu.forEach(cat => {
        if (cat.status === "delete" || cat.status === "deleted") return;
        (cat.sub_category || []).forEach(sub => {
            if (sub.status === "delete" || sub.status === "deleted") return;
            (sub.items || []).forEach(item => {
                if (item.status === "delete" || item.status === "deleted") return;

                const idStr = String(item.id);
                if (idStr.startsWith("temp-")) {
                    taxes.push({
                        entityType: "CATALOGUE",
                        tempReferenceId: idStr.replace("temp-", ""),
                        taxGroupIds: [1],
                        entityTaxes: []
                    });
                } else {
                    taxes.push({
                        entityType: "CATALOGUE",
                        entityId: idStr,
                        taxGroupIds: [1],
                        entityTaxes: []
                    });
                }
            });
        });
    });
    return taxes;
};

export const buildZomatoMenuPayload = (menu, originalDbMenu = []) => {
    if (!menu) return {};

    const catalogueWrappersForCheck = menu.catalogueWrappers || [];
    const dbMenu = originalDbMenu.map(cat => ({
        ...cat,
        sub_category: (cat.sub_category || []).map(sub => ({
            ...sub,
            items: (sub.items || []).map(item => {
                if (String(item.id).startsWith("temp-")) return item;

                const wrapper = catalogueWrappersForCheck.find(w => String(w.catalogue?.catalogueId) === String(item.id));
                if (!wrapper) return item;

                const hadProperties = !!wrapper.catalogue?.hasProperties;
                const activeVariants = (item.variants || []).filter(p => p.status !== 'delete' && p.status !== 'deleted');
                const hasPropertiesNow = activeVariants.length > 0;

                if (hadProperties !== hasPropertiesNow) {
                    return { ...item, id: `temp-rebuild-${item.id}` };
                }
                return item;
            })
        }))
    }));

    const catalogueWrappers = getUpdatedCatalogueData?.(menu.catalogueWrappers ?? [], dbMenu) ?? menu.catalogueWrappers ?? [];
    
    return {
        menuEntityTaxes: buildMenuEntityTaxes(dbMenu),
        menuEntityCharges: menu.menuEntityCharges ?? [],

        categoryWrappers:
            getUpdatedCategoryData?.(menu.categoryWrappers ?? [], dbMenu, String(menu.resId || "")) ??
            menu.categoryWrappers ??
            [],

        catalogueWrappers: catalogueWrappers,

        modifierGroupWrappers: [],
        resDisclaimers: menu.resDisclaimers ?? [],
        requestedModerationData: Object.keys(menu.requestedModerationData || {}).length > 0 ? menu.requestedModerationData : { variantPrices: [] },
        contentCombos: menu.contentCombos ?? [],
        disclaimers: menu.disclaimers ?? [],
        resId: menu.resId ? String(menu.resId) : "",
        requestMetadata: menu.requestMetadata ?? {},
    };
};