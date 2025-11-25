import React, { useState } from 'react';
import { ColorScale } from '../types';
import { X, Copy, Check } from 'lucide-react';

interface ExportModalProps {
  scales: ColorScale[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ scales, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'tailwind' | 'css'>('tailwind');

  const generateCode = () => {
    if (format === 'tailwind') {
      const colors = scales.reduce((acc, scale) => {
        const safeName = scale.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        acc[safeName] = scale.steps;
        return acc;
      }, {} as Record<string, any>);
      
      return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colors, null, 2)}\n    }\n  }\n}`;
    } else {
      let css = ':root {\n';
      scales.forEach(scale => {
        const safeName = scale.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        Object.entries(scale.steps).forEach(([step, hex]) => {
          css += `  --${safeName}-${step}: ${hex};\n`;
        });
        css += '\n';
      });
      css += '}';
      return css;
    }
  };

  const code = generateCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Export Stack</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <button 
            onClick={() => setFormat('tailwind')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${format === 'tailwind' ? 'text-white border-b-2 border-indigo-500 bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Tailwind Config
          </button>
          <button 
            onClick={() => setFormat('css')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${format === 'css' ? 'text-white border-b-2 border-indigo-500 bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            CSS Variables
          </button>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-950 font-mono text-xs md:text-sm relative">
           <button 
             onClick={handleCopy}
             className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md text-xs font-medium transition-all border border-zinc-700"
           >
             {copied ? <><Check size={14}/> Copied</> : <><Copy size={14}/> Copy Code</>}
           </button>
           <pre className="text-zinc-300">{code}</pre>
        </div>

      </div>
    </div>
  );
};
