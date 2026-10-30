import React from 'react';
import { VehicleConfig, TravelMode } from '../types/routing';
import {
  Settings,
  Fuel,
  Car,
  Bike,
  Bus,
  Footprints,
  Palette,
  RotateCcw,
  Sliders,
  Check,
  SunMedium,
} from 'lucide-react';

interface SettingsPageProps {
  mode: TravelMode;
  onSelectMode: (m: TravelMode) => void;
  vehicleConfig: VehicleConfig;
  onChangeVehicleConfig: (cfg: VehicleConfig) => void;
  trafficMultiplier: number;
  onTrafficMultiplierChange: (val: number) => void;
  colorAccent: 'emerald' | 'cyan' | 'violet' | 'amber';
  onSelectColorAccent: (accent: 'emerald' | 'cyan' | 'violet' | 'amber') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  mode,
  onSelectMode,
  vehicleConfig,
  onChangeVehicleConfig,
  trafficMultiplier,
  onTrafficMultiplierChange,
  colorAccent,
  onSelectColorAccent,
}) => {
  const resetDefaults = () => {
    onChangeVehicleConfig({
      fuelPricePerLiter: 98.0,
      mileageKmPerLiter: mode === 'car' ? 16.0 : 48.0,
      busBaseFare: 15.0,
      busPerKmFare: 1.75,
    });
    onTrafficMultiplierChange(1.25);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Trip & Vehicle Settings
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              Custom Rates & Physics
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure vehicle fuel rates, mileage, transit fares, and visual next-level color accents.
          </p>
        </div>

        <button
          onClick={resetDefaults}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Grid of Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Next-Level Color Mode */}
        <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Palette className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-100">Next-Level Neon Color Mode</h3>
          </div>
          <p className="text-xs text-slate-400">
            Choose your preferred cyber neon lighting theme:
          </p>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={() => onSelectColorAccent('emerald')}
              className={`p-3 rounded-xl border flex items-center justify-between transition ${
                colorAccent === 'emerald'
                  ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50"></span>
                <span className="text-xs font-bold">Cyber Emerald</span>
              </div>
              {colorAccent === 'emerald' && <Check className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => onSelectColorAccent('cyan')}
              className={`p-3 rounded-xl border flex items-center justify-between transition ${
                colorAccent === 'cyan'
                  ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/30 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/50"></span>
                <span className="text-xs font-bold">Electric Cyan</span>
              </div>
              {colorAccent === 'cyan' && <Check className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              onClick={() => onSelectColorAccent('violet')}
              className={`p-3 rounded-xl border flex items-center justify-between transition ${
                colorAccent === 'violet'
                  ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-md shadow-purple-500/50"></span>
                <span className="text-xs font-bold">Neon Violet</span>
              </div>
              {colorAccent === 'violet' && <Check className="w-4 h-4 text-purple-400" />}
            </button>

            <button
              onClick={() => onSelectColorAccent('amber')}
              className={`p-3 rounded-xl border flex items-center justify-between transition ${
                colorAccent === 'amber'
                  ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30 text-white'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-md shadow-amber-400/50"></span>
                <span className="text-xs font-bold">Hyper Amber</span>
              </div>
              {colorAccent === 'amber' && <Check className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>

        {/* Traffic Peak Rush Simulator */}
        <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <SunMedium className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">Live Traffic Delay Factor</h3>
          </div>
          <p className="text-xs text-slate-400">
            Simulate rush-hour congestion on highway bypasses and arterial roads:
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => onTrafficMultiplierChange(1.0)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                trafficMultiplier === 1.0
                  ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              Free Flow (1.0x)
            </button>
            <button
              onClick={() => onTrafficMultiplierChange(1.35)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                trafficMultiplier === 1.35
                  ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              Moderate (1.35x)
            </button>
            <button
              onClick={() => onTrafficMultiplierChange(2.1)}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                trafficMultiplier === 2.1
                  ? 'bg-red-950/50 border-red-500 text-red-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              Peak Rush (2.1x)
            </button>
          </div>

          <div className="pt-2">
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Custom Congestion Slider:</span>
              <span className="font-mono font-bold text-amber-400">{trafficMultiplier.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="2.5"
              step="0.05"
              value={trafficMultiplier}
              onChange={e => onTrafficMultiplierChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Fuel & Vehicle Economics */}
        <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Fuel className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100">Vehicle Economics & Fare Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 block mb-1 font-semibold">Fuel Price (₹/Liter):</label>
              <input
                type="number"
                value={vehicleConfig.fuelPricePerLiter}
                onChange={e =>
                  onChangeVehicleConfig({
                    ...vehicleConfig,
                    fuelPricePerLiter: Math.max(1, parseFloat(e.target.value) || 98),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Tricity average Petrol rate</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 block mb-1 font-semibold">Car Mileage (km/L):</label>
              <input
                type="number"
                value={vehicleConfig.mileageKmPerLiter}
                onChange={e =>
                  onChangeVehicleConfig({
                    ...vehicleConfig,
                    mileageKmPerLiter: Math.max(1, parseFloat(e.target.value) || 16),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Average hatchback / sedan</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 block mb-1 font-semibold">Bus Base Fare (₹):</label>
              <input
                type="number"
                value={vehicleConfig.busBaseFare}
                onChange={e =>
                  onChangeVehicleConfig({
                    ...vehicleConfig,
                    busBaseFare: Math.max(0, parseFloat(e.target.value) || 15),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">CTU minimum boarding fare</span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <label className="text-slate-400 block mb-1 font-semibold">Bus Rate per km (₹):</label>
              <input
                type="number"
                step="0.25"
                value={vehicleConfig.busPerKmFare}
                onChange={e =>
                  onChangeVehicleConfig({
                    ...vehicleConfig,
                    busPerKmFare: Math.max(0, parseFloat(e.target.value) || 1.75),
                  })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Per-kilometer transit tariff</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
