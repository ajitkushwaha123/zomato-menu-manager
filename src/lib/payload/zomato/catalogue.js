import { generateTempReferenceId } from "./helper";

export function buildCataloguePayload(wrapper) {
    if (!wrapper) return null;
    return {
        catalogue: wrapper.catalogue || {},
        cataloguePropertyWrappers: wrapper.cataloguePropertyWrappers || [],
        variantWrappers: wrapper.variantWrappers || [],
        catalogueTags: wrapper.catalogueTags || [],
        mapModifierGroupOrder: wrapper.mapModifierGroupOrder || {}
    };
}

export function buildCatalogueTagsBuilder(newItem) {
    let catalogueTags = [];
    if (newItem.is_veg !== undefined) {
        if (newItem.is_veg === "EGG") {
            catalogueTags.push("egg", "sf-kid-friendly", "sf-not-vegan");
        } else {
            const isNonVeg = newItem.is_veg === false || newItem.is_veg === "NON_VEG" || newItem.is_veg === "NON-VEG";
            catalogueTags.push(isNonVeg ? "non-veg" : "veg");
        }
    } else {
        catalogueTags.push("veg");
    }
    catalogueTags.push("services");
    return catalogueTags;
}

export function buildCategoryPropertyWrappersBuilder(properties, catalogueId) {
    const propertyWrappers = [];
    let allOptionsArrays = [];

    properties.forEach((property, propertyIndex) => {
        const propertyId = generateTempReferenceId();
        const values = property.options || property.values || [];
        let optionsForCombo = [];

        const propertyValues = values.map((value, valueIndex) => {
            let tempRef = generateTempReferenceId();
            optionsForCombo.push({
                ...value,
                tempReferenceId: tempRef
            });
            return {
                value: value.option_name || value.label || value.name || value.value,
                order: valueIndex + 1,
                tempReferenceId: tempRef,
            };
        });

        let newCatProp = {
            tempReferenceId: propertyId,
            name: property.property_name || property.name,
            order: propertyIndex + 1,
        };
        if (catalogueId) {
            newCatProp.catalogueId = catalogueId;
        }

        propertyWrappers.push({
            catalogueProperty: newCatProp,
            cataloguePropertyValues: propertyValues,
        });

        if (optionsForCombo.length > 0) {
            allOptionsArrays.push(optionsForCombo);
        }
    });

    return { propertyWrappers, allOptionsArrays };
}

export function buildVariantWrappersBuilder(properties, allOptionsArrays, newItem) {
    const variantWrappers = [];

    if (allOptionsArrays.length > 0) {
        const cartesianProduct = (arrays) => {
            if (!arrays || arrays.length === 0) return [];
            return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]]);
        };

        const combinations = cartesianProduct(allOptionsArrays);
        combinations.forEach((combo) => {
            let variantPropertyValues = combo.map(opt => ({
                tempReferenceId: opt.tempReferenceId
            }));

            let price = combo.reduce((sum, opt) => sum + (opt.price || 0), 0);
            if (properties.length === 1) {
                price = combo[0].price ?? newItem.price ?? 0;
            }

            const varId = generateTempReferenceId();
            const variantModifierGroupMaps = (newItem.addons || []).map((addonId, idx) => {
                const mgIdStr = String(addonId);
                const isNewMg = mgIdStr.startsWith("temp-");
                const cleanMgId = mgIdStr.replace("temp-", "");

                return {
                    modifierGroupId: isNewMg ? "" : cleanMgId,
                    ...(isNewMg && { tempReferenceId: cleanMgId }),
                    order: idx + 1,
                    variantIsParent: true
                };
            });

            variantWrappers.push({
                variant: {
                    tempReferenceId: varId,
                },
                variantModifierGroupMaps: variantModifierGroupMaps,
                variantPropertyValues: variantPropertyValues,
                variantPrices: [
                    {
                        isVisible: true,
                        service: "delivery",
                        tempReferenceId: generateTempReferenceId(),
                        price: price,
                    },
                ],
            });
        });
    }

    if (properties.length === 0) {
        const varId = generateTempReferenceId();
        const variantModifierGroupMaps = (newItem.addons || []).map((addonId, idx) => {
            const mgIdStr = String(addonId);
            const isNewMg = mgIdStr.startsWith("temp-");
            const cleanMgId = mgIdStr.replace("temp-", "");

            return {
                modifierGroupId: isNewMg ? "" : cleanMgId,
                ...(isNewMg && { tempReferenceId: cleanMgId }),
                order: idx + 1,
                variantIsParent: true
            };
        });

        variantWrappers.push({
            variant: {
                tempReferenceId: varId,
            },
            variantModifierGroupMaps: variantModifierGroupMaps,
            variantPrices: [
                {
                    isVisible: true,
                    service: "delivery",
                    tempReferenceId: generateTempReferenceId(),
                    price: newItem.price ?? 0,
                },
            ],
        });
    }

    return variantWrappers;
}

