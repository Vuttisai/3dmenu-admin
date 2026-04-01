import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Plus, Trash2, Save, Loader2, Tag, ToggleLeft, ToggleRight, Info, Crosshair, Wand2, RotateCcw, MousePointerClick } from "lucide-react";
import { updateAnnotations } from "../lib/api";

const AnnotationsEditor = ({ item, onClose, onSaved }) => {
    const [annotations, setAnnotations] = useState([]);
    const [enabled, setEnabled] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [modelLoaded, setModelLoaded] = useState(false);
    const [modelDimensions, setModelDimensions] = useState(null);
    const [placingMode, setPlacingMode] = useState(false);    // click-to-place mode
    const [placingIndex, setPlacingIndex] = useState(null);    // which annotation is being placed
    const modelViewerRef = useRef(null);

    useEffect(() => {
        try {
            const parsed = typeof item.annotations === "string" ? JSON.parse(item.annotations) : (item.annotations || []);
            setAnnotations(parsed);
        } catch { setAnnotations([]); }
        setEnabled(!!item.annotations_enabled);
    }, [item]);

    // ── Model analysis ─────────────────────────────────────
    const onModelLoad = useCallback(() => {
        const mv = modelViewerRef.current;
        if (!mv) return;
        setModelLoaded(true);

        // Get real model dimensions
        try {
            const center = mv.getBoundingBoxCenter();
            const size = mv.getDimensions();
            setModelDimensions({
                width: size.x,
                height: size.y,
                depth: size.z,
                centerX: center.x,
                centerY: center.y,
                centerZ: center.z,
            });
        } catch (e) {
            console.warn("Could not get model dimensions:", e);
        }
    }, []);

    // ── Auto-generate positions based on actual model geometry ──
    const autoGeneratePositions = () => {
        if (!modelDimensions) return;
        const { width, height, depth, centerX, centerY, centerZ } = modelDimensions;

        // Calculate positions based on the real model bounding box
        const hw = width * 0.4;   // 40% out from center (on the dish edge)
        const hd = depth * 0.4;
        const topY = centerY + height * 0.4;   // slightly above the model
        const midY = centerY + height * 0.15;

        const autoPositions = [
            { label: "", position: `${centerX}m ${topY}m ${centerZ}m`, normal: "0 1 0", auto: "Top Center" },
            { label: "", position: `${(centerX - hw).toFixed(4)}m ${(midY + height * 0.1).toFixed(4)}m ${(centerZ + hd * 0.5).toFixed(4)}m`, normal: "-0.4 1 0.3", auto: "Top Left" },
            { label: "", position: `${(centerX + hw).toFixed(4)}m ${(midY + height * 0.1).toFixed(4)}m ${(centerZ + hd * 0.5).toFixed(4)}m`, normal: "0.4 1 0.3", auto: "Top Right" },
            { label: "", position: `${centerX}m ${midY}m ${(centerZ + hd).toFixed(4)}m`, normal: "0 0.3 1", auto: "Front" },
            { label: "", position: `${(centerX - hw).toFixed(4)}m ${midY}m ${centerZ}m`, normal: "-1 0.5 0", auto: "Left" },
            { label: "", position: `${(centerX + hw).toFixed(4)}m ${midY}m ${centerZ}m`, normal: "1 0.5 0", auto: "Right" },
        ];

        setAnnotations(autoPositions);
    };

    // ── Click-to-place: user clicks on the 3D model to set position ──
    const handleModelClick = useCallback((event) => {
        if (!placingMode || placingIndex === null) return;

        const mv = modelViewerRef.current;
        if (!mv) return;

        // Get the click coordinates relative to the model-viewer element
        const rect = mv.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Use model-viewer API to get 3D position from 2D click
        const hit = mv.positionAndNormalFromPoint(x, y);
        if (hit) {
            const pos = `${hit.position.x.toFixed(4)}m ${hit.position.y.toFixed(4)}m ${hit.position.z.toFixed(4)}m`;
            const norm = `${hit.normal.x.toFixed(2)} ${hit.normal.y.toFixed(2)} ${hit.normal.z.toFixed(2)}`;

            setAnnotations(prev => {
                const updated = [...prev];
                updated[placingIndex] = { ...updated[placingIndex], position: pos, normal: norm, auto: "Placed on model" };
                return updated;
            });

            // Exit placing mode
            setPlacingMode(false);
            setPlacingIndex(null);
        }
    }, [placingMode, placingIndex]);

    const startPlacing = (index) => {
        setPlacingMode(true);
        setPlacingIndex(index);
    };

    const cancelPlacing = () => {
        setPlacingMode(false);
        setPlacingIndex(null);
    };

    // ── CRUD ───────────────────────────────────────────────
    const addAnnotation = () => {
        // If model is loaded, place new annotation at a smart default
        let defaultPos = "0m 0.03m 0m";
        let defaultNormal = "0 1 0";

        if (modelDimensions) {
            const { centerX, centerY, height, centerZ } = modelDimensions;
            defaultPos = `${centerX}m ${(centerY + height * 0.3).toFixed(4)}m ${centerZ}m`;
        }

        setAnnotations([...annotations, { label: "", position: defaultPos, normal: defaultNormal, auto: "" }]);
    };

    const removeAnnotation = (index) => {
        setAnnotations(annotations.filter((_, i) => i !== index));
        if (placingIndex === index) cancelPlacing();
    };

    const updateAnnotation = (index, field, value) => {
        const updated = [...annotations];
        updated[index] = { ...updated[index], [field]: value };
        setAnnotations(updated);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            // Clean up internal fields before saving
            const cleanAnnotations = annotations.map(({ auto, ...rest }) => rest);
            await updateAnnotations(item.id, cleanAnnotations, enabled);
            onSaved?.();
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const modelSrc = item.model_url_android || "";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Tag size={18} /> Annotations
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">"{item.name}" — ingredient labels on 3D view</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg border-none bg-transparent cursor-pointer"><X size={20} /></button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                        <div>
                            <div className="text-sm font-semibold text-gray-900">Show Annotations</div>
                            <div className="text-xs text-gray-500">Users see labels in 3D/AR view</div>
                        </div>
                        <button onClick={() => setEnabled(!enabled)} className="p-0 border-none bg-transparent cursor-pointer">
                            {enabled ?
                                <ToggleRight size={36} className="text-green-500" /> :
                                <ToggleLeft size={36} className="text-gray-300" />
                            }
                        </button>
                    </div>

                    {/* ── Live 3D Model Preview ─────────────────────────── */}
                    {modelSrc ? (
                        <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 relative">
                            {/* Placing mode indicator */}
                            {placingMode && (
                                <div className="absolute inset-x-0 top-0 z-10 bg-indigo-600 text-white text-center text-xs font-bold py-2 flex items-center justify-center gap-2">
                                    <MousePointerClick size={14} /> Tap on the dish to place label #{(placingIndex ?? 0) + 1}
                                    <button onClick={cancelPlacing} className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs border-none cursor-pointer text-white">Cancel</button>
                                </div>
                            )}

                            <model-viewer
                                ref={modelViewerRef}
                                src={modelSrc}
                                camera-controls
                                interaction-prompt="none"
                                camera-orbit="30deg 65deg auto"
                                auto-rotate
                                style={{ width: "100%", height: "220px", backgroundColor: "#f9f9f9", cursor: placingMode ? "crosshair" : "grab" }}
                                onLoad={() => onModelLoad()}
                                onClick={(e) => handleModelClick(e)}
                            >
                                {/* Show current annotations as live preview */}
                                {annotations.map((ann, i) => (
                                    ann.position && (
                                        <button
                                            key={i}
                                            className="annotation-preview-dot"
                                            slot={`hotspot-preview-${i}`}
                                            data-position={ann.position}
                                            data-normal={ann.normal || "0 1 0"}
                                            data-visibility-attribute="visible"
                                            style={{
                                                background: placingIndex === i ? '#6366f1' : '#F56068',
                                                width: 10, height: 10, borderRadius: '50%',
                                                border: '2px solid #fff',
                                                boxShadow: `0 0 0 2px ${placingIndex === i ? '#6366f1' : '#F56068'}, 0 2px 4px rgba(0,0,0,0.2)`,
                                                padding: 0, cursor: 'default',
                                                display: 'flex', alignItems: 'center', gap: 4,
                                            }}
                                        >
                                            {ann.label && (
                                                <span style={{
                                                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                                                    background: 'rgba(0,0,0,0.75)', color: '#fff',
                                                    fontSize: 9, fontWeight: 700, padding: '2px 6px',
                                                    borderRadius: 20, whiteSpace: 'nowrap', letterSpacing: 0.3,
                                                }}>{ann.label}</span>
                                            )}
                                        </button>
                                    )
                                ))}
                            </model-viewer>

                            {/* Model info bar */}
                            <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    {modelLoaded ? (
                                        modelDimensions ? (
                                            <span>📐 {(modelDimensions.width * 100).toFixed(1)}×{(modelDimensions.height * 100).toFixed(1)}×{(modelDimensions.depth * 100).toFixed(1)} cm</span>
                                        ) : "✅ Model loaded"
                                    ) : (
                                        <span className="flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Loading model...</span>
                                    )}
                                </div>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={autoGeneratePositions}
                                        disabled={!modelLoaded}
                                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-indigo-100 transition-colors disabled:opacity-40 border-none cursor-pointer"
                                    >
                                        <Wand2 size={12} /> Auto-Place
                                    </button>
                                    <button
                                        onClick={() => { setAnnotations([]); }}
                                        className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-gray-200 transition-colors border-none cursor-pointer"
                                    >
                                        <RotateCcw size={12} /> Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                            <Info size={14} className="flex-shrink-0 mt-0.5" />
                            <span>No 3D model URL set for this item. Add an Android (.glb) model link in the Edit panel first.</span>
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                        <Info size={14} className="flex-shrink-0 mt-0.5" />
                        <span>
                            <strong>Auto-Place:</strong> Analyzes the model and distributes labels based on actual size.
                            <strong> Click-to-Place:</strong> Hit the <Crosshair size={10} className="inline" /> icon on any label, then tap on the 3D model to set its exact position.
                        </span>
                    </div>

                    {/* ── Annotation List ─────────────────────────────────── */}
                    <div className="space-y-3">
                        {annotations.map((ann, index) => (
                            <div key={index} className={`rounded-xl p-3 space-y-2 relative transition-colors ${placingIndex === index ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-gray-50'}`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 w-5">#{index + 1}</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Saffron Rice, Fried Onions..."
                                        value={ann.label}
                                        onChange={e => updateAnnotation(index, "label", e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                                    />
                                    {/* Click-to-place button */}
                                    <button
                                        onClick={() => placingIndex === index ? cancelPlacing() : startPlacing(index)}
                                        className={`p-1.5 rounded-lg border-none cursor-pointer transition-colors ${placingIndex === index ? 'bg-indigo-600 text-white' : 'text-indigo-500 hover:bg-indigo-50 bg-transparent'}`}
                                        title="Click on 3D model to set position"
                                    >
                                        <Crosshair size={14} />
                                    </button>
                                    <button onClick={() => removeAnnotation(index)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg border-none bg-transparent cursor-pointer">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                {/* Position info */}
                                <div className="pl-7 flex items-center gap-2 text-xs text-gray-400">
                                    <Crosshair size={10} />
                                    <span className="font-mono truncate" style={{ fontSize: 10 }}>
                                        {ann.auto || ann.position || "No position set"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Button */}
                    <button
                        onClick={addAnnotation}
                        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2 bg-transparent cursor-pointer"
                    >
                        <Plus size={16} /> Add Label
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
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnnotationsEditor;
