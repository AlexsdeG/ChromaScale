import React from 'react';
import { getContrastColor } from '../utils/colorEngine';
import { Copy, Check } from 'lucide-react';

interface ColorSwatchProps {
  step: number;
  hex: string;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({ step, hex }) => {
  const [copied, setCopied] = React.useState(false);
  const textColor = getContrastColor(hex);

  const handleCopy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="group relative flex-1 min-w-[3rem] h-20 md:h-24 flex flex-col justify-between p-2 cursor-pointer transition-all hover:z-10 hover:scale-105 first:rounded-l-md last:rounded-r-md ring-0 hover:ring-2 ring-white/20"
      style={{ backgroundColor: hex, color: textColor }}
      onClick={handleCopy}
      role="button"
      aria-label={`Copy ${hex}`}
    >
      {/* Top Label: Step Number */}
      <span className="text-[10px] md:text-xs font-medium opacity-60 group-hover:opacity-100 transition-opacity">
        {step}
      </span>
      
      {/* Center Icon: Copy/Check Status */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 pointer-events-none">
        {copied ? <Check size={24} strokeWidth={3} /> : <Copy size={20} strokeWidth={2.5} />}
      </div>
      
      {/* Bottom Label: Hex Code */}
      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider self-end opacity-90">
        {hex.replace('#', '')}
      </span>
    </div>
  );
};