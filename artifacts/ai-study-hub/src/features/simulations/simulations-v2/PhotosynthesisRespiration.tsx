import { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, Moon, Droplets, Thermometer } from 'lucide-react';

interface DataPoint { t: number; o2Ps: number; co2Ps: number; o2Resp: number; co2Resp: number; glucose: number; }

type LightColor = 'white' | 'red' | 'blue' | 'green';
type PlantType = 'C3' | 'C4';
type Preset = 'none' | 'optimal' | 'dark' | 'cloudy' | 'greenhouse' | 'hot';

const PRESETS: Record<Exclude<Preset, 'none'>, { light: number; co2: number; temp: number; label: string }> = {
  optimal: { light: 80, co2: 70, temp: 25, label: 'Optimal' },
  dark: { light: 0, co2: 50, temp: 20, label: 'Dark/Night' },
  cloudy: { light: 30, co2: 50, temp: 18, label: 'Cloudy Day' },
  greenhouse: { light: 60, co2: 90, temp: 28, label: 'Greenhouse' },
  hot: { light: 90, co2: 50, temp: 42, label: 'Hot Day' },
};

const LIGHT_MULTIPLIER: Record<LightColor, number> = { white: 1.0, red: 1.2, blue: 1.1, green: 0.3 };
const LIGHT_LABELS: Record<LightColor, { nm: string; note: string }> = {
  white: { nm: 'Full Spectrum', note: 'All wavelengths' },
  red: { nm: '660 nm', note: 'Boosts PSII' },
  blue: { nm: '450 nm', note: 'Boosts PSI' },
  green: { nm: '550 nm', note: 'Least effective' },
};
const LIGHT_COLORS_HEX: Record<LightColor, string> = { white: '#f5f5f5', red: '#C47B6B', blue: '#5B7FA5', green: '#6A9B7A' };

