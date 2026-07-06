"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckSquare, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIAssistantPanel({ resId, menuData, addAddonGroup, addAddonOption, bulkToggleAddon, onClose }) {
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState(null);
    const [error, setError] = useState(null);
    const [selectedGroups, setSelectedGroups] = useState(new Set());

    const handleSuggest = async () => {
        if (!resId || !menuData) return;
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/menu/${resId}/ai/suggest-addons`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const data = await response.json();
            if (data.success && data.addons) {
                setSuggestions(data.addons);
                const allIdx = new Set(data.addons.map((_, i) => i));
                setSelectedGroups(allIdx);
            } else {
                setError(data.message || "Failed to fetch suggestions");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleGroup = (idx) => {
        const newSelected = new Set(selectedGroups);
        if (newSelected.has(idx)) newSelected.delete(idx);
        else newSelected.add(idx);
        setSelectedGroups(newSelected);
    };

    const handleApply = () => {
        if (!suggestions) return;
        
        suggestions.forEach((group, idx) => {
            if (selectedGroups.has(idx)) {
                const groupId = 'temp-' + crypto.randomUUID();
                addAddonGroup(groupId, group.name, group.min || 0, group.max || 1);
                
                (group.options || []).forEach(opt => {
                    addAddonOption(groupId, {
                        name: opt.name,
                        price: opt.price || 0,
                        is_default: false,
                        is_veg: opt.is_veg || "NONE"
                    });
                });

                if (group.item_ids && group.item_ids.length > 0) {
                    bulkToggleAddon(groupId, group.item_ids, true);
                }
            }
        });

        onClose();
    };

    return (
        <div className="flex flex-col h-full w-full bg-white z-10 border-l border-purple-100">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-purple-100 bg-purple-50/50">
                <h3 className="flex items-center gap-2 font-semibold text-purple-800 text-[15px]">
                    <Sparkles className="w-4 h-4" /> AI Suggestions
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-gray-500 hover:text-gray-900 rounded-full hover:bg-white">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
                {!suggestions && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-5">
                            <Sparkles className="w-8 h-8 text-purple-600" />
                        </div>
                        <h4 className="text-base font-bold text-gray-900 mb-2">Design Smart Addons</h4>
                        <p className="text-[13px] text-gray-500 mb-8 leading-relaxed">
                            We'll analyze your existing menu and instantly generate profitable addon groups (like extra cheese, dips, or crusts) tailored to your dishes.
                        </p>
                        <Button onClick={handleSuggest} className="w-full bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200 py-5 text-[14px] font-semibold transition-all">
                            Generate Now
                        </Button>
                        {error && <p className="text-xs text-red-500 mt-4 bg-red-50 p-2 rounded w-full border border-red-100">{error}</p>}
                    </div>
                )}

                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-full px-6">
                        <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-5" />
                        <h4 className="text-sm font-bold text-gray-800 mb-1">Analyzing Menu...</h4>
                        <p className="text-[13px] text-gray-500 text-center">Finding the perfect modifiers to boost your sales.</p>
                    </div>
                )}

                {suggestions && (
                    <div className="flex-1 flex flex-col h-full overflow-hidden min-h-0 bg-slate-50/50">
                        <div className="px-5 py-4 border-b border-gray-100 bg-white shadow-sm z-10 shrink-0">
                            <p className="text-[13px] text-gray-600 font-medium">
                                We found <span className="text-purple-700 font-bold">{suggestions.length}</span> addon groups! Uncheck any you don't want.
                            </p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {suggestions.map((group, idx) => (
                                <div key={idx} className={`rounded-xl border transition-all duration-200 overflow-hidden ${selectedGroups.has(idx) ? 'border-purple-300 shadow-sm bg-white' : 'border-gray-200 bg-slate-50 opacity-60'}`}>
                                    <div className="p-3.5 flex items-start gap-3">
                                        <div 
                                            className="mt-0.5 cursor-pointer text-gray-300 hover:text-purple-600 transition-colors"
                                            onClick={() => toggleGroup(idx)}
                                        >
                                            {selectedGroups.has(idx) ? <CheckSquare className="w-5 h-5 text-purple-600" /> : <Square className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm text-gray-900 truncate">{group.name}</h4>
                                            <div className="flex gap-2 mt-1 text-[11px] text-gray-500 font-medium">
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">Min: {group.min || 0}</span>
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">Max: {group.max || 1}</span>
                                                <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{group.item_ids?.length || 0} items</span>
                                            </div>
                                            
                                            <div className="mt-3 flex flex-col gap-1.5">
                                                {(group.options || []).map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex justify-between items-center bg-slate-50 p-2 border border-slate-100 rounded-md text-[13px]">
                                                        <span className="font-medium text-gray-700 truncate mr-2">{opt.name}</span>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-xs font-bold text-gray-900">₹{opt.price}</span>
                                                            <div className={`w-2.5 h-2.5 rounded-[3px] border ${opt.is_veg === 'VEG' ? 'border-green-600 bg-green-500' : opt.is_veg === 'NON_VEG' ? 'border-red-600 bg-red-500' : 'border-yellow-600 bg-yellow-500'}`} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-200 bg-white shrink-0">
                            <Button onClick={handleApply} disabled={selectedGroups.size === 0} className="w-full bg-purple-600 hover:bg-purple-700 font-semibold shadow-md transition-all">
                                Add {selectedGroups.size} Groups to Menu
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
