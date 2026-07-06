import { getUpdatedCatalogueData } from "./catalogue";
import { getUpdatedCategoryData } from "./category";

export const buildModifierGroupWrappers = (addons = [], resId) => {
    if (!addons || addons.length === 0) return [];
    
    // Create modifier groups from addons
    return addons.map(addon => {
        let mgId = String(addon.id);
        let isNewMg = mgId.startsWith("temp-");
        if (isNewMg) mgId = mgId.replace("temp-", "");

        const variantMaps = (addon.options || []).map((option, idx) => {
            let optId = String(option.id);
            let isNewOpt = optId.startsWith("temp-");
            if (isNewOpt) optId = optId.replace("temp-", "");

            const mapObj = { order: idx + 1 };
            
            if (option.map_id && !String(option.map_id).startsWith("temp-")) {
                mapObj.id = option.map_id;
            }

            if (isNewOpt) {
                mapObj.tempReferenceId = optId;
            } else {
                mapObj.variantId = optId;
            }

            if (!isNewMg) {
                mapObj.modifierGroupId = mgId;
            }

            return mapObj;
        });

        return {
            modifierGroup: {
                modifierGroupId: isNewMg ? "" : mgId,
                ...(isNewMg && { tempReferenceId: mgId }),
                ...(resId && !isNewMg && { resId: String(resId) }),
                name: addon.name,
                min: addon.min || 0,
                max: addon.max || 1,
                displayName: addon.name,
                maxSelectionsPerItem: addon.allow_multiple ? (addon.max_per_item || 1) : 1,
                isCompulsory: (addon.min || 0) > 0
            },
            variantModifierGroupMaps: variantMaps
        };
    });
};

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

export const buildAddonEntityTaxes = (addons = []) => {
    const taxes = [];
    addons.forEach(addon => {
        (addon.options || []).forEach(option => {
            const idStr = String(option.id);
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
    return taxes;
};

export const buildAddonCatalogueWrappers = (addons = [], resId) => {
    if (!addons || addons.length === 0) return [];
    const wrappers = [];
    
    addons.forEach(addon => {
        (addon.options || []).forEach(option => {
            const optId = String(option.id).replace("temp-", "");
            const isNew = String(option.id).startsWith("temp-");
            const catalogueId = isNew ? optId : (option.catalogue_id ? String(option.catalogue_id) : optId);
            
            const tagsWithStatus = [];
            if (option.is_veg === "VEG") {
                tagsWithStatus.push({ slug: "veg", tagId: 1 });
            } else if (option.is_veg === "NON_VEG") {
                tagsWithStatus.push({ slug: "non-veg", tagId: 2 });
            } else if (option.is_veg === "EGG") {
                tagsWithStatus.push({ slug: "egg", tagId: 3 });
            }
            const catalogueTags = tagsWithStatus.map(t => t.slug);

            wrappers.push({
                catalogue: {
                    ...(isNew ? { tempReferenceId: catalogueId } : { catalogueId: catalogueId }),
                    resId: String(resId),
                    name: option.name,
                    hasProperties: false,
                    ...(isNew && { isVisible: false }),
                    media: [],
                    isRefrigerationRequired: false,
                    ...(!isNew && { tagsWithStatus: tagsWithStatus })
                },
                catalogueTags: catalogueTags,
                variantWrappers: [
                    {
                        variant: {
                            ...(isNew ? { tempReferenceId: optId } : {
                                variantId: optId,
                                turnOnTime: "2026-07-03 18:12:29",
                                catalogueId: catalogueId
                            })
                        },
                        variantModifierGroupMaps: [],
                        variantPrices: [
                            {
                                isVisible: true,
                                service: "delivery",
                                ...(isNew ? { tempReferenceId: crypto.randomUUID().replace(/-/g, '').toUpperCase() } : {
                                    variantId: optId,
                                    maxAllowedPrice: (option.price || 0) + 50,
                                    basePrice: option.price || 0
                                }),
                                price: option.price || 0
                            }
                        ]
                    }
                ]
            });
        });
    });
    
    return wrappers;
};

export const buildZomatoMenuPayload = (menu, originalDbMenu = [], originalDbAddons = []) => {
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
    
    // Append Addon options as catalogue items
    const addonCatalogueWrappers = buildAddonCatalogueWrappers(originalDbAddons, menu.resId);
    const finalCatalogueWrappers = [...catalogueWrappers, ...addonCatalogueWrappers];

    const baseTaxes = buildMenuEntityTaxes(dbMenu);
    // Addons catalogue does not need taxes added
    // const addonTaxes = buildAddonEntityTaxes(originalDbAddons);

    return {
        menuEntityTaxes: [...baseTaxes],
        menuEntityCharges: menu.menuEntityCharges ?? [],

        categoryWrappers:
            getUpdatedCategoryData?.(menu.categoryWrappers ?? [], dbMenu, String(menu.resId || "")) ??
            menu.categoryWrappers ??
            [],

        catalogueWrappers: finalCatalogueWrappers,

        modifierGroupWrappers: buildModifierGroupWrappers(originalDbAddons, menu.resId),
        resDisclaimers: menu.resDisclaimers ?? [],
        requestedModerationData: Object.keys(menu.requestedModerationData || {}).length > 0 ? menu.requestedModerationData : { variantPrices: [] },
        contentCombos: menu.contentCombos ?? [],
        disclaimers: menu.disclaimers ?? [],
        resId: menu.resId ? String(menu.resId) : "",
        requestMetadata: menu.requestMetadata ?? {},
    };
};