export function buildNewCatalogueItemBuilder(newItem, resId) {
    const itemTempId = String(newItem.id).replace("temp-", "");
    let properties = newItem.variants || newItem.properties || [];
    properties = properties.filter(p => p.status !== 'delete' && p.status !== 'deleted').slice(0, 1);

    const { propertyWrappers, allOptionsArrays } = buildCategoryPropertyWrappersBuilder(properties, null);
    const variantWrappers = buildVariantWrappersBuilder(properties, allOptionsArrays, newItem);
    const catalogueTags = buildCatalogueTagsBuilder(newItem);

    return {
        catalogue: {
            tempReferenceId: itemTempId,
            resId: resId,
            name: newItem.name,
            hasProperties: propertyWrappers.length > 0,
            isVisible: true,
            media: newItem.media || [],
            description: newItem.description || "",
            isRefrigerationRequired: false,
            ...((newItem.is_veg === false || newItem.is_veg === "NON_VEG" || newItem.is_veg === "NON-VEG") ? { meatTypes: (newItem.meatTypes && newItem.meatTypes.length > 0) ? newItem.meatTypes : ["chicken"] } : {}),
        },
        catalogueTags: catalogueTags,
        cataloguePropertyWrappers: propertyWrappers,
        variantWrappers: variantWrappers,
        mapModifierGroupOrder: {}
    };
}

export function buildNewAddonCatalogueItemBuilder(addonOption, resId, variantTempId) {
    const itemTempId = addonOption.id ? String(addonOption.id).replace("temp-", "") : generateTempReferenceId();
    const vTempId = variantTempId || generateTempReferenceId();

    let catalogueTags = [];
    if (addonOption.is_veg === "EGG") {
        catalogueTags.push("egg", "sf-kid-friendly", "sf-not-vegan");
    } else {
        const isNonVeg = addonOption.is_veg === false || addonOption.is_veg === "NON_VEG" || addonOption.is_veg === "NON-VEG";
        catalogueTags.push(isNonVeg ? "non-veg" : "veg");
    }

    return {
        catalogue: {
            tempReferenceId: itemTempId,
            resId: resId,
            name: addonOption.name || "",
            hasProperties: false,
            isVisible: false,
            media: [],
            isRefrigerationRequired: false
        },
        catalogueTags: catalogueTags,
        variantWrappers: [
            {
                variant: {
                    tempReferenceId: vTempId
                },
                variantModifierGroupMaps: [],
                variantPrices: [
                    {
                        isVisible: true,
                        service: "delivery",
                        tempReferenceId: generateTempReferenceId(),
                        price: addonOption.price || 0
                    }
                ]
            }
        ]
    };
}

