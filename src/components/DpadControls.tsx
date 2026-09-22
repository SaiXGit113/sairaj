import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import type { Direction } from '../types';

interface DpadControlsProps {
  onDirectionChange: (dir: Direction) => void;
  disabled?: boolean;
}

export const DpadControls: React.FC<DpadControlsProps> = ({
  onDirectionChange,
  disabled = false,
}) => {
  const handleTouch = (e: React.TouchEvent | React.MouseEvent, dir: Direction) => {
    e.preventDefault();
    if (!disabled) {
      onDirectionChange(dir);
    }
  };

  return (
    <div
      id="mobile-dpad-controller"
      className="w-full max-w-[280px] mx-auto select-none pt-1"
    >
      <div className="grid grid-cols-3 gap-2.5 max-w-[200px] mx-auto">
        {/* Row 1: Up */}
        <div />
        <button
          id="dpad-btn-up"
          type="button"
          disabled={disabled}
          onTouchStart={(e) => handleTouch(e, 'UP')}
          onClick={(e) => handleTouch(e, 'UP')}
          aria-label="Move Up"
          className="h-13 aspect-square flex items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700/80 text-emerald-400 active:scale-90 active:bg-emerald-500 active:text-slate-950 shadow-md transition-all touch-manipulation disabled:opacity-50"
        >
          <ArrowUp className="w-6 h-6 pointer-events-none" />
        </button>
        <div />

        {/* Row 2: Left, Center decoration, Right */}
        <button
          id="dpad-btn-left"
          type="button"
          disabled={disabled}
          onTouchStart={(e) => handleTouch(e, 'LEFT')}
          onClick={(e) => handleTouch(e, 'LEFT')}
          aria-label="Move Left"
          className="h-13 aspect-square flex items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700/80 text-emerald-400 active:scale-90 active:bg-emerald-500 active:text-slate-950 shadow-md transition-all touch-manipulation disabled:opacity-50"
        >
          <ArrowLeft className="w-6 h-6 pointer-events-none" />
        </button>

        <div className="flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700/60" />
        </div>

        <button
          id="dpad-btn-right"
          type="button"
          disabled={disabled}
          onTouchStart={(e) => handleTouch(e, 'RIGHT')}
          onClick={(e) => handleTouch(e, 'RIGHT')}
          aria-label="Move Right"
          className="h-13 aspect-square flex items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700/80 text-emerald-400 active:scale-90 active:bg-emerald-500 active:text-slate-950 shadow-md transition-all touch-manipulation disabled:opacity-50"
        >
          <ArrowRight className="w-6 h-6 pointer-events-none" />
        </button>

        {/* Row 3: Down */}
        <div />
        <button
          id="dpad-btn-down"
          type="button"
          disabled={disabled}
          onTouchStart={(e) => handleTouch(e, 'DOWN')}
          onClick={(e) => handleTouch(e, 'DOWN')}
          aria-label="Move Down"
          className="h-13 aspect-square flex items-center justify-center rounded-xl bg-slate-800/90 border border-slate-700/80 text-emerald-400 active:scale-90 active:bg-emerald-500 active:text-slate-950 shadow-md transition-all touch-manipulation disabled:opacity-50"
        >
          <ArrowDown className="w-6 h-6 pointer-events-none" />
        </button>
        <div />
      </div>
    </div>
  );
};
