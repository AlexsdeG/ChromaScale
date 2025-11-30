import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { generateScale, generateVariant } from '../utils/colorEngine';
import { formatHex, oklch } from 'culori';
import { ColorScale, VariantType } from '../types';
import { ColorRow } from './ColorRow';
import { ExportModal } from './ExportModal';
import { extractColorsFromImage, askGeminiFast, generatePaletteFromText, generateVariantWithAI } from '../services/geminiService';
import { Plus, Wand2, Image as ImageIcon, Loader2, Sparkles, Terminal, UploadCloud, X, Download, Bot, Zap, Undo2, Dices } from 'lucide-react';

export const ChromaTool: React.FC = () => {
  const [scales, setScales] = useState<ColorScale[]>([
    generateScale('#3b82f6', 'Primary Blue', 'manual')
  ]);
  const [inputColor, setInputColor] = useState('#10b981');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  
  // Undo State
  const [undoData, setUndoData] = useState<{ scales: ColorScale[], type: 'single' | 'clear' } | null>(null);
  const undoTimerRef = useRef<number | null>(null);

  // UI States
  const [useAiForVariants, setUseAiForVariants] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportScales, setExportScales] = useState<ColorScale[]>([]); // Controls which scales are in the export modal
  const [variantLoadingId, setVariantLoadingId] = useState<string | null>(null);

  // Auto-dismiss AI message
  useEffect(() => {
    if (aiMessage) {
      const timer = setTimeout(() => setAiMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [aiMessage]);

  // Clean up undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // --- Actions ---

  const addScale = (hex: string, name?: string) => {
    try {
      const newScale = generateScale(hex, name || 'Manual Scale', 'manual');
      setScales(prev => [newScale, ...prev]);
    } catch (e) {
      // Fail silently for bad hex
    }
  };

  const setUndoAction = (data: { scales: ColorScale[], type: 'single' | 'clear' }) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoData(data);
    undoTimerRef.current = window.setTimeout(() => {
      setUndoData(null);
    }, 5000);
  };

  const deleteScale = (id: string) => {
    const scaleToDelete = scales.find(s => s.id === id);
    if (!scaleToDelete) return;
    
    setUndoAction({ scales: [scaleToDelete], type: 'single' });
    setScales(prev => prev.filter(s => s.id !== id));
  };

  const handleClearAll = () => {
    setUndoAction({ scales: [...scales], type: 'clear' });
    setScales([]);
  };

  const handleUndo = () => {
    if (!undoData) return;
    
    if (undoData.type === 'clear') {
        setScales(undoData.scales);
    } else {
        // For single undo, append to top or try to restore? 
        // Adding to top is simplest and usually expected for "restoring" an item.
        setScales(prev => [...undoData.scales, ...prev]);
    }
    setUndoData(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  };

  const renameScale = (id: string, newName: string) => {
    setScales(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const spawnVariant = async (parentId: string, type: VariantType) => {
    const parentIndex = scales.findIndex(s => s.id === parentId);
    if (parentIndex === -1) return;

    setVariantLoadingId(parentId);

    try {
      const parentScale = scales[parentIndex];
      let newBase: string;
      let newName: string;
      const source = useAiForVariants ? 'ai-variant' : 'algo-variant';

      if (useAiForVariants) {
        const aiResult = await generateVariantWithAI(parentScale.baseColor, type);
        newBase = aiResult.hex;
        newName = aiResult.name;
      } else {
        newBase = generateVariant(parentScale.baseColor, type);
        newName = `${parentScale.name} (${type === 'dark' ? 'Darker' : 'Lighter'})`;
      }

      const newScale = generateScale(newBase, newName, source);
      
      // Insert immediately after parent
      const newScales = [...scales];
      newScales.splice(parentIndex + 1, 0, newScale);
      setScales(newScales);
    } catch (e) {
      setAiMessage("Failed to generate variant.");
    } finally {
      setVariantLoadingId(null);
    }
  };

  const handleExportAll = () => {
    setExportScales(scales);
    setShowExport(true);
  };

  const handleExportSingle = (scale: ColorScale) => {
    setExportScales([scale]);
    setShowExport(true);
  };

  const handleLucky = () => {
    // Generate 5 random vivid colors
    const randomScales = Array.from({ length: 5 }).map((_, i) => {
        // Use OKLCH for uniform brightness/chroma distribution
        // L: 0.5-0.7 (nice visible midtones), C: 0.15-0.25 (vibrant), H: 0-360
        const l = 0.5 + Math.random() * 0.2;
        const c = 0.15 + Math.random() * 0.1;
        const h = Math.random() * 360;
        const hex = formatHex({ mode: 'oklch', l, c, h });
        return generateScale(hex, `Lucky Color ${i + 1}`, 'manual');
    });
    setScales(prev => [...randomScales, ...prev]);
    setAiMessage("Feelin' lucky? Here are 5 random colors!");
  };

  // --- Gemini & Image Logic ---

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setAiMessage(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
        try {
            const base64 = reader.result as string;
            const colors = await extractColorsFromImage(base64);
            const newScales = colors.map(c => generateScale(c.hex, c.name, 'image'));
            setScales(prev => [...newScales, ...prev]);
            setAiMessage(`Successfully extracted ${colors.length} colors.`);
        } catch (err) {
            console.error(err);
            setAiMessage("Failed to analyze image. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false,
    onDragEnter: undefined,
    onDragOver: undefined,
    onDragLeave: undefined
  });

  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsProcessing(true);
    setAiMessage(null);

    try {
        const lowerPrompt = aiPrompt.toLowerCase();
        // Broader check for generation intent
        const isGenerationRequest = 
            lowerPrompt.includes('generate') || 
            lowerPrompt.includes('palette') || 
            lowerPrompt.includes('theme') ||
            lowerPrompt.includes('colors') ||
            lowerPrompt.includes('make') ||
            lowerPrompt.includes('create');

        if (isGenerationRequest) {
            const colors = await generatePaletteFromText(aiPrompt);
            if (colors.length > 0) {
                const newScales = colors.map(c => generateScale(c.hex, c.name, 'ai-palette'));
                setScales(prev => [...newScales, ...prev]);
                setAiMessage(`Generated ${colors.length} new color scales.`);
            } else {
                setAiMessage("AI response was not a valid palette. Try being more specific (e.g., 'Ocean theme palette').");
            }
        } else {
            const answer = await askGeminiFast(aiPrompt);
            setAiMessage(answer);
        }
    } catch (err) {
        console.error("AI Request Failed", err);
        setAiMessage("AI Service unavailable. Please check your connection.");
    } finally {
        setIsProcessing(false);
    }
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-purple-500/30 pb-20">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white text-lg">C</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">ChromaScale</h1>
          </div>

          <div className="flex items-center gap-3">
             {/* AI Mode Toggle */}
             <button 
               onClick={() => setUseAiForVariants(!useAiForVariants)}
               className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${useAiForVariants ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
               title="Use AI for smarter dark/light variant generation"
             >
               {useAiForVariants ? <Bot size={14} /> : <Zap size={14} />}
               {useAiForVariants ? 'AI Variants On' : 'Algo Variants'}
             </button>

             {/* Export Button */}
             <button 
                onClick={handleExportAll}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 text-black text-sm font-semibold rounded-lg hover:bg-white transition-colors"
             >
                <Download size={16} />
                Export Stack
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Top Controls Grid (3 Cards) */}
        <section className="mb-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: AI Generator */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-colors flex flex-col">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full pointer-events-none"></div>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2 text-zinc-200">
                    <Wand2 className="text-purple-400" size={18}/> 
                    AI Palette Generator
                </h2>
                <textarea 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe a mood, scene, or theme..."
                    className="flex-1 w-full bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-300 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 outline-none resize-none min-h-[80px]"
                />
                <div className="flex items-center gap-2 mt-3">
                    <button 
                        onClick={handleAskAI}
                        disabled={isProcessing || !aiPrompt.trim()}
                        className="flex-1 flex justify-center items-center gap-2 px-4 py-2 bg-purple-600/80 hover:bg-purple-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                        Generate
                    </button>
                    <button 
                        onClick={handleLucky}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors border border-zinc-700"
                        title="I Feel Lucky (Random Colors)"
                    >
                        <Dices size={18} />
                    </button>
                </div>
            </div>

            {/* Card 2: Image Extraction */}
            <div 
                {...getRootProps()}
                className={`
                    relative border border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-full
                    ${isDragActive ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'}
                `}
            >
                <input {...getInputProps()} />
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isDragActive ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                    {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <UploadCloud size={20}/>}
                </div>
                <h2 className="text-sm font-semibold text-zinc-200">Drop Image Here</h2>
                <p className="text-xs text-zinc-500 mt-1">Extracts dominant & accent colors</p>
            </div>

            {/* Card 3: Manual Entry */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-center gap-4 hover:border-zinc-700 transition-colors">
               <h2 className="text-base font-semibold flex items-center gap-2 text-zinc-200">
                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                    Manual Entry
               </h2>
               
               <div className="flex flex-col gap-3">
                   <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-lg border border-zinc-800">
                        <input 
                            type="color" 
                            value={inputColor}
                            onChange={(e) => setInputColor(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                        />
                        <div className="flex flex-col">
                            <span className="text-xs text-zinc-500 font-mono">HEX CODE</span>
                            <input 
                                type="text"
                                value={inputColor}
                                onChange={(e) => setInputColor(e.target.value)}
                                className="bg-transparent text-sm font-mono text-white w-full focus:outline-none uppercase"
                            />
                        </div>
                   </div>
                   <button 
                        onClick={() => addScale(inputColor)}
                        className="w-full py-2 bg-zinc-100 hover:bg-white text-black text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus size={14} strokeWidth={3} />
                        Add Scale
                    </button>
               </div>
            </div>
        </section>

        {/* AI Message Toast */}
        {aiMessage && (
            <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-zinc-900 border-l-4 border-purple-500 rounded-r-lg shadow-2xl animate-in slide-in-from-right-10 fade-in duration-300">
                <div className="p-4 relative">
                    <button 
                        onClick={() => setAiMessage(null)}
                        className="absolute top-2 right-2 text-zinc-500 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Sparkles size={12}/> Gemini
                    </h3>
                    <p className="text-zinc-200 text-sm leading-relaxed">{aiMessage}</p>
                </div>
            </div>
        )}

        {/* Undo Toast */}
        {undoData && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-800/90 backdrop-blur border border-zinc-700 text-white rounded-lg shadow-2xl overflow-hidden min-w-[300px] animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="px-4 py-3 flex items-center justify-between gap-4">
                    <span className="text-sm font-medium">
                        {undoData.type === 'clear' ? 'All scales cleared' : 'Scale deleted'}
                    </span>
                    <button 
                        onClick={handleUndo} 
                        className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-bold uppercase rounded transition-colors"
                    >
                        <Undo2 size={12} /> Undo
                    </button>
                </div>
                {/* Progress Bar */}
                <div className="h-1 bg-zinc-700 w-full">
                    <div className="h-full bg-indigo-500 animate-[progress_5s_linear_forwards] origin-left" />
                </div>
                <style>{`
                    @keyframes progress {
                        from { width: 100%; }
                        to { width: 0%; }
                    }
                `}</style>
            </div>
        )}

        {/* Color Stack */}
        <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold">Your Stack</h2>
                <div className="flex items-center gap-4">
                    {variantLoadingId && <div className="text-xs text-indigo-400 flex items-center gap-1"><Loader2 className="animate-spin" size={12}/> Generating Variant...</div>}
                    <span className="text-sm text-zinc-500">{scales.length} Scales</span>
                    {scales.length > 0 && (
                        <button 
                            onClick={handleClearAll}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>
            </div>
            
            <div className="space-y-4">
                {scales.length === 0 ? (
                    <div className="py-24 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
                        <p className="text-zinc-500">Your stack is empty.</p>
                        <p className="text-zinc-600 text-sm mt-2">Generate a palette or add a color to get started.</p>
                    </div>
                ) : (
                    scales.map(scale => (
                        <ColorRow 
                            key={scale.id} 
                            scale={scale} 
                            onDelete={deleteScale} 
                            onBranch={spawnVariant}
                            onRename={renameScale}
                            onExport={handleExportSingle}
                        />
                    ))
                )}
            </div>
        </section>

        {showExport && <ExportModal scales={exportScales} onClose={() => setShowExport(false)} />}

      </main>
    </div>
  );
};