export function buildModifierGroupBuilder(modifierGroup, optionsVariantIds = []) {
    const groupId = modifierGroup.id && !String(modifierGroup.id).startsWith("temp-") ? String(modifierGroup.id) : "";
    const tempReferenceId = modifierGroup.tempReferenceId || generateTempReferenceId();

    return {
        modifierGroup: {
            modifierGroupId: groupId,
            ...(groupId ? {} : { tempReferenceId: tempReferenceId }),
            name: modifierGroup.name || "",
            displayName: modifierGroup.displayName || modifierGroup.name || "",
            min: modifierGroup.min || 0,
            max: modifierGroup.max || 1,
            maxSelectionsPerItem: modifierGroup.max_per_item || 1,
            isCompulsory: modifierGroup.is_compulsory || (modifierGroup.min || 0) > 0
        },
        variantModifierGroupMaps: optionsVariantIds.map((optIdObj, index) => {
            const map = { order: index + 1 };
            if (optIdObj.variantId) {
                map.variantId = optIdObj.variantId;
            }
            if (optIdObj.tempReferenceId) {
                map.tempReferenceId = optIdObj.tempReferenceId;
            }
            return map;
        })
    };
}

export function updateCatalogueBase(wrapper, dbItem) {
    let newWrapper = { ...wrapper };
    newWrapper.catalogue = {
        ...newWrapper.catalogue,
        name: dbItem.name || newWrapper.catalogue.name,
        description: dbItem.description !== undefined ? dbItem.description : newWrapper.catalogue.description,
        media: dbItem?.media || []
    };

    if (dbItem.is_veg !== undefined) {
        if (dbItem.is_veg === "EGG") {
            delete newWrapper.catalogue.meatTypes;
            newWrapper.catalogueTags = ["services", "sf-kid-friendly", "sf-not-vegan", "egg"];
        } else {
            const isNonVeg = dbItem.is_veg === false || dbItem.is_veg === "NON_VEG" || dbItem.is_veg === "NON-VEG";
            if (isNonVeg) {
                newWrapper.catalogue.meatTypes = (dbItem.meatTypes && dbItem.meatTypes.length > 0) ? dbItem.meatTypes : ["chicken"];
                newWrapper.catalogueTags = ["non-veg", "services"];
            } else {
                delete newWrapper.catalogue.meatTypes;
                newWrapper.catalogueTags = ["veg", "services"];
            }
        }
    }

    return newWrapper;
}

export function updatePropertyWrappers(existingPropWrappers, dbItem, hasNewProperty, catalogueId) {
    let updatedPropWrappers = [];
    let allOptionsArrays = [];

    const properties = (dbItem.variants || []).filter(p => p.status !== 'delete' && p.status !== 'deleted').slice(0, 1);

    properties.forEach((dbProp, propIndex) => {
        let propId = String(dbProp.property_id || "");
        let existingProp = !hasNewProperty && propId && !propId.startsWith("temp-")
            ? existingPropWrappers.find(p => String(p.catalogueProperty?.propertyId) === propId)
            : null;

        let finalPropId = existingProp ? existingProp.catalogueProperty.propertyId : "";
        let propTempRefId = existingProp ? existingProp.catalogueProperty.tempReferenceId : generateTempReferenceId();

        let propertyValues = [];
        let optionsForCombo = [];

        (dbProp.options || []).forEach((dbOpt, optIndex) => {
            let optId = String(dbOpt.option_id || "");
            let existingOptValue = null;
            if (existingProp && optId && !optId.startsWith("temp-")) {
                existingOptValue = existingProp.cataloguePropertyValues?.find(v => String(v.propertyValueId) === optId);
            }

            let finalOptValueId = existingOptValue ? existingOptValue.propertyValueId : "";
            let optTempRefId = existingOptValue ? (existingOptValue.tempReferenceId || generateTempReferenceId()) : generateTempReferenceId();

            let newPropValue = {
                ...(existingOptValue || {}),
                value: dbOpt.option_name || dbOpt.label,
                order: optIndex + 1,
            };
            if (finalOptValueId) {
                newPropValue.propertyValueId = finalOptValueId;
            } else {
                newPropValue.tempReferenceId = optTempRefId;
                delete newPropValue.propertyValueId;
            }
            propertyValues.push(newPropValue);

            optionsForCombo.push({
                ...dbOpt,
                propertyValueId: finalOptValueId,
                tempReferenceId: optTempRefId
            });
        });

        let newCatProp = {
            ...(existingProp ? existingProp.catalogueProperty : {}),
            name: dbProp.property_name || dbProp.name,
            order: propIndex + 1
        };
        if (catalogueId) {
            newCatProp.catalogueId = catalogueId;
        }
        if (finalPropId) {
            newCatProp.propertyId = finalPropId;
        } else {
            newCatProp.tempReferenceId = propTempRefId;
            delete newCatProp.propertyId;
        }

        updatedPropWrappers.push({
            ...(existingProp || {}),
            catalogueProperty: newCatProp,
            cataloguePropertyValues: propertyValues
        });

        if (optionsForCombo.length > 0) {
            allOptionsArrays.push(optionsForCombo);
        }
    });

    return { updatedPropWrappers, allOptionsArrays };
}

