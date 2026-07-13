"use client";

import { useState, useEffect } from "react";
import { useMenu } from "@/store/hooks/useMenu";
import { Plus, Trash2, CheckSquare, Square, Link as LinkIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AIAssistantPanel } from "./AIAssistantPanel";
import { BulkAssignmentPanel } from "./BulkAssignmentPanel";

export default function AddonsBuilder() {
    const { 
        addonsData, 
        menuData,
        activeResId,
        bulkToggleAddon,
        addAddonGroup, 
        updateAddonGroup, 
        deleteAddonGroup, 
        addAddonOption, 
        updateAddonOption, 
        deleteAddonOption 
    } = useMenu();

    const [selectedAddonId, setSelectedAddonId] = useState(null);
    const [localName, setLocalName] = useState("");
    
    // Panel state: 'none' | 'ai-suggest' | 'link-items'
    const [rightPanelMode, setRightPanelMode] = useState("none");

    const activeAddon = addonsData?.find(a => a.id === selectedAddonId);

    // Sync local name when active addon changes
    useEffect(() => {
        if (activeAddon) {
            setLocalName(activeAddon.name);
        } else {
            // Close link-items panel if no addon is selected
            if (rightPanelMode === 'link-items') setRightPanelMode('none');
        }
    }, [activeAddon?.id]);

    const handleAddOption = (name, price, is_veg) => {
        if (!name.trim()) return;
        addAddonOption(selectedAddonId, { name, price: parseFloat(price) || 0, is_default: false, is_veg });
    };

    return (
        <div className="flex h-full w-full bg-slate-50 overflow-hidden">
            {/* Left Pane: Addon Groups List */}
            <div className="w-[320px] flex flex-col bg-white border-r border-gray-200 shrink-0 z-10">
                <div className="p-5 border-b border-gray-100 bg-white flex items-center justify-between">
                    <div>
                        <h2 className="font-bold text-gray-900 text-[15px]">Addon Groups</h2>
                        <p className="text-[12px] text-gray-500 mt-0.5">Global modifiers</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="secondary"
                            size="icon"
                            onClick={() => setRightPanelMode(prev => prev === 'ai-suggest' ? 'none' : 'ai-suggest')}
                            className={`h-8 w-8 rounded-full transition-colors ${rightPanelMode === 'ai-suggest' ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}
                            title="AI Suggest"
                        >
                            <Sparkles className="w-4 h-4" />
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={() => {
                                const newId = 'temp-' + crypto.randomUUID();
                                addAddonGroup(newId, "New Addon Group", 0, 1);
                                setSelectedAddonId(newId);
                            }}
                            className="h-8 gap-1 shadow-sm px-3 rounded-full"
                        >
                            <Plus className="w-4 h-4" /> Add
                        </Button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                    {addonsData?.map((addon) => (
                        <div 
                            key={addon.id} 
                            onClick={() => {
                                setSelectedAddonId(addon.id);
                                if (rightPanelMode === 'ai-suggest') setRightPanelMode('none');
                            }}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex justify-between items-center group ${selectedAddonId === addon.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm' : 'border-gray-100 hover:border-gray-300 hover:bg-slate-50 bg-white'}`}
                        >
                            <div className="font-semibold text-[13px] text-gray-800 truncate pr-2">{addon.name}</div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteAddonGroup(addon.id);
                                    if (selectedAddonId === addon.id) setSelectedAddonId(null);
                                }}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    ))}
                    {(!addonsData || addonsData.length === 0) && (
                        <div className="text-center py-8 px-4">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No Addons Yet</p>
                            <p className="text-[12px] text-gray-500">Create an addon group or let AI suggest some for you.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Center Area (Editor + Overlay Panels) */}
            <div className="flex-1 relative overflow-hidden flex">
                {/* Center Pane: Addon Group Editor */}
                <div className="flex-1 flex flex-col bg-slate-50/50 relative overflow-hidden">
                    {activeAddon ? (
                    <div className="flex flex-col h-full overflow-hidden absolute inset-0">
                        <div className="px-8 py-6 border-b border-gray-200 bg-white space-y-6 shadow-sm z-10 shrink-0">
                            <div className="flex justify-between items-start gap-6">
                                <div className="flex-1">
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Group Name</label>
                                    <Input 
                                        value={localName} 
                                        onChange={(e) => setLocalName(e.target.value)}
                                        onBlur={() => updateAddonGroup(activeAddon.id, { name: localName })}
                                        className="font-bold text-xl h-12 border-0 border-b-2 border-transparent hover:border-gray-200 focus-visible:border-primary focus-visible:ring-0 rounded-none px-0 bg-transparent transition-colors shadow-none"
                                        placeholder="Enter group name"
                                    />
                                </div>
                                <div>
                                    <Button 
                                        variant={rightPanelMode === 'link-items' ? 'default' : 'outline'}
                                        size="sm" 
                                        className="h-9 gap-2 font-semibold px-4 rounded-full transition-all"
                                        onClick={() => setRightPanelMode(prev => prev === 'link-items' ? 'none' : 'link-items')}
                                    >
                                        <LinkIcon className="w-4 h-4" /> Link to Items
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div 
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all col-span-2 sm:col-span-1 ${activeAddon.is_compulsory ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                                    onClick={() => {
                                        const nextCompulsory = !activeAddon.is_compulsory;
                                        const nextMin = nextCompulsory ? Math.max(1, activeAddon.min || 1) : activeAddon.min;
                                        updateAddonGroup(activeAddon.id, { is_compulsory: nextCompulsory, min: nextMin });
                                    }}
                                >
                                    {activeAddon.is_compulsory ? <CheckSquare className="w-5 h-5 text-primary" /> : <Square className="w-5 h-5 text-gray-300" />}
                                    <span className="text-sm font-semibold text-gray-800">Customer selection is compulsory</span>
                                </div>

                                <div className="flex gap-4 col-span-2 sm:col-span-1 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Min Selection</label>
                                        <Input 
                                            type="number" 
                                            min={activeAddon.is_compulsory ? 1 : 0}
                                            value={activeAddon.min} 
                                            onChange={(e) => updateAddonGroup(activeAddon.id, { min: parseInt(e.target.value) || 0 })}
                                            className="h-8 font-semibold bg-white border-gray-200"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Max Selection</label>
                                        <Input 
                                            type="number" 
                                            min={activeAddon.min || 1}
                                            value={activeAddon.max} 
                                            onChange={(e) => updateAddonGroup(activeAddon.id, { max: parseInt(e.target.value) || 1 })}
                                            className="h-8 font-semibold bg-white border-gray-200"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-3xl mx-auto">
                                <div className="flex justify-between items-end mb-4">
                                    <h3 className="font-bold text-gray-900">Options <span className="text-gray-400 font-normal ml-1">({activeAddon.options?.length || 0})</span></h3>
                                </div>
                                
                                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50/80 border-b border-gray-100 text-[11px] font-bold text-gray-500 uppercase tracking-wider px-6">
                                        <div className="col-span-6">Option Name</div>
                                        <div className="col-span-3">Dietary Type</div>
                                        <div className="col-span-2 text-right">Price (₹)</div>
                                        <div className="col-span-1"></div>
                                    </div>

                                    <div className="divide-y divide-gray-100">
                                        {activeAddon.options?.map((option) => (
                                            <div key={option.id} className="grid grid-cols-12 gap-4 p-3 px-6 items-center hover:bg-slate-50 transition-colors group">
                                                <div className="col-span-6">
                                                    <Input 
                                                        value={option.name} 
                                                        onChange={(e) => updateAddonOption(activeAddon.id, option.id, { name: e.target.value })}
                                                        className="h-9 border-transparent hover:border-gray-200 focus-visible:border-primary shadow-none bg-transparent font-medium"
                                                    />
                                                </div>
                                                <div className="col-span-3">
                                                    <select 
                                                        className="h-9 w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-primary rounded-md text-sm font-medium px-2 outline-none"
                                                        value={option.is_veg}
                                                        onChange={(e) => updateAddonOption(activeAddon.id, option.id, { is_veg: e.target.value })}
                                                    >
                                                        <option value="VEG">Veg</option>
                                                        <option value="NON_VEG">Non-Veg</option>
                                                        <option value="EGG">Egg</option>
                                                        <option value="NONE">None</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2">
                                                    <Input 
                                                        type="number"
                                                        value={option.price} 
                                                        onChange={(e) => updateAddonOption(activeAddon.id, option.id, { price: parseFloat(e.target.value) || 0 })}
                                                        className="h-9 border-transparent hover:border-gray-200 focus-visible:border-primary shadow-none bg-transparent text-right font-semibold"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                                                        onClick={() => deleteAddonOption(activeAddon.id, option.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add New Option Row */}
                                        <form 
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                const form = e.target;
                                                handleAddOption(form.name.value, form.price.value, form.is_veg.value);
                                                form.reset();
                                                form.name.focus();
                                            }}
                                            className="grid grid-cols-12 gap-4 p-3 px-6 items-center bg-blue-50/30"
                                        >
                                            <div className="col-span-6">
                                                <Input 
                                                    name="name"
                                                    placeholder="Add new option..."
                                                    className="h-9 border-gray-200 focus-visible:border-primary focus-visible:ring-1 bg-white font-medium"
                                                    required
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <select 
                                                    name="is_veg"
                                                    className="h-9 w-full bg-white border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary rounded-md text-sm font-medium px-2 outline-none"
                                                    defaultValue="VEG"
                                                >
                                                    <option value="VEG">Veg</option>
                                                    <option value="NON_VEG">Non-Veg</option>
                                                    <option value="EGG">Egg</option>
                                                    <option value="NONE">None</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <Input 
                                                    name="price"
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="h-9 border-gray-200 focus-visible:border-primary focus-visible:ring-1 bg-white text-right font-semibold"
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <Button type="submit" size="sm" className="h-8 shadow-sm">
                                                    Add
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <Plus className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Select an Addon Group</h3>
                        <p className="text-sm text-gray-500 max-w-sm text-center">
                            Select a group from the left sidebar to edit its options, or create a new one.
                        </p>
                    </div>
                )}
                </div>

                {/* Sliding Overlay Container over Center Pane */}
                <div 
                    className={`absolute inset-0 bg-white transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)] z-20 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] ${rightPanelMode !== 'none' ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {rightPanelMode === 'ai-suggest' && (
                        <AIAssistantPanel 
                            resId={activeResId}
                            menuData={menuData} 
                            addAddonGroup={addAddonGroup} 
                            addAddonOption={addAddonOption} 
                            bulkToggleAddon={bulkToggleAddon} 
                            onClose={() => setRightPanelMode('none')}
                        />
                    )}
                    {rightPanelMode === 'link-items' && activeAddon && (
                        <BulkAssignmentPanel 
                            activeAddon={activeAddon} 
                            menuData={menuData} 
                            bulkToggleAddon={bulkToggleAddon} 
                            onClose={() => setRightPanelMode('none')}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
