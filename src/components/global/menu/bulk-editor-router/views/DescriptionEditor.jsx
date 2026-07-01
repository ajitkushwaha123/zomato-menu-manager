import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import api from "@/lib/api/axios";
import { useMenu } from "@/store/hooks/useMenu";
import useNotification from "@/store/hooks/useNotification";

export default function DescriptionEditor({ allItems, updateItem }) {
    const { activeResId, getMenuByResId } = useMenu();
    const notification = useNotification();
    const [isGenerating, setIsGenerating] = useState(false);

    if (!allItems || allItems.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-400">
                No items available.
            </div>
        );
    }

    const generateDescriptions = async () => {
        setIsGenerating(true);
        try {
            const { data } = await api.post(`/api/menu/${activeResId}/bulk-editor/description`);

            if (!data.success) {
                throw new Error(data.message || "Failed to generate descriptions");
            }

            notification.success(`Successfully generated ${data.updated_items || 0} descriptions!`, {
                duration: 5000,
            });
            getMenuByResId(activeResId);
        } catch (error) {
            console.error("Generate description error:", error);
            const errMsg = error.response?.data?.message || error.message || "Something went wrong while generating descriptions.";
            notification.error(errMsg, {
                duration: 5000
            });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
            <div className="mx-auto space-y-4">
                <div className="flex justify-between items-end border-b pb-2">
                    <h2 className="text-lg font-bold text-gray-800">Description Editor</h2>
                    <button
                        onClick={generateDescriptions}
                        disabled={isGenerating}
                        className="flex items-center gap-2 text-sm bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-200 font-semibold shadow-sm transition-colors disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {isGenerating ? "Generating..." : "Generate descriptions (AI)"}
                    </button>
                </div>

                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b text-gray-500 font-semibold">
                            <tr>
                                <th className="p-3 w-1/3">Item Name</th>
                                <th className="p-3">Description</th>
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
                                        <textarea
                                            value={item.description || ""}
                                            onChange={(e) => updateItem({ itemId: item.id, updates: { description: e.target.value } })}
                                            className="w-full border rounded-md px-3 py-2 outline-none focus:border-primary text-sm min-h-[80px] resize-y bg-white"
                                            placeholder="Add item description..."
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
