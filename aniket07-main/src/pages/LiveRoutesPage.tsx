import React, { useState } from 'react';
import { ArrowRight, MapPin, Route, Clock3, Wallet, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';

type RouteResult = {
  id: number | string;
  distance_km: number;
  duration_min: number;
  cost_inr?: number;
  recommended?: boolean;
  reason?: string;
  geometry?: unknown;
  steps?: { instruction?: string; name?: string; distance?: number }[];
};

export const LiveRoutesPage: React.FC = () => {
  const [origin, setOrigin] = useState('GGS College of Modern Technology, Kharar, Punjab');
  const [destination, setDestination] = useState('Sector 17, Chandigarh');
  const [mode, setMode] = useState<'car' | 'bike' | 'walking' | 'bus'>('car');
  const [preference, setPreference] = useState<'balanced' | 'fastest' | 'shortest' | 'cost'>('balanced');
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState('OSRM / OpenStreetMap');
  const [traffic, setTraffic] = useState('Live traffic unavailable');

  async function findRoutes(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setRoutes([]);
    try {
      const response = await fetch('/api/route', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, mode, preference }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not find routes. Please try again.');
      setRoutes(data.routes || []); setProvider(data.provider || 'OSRM / OpenStreetMap'); setTraffic(data.traffic || 'Traffic estimate');
      if (!data.routes?.length) setError('No routes were returned for these locations.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect to the routing service. Start the Python backend first.');
    } finally { setLoading(false); }
  }

  return <section className="space-y-5 max-w-5xl mx-auto">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs uppercase tracking-[0.22em] font-bold" style={{color:'var(--primary-light)'}}>Road routing</p><h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Find a real-world route</h2><p className="text-sm text-slate-400 mt-2">Search between places and compare road-route estimates without the GIS map panel.</p></div>
      <span className="text-xs rounded-full px-3 py-1.5 border border-slate-700 text-slate-300">{provider}</span>
    </div>
    <form onSubmit={findRoutes} className="glass-panel rounded-2xl p-4 sm:p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block text-sm text-slate-300"><span className="flex items-center gap-2 mb-2"><MapPin size={15} style={{color:'var(--primary-light)'}}/> Starting place</span><input value={origin} onChange={e=>setOrigin(e.target.value)} required className="w-full rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-3 text-white outline-none focus:border-cyan-400" placeholder="Enter starting address" /></label>
        <label className="block text-sm text-slate-300"><span className="flex items-center gap-2 mb-2"><MapPin size={15} className="text-rose-400"/> Destination</span><input value={destination} onChange={e=>setDestination(e.target.value)} required className="w-full rounded-xl bg-slate-950/70 border border-slate-700 px-3 py-3 text-white outline-none focus:border-cyan-400" placeholder="Enter destination" /></label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-sm text-slate-300">Travel mode<select value={mode} onChange={e=>setMode(e.target.value as typeof mode)} className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-3 text-white"><option value="car">Car</option><option value="bike">Bike</option><option value="walking">Walking</option><option value="bus">Bus</option></select></label>
        <label className="text-sm text-slate-300">Route preference<select value={preference} onChange={e=>setPreference(e.target.value as typeof preference)} className="mt-2 w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-3 text-white"><option value="balanced">Balanced</option><option value="fastest">Fastest</option><option value="shortest">Shortest</option><option value="cost">Lowest fuel cost</option></select></label>
        <div className="flex items-end"><button disabled={loading} className="btn-neon-glow btn-moving-shimmer w-full rounded-xl px-4 py-3 font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60">{loading?<RefreshCw size={17} className="animate-spin"/>:<Route size={17}/>} {loading?'Finding routes…':'Find routes'} <ArrowRight size={16}/></button></div>
      </div>
      <p className="text-xs text-slate-500">Requires the Python backend and an internet connection. Route times are estimates; live traffic and bus routing are not available.</p>
    </form>
    {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200 flex gap-2"><AlertCircle size={18} className="shrink-0"/>{error}</div>}
    {routes.length>0 && <div className="space-y-3"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-white text-lg">Route options</h3><span className="text-xs text-slate-400">{traffic}</span></div>
      {routes.map((r,i)=><article key={r.id ?? i} className={`glass-panel rounded-2xl p-4 sm:p-5 ${r.recommended?'ring-1 ring-emerald-400/50':''}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 flex-wrap"><h4 className="font-bold text-white">{r.recommended?'Recommended route':`Alternative route ${i+1}`}</h4>{r.recommended&&<span className="text-[10px] uppercase tracking-wider rounded-full px-2 py-1 bg-emerald-400/15 text-emerald-300">Best match</span>}</div><p className="text-sm text-slate-400 mt-1">{r.reason || 'Alternative route for comparison.'}</p></div><a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=${mode==='walking'?'walking':mode==='bike'?'bicycling':'driving'}`} target="_blank" rel="noreferrer" className="text-xs flex items-center gap-1 text-cyan-300 hover:text-cyan-200">Open directions <ExternalLink size={13}/></a></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4"><div className="rounded-xl bg-slate-950/50 p-3"><div className="text-xs text-slate-400 flex items-center gap-1"><Route size={13}/> Distance</div><div className="text-xl font-extrabold text-white mt-1">{Number(r.distance_km).toFixed(1)} km</div></div><div className="rounded-xl bg-slate-950/50 p-3"><div className="text-xs text-slate-400 flex items-center gap-1"><Clock3 size={13}/> Estimated time</div><div className="text-xl font-extrabold text-white mt-1">{Math.round(Number(r.duration_min))} min</div></div><div className="rounded-xl bg-slate-950/50 p-3"><div className="text-xs text-slate-400 flex items-center gap-1"><Wallet size={13}/> Estimated cost</div><div className="text-xl font-extrabold text-white mt-1">₹{Math.round(Number(r.cost_inr||0))}</div></div></div>
      </article>)}
    </div>}
  </section>;
};
