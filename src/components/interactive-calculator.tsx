"use client";

import { useState } from "react";
import { Scale, AlertTriangle, CheckCircle, Info } from "lucide-react";

export function InteractiveCalculator() {
  const [weight, setWeight] = useState<number>(300);
  const [length, setLength] = useState<number>(30);
  const [width, setWidth] = useState<number>(25);
  const [height, setHeight] = useState<number>(5);

  // Derived directly from the inputs — no state/effect needed.
  const volumetric = (length * width * height) / 5000;
  const dead = weight / 1000;
  const chargeable = Math.max(volumetric, dead);
  const slab = chargeable <= 0.5 ? 0.5 : Math.ceil(chargeable * 2) / 2;
  const isVolumetricHigher = volumetric > dead;

  return (
    <div className="w-full rounded-[28px] border border-zinc-800 bg-white p-6 md:p-8 shadow-pin-lg">
      <div className="flex items-center gap-3 mb-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <Scale className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-extrabold text-zinc-100 text-base leading-tight">Interactive Shipping Calculator</h3>
          <p className="text-xs text-zinc-550 mt-0.5">Calculate volumetric vs. dead weight slab instantly</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 mb-6">
        <div className="space-y-4">
          <div>
            <label className="flex justify-between text-xs font-bold text-zinc-400 mb-1.5">
              <span>Dead Weight (grams)</span>
              <span className="text-indigo-600">{weight}g</span>
            </label>
            <input 
              type="range" 
              min="50" 
              max="5000" 
              step="50"
              value={weight} 
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs font-bold text-zinc-400 mb-1.5">
              <span>Package Length (cm)</span>
              <span className="text-indigo-600">{length} cm</span>
            </label>
            <input 
              type="range" 
              min="5" 
              max="100" 
              step="1"
              value={length} 
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs font-bold text-zinc-400 mb-1.5">
              <span>Package Width (cm)</span>
              <span className="text-indigo-600">{width} cm</span>
            </label>
            <input 
              type="range" 
              min="5" 
              max="100" 
              step="1"
              value={width} 
              onChange={(e) => setWidth(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div>
            <label className="flex justify-between text-xs font-bold text-zinc-400 mb-1.5">
              <span>Package Height (cm)</span>
              <span className="text-indigo-600">{height} cm</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="50" 
              step="1"
              value={height} 
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-3">
              <span className="text-zinc-500">Dead Weight (kg)</span>
              <span className="text-zinc-200">{(weight / 1000).toFixed(2)} kg</span>
            </div>
            
            <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-3">
              <span className="text-zinc-500">Volumetric Weight</span>
              <span className="text-zinc-200">{volumetric.toFixed(2)} kg</span>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-sm font-extrabold text-zinc-100">Chargeable Slab</span>
              <span className="text-lg font-black text-indigo-600">{slab.toFixed(1)} kg</span>
            </div>
          </div>

          <div className="mt-5">
            {isVolumetricHigher ? (
              <div className="flex gap-2 rounded-xl bg-amber-50 border border-amber-200/50 p-3 text-[11px] leading-relaxed text-amber-800">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0" />
                <div>
                  <strong className="font-extrabold block">Volumetric Weight is higher!</strong>
                  You will be billed for <strong className="font-black">{slab} kg</strong>. Try reducing packaging size to save shipping charges.
                </div>
              </div>
            ) : (
              <div className="flex gap-2 rounded-xl bg-emerald-50 border border-emerald-200/50 p-3 text-[11px] leading-relaxed text-emerald-800">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="font-extrabold block">Packaging is Optimal!</strong>
                  Billed on dead weight: <strong className="font-black">{slab} kg</strong>. Volumetric size does not exceed product weight.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-indigo-50/50 p-3 text-[10px] font-bold text-indigo-750">
        <Info className="h-4 w-4 text-indigo-500 shrink-0" />
        Formula: (L × B × H) / 5000. Couriers charge on the higher of dead and volumetric weight.
      </div>
    </div>
  );
}