export function updateVariantWrappers(existingVarWrappers, dbItem, allOptionsArrays, catalogueId, hasNewProperty) {
    let updatedVarWrappers = [];
    const cartesianProduct = (arrays) => {
        if (!arrays || arrays.length === 0) return [];
        return arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]]);
    };

    const properties = (dbItem.variants || []).filter(p => p.status !== 'delete' && p.status !== 'deleted').slice(0, 1);

    if (allOptionsArrays.length > 0) {
        const combinations = cartesianProduct(allOptionsArrays);
        combinations.forEach((combo) => {
            let varIdStr = "";
            if (properties.length === 1) {
                varIdStr = String(combo[0].variant_id || "");
            }

            let existingVar = !hasNewProperty && varIdStr && !varIdStr.startsWith("temp-")
                ? existingVarWrappers.find(v => String(v.variant?.variantId) === varIdStr)
                : null;

            let finalVarId = existingVar ? existingVar.variant.variantId : "";
            let varTempRefId = existingVar ? (existingVar.variant.tempReferenceId || generateTempReferenceId()) : generateTempReferenceId();

            let variantPropertyValues = combo.map(opt => {
                let vpv = {};
                if (opt.propertyValueId) {
                    vpv.propertyValueId = opt.propertyValueId;
                } else {
                    vpv.tempReferenceId = opt.tempReferenceId;
                }

                if (existingVar && existingVar.variantPropertyValues) {
                    const existingVpv = existingVar.variantPropertyValues.find(evpv => 
                        (evpv.propertyValueId && evpv.propertyValueId === vpv.propertyValueId) ||
                        (evpv.tempReferenceId && evpv.tempReferenceId === vpv.tempReferenceId)
                    );
                    if (existingVpv && existingVpv.id) {
                        vpv.id = existingVpv.id;
                    }
                }
                if (finalVarId) {
                    vpv.variantId = finalVarId;
                }

                return vpv;
            });

            let existingPrice = existingVar?.variantPrices?.[0] || null;

            let price = combo.reduce((sum, opt) => sum + (opt.price || 0), 0);
            if (properties.length === 1) {
                price = combo[0].price ?? 0;
            }

            let newVariant = {
                ...(existingVar ? existingVar.variant : {}),
                catalogueId: catalogueId
            };
            if (finalVarId) {
                newVariant.variantId = finalVarId;
            } else {
                newVariant.tempReferenceId = varTempRefId;
                delete newVariant.variantId;
            }

            let newPrice = {
                ...(existingPrice || {}),
                service: "delivery",
                isVisible: true,
                price: price,
                basePrice: price,
                maxAllowedPrice: price
            };
            if (finalVarId) {
                newPrice.variantId = finalVarId;
            }
            if (!existingPrice || !existingPrice.id) {
                newPrice.tempReferenceId = generateTempReferenceId();
                delete newPrice.id;
            }

            let variantModifierGroupMaps = (dbItem.addons || []).map((addonId, idx) => {
                let modGroupId = String(addonId);
                let isNew = modGroupId.startsWith("temp-");
                if (isNew) {
                    modGroupId = modGroupId.replace("temp-", "");
                }
                
                let existingMap = null;
                if (existingVar && existingVar.variantModifierGroupMaps) {
                    existingMap = existingVar.variantModifierGroupMaps.find(m => 
                        String(m.modifierGroupId) === modGroupId || (m.tempReferenceId && String(m.tempReferenceId) === modGroupId)
                    );
                }

                let mapObj = {
                    ...(existingMap || {}),
                    order: idx + 1,
                    variantIsParent: true,
                    modifierGroupId: isNew ? "" : modGroupId,
                    ...(!isNew && finalVarId && { variantId: finalVarId })
                };

                if (isNew) {
                    mapObj.tempReferenceId = modGroupId;
                    delete mapObj.id;
                } else if (!existingMap || (!existingMap.id && !existingMap.tempReferenceId)) {
                    // if it's an existing addon but a new map, omit tempReferenceId as per previous discussion
                    delete mapObj.id;
                }

                return mapObj;
            });

            updatedVarWrappers.push({
                ...(existingVar || {}),
                variant: newVariant,
                variantModifierGroupMaps: variantModifierGroupMaps,
                variantPropertyValues: variantPropertyValues,
                variantPrices: [newPrice]
            });
        });
    }
    return updatedVarWrappers;
}

