import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, Loader2, Tag, ToggleLeft, ToggleRight, Info, Move } from "lucide-react";
import { updateAnnotations } from "../lib/api";

// Preset positions for food dish hotspots (centered dish, annotations around it)
const PRESET_POSITIONS = [
    { label: "Top Center", position: "0m 0.12m 0m", normal: "0 1 0" },
    { label: "Top Left", position: "-0.08m 0.1m 0.04m", normal: "0 1 0.2" },
    { label: "Top Right", position: "0.08m 0.1m 0.04m", normal: "0 1 0.2" },
    { label: "Front", position: "0m 0.06m 0.1m", normal: "0 0.3 1" },
    { label: "Left Side", position: "-0.1m 0.06m 0m", normal: "-1 0.3 0" },
    { label: "Right Side", position: "0.1m 0.06m 0m", normal: "1 0.3 0" },
    { label: "Back Left", position: "-0.06m 0.08m -0.06m", normal: "0 1 -0.3" },
    { label: "Back Right", position: "0.06m 0.08m -0.06m", normal: "0 1 -0.3" },
    { label: "Center", position: "0m 0.08m 0m", normal: "0 1 0" },
];

const AnnotationsEditor = ({ item, onClose, onSaved }) => {
    const [annotations, setAnnotations] = useState([]);
    const [enabled, setEnabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            const parsed = typeof item.annotations === "string" ? JSON.parse(item.annotations) : (item.annotations || []);
            setAnnotations(parsed);
        } catch { setAnnotations([]); }
        setEnabled(!!item.annotations_enabled);
    }, [item]);

    const addAnnotation = () => {
        const usedPositions = annotations.map(a => a.preset);
        const nextPreset = PRESET_POSITIONS.find(p => !usedPositions.includes(p.label)) || PRESET_POSITIONS[0];
        setAnnotations([...annotations, {
            label: "",
            position: nextPreset.position,
            normal: nextPreset.normal,
            preset: nextPreset.label,
        }]);
    };

    const removeAnnotation = (index) => {
        setAnnotations(annotations.filter((_, i) => i !== index));
    };

    const updateAnnotation = (index, field, value) => {
        const updated = [...annotations];
        updated[index] = { ...updated[index], [field]: value };
        // If preset changed, update position/normal
        if (field === "preset") {
            const preset = PRESET_POSITIONS.find(p => p.label === value);
            if (preset) {
                updated[index].position = preset.position;
                updated[index].normal = preset.normal;
            }
        }
        setAnnotations(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await updateAnnotations(item.id, annotations, enabled);
            onSaved?.();
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Tag size={18} /> Annotations
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">"{item.name}" — ingredient labels on 3D view</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Show Annotations</div>
                            <div className="text-xs text-gray-500">Users see ingredient labels in 3D/AR view</div>
                        </div>
                        <button onClick={() => setEnabled(!enabled)} className="p-0 border-none bg-transparent cursor-pointer">
                            {enabled ?
                                <ToggleRight size={36} className="text-green-500" /> :
                                <ToggleLeft size={36} className="text-gray-300" />
                            }
                        </button>
                    </div>

                    {/* Info */}
                    <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                        <Info size={14} className="flex-shrink-0 mt-0.5" />
                        <span>Add labels for ingredients visible in the 3D model. Each label will show as a floating tag with an arrow pointing to the dish. Choose a position preset for where the label appears.</span>
                    </div>

                    {/* Annotation List */}
                    <div className="space-y-3">
                        {annotations.map((ann, index) => (
                            <div key={index} className="bg-gray-50 rounded-xl p-3 space-y-2 relative">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 w-5">#{index + 1}</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Saffron Rice, Fried Onions, Mint..."
                                        value={ann.label}
                                        onChange={e => updateAnnotation(index, "label", e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                                    />
                                    <button onClick={() => removeAnnotation(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 pl-7">
                                    <Move size={12} className="text-gray-400 flex-shrink-0" />
                                    <select
                                        value={ann.preset || ""}
                                        onChange={e => updateAnnotation(index, "preset", e.target.value)}
                                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-gray-600"
                                    >
                                        <option value="">Custom Position</option>
                                        {PRESET_POSITIONS.map(p => (
                                            <option key={p.label} value={p.label}>{p.label}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Advanced: custom position (shown if no preset or "Custom Position") */}
                                {!ann.preset && (
                                    <div className="flex gap-2 pl-7">
                                        <input
                                            type="text"
                                            placeholder="position: 0m 0.1m 0m"
                                            value={ann.position || ""}
                                            onChange={e => updateAnnotation(index, "position", e.target.value)}
                                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono bg-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="normal: 0 1 0"
                                            value={ann.normal || ""}
                                            onChange={e => updateAnnotation(index, "normal", e.target.value)}
                                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono bg-white"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={addAnnotation}
                        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 bg-transparent cursor-pointer"
                    >
                        <Plus size={16} /> Add Ingredient Label
                    </button>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs">{error}</div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors cursor-pointer border-none">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-none">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Annotations
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnotationsEditor;
