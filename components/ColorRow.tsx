import React, { useState, useRef, useEffect } from 'react';
import { ColorScale, VariantType, ScaleSource } from '../types';
import { ColorSwatch } from './ColorSwatch';
import { Trash2, GitBranch, Moon, Sun, ChevronDown, Download, Edit2, Check, Sparkles, Image as ImageIcon, Bot, Zap, PenTool } from 'lucide-react';

interface ColorRowProps {
  scale: ColorScale;
  onDelete: (id: string) => void;
  onBranch: (id: string, type: VariantType) => void;
  onRename: (id: string, newName: string) => void;
  onExport: (scale: ColorScale) => void;
}

const SourceBadge: React.FC<{ source: ScaleSource }> = ({ source }) => {
    let color = 'bg-zinc-800 text-zinc-400 border-zinc-700';
    let label = 'Manual';
    let Icon = PenTool;

    switch (source) {
        case 'ai-palette':
            color = 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            label = 'AI Generated';
            Icon = Sparkles;
            break;
        case 'image':
            color = 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            label = 'Image';
            Icon = ImageIcon;
            break;
        case 'ai-variant':
            color = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
            label = 'AI Variant';
            Icon = Bot;
            break;
        case 'algo-variant':
            color = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
            label = 'Algo Variant';
            Icon = Zap;
            break;
        case 'manual':
            color = 'bg-zinc-800 text-zinc-400 border-zinc-700';
            label = 'Manual';
            Icon = PenTool;
            break;
    }

    return (
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${color} select-none`}>
            <Icon size={12} strokeWidth={2.5} />
            <span className="hidden sm:inline">{label}</span>
        </span>
    );
};

export const ColorRow: React.FC<ColorRowProps> = ({ scale, onDelete, onBranch, onRename, onExport }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(scale.name);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
      if (isEditing && inputRef.current) {
          inputRef.current.focus();
      }
  }, [isEditing]);

  const saveName = () => {
      if (editName.trim()) {
          onRename(scale.id, editName);
      } else {
          setEditName(scale.name); // Revert if empty
      }
      setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveName();
      if (e.key === 'Escape') {
          setEditName(scale.name);
          setIsEditing(false);
      }
  };

  return (
    <div className="group relative bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 shadow-sm hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-2 hover:border-zinc-700">
      
      <div className="flex flex-col items-stretch gap-4">
        
        {/* LEFT: Info & Base Color */}
        <div className="flex items-center gap-3 min-w-[140px]">
           <div className="flex items-center gap-3 w-full">
              <div className="relative w-8 h-8 rounded-full shadow-inner ring-1 ring-zinc-700 overflow-hidden shrink-0">
                <input 
                  type="color" 
                  value={scale.baseColor} 
                  disabled 
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-default bg-transparent"
                />
              </div>
              
              <div className="flex flex-col justify-center flex-1">
                <div className="flex items-center gap-2 h-5 w-full">
                    {isEditing ? (
                        <div className="flex items-center gap-1">
                            <input 
                                ref={inputRef}
                                type="text" 
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={saveName}
                                onKeyDown={handleKeyDown}
                                className="bg-zinc-950 border border-zinc-700 rounded px-1 py-0.5 text-sm font-semibold text-white w-32 focus:outline-none focus:border-indigo-500"
                            />
                            <button onMouseDown={(e) => { e.preventDefault(); saveName(); }} className="text-green-400 hover:text-green-300"><Check size={14}/></button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 group/edit w-full">
                            <span 
                                className="text-sm font-semibold text-zinc-100 truncate max-w-[100px] md:max-w-[120px] cursor-pointer" 
                                title={scale.name}
                                onClick={() => setIsEditing(true)}
                            >
                            {scale.name}
                            </span>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="text-zinc-600 hover:text-zinc-300 opacity-0 group-hover/edit:opacity-100 transition-opacity"
                            >
                                <Edit2 size={10} />
                            </button>
                            
                            {/* Source Badge: Pushed to the right */}
                            <div className="ml-auto">
                                <SourceBadge source={scale.source} />
                            </div>
                        </div>
                    )}
                </div>
                
                <span className="text-[10px] text-zinc-500 font-mono uppercase leading-tight">
                  {scale.baseColor}
                </span>
              </div>
           </div>
        </div>

        {/* CENTER: Swatches */}
        <div className="flex-1 min-w-0 overflow-x-auto pb-2 scrollbar-hide">
           <div className="flex w-full min-w-[600px] rounded-lg overflow-hidden shadow-inner ring-1 ring-zinc-800/50">
            {Object.entries(scale.steps).map(([step, hex]) => (
              <ColorSwatch key={step} step={Number(step)} hex={hex} />
            ))}
          </div>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-2">
                        
            {/* Export Button (Single) */}
            <button
                onClick={() => onExport(scale)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                title="Export this scale"
            >
                <Download size={16} />
            </button>

            {/* Variant Dropdown */}
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors border ${showMenu ? 'bg-zinc-800 border-zinc-600 text-zinc-100' : 'bg-transparent border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'}`}
                >
                    <GitBranch size={14} />
                    <span className="hidden xl:inline">Variant</span>
                    <ChevronDown size={12} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showMenu && (
                    <div className="absolute top-full right-0 lg:right-auto lg:left-0 mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 overflow-hidden ring-1 ring-black/50">
                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-800/50">
                          Spawn Scale
                        </div>
                        <button 
                            onClick={() => { onBranch(scale.id, 'light'); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                        >
                            <Sun size={14} className="text-amber-400" /> Lighter
                        </button>
                        <button 
                            onClick={() => { onBranch(scale.id, 'dark'); setShowMenu(false); }}
                            className="w-full text-left px-3 py-2.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                        >
                            <Moon size={14} className="text-indigo-400" /> Darker
                        </button>
                    </div>
                )}
            </div>

            {/* Delete Button */}
            <button 
                onClick={() => onDelete(scale.id)}
                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors border border-transparent hover:border-red-500/20"
                title="Delete Scale"
            >
                <Trash2 size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};