export function updateBasePrices(variantWrappers, dbItem) {
    return variantWrappers.map(vWrapper => {
        let newVWrapper = { ...vWrapper };
        if (newVWrapper.variantPrices) {
            newVWrapper.variantPrices = newVWrapper.variantPrices.map(vp => ({
                ...vp,
                price: dbItem.price ?? vp.price,
                basePrice: dbItem.price ?? vp.basePrice,
                maxAllowedPrice: dbItem.price ?? vp.maxAllowedPrice,
            }));
        }
        return newVWrapper;
    });
}

export function getUpdatedCatalogueData(catalogueWrappers, dbMenu = []) {
    if (!Array.isArray(catalogueWrappers)) return [];

    const dbItemsMap = {};
    const newDbItems = [];

    dbMenu.forEach(cat => {
        const isCatDeleted = cat.status === 'delete' || cat.status === 'deleted';
        (cat.sub_category || []).forEach(sub => {
            const isSubDeleted = sub.status === 'delete' || sub.status === 'deleted';
            (sub.items || []).forEach(item => {
                const isItemDeleted = item.status === 'delete' || item.status === 'deleted';
                const effectiveStatus = (isCatDeleted || isSubDeleted || isItemDeleted) ? 'delete' : item.status;

                const existing = dbItemsMap[String(item.id)];
                if (existing && existing.status !== 'delete' && existing.status !== 'deleted' && effectiveStatus === 'delete') {
                    // Item is already active somewhere, don't overwrite with deleted state
                } else if (existing && (existing.status === 'delete' || existing.status === 'deleted') && effectiveStatus !== 'delete' && effectiveStatus !== 'deleted') {
                    // Item was seen as deleted, but is actually active somewhere else
                    dbItemsMap[String(item.id)] = { ...item, status: effectiveStatus };
                } else if (!existing) {
                    dbItemsMap[String(item.id)] = { ...item, status: effectiveStatus };
                }
            });
        });
    });

    Object.values(dbItemsMap).forEach(item => {
        if (String(item.id).startsWith("temp-") && item.status !== 'delete' && item.status !== 'deleted') {
            newDbItems.push(item);
        }
    });

    const resId = catalogueWrappers[0]?.catalogue?.resId || "";

    let newCatalogueWrappers = catalogueWrappers
        .map((wrapper) => {
            const catalogueId = String(wrapper?.catalogue?.catalogueId);
            const dbItem = dbItemsMap[catalogueId];

            if (!dbItem) {
                return null;
            }
;
            if (dbItem.status === 'delete' || dbItem.status === 'deleted') {
                return null
            }

            let newWrapper = updateCatalogueBase(wrapper, dbItem);

            const activeVariants = (dbItem.variants || []).filter(p => p.status !== 'delete' && p.status !== 'deleted');

            if (activeVariants.length > 0) {
                let existingPropWrappers = newWrapper.cataloguePropertyWrappers || [];
                let existingVarWrappers = newWrapper.variantWrappers || [];

                let hasNewProperty = activeVariants.slice(0, 1).some(dbProp => {
                    let pId = String(dbProp.property_id || "");
                    return !pId || pId.startsWith("temp-");
                });

                const { updatedPropWrappers, allOptionsArrays } = updatePropertyWrappers(existingPropWrappers, dbItem, hasNewProperty, newWrapper.catalogue.catalogueId);

                const updatedVarWrappers = updateVariantWrappers(existingVarWrappers, dbItem, allOptionsArrays, newWrapper.catalogue.catalogueId, hasNewProperty);

                newWrapper.cataloguePropertyWrappers = updatedPropWrappers;
                newWrapper.variantWrappers = updatedVarWrappers;
                newWrapper.catalogue.hasProperties = updatedPropWrappers.length > 0;
            } else {
                newWrapper.cataloguePropertyWrappers = [];
                newWrapper.catalogue.hasProperties = false;

                let existingVar = (newWrapper.variantWrappers && newWrapper.variantWrappers.length > 0) ? newWrapper.variantWrappers[0] : {};
                let existingPrice = (existingVar.variantPrices && existingVar.variantPrices.length > 0) ? existingVar.variantPrices[0] : {};

                let basePrice = dbItem.price !== undefined ? dbItem.price : (existingPrice.price || 0);

                // Do not reuse the old variantId because it belonged to a property combination
                let baseVarObj = { tempReferenceId: generateTempReferenceId() };

                if (existingVar.variant?.catalogueId) {
                    baseVarObj.catalogueId = existingVar.variant.catalogueId;
                }
                if (existingVar.variant?.turnOnTime) {
                    baseVarObj.turnOnTime = existingVar.variant.turnOnTime;
                }

                let priceObj = {
                    isVisible: true,
                    service: "delivery",
                    basePrice: basePrice,
                    price: basePrice,
                    maxAllowedPrice: basePrice,
                    tempReferenceId: generateTempReferenceId()
                };

                let variantModifierGroupMaps = (dbItem.addons || []).map((addonId, idx) => {
                    let modGroupId = String(addonId);
                    let isNew = modGroupId.startsWith("temp-");
                    if (isNew) {
                        modGroupId = modGroupId.replace("temp-", "");
                    }
                    
                    let existingMap = null;
                    if (existingVar && existingVar.variantModifierGroupMaps) {
                        existingMap = existingVar.variantModifierGroupMaps.find(m => 
                            String(m.modifierGroupId) === modGroupId || (m.tempReferenceId && String(m.tempReferenceId) === modGroupId)
                        );
                    }

                    let mapObj = {
                        ...(existingMap || {}),
                        order: idx + 1,
                        variantIsParent: true,
                        modifierGroupId: isNew ? "" : modGroupId,
                        ...(!isNew && baseVarObj.variantId && { variantId: baseVarObj.variantId })
                    };

                    if (isNew) {
                        mapObj.tempReferenceId = modGroupId;
                        delete mapObj.id;
                    } else if (!existingMap || (!existingMap.id && !existingMap.tempReferenceId)) {
                        delete mapObj.id;
                    }

                    return mapObj;
                });

                newWrapper.variantWrappers = [{
                    variant: baseVarObj,
                    variantModifierGroupMaps: variantModifierGroupMaps,
                    variantPrices: [priceObj]
                }];
            }

            return buildCataloguePayload(newWrapper);
        })
        .filter(Boolean);

    for (const newItem of newDbItems) {
        newCatalogueWrappers.push(buildNewCatalogueItemBuilder(newItem, resId));
    }

    return newCatalogueWrappers;
}