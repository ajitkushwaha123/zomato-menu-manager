import { useState, useRef } from "react";
import { Upload, X, Plus, Trash2, Calculator, Loader2 } from "lucide-react";
import api from "@/lib/api/axios";
import { useMenu } from "@/store/hooks/useMenu";
import useNotification from "@/store/hooks/useNotification";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function PriceEditor({ allItems, updateItem }) {
    const [referenceFile, setReferenceFile] = useState(null);
    const [referenceFileType, setReferenceFileType] = useState(null);
    const fileInputRef = useRef(null);

    if (!allItems || allItems.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400">
                No items available.
            </div>
        );
    }

    const { activeResId, getMenuByResId } = useMenu();
    const notification = useNotification();

    const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
    const [bulkMode, setBulkMode] = useState("percentage"); // flat or percentage
    const [bulkAction, setBulkAction] = useState("increase"); // increase or decrease
    const [bulkValue, setBulkValue] = useState("");
    const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

    const submitBulkUpdate = async () => {
        if (!bulkValue || isNaN(Number(bulkValue)) || Number(bulkValue) <= 0) {
            notification.error("Please enter a valid positive number for the value.", { duration: 5000 });
            return;
        }

        setIsSubmittingBulk(true);
        try {
            const numVal = Number(bulkValue);
            let finalValue = bulkAction === "decrease" ? `-${numVal}` : `${numVal}`;
            if (bulkMode === "percentage") {
                finalValue += "%";
            }

            const { data } = await api.post(`/api/menu/${activeResId}/bulk-editor/price`, {
                value: finalValue
            });
            
            if (!data.success) {
                throw new Error(data.message || "Failed to bulk update prices");
            }

            notification.success(`Successfully updated ${data.updated_items || 0} items/variants!`, { duration: 5000 });
            setBulkUpdateOpen(false);
            setBulkValue("");
            // Refresh data from server to show updated prices
            getMenuByResId(activeResId);
        } catch (error) {
            console.error("Bulk update error:", error);
            const errMsg = error.response?.data?.message || error.message || "Something went wrong during bulk update.";
            notification.error(errMsg, { duration: 5000 });
        } finally {
            setIsSubmittingBulk(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setReferenceFile(url);
            setReferenceFileType(file.type);
        }
    };

    const removeFile = () => {
        setReferenceFile(null);
        setReferenceFileType(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const inputs = Array.from(document.querySelectorAll('.price-input-field'));
            const index = inputs.indexOf(e.target);
            if (index > -1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
                inputs[index + 1].select();
            }
        }
    };

    const addVariantGroup = (itemId, itemVariants) => {
        if (itemVariants && itemVariants.length >= 1) {
            notification.error("Only a single variant property is allowed.", { duration: 5000 });
            return;
        }

        const newGroup = {
            property_name: "New Group",
            property_id: `temp-${crypto.randomUUID()}`,
            options: [
                { option_name: "Default Option", price: 0, is_default: true, option_id: `temp-${crypto.randomUUID()}` }
            ]
        };
        updateItem({ itemId, updates: { variants: [...(itemVariants || []), newGroup] } });
    };

    const addVariantOption = (itemId, itemVariants, gIdx) => {
        const newVariants = [...itemVariants];
        const newOptions = [...(newVariants[gIdx].options || []), { option_name: "New Option", price: 0, is_default: false, option_id: `temp-${crypto.randomUUID()}` }];
        newVariants[gIdx] = { ...newVariants[gIdx], options: newOptions };
        updateItem({ itemId, updates: { variants: newVariants } });
    };

    const updateVariantGroupName = (itemId, itemVariants, gIdx, newName) => {
        const newVariants = [...itemVariants];
        newVariants[gIdx] = { ...newVariants[gIdx], property_name: newName };
        updateItem({ itemId, updates: { variants: newVariants } });
    };

    const updateVariantOptionName = (itemId, itemVariants, gIdx, oIdx, newName) => {
        const newVariants = [...itemVariants];
        newVariants[gIdx] = { ...newVariants[gIdx], options: [...newVariants[gIdx].options] };
        newVariants[gIdx].options[oIdx] = { ...newVariants[gIdx].options[oIdx], option_name: newName };
        updateItem({ itemId, updates: { variants: newVariants } });
    };

    const deleteVariantGroup = (itemId, itemVariants, gIdx) => {
        const newVariants = itemVariants.filter((_, idx) => idx !== gIdx);
        updateItem({ itemId, updates: { variants: newVariants } });
    };

    const deleteVariantOption = (itemId, itemVariants, gIdx, oIdx) => {
        const newVariants = [...itemVariants];
        const newOptions = (newVariants[gIdx].options || []).filter((_, idx) => idx !== oIdx);
        newVariants[gIdx] = { ...newVariants[gIdx], options: newOptions };
        updateItem({ itemId, updates: { variants: newVariants } });
    };

    return (
        <div className="flex h-full bg-gray-50/30 w-full overflow-hidden">
            <div className={`transition-all duration-300 border-r border-gray-200 bg-gray-100 flex flex-col ${referenceFile ? 'w-1/2' : 'w-0 hidden'}`}>
                {referenceFile && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-3 border-b bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
                            <span className="text-sm font-bold text-gray-700">Reference Menu</span>
                            <button onClick={removeFile} className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto relative bg-[#525659]">
                            {referenceFileType?.includes('pdf') ? (
                                <iframe src={`${referenceFile}#toolbar=0`} className="w-full h-full border-0" title="PDF Reference" />
                            ) : (
                                <img src={referenceFile} alt="Reference" className="max-w-full h-auto object-contain mx-auto" />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className={`flex-1 overflow-y-auto p-4 ${referenceFile ? '' : 'w-full'}`}>
                <div className="space-y-4">
                    <div className="flex justify-between items-end border-b pb-2">
                        <h2 className="text-lg font-bold text-gray-800">Price Editor</h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setBulkUpdateOpen(true)}
                                className="flex items-center gap-2 text-sm bg-white/10 text-primary border border-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 font-semibold shadow-sm transition-colors"
                            >
                                <Calculator size={16} /> Bulk Update Prices
                            </button>
                            {!referenceFile && (
                                <div>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,application/pdf" className="hidden" />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center gap-2 text-sm bg-white border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 font-semibold text-gray-700 shadow-sm transition-colors"
                                    >
                                        <Upload size={16} /> Open File (Img/PDF)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b text-gray-500 font-semibold">
                                <tr>
                                    <th className="p-3 w-1/3">Item Name</th>
                                    <th className="p-3">Base Price (₹)</th>
                                    <th className="p-3 w-1/2">Variants Prices (₹)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {allItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="p-3 font-medium text-gray-900 align-top">
                                            {item.name || "Unnamed Item"}
                                            <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                                                {item._parentCategoryName} &gt; {item._parentSubCategoryName}
                                            </div>
                                        </td>
                                        <td className="p-3 align-top">
                                            <input
                                                type="number"
                                                value={item.price ?? ""}
                                                onChange={(e) => updateItem({ itemId: item.id, updates: { price: e.target.value === "" ? "" : Number(e.target.value) } })}
                                                onKeyDown={handleKeyDown}
                                                className="price-input-field w-24 border rounded-md px-2 py-1 outline-none focus:border-primary text-sm font-semibold bg-white shadow-sm"
                                                placeholder="0"
                                            />
                                        </td>
                                        <td className="p-3 align-top space-y-3">
                                            {(!item.variants || item.variants.length === 0) ? (
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-400 text-xs italic">No variants</span>
                                                    <button
                                                        onClick={() => addVariantGroup(item.id, item.variants)}
                                                        className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 flex items-center gap-1 transition-colors"
                                                    >
                                                        <Plus size={10} strokeWidth={3} /> Add Variant
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {item.variants.map((group, gIdx) => (
                                                        <div key={gIdx} className="space-y-1.5 p-2 bg-gray-50/50 border border-gray-100 rounded-md shadow-sm">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={group.property_name}
                                                                        onChange={(e) => updateVariantGroupName(item.id, item.variants, gIdx, e.target.value)}
                                                                        className="text-xs font-semibold text-gray-700 bg-transparent outline-none focus:border-b focus:border-primary px-1 w-24"
                                                                    />
                                                                    <button
                                                                        onClick={() => addVariantOption(item.id, item.variants, gIdx)}
                                                                        className="text-[10px] font-bold text-primary hover:bg-primary/10 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Plus size={10} strokeWidth={3} /> Option
                                                                    </button>
                                                                </div>

                                                                <button
                                                                    onClick={() => deleteVariantGroup(item.id, item.variants, gIdx)}
                                                                    className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                                                                    title="Delete Group"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {(group.options || []).map((opt, oIdx) => (
                                                                    <div key={oIdx} className="flex items-center text-xs bg-white rounded border border-gray-200 overflow-hidden shadow-sm focus-within:border-primary">
                                                                        <input
                                                                            type="text"
                                                                            value={opt.option_name || ""}
                                                                            onChange={(e) => updateVariantOptionName(item.id, item.variants, gIdx, oIdx, e.target.value)}
                                                                            className="px-2 py-1.5 bg-gray-50 border-r border-gray-200 text-gray-700 font-medium outline-none w-16"
                                                                            placeholder="Opt"
                                                                        />
                                                                        <input
                                                                            type="number"
                                                                            value={opt.price ?? ""}
                                                                            onChange={(e) => {
                                                                                const newVariants = [...item.variants];
                                                                                newVariants[gIdx] = { ...newVariants[gIdx], options: [...newVariants[gIdx].options] };
                                                                                newVariants[gIdx].options[oIdx] = { ...newVariants[gIdx].options[oIdx], price: e.target.value === "" ? "" : Number(e.target.value) };
                                                                                updateItem({ itemId: item.id, updates: { variants: newVariants } });
                                                                            }}
                                                                            onKeyDown={handleKeyDown}
                                                                            className="price-input-field w-16 px-1 py-1.5 outline-none bg-white font-semibold text-center focus:bg-primary/5"
                                                                            placeholder="0"
                                                                        />
                                                                        <button
                                                                            onClick={() => deleteVariantOption(item.id, item.variants, gIdx, oIdx)}
                                                                            className="bg-gray-50 px-1.5 py-1.5 border-l border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                                                                            title="Remove Option"
                                                                        >
                                                                            <X size={12} strokeWidth={2.5} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!item.variants || item.variants.length < 1) && (
                                                        <button
                                                            onClick={() => addVariantGroup(item.id, item.variants)}
                                                            className="text-[10px] font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors flex items-center gap-1 mt-1"
                                                        >
                                                            <Plus size={10} strokeWidth={3} /> Add Variant Group
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <Dialog open={bulkUpdateOpen} onOpenChange={setBulkUpdateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Bulk Price Update</DialogTitle>
                        <DialogDescription>
                            Apply a flat or percentage increase/decrease to all items and variants in this menu. Note: Prices will automatically round to the nearest ending 9.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-600">Action</label>
                                <div className="flex border rounded-md overflow-hidden">
                                    <button
                                        onClick={() => setBulkAction("increase")}
                                        className={`flex-1 py-1.5 text-sm font-medium ${bulkAction === "increase" ? "bg-primary text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        +
                                    </button>
                                    <button
                                        onClick={() => setBulkAction("decrease")}
                                        className={`flex-1 py-1.5 text-sm font-medium border-l ${bulkAction === "decrease" ? "bg-primary text-white border-primary" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        -
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-600">Type</label>
                                <div className="flex border rounded-md overflow-hidden">
                                    <button
                                        onClick={() => setBulkMode("percentage")}
                                        className={`flex-1 py-1.5 px-2 text-sm font-medium ${bulkMode === "percentage" ? "bg-primary text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        %
                                    </button>
                                    <button
                                        onClick={() => setBulkMode("flat")}
                                        className={`flex-1 py-1.5 text-sm font-medium border-l ${bulkMode === "flat" ? "bg-primary text-white border-primary" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        Flat
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-600">Value</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={bulkValue}
                                    onChange={(e) => setBulkValue(e.target.value)}
                                    placeholder={bulkMode === "percentage" ? "e.g. 10" : "e.g. 50"}
                                    className="w-full border rounded-md px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
                                    {bulkMode === "percentage" ? "%" : "₹"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBulkUpdateOpen(false)} disabled={isSubmittingBulk}>
                            Cancel
                        </Button>
                        <Button onClick={submitBulkUpdate} disabled={isSubmittingBulk || !bulkValue}>
                            {isSubmittingBulk ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Apply Update"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
