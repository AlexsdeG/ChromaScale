import React, { useState } from 'react';
import { Dices, Plus, RefreshCw } from 'lucide-react';
import { generateRandomColors } from '../utils/colorEngine';

interface RandomColorPanelProps {
  onGenerate: (colors: string[]) => void;
}

export const RandomColorPanel: React.FC<RandomColorPanelProps> = ({ onGenerate }) => {
  const [count, setCount] = useState(5);
  const [useBaseColor, setUseBaseColor] = useState(false);
  const [baseColor, setBaseColor] = useState('#3b82f6');

  const handleGenerate = () => {
    const colors = generateRandomColors(count, useBaseColor ? baseColor : undefined);
    onGenerate(colors);
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-zinc-700 transition-colors h-full">
      <h2 className="text-base font-semibold flex items-center gap-2 text-zinc-200">
        <Dices className="text-pink-400" size={18} />
        Random Colors
      </h2>

      <div className="flex flex-col gap-4 flex-1">
        {/* Count Input */}
        <div className="flex items-center justify-between">
            <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Amount</label>
            <input 
                type="number" 
                min="1" 
                max="20" 
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 5)))}
                className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-sm text-center text-zinc-200 focus:border-pink-500/50 outline-none"
            />
        </div>

        {/* Base Color Toggle */}
        <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={useBaseColor}
                    onChange={(e) => setUseBaseColor(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-pink-500 focus:ring-pink-500/20"
                />
                <span className="text-sm text-zinc-300">Use Base Color</span>
            </label>
            
            {useBaseColor && (
                <div className="flex items-center gap-2">
                    <input 
                        type="color" 
                        value={baseColor}
                        onChange={(e) => setBaseColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent p-0"
                    />
                </div>
            )}
        </div>

        <div className="mt-auto pt-2">
            <button 
                onClick={handleGenerate}
                className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-2 border border-zinc-700"
            >
                <RefreshCw size={14} />
                Generate
            </button>
        </div>
      </div>
    </div>
  );
};