export default function PhotosynthesisRespiration() {
  const [light, setLight] = useState(70);
  const [co2Level, setCo2Level] = useState(50);
  const [temp, setTemp] = useState(25);
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<DataPoint[]>([{ t: 0, o2Ps: 20, co2Ps: 50, o2Resp: 20, co2Resp: 50, glucose: 10 }]);
  const [activeTab, setActiveTab] = useState<'overview' | 'light' | 'calvin'>('overview');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);

  const [lightColor, setLightColor] = useState<LightColor>('white');
  const [plantType, setPlantType] = useState<PlantType>('C3');
  const [preset, setPreset] = useState<Preset>('none');
  const [darkLightCycle, setDarkLightCycle] = useState(false);
  const [cycleLength, setCycleLength] = useState(10);
  const lightWasOnRef = useRef(true);

  const applyPreset = useCallback((key: Preset) => {
    if (key === 'none') return;
    const p = PRESETS[key];
    setLight(p.light);
    setCo2Level(p.co2);
    setTemp(p.temp);
    setPreset(key);
  }, []);

  // Rate calculations
  const lightMult = LIGHT_MULTIPLIER[lightColor];

  const effectiveTempOpt = plantType === 'C4' ? 35 : 25;
  const tempPenalty = Math.max(0, 1 - Math.abs(temp - effectiveTempOpt) / 30);

  const co2Factor = plantType === 'C4' ? Math.pow(co2Level / 100, 0.7) : co2Level / 100;

  let psRate = (light / 100) * lightMult * co2Factor * tempPenalty * 2.5;
  const respRate = (temp > 10 ? 0.4 + (temp - 10) * 0.04 : 0.1) * 0.8;

  // Dark/Light cycle
  if (darkLightCycle && running) {
    const cyclePos = tickRef.current % cycleLength;
    const isLightPhase = cyclePos < cycleLength / 2;
    if (!isLightPhase) {
      psRate = 0;
    }
  }

  const o2Net = psRate - respRate;
  const co2Net = respRate - psRate;

  // Limiting factor
  const limitingFactor = (() => {
    if (light < 30) return { text: 'Light is limiting', color: '#B89555', icon: <Sun size={14} /> };
    if (co2Level < 30) return { text: 'CO₂ is limiting', color: '#5B7FA5', icon: <Droplets size={14} /> };
    if (temp < 15 || temp > 35) return { text: 'Temperature is limiting', color: '#C47B6B', icon: <Thermometer size={14} /> };
    return null;
  })();

  // Compensation & saturation points
  const compensationLight = (() => {
    // Find light % where o2Net ≈ 0: psRate = respRate
    // psRate = (L/100)*lightMult*co2Factor*tempPenalty*2.5
    // Solve: L = respRate*100 / (lightMult*co2Factor*tempPenalty*2.5)
    const denom = lightMult * co2Factor * tempPenalty * 2.5;
    if (denom <= 0) return 100;
    return Math.min(100, Math.max(0, (respRate * 100) / denom));
  })();

  const saturationLight = (() => {
    // Approximate: where psRate plateaus — when light increase gives <1% psRate increase
    // psRate grows linearly with light, so saturation at the max meaningful point
    // Practically: where psRate reaches ~95% of its theoretical max
    const maxPs = 1.0 * lightMult * co2Factor * tempPenalty * 2.5;
    if (maxPs <= 0) return 100;
    const target = maxPs * 0.95;
    const L = (target * 100) / (lightMult * co2Factor * tempPenalty * 2.5);
    return Math.min(100, Math.max(0, L));
  })();

  // BTB color
  const btbBlue = Math.max(0, Math.min(1, 0.5 + o2Net * 0.3));
  const btbR = Math.round(255 * (1 - btbBlue));
  const btbG = Math.round(165 * (1 - btbBlue) + 100 * btbBlue);
  const btbB = Math.round(50 * (1 - btbBlue) + 255 * btbBlue);
  const btbColor = `rgb(${btbR},${btbG},${btbB})`;
  const btbLabel = btbBlue > 0.6 ? 'Basic (high O₂)' : btbBlue < 0.4 ? 'Acidic (high CO₂)' : 'Neutral';

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        tickRef.current += 1;

        // Dark/Light cycle logic
        let effectivePsRate = psRate;
        if (darkLightCycle) {
          const cyclePos = tickRef.current % cycleLength;
          const isLightPhase = cyclePos < cycleLength / 2;
          if (!isLightPhase) {
            effectivePsRate = 0;
          }
        }

        const effectiveO2Net = effectivePsRate - respRate;

        setData(prev => {
          const last = prev[prev.length - 1];
          const newPt: DataPoint = {
            t: last.t + 1,
            o2Ps: Math.min(100, Math.max(0, last.o2Ps + effectiveO2Net * 0.8)),
            co2Ps: Math.min(100, Math.max(0, last.co2Ps - effectivePsRate * 0.5 + respRate * 0.5)),
            o2Resp: Math.min(100, Math.max(0, last.o2Resp - respRate * 0.6)),
            co2Resp: Math.min(100, Math.max(0, last.co2Resp + respRate * 0.6)),
            glucose: Math.min(100, Math.max(0, last.glucose + effectivePsRate * 0.3 - respRate * 0.3)),
          };
          return [...prev.slice(-50), newPt];
        });
      }, 500);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, o2Net, psRate, respRate, co2Net, darkLightCycle, cycleLength]);

  const reset = () => {
    setRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setData([{ t: 0, o2Ps: 20, co2Ps: 50, o2Resp: 20, co2Resp: 50, glucose: 10 }]);
    tickRef.current = 0;
    setPreset('none');
  };

  const current = data[data.length - 1];
  const GRAPH_W = 380, GRAPH_H = 140;

  const isDarkPhase = darkLightCycle && running && (tickRef.current % cycleLength) >= cycleLength / 2;

  return (
    <div className="sim-container">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Presets */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Presets</h3>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(PRESETS) as [Preset, typeof PRESETS['optimal']][]).map(([key, p]) => (
                <button key={key} onClick={() => applyPreset(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    preset === key
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card border-border hover:bg-muted'
                  }`}>
                  {p.label}
                </button>
              ))}
              {preset !== 'none' && (
                <button onClick={() => setPreset('none')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-border bg-card hover:bg-muted text-muted-foreground">
                  Custom
                </button>
              )}
            </div>
          </div>

          {/* Plant Type */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Plant Type</h3>
            <div className="flex gap-2">
              {(['C3', 'C4'] as PlantType[]).map(pt => (
                <button key={pt} onClick={() => setPlantType(pt)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                    plantType === pt
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card border-border hover:bg-muted text-muted-foreground'
                  }`}>
                  <div>{pt}</div>
                  <div className="text-[10px] font-normal mt-0.5 opacity-70">
                    {pt === 'C3' ? 'Standard (25°C opt)' : 'CO₂ efficient (35°C opt)'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Light Color Filter */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Light Color Filter</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['white', 'red', 'blue', 'green'] as LightColor[]).map(lc => (
                <button key={lc} onClick={() => setLightColor(lc)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border flex flex-col items-center gap-1 ${
                    lightColor === lc
                      ? 'border-foreground shadow-md'
                      : 'border-border hover:bg-muted'
                  }`}>
                  <div className="w-5 h-5 rounded-full border-2" style={{
                    background: LIGHT_COLORS_HEX[lc],
                    borderColor: lightColor === lc ? 'hsl(var(--foreground))' : 'hsl(var(--border))'
                  }}/>
                  <span className="capitalize">{lc}</span>
                  <span className="text-[9px] font-normal text-muted-foreground">{LIGHT_LABELS[lc].nm}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">
              {LIGHT_LABELS[lightColor].note} — {lightColor === 'white' ? '1.0x' : `${LIGHT_MULTIPLIER[lightColor]}x`} PS rate multiplier
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'Space Grotesk' }}>Experiment Controls</h3>

            {[
              { label: 'Light Intensity', val: light, set: setLight, unit: '%', color: '#B89555',
                hint: `Photosynthesis rate: ${psRate.toFixed(2)} units/s` },
              { label: 'CO2 Concentration', val: co2Level, set: setCo2Level, unit: '%', color: '#5B7FA5',
                hint: `Calvin cycle limited by CO2 supply` },
              { label: 'Temperature', val: temp, set: setTemp, unit: '°C', min: 5, max: 45, color: '#C47B6B',
                hint: temp < 15 ? 'Cold — enzyme activity reduced' : temp > 35 ? 'Hot — enzymes denaturing' : 'Optimal temperature range' },
            ].map(ctrl => (
              <div key={ctrl.label} className="mb-4">
                <div className="flex justify-between mb-1">
                  <div className="sim-label mb-0">{ctrl.label}</div>
                  <span className="font-mono text-sm font-bold" style={{ color: ctrl.color }}>
                    {ctrl.val}{ctrl.unit}
                  </span>
                </div>
                <input type="range"
                  min={'min' in ctrl ? ctrl.min : 0} max={'max' in ctrl ? ctrl.max : 100}
                  value={ctrl.val} onChange={e => { ctrl.set(Number(e.target.value)); setPreset('none'); }}
                  className="w-full mb-1" style={{ accentColor: ctrl.color }}/>
                <p className="text-xs text-muted-foreground">{ctrl.hint}</p>
              </div>
            ))}

            {/* Limiting Factor Banner */}
            {limitingFactor && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4 text-xs font-bold"
                style={{ background: `${limitingFactor.color}20`, color: limitingFactor.color, border: `1px solid ${limitingFactor.color}40` }}>
                {limitingFactor.icon}
                {limitingFactor.text}
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={() => setRunning(r => !r)}
                data-testid="button-toggle-run"
                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 text-white"
                style={{ background: running ? '#C47B6B' : '#6A9B7A' }}>
                {running ? 'Pause' : 'Start'}
              </button>
              <button onClick={reset}
                data-testid="button-reset"
                className="flex-1 py-3 rounded-xl font-bold text-sm border border-border hover:bg-muted transition-all">
                Reset
              </button>
            </div>
          </div>

          {/* Dark/Light Cycle */}
          <div className="sim-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Dark/Light Cycle</h3>
              <button onClick={() => setDarkLightCycle(d => !d)}
                className={`relative w-12 h-6 rounded-full transition-all ${darkLightCycle ? 'bg-green-500' : 'bg-muted'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${darkLightCycle ? 'left-[26px]' : 'left-0.5'}`}>
                  {darkLightCycle ? <Sun size={12} className="absolute top-1 left-1 text-amber-500" /> : <Moon size={12} className="absolute top-1 left-1 text-gray-400" />}
                </div>
              </button>
            </div>
            {darkLightCycle && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-muted-foreground">Phase:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDarkPhase ? 'bg-gray-800 text-white' : 'bg-amber-100 text-amber-800'}`}>
                    {isDarkPhase ? <Moon size={10} className="inline mr-1" /> : <Sun size={10} className="inline mr-1" />}
                    {isDarkPhase ? 'Dark' : 'Light'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Tick {tickRef.current % cycleLength}/{cycleLength}</span>
                </div>
                <div className="mb-1">
                  <div className="flex justify-between mb-1">
                    <span className="sim-label mb-0">Cycle Length</span>
                    <span className="font-mono text-xs font-bold text-muted-foreground">{cycleLength} ticks</span>
                  </div>
                  <input type="range" min={5} max={20} value={cycleLength}
                    onChange={e => setCycleLength(Number(e.target.value))}
                    className="w-full" style={{ accentColor: '#6A6A6A' }}/>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-muted flex">
                  <div className="h-full bg-amber-300 transition-all" style={{ width: `${50}%` }}/>
                  <div className="h-full bg-gray-700 transition-all" style={{ width: `${50}%` }}/>
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>Light</span>
                  <span>Dark</span>
                </div>
              </>
            )}
          </div>

          {/* Rate display */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Current Rates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'PS Rate', val: psRate.toFixed(2), unit: 'u/s', color: '#6A9B7A', desc: 'O2 produced' },
                { label: 'Resp Rate', val: respRate.toFixed(2), unit: 'u/s', color: '#C47B6B', desc: 'CO2 released' },
                { label: 'Net O2', val: o2Net.toFixed(2), unit: 'u/s', color: o2Net > 0 ? '#5B7FA5' : '#B89555', desc: o2Net > 0 ? 'Net gain' : 'Net loss' },
                { label: 'Glucose', val: current.glucose.toFixed(0), unit: '%', color: '#8B7BB5', desc: 'Storage' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                  <div className="text-xl font-bold font-mono" style={{ color: item.color }}>
                    {item.val}<span className="text-xs ml-0.5 font-normal">{item.unit}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Diagrams tab */}
          <div className="sim-panel">
            <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
              {(['overview', 'light', 'calvin'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${activeTab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                  {t === 'light' ? 'Light Rxns' : t === 'calvin' ? 'Calvin Cycle' : 'Overview'}
                </button>
              ))}
            </div>
            {activeTab === 'overview' && (
              <svg viewBox="0 0 300 160" className="w-full">
                <rect x="10" y="10" width="120" height="140" rx="8" fill="#D8EDE0" stroke="#6A9B7A" strokeWidth="1.5"/>
                <text x="70" y="30" textAnchor="middle" fontSize="10" fill="#166534" fontWeight="700">Plant Cell</text>
                <text x="70" y="45" textAnchor="middle" fontSize="8" fill="#166534">(Photosynthesis)</text>
                <ellipse cx="70" cy="90" rx="25" ry="18" fill="#6A9B7A" opacity="0.7"/>
                <text x="70" y="93" textAnchor="middle" fontSize="7" fill="white" fontWeight="600">Chloroplast</text>
                <text x="70" y="102" textAnchor="middle" fontSize="7" fill="white">Thylakoid</text>
                <rect x="170" y="10" width="120" height="140" rx="8" fill="#F5EDE0" stroke="#B89555" strokeWidth="1.5"/>
                <text x="230" y="30" textAnchor="middle" fontSize="10" fill="#7A5A2E" fontWeight="700">Yeast/Cell</text>
                <text x="230" y="45" textAnchor="middle" fontSize="8" fill="#7A5A2E">(Respiration)</text>
                <ellipse cx="230" cy="90" rx="25" ry="18" fill="#B89555" opacity="0.7"/>
                <text x="230" y="93" textAnchor="middle" fontSize="7" fill="white" fontWeight="600">Mitochondrion</text>
                <text x="230" y="102" textAnchor="middle" fontSize="7" fill="white">Matrix</text>
                <path d="M 132 70 Q 150 60 168 70" stroke="#6A9B7A" strokeWidth="2" fill="none" markerEnd="url(#a1)"/>
                <text x="150" y="58" textAnchor="middle" fontSize="7" fill="#6A9B7A">O2 + Glucose</text>
                <path d="M 168 100 Q 150 110 132 100" stroke="#B89555" strokeWidth="2" fill="none" markerEnd="url(#a2)"/>
                <text x="150" y="120" textAnchor="middle" fontSize="7" fill="#7A5A2E">CO2 + H2O</text>
                <defs>
                  <marker id="a1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#6A9B7A"/>
                  </marker>
                  <marker id="a2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#B89555"/>
                  </marker>
                </defs>
              </svg>
            )}
            {activeTab === 'light' && (
              <svg viewBox="0 0 300 160" className="w-full">
                <rect x="5" y="5" width="290" height="150" rx="8" fill="#EEF2F6" stroke="#5B7FA5" strokeWidth="1.5"/>
                <text x="150" y="22" textAnchor="middle" fontSize="10" fill="#3A5A7A" fontWeight="700">Light-Dependent Reactions (Thylakoid)</text>
                <circle cx="30" cy="90" r="20" fill="#fef08a" stroke="#B89555" strokeWidth="2"/>
                <text x="30" y="93" textAnchor="middle" fontSize="7" fill="#713f12">Light</text>
                <path d="M 52 90 L 75 80" stroke="#B89555" strokeWidth="2" markerEnd="url(#la)"/>
                <rect x="75" y="65" width="40" height="50" rx="4" fill="#8BAEC5" stroke="#5B7FA5" strokeWidth="1.5"/>
                <text x="95" y="88" textAnchor="middle" fontSize="7" fill="#3A5A7A" fontWeight="600">PS II</text>
                <text x="95" y="98" textAnchor="middle" fontSize="6" fill="#3A5A7A">H2O split</text>
                <text x="95" y="107" textAnchor="middle" fontSize="6" fill="#3A5A7A">O2 released</text>
                <path d="M 117 90 L 145 90" stroke="#5B7FA5" strokeWidth="1.5" markerEnd="url(#la)"/>
                <text x="131" y="83" textAnchor="middle" fontSize="6" fill="#5B7FA5">e-</text>
                <rect x="147" y="65" width="40" height="50" rx="4" fill="#6ee7b7" stroke="#059669" strokeWidth="1.5"/>
                <text x="167" y="88" textAnchor="middle" fontSize="7" fill="#065f46" fontWeight="600">PS I</text>
                <text x="167" y="98" textAnchor="middle" fontSize="6" fill="#065f46">NADPH</text>
                <text x="167" y="107" textAnchor="middle" fontSize="6" fill="#065f46">produced</text>
                <path d="M 189 80 L 220 70" stroke="#059669" strokeWidth="1.5" markerEnd="url(#la)"/>
                <rect x="220" y="55" width="50" height="30" rx="4" fill="#B5ABD0" stroke="#8B7BB5" strokeWidth="1.5"/>
                <text x="245" y="68" textAnchor="middle" fontSize="7" fill="#4c1d95" fontWeight="600">ATP Synthase</text>
                <text x="245" y="79" textAnchor="middle" fontSize="6" fill="#4c1d95">ATP made</text>
                <defs>
                  <marker id="la" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 Z" fill="#5B7FA5"/>
                  </marker>
                </defs>
              </svg>
            )}
            {activeTab === 'calvin' && (
              <svg viewBox="0 0 300 160" className="w-full">
                <rect x="5" y="5" width="290" height="150" rx="8" fill="#F2F8F4" stroke="#6A9B7A" strokeWidth="1.5"/>
                <text x="150" y="22" textAnchor="middle" fontSize="10" fill="#166534" fontWeight="700">Calvin Cycle (Stroma)</text>
                <circle cx="150" cy="85" r="50" fill="none" stroke="#6A9B7A" strokeWidth="2" strokeDasharray="5,3"/>
                <text x="150" y="50" textAnchor="middle" fontSize="8" fill="#166534">CO2 fixation</text>
                <text x="205" y="90" textAnchor="middle" fontSize="8" fill="#166534">Reduction</text>
                <text x="150" y="135" textAnchor="middle" fontSize="8" fill="#166534">Regeneration</text>
                <text x="95" y="90" textAnchor="middle" fontSize="8" fill="#166534">RuBP</text>
                <path d="M 155 43 Q 200 43 210 80" stroke="#6A9B7A" strokeWidth="1.5" fill="none" markerEnd="url(#ca)"/>
                <path d="M 210 95 Q 210 130 155 132" stroke="#6A9B7A" strokeWidth="1.5" fill="none" markerEnd="url(#ca)"/>
                <path d="M 145 132 Q 95 130 90 90" stroke="#6A9B7A" strokeWidth="1.5" fill="none" markerEnd="url(#ca)"/>
                <path d="M 90 80 Q 90 43 143 43" stroke="#6A9B7A" strokeWidth="1.5" fill="none" markerEnd="url(#ca)"/>
                <text x="35" y="62" fontSize="7" fill="#C47B6B">CO2 in</text>
                <text x="215" y="62" fontSize="7" fill="#5B7FA5">ATP + NADPH</text>
                <text x="220" y="115" fontSize="7" fill="#8B7BB5">G3P out</text>
                <text x="215" y="72" fontSize="6" fill="#5B7FA5">(from light rxns)</text>
                <defs>
                  <marker id="ca" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 Z" fill="#6A9B7A"/>
                  </marker>
                </defs>
              </svg>
            )}
          </div>
        </div>

        {/* Visualization */}
        <div className="space-y-4">
          {/* BTB Indicator */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>BTB Indicator (Bromothymol Blue)</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-10 rounded-xl overflow-hidden relative" style={{ background: btbColor }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold" style={{ color: btbBlue > 0.5 ? '#3A3A3A' : '#fff', textShadow: btbBlue > 0.5 ? 'none' : '0 1px 2px rgba(0,0,0,0.3)' }}>
                    {btbLabel}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground">O₂ Index</div>
                <div className="font-mono text-sm font-bold" style={{ color: btbColor }}>{(btbBlue * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/> Acidic (high CO₂)</span>
              <span className="flex items-center gap-1">Neutral <span className="w-2 h-2 rounded-full bg-green-400 inline-block"/></span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/> Basic (high O₂)</span>
            </div>
          </div>

          {/* Compensation & Saturation Points */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Photo Points</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                <div className="text-[10px] text-muted-foreground mb-1">Compensation Point</div>
                <div className="font-mono text-lg font-bold" style={{ color: '#B89555' }}>
                  {compensationLight.toFixed(0)}%
                </div>
                <div className="text-[10px] text-muted-foreground">Light where net O₂ = 0</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${compensationLight}%`, background: '#B89555' }}/>
                </div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: 'hsl(var(--muted))' }}>
                <div className="text-[10px] text-muted-foreground mb-1">Saturation Point</div>
                <div className="font-mono text-lg font-bold" style={{ color: '#6A9B7A' }}>
                  {saturationLight.toFixed(0)}%
                </div>
                <div className="text-[10px] text-muted-foreground">Light where PS plateaus</div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${saturationLight}%`, background: '#6A9B7A' }}/>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                <div className="h-full" style={{ width: `${Math.min(100, light)}%`, background: light < compensationLight ? '#B89555' : light < saturationLight ? '#5B7FA5' : '#6A9B7A' }}/>
              </div>
              <span className="whitespace-nowrap font-mono font-bold text-xs" style={{ color: light < compensationLight ? '#B89555' : light < saturationLight ? '#5B7FA5' : '#6A9B7A' }}>
                {light}%
              </span>
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
              <span className="text-amber-500">Below comp.</span>
              <span className="text-blue-500">Linear range</span>
              <span className="text-green-500">Saturated</span>
            </div>
          </div>

          {/* Chambers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Photosynthesis chamber */}
            <div className="sim-panel">
              <div className="text-xs font-bold mb-2 text-green-700">Photosynthesis Chamber</div>
              <div className="flex justify-center mb-2">
                <svg viewBox="0 0 120 100" className="w-28 h-20">
                  <rect x="5" y="5" width="110" height="90" rx="8" fill={isDarkPhase ? '#1a2332' : '#F2F8F4'} stroke="#6A9B7A" strokeWidth="1.5"/>
                  {/* Sun — color varies by filter */}
                  <circle cx="95" cy="18" r="10" fill={isDarkPhase ? '#4A4A4A' : LIGHT_COLORS_HEX[lightColor]} opacity={isDarkPhase ? 0.2 : light / 100}/>
                  {!isDarkPhase && Array.from({ length: 6 }).map((_, i) => {
                    const angle = (i * 60 * Math.PI) / 180;
                    return <line key={i} x1={95 + Math.cos(angle) * 12} y1={18 + Math.sin(angle) * 12} x2={95 + Math.cos(angle) * 16} y2={18 + Math.sin(angle) * 16} stroke={LIGHT_COLORS_HEX[lightColor]} strokeWidth="1.5" opacity={light / 100}/>;
                  })}
                  {/* Plant */}
                  <rect x="56" y="55" width="8" height="30" rx="2" fill="#6A9B7A"/>
                  <ellipse cx="42" cy="55" rx="16" ry="12" fill="#6A9B7A" transform="rotate(-20 42 55)"/>
                  <ellipse cx="72" cy="58" rx="16" ry="12" fill="#6A9B7A" transform="rotate(20 72 58)"/>
                  <ellipse cx="60" cy="40" rx="14" ry="18" fill="#6A9B7A"/>
                  {/* O2 bubbles */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <circle key={i} cx={50 + i * 8} cy={30 - (i * 6)} r="3" fill="#5B7FA5" opacity={psRate / 3}/>
                  ))}
                </svg>
              </div>
              <div className="space-y-1">
                <GasBar label="O2" value={current.o2Ps} color="#5B7FA5"/>
                <GasBar label="CO2" value={current.co2Ps} color="#C47B6B"/>
              </div>
            </div>

            {/* Respiration chamber */}
            <div className="sim-panel">
              <div className="text-xs font-bold mb-2 text-amber-700">Respiration Chamber</div>
              <div className="flex justify-center mb-2">
                <svg viewBox="0 0 120 100" className="w-28 h-20">
                  <rect x="5" y="5" width="110" height="90" rx="8" fill="#F5EDE0" stroke="#B89555" strokeWidth="1.5"/>
                  {/* Yeast cells */}
                  {[[ 35, 55, 14], [65, 60, 10], [50, 40, 12], [80, 45, 8], [28, 35, 8]].map(([cx, cy, r], i) => (
                    <ellipse key={i} cx={cx} cy={cy} rx={r} ry={r * 0.8} fill="#B89555" stroke="#B89555" strokeWidth="1" opacity="0.8"/>
                  ))}
                  {/* CO2 bubbles */}
                  {Array.from({ length: 3 }).map((_, i) => (
                    <circle key={i} cx={45 + i * 15} cy={20 - i * 5} r="3" fill="#C47B6B" opacity={respRate / 2}/>
                  ))}
                  <text x="60" y="15" textAnchor="middle" fontSize="7" fill="#7A5A2E">{temp}°C</text>
                </svg>
              </div>
              <div className="space-y-1">
                <GasBar label="O2" value={current.o2Resp} color="#5B7FA5"/>
                <GasBar label="CO2" value={current.co2Resp} color="#C47B6B"/>
              </div>
            </div>
          </div>

          {/* Glucose */}
          <div className="sim-panel">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-purple-700">Glucose Storage</div>
              <div className="font-mono text-sm font-bold" style={{ color: '#8B7BB5' }}>{current.glucose.toFixed(0)}%</div>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${current.glucose}%`, background: 'linear-gradient(90deg, #8B7BB5, #8B7BB5)' }}/>
            </div>
          </div>

          {/* Real-time graph */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Real-Time Graph</h3>
            <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H + 30}`} className="w-full">
              {[0, 25, 50, 75, 100].map(v => (
                <g key={v}>
                  <line x1="35" y1={10 + (1 - v/100) * GRAPH_H} x2={GRAPH_W - 10} y2={10 + (1 - v/100) * GRAPH_H}
                    stroke="hsl(var(--border))" strokeWidth="0.5"/>
                  <text x="32" y={13 + (1 - v/100) * GRAPH_H} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">{v}</text>
                </g>
              ))}
              <line x1="35" y1="10" x2="35" y2={GRAPH_H + 10} stroke="hsl(var(--border))" strokeWidth="1.5"/>

              {(['o2Ps', 'co2Ps'] as const).map((key, ki) => {
                const colors = ['#5B7FA5', '#C47B6B'];
                const labels = ['O2 (PS)', 'CO2 (PS)'];
                if (data.length < 2) return null;
                const pathD = data.map((pt, i) => {
                  const x = 35 + (i / (data.length - 1)) * (GRAPH_W - 45);
                  const y = 10 + (1 - pt[key] / 100) * GRAPH_H;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                }).join(' ');
                return (
                  <g key={key}>
                    <path d={pathD} stroke={colors[ki]} strokeWidth="2" fill="none"/>
                    <text x={GRAPH_W - 8} y={ki * 14 + 18} fontSize="8" fill={colors[ki]} textAnchor="end">{labels[ki]}</text>
                  </g>
                );
              })}
              <text x={GRAPH_W / 2} y={GRAPH_H + 26} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">Time (ticks)</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function GasBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-mono w-8" style={{ color }}>{label}</span>
      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${value}%`, background: color }}/>
      </div>
      <span className="text-xs font-mono w-8 text-right text-muted-foreground">{Math.round(value)}</span>
    </div>
  );
}
