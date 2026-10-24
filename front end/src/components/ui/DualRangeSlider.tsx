import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../../utils/currency';

interface DualRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onChangeEnd?: (value: [number, number]) => void;
}

export default function DualRangeSlider({ min, max, value, onChange, onChangeEnd }: DualRangeSliderProps) {
  const [localMin, setLocalMin] = useState(value[0]);
  const [localMax, setLocalMax] = useState(value[1]);
  
  useEffect(() => {
    setLocalMin(value[0]);
    setLocalMax(value[1]);
  }, [value[0], value[1]]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onChangeEnd?.([localMin, localMax]);
    }, 400);
    return () => clearTimeout(handler);
  }, [localMin, localMax]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Math.min(Number(e.target.value), localMax);
    setLocalMin(newVal);
    onChange([newVal, localMax]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Math.max(Number(e.target.value), localMin);
    setLocalMax(newVal);
    onChange([localMin, newVal]);
  };

  const getPercent = (val: number) => {
    if (max === min) return 0;
    return Math.round(((val - min) / (max - min)) * 100);
  };

  return (
    <div className="w-full select-none">
      <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-4">
        <span>{formatCurrency(min)}</span>
        <span>{formatCurrency(max)}</span>
      </div>
      
      <div className="relative h-1.5 bg-slate-200 rounded-full mb-6">
        <div 
          className="absolute h-1.5 bg-primary rounded-full"
          style={{ 
            left: `${getPercent(localMin)}%`, 
            width: `${getPercent(localMax) - getPercent(localMin)}%` 
          }}
        />
        
        <input 
          type="range"
          min={min}
          max={max}
          value={localMin}
          onChange={handleMinChange}
          className="absolute w-full h-1.5 top-0 touch-none cursor-pointer appearance-none pointer-events-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:shadow-md"
          style={{ zIndex: localMin > max - 100 ? '5' : '3' }}
        />
        
        <input 
          type="range"
          min={min}
          max={max}
          value={localMax}
          onChange={handleMaxChange}
          className="absolute w-full h-1.5 top-0 touch-none cursor-pointer appearance-none pointer-events-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:shadow-md"
          style={{ zIndex: '4' }}
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Min Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
            <input 
              type="number" 
              min={Math.max(0, min)}
              max={localMax}
              value={localMin}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                  e.preventDefault();
                }
                if (e.key === 'Enter') {
                  onChangeEnd?.([localMin, localMax]);
                  e.currentTarget.blur();
                }
              }}
              onChange={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val) || val < Math.max(0, min)) val = Math.max(0, min);
                if (val > localMax) val = localMax;
                setLocalMin(val);
                onChange([val, localMax]);
              }}
              onBlur={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val) || val < Math.max(0, min)) val = Math.max(0, min);
                if (val > localMax) val = localMax;
                setLocalMin(val);
                onChange([val, localMax]);
                onChangeEnd?.([val, localMax]);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-7 pr-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5 block">Max Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
            <input 
              type="number" 
              min={Math.max(0, localMin)}
              max={max}
              value={localMax}
              onKeyDown={(e) => {
                if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                  e.preventDefault();
                }
                if (e.key === 'Enter') {
                  onChangeEnd?.([localMin, localMax]);
                  e.currentTarget.blur();
                }
              }}
              onChange={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val) || val < Math.max(0, localMin)) val = Math.max(0, localMin);
                if (val > max) val = max;
                setLocalMax(val);
                onChange([localMin, val]);
              }}
              onBlur={(e) => {
                let val = parseInt(e.target.value);
                if (isNaN(val) || val < Math.max(0, localMin)) val = Math.max(0, localMin);
                if (val > max) val = max;
                setLocalMax(val);
                onChange([localMin, val]);
                onChangeEnd?.([localMin, val]);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-7 pr-2 text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
