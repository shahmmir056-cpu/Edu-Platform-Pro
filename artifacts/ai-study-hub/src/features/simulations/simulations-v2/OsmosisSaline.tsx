import { useState, useEffect, useRef, useMemo } from 'react';
import { useLabControls } from './labControls';

type SalineType = 'hypotonic' | 'isotonic' | 'hypertonic' | 'custom';
type Scenario = 'none' | 'dehydration' | 'hyponatremia' | 'brain_edema';
type CellType = 'RBC' | 'WBC' | 'Plant Cell';

interface SalineOption {
  id: SalineType;
  label: string;
  concentration: string;
  pct: string;
  osmolarity: string;
  color: string;
  effect: string;
  recommendation: Scenario[];
}

const SALINE_OPTIONS: SalineOption[] = [
  {
    id: 'hypotonic',
    label: 'Hypotonic Saline',
    concentration: '0.45% NaCl',
    pct: '0.45',
    osmolarity: '154 mOsm/L',
    color: '#5B7FA5',
    effect: 'Less solute outside cell → water moves IN → cell swells and may lyse',
    recommendation: ['hyponatremia'],
  },
  {
    id: 'isotonic',
    label: 'Normal Saline',
    concentration: '0.9% NaCl',
    pct: '0.9',
    osmolarity: '308 mOsm/L',
    color: '#6A9B7A',
    effect: 'Equal osmolarity inside and outside → no net water movement → cell stays normal',
    recommendation: ['dehydration', 'none'],
  },
  {
    id: 'hypertonic',
    label: 'Hypertonic Saline',
    concentration: '3% NaCl',
    pct: '3',
    osmolarity: '1026 mOsm/L',
    color: '#B89555',
    effect: 'More solute outside cell → water moves OUT → cell shrinks and crenates',
    recommendation: ['brain_edema'],
  },
];

const SCENARIOS = [
  { id: 'none' as Scenario, label: 'No Scenario', desc: '' },
  { id: 'dehydration' as Scenario, label: 'Severe Dehydration', desc: 'Patient has lost fluids and electrolytes. Needs volume replacement.' },
  { id: 'hyponatremia' as Scenario, label: 'Hyponatremia', desc: 'Serum Na⁺ is dangerously low (120 mEq/L). Cells are swelling.' },
  { id: 'brain_edema' as Scenario, label: 'Cerebral Edema', desc: 'Brain swelling from head injury. Need to pull water out of brain tissue.' },
];

function customOsmolarity(naclPct: number): number {
  return naclPct * 10 * 2 * 340 / 5.844 * (5.844 / 1000) * (1000 / 0.9) * 308;
}

function computeCellScale(osmolarity: number, cellType: CellType): number {
  const ratio = osmolarity / 308;
  const factor = cellType === 'WBC' ? 0.5 : cellType === 'Plant Cell' ? 0.3 : 1.0;
  if (ratio < 1) return 1 + (1 - ratio) * 0.35 * factor;
  if (ratio > 1) return 1 - (ratio - 1) * 0.28 * factor;
  return 1.0;
}

function getElectrolytes(saline: SalineType, customPct: number) {
  const base = { na: 140, k: 4.2, cl: 102 };
  switch (saline) {
    case 'hypotonic':
      return { na: 133, k: 4.0, cl: 95 };
    case 'isotonic':
      return { na: 140, k: 4.2, cl: 102 };
    case 'hypertonic':
      return { na: 152, k: 3.8, cl: 112 };
    case 'custom': {
      const f = customPct / 0.9;
      return {
        na: Math.round(140 + (f - 1) * 12),
        k: +(4.2 - (f - 1) * 0.4).toFixed(1),
        cl: Math.round(102 + (f - 1) * 10),
      };
    }
  }
}

function getVitals(saline: SalineType, customPct: number) {
  const f = saline === 'custom' ? customPct / 0.9 : saline === 'hypotonic' ? 0.5 : saline === 'hypertonic' ? 3.33 : 1;
  const hr = Math.round(88 + (f - 1) * 12);
  const sbp = Math.round(118 + (f - 1) * 8);
  const dbp = Math.round(76 + (f - 1) * 4);
  const o2 = Math.round(98 - Math.abs(f - 1) * 2);
  return { hr, sbp, dbp, o2 };
}

export default function OsmosisSaline() {
  const [saline, setSaline] = useState<SalineType>('isotonic');
  const [scenario, setScenario] = useState<Scenario>('none');
  const [cellType, setCellType] = useState<CellType>('RBC');
  const [infusionRate, setInfusionRate] = useState(125);
  const [volume, setVolume] = useState(1000);
  const [customPct, setCustomPct] = useState(0.45);
  const [animTick, setAnimTick] = useState(0);
  const [timeCourseData, setTimeCourseData] = useState<number[]>([]);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    animRef.current = setInterval(() => setAnimTick(t => t + 1), 100);
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, []);

  useEffect(() => {
    const osm = saline === 'custom' ? customOsmolarity(customPct) : parseInt(sel.osmolarity);
    const scale = computeCellScale(osm, cellType);
    const data: number[] = [];
    for (let t = 0; t <= 30; t++) {
      const progress = 1 - Math.exp(-t / 8);
      data.push(100 + (scale - 1) * 100 * progress);
    }
    setTimeCourseData(data);
  }, [saline, customPct, cellType]);

  const customOsm = customOsmolarity(customPct);
  const sel = SALINE_OPTIONS.find(s => s.id === saline) ?? {
    id: 'custom' as SalineType,
    label: 'Custom Solution',
    concentration: `${customPct.toFixed(2)}% NaCl`,
    pct: customPct.toFixed(2),
    osmolarity: `${Math.round(customOsm)} mOsm/L`,
    color: '#8B7BB5',
    effect: customOsm < 308 ? 'Hypotonic — water enters cell' : customOsm > 308 ? 'Hypertonic — water exits cell' : 'Isotonic — no net movement',
    recommendation: [] as Scenario[],
  };
  const currentOsm = saline === 'custom' ? customOsm : parseInt(sel.osmolarity);
  const scenObj = SCENARIOS.find(s => s.id === scenario)!;
  const isCorrect = scenario !== 'none' && sel.recommendation.includes(scenario);

  const cellScale = computeCellScale(currentOsm, cellType);
  const dripSpeed = Math.max(1, 12 - Math.floor(infusionRate / 50));
  const hours = (volume / infusionRate).toFixed(1);

  const electrolytes = getElectrolytes(saline, customPct);
  const vitals = getVitals(saline, customPct);

  const chartW = 200;
  const chartH = 60;
  const chartPadding = 5;

  useLabControls({
    dataset: {
      name: "IV Saline Cell Response",
      columns: [
        { key: "t", label: "Time (min)" },
        { key: "size", label: "Cell size (%)" },
        { key: "osmolarity", label: "Osmolarity (mOsm/L)" },
        { key: "scale", label: "Scale factor" },
      ],
      rows: timeCourseData.map((size, t) => ({
        t,
        size: Math.round(size * 10) / 10,
        osmolarity: Math.round(currentOsm),
        scale: +cellScale.toFixed(2),
      })),
    },
  });

  return (
    <div className="sim-container">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>Select IV Solution</h3>
            <div className="space-y-3">
              {SALINE_OPTIONS.map(s => (
                <div key={s.id}
                  data-testid={`button-saline-${s.id}`}
                  onClick={() => setSaline(s.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${saline === s.id ? 'border-2' : 'border-border opacity-70 hover:opacity-90'}`}
                  style={saline === s.id ? { borderColor: s.color, background: s.color + '15' } : {}}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm" style={saline === s.id ? { color: s.color } : {}}>{s.label}</div>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">{s.concentration} | {s.osmolarity}</div>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{ borderColor: s.color }}>
                      {saline === s.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{s.effect}</p>
                </div>
              ))}

              {/* Custom solution */}
              <div
                data-testid="button-saline-custom"
                onClick={() => setSaline('custom')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${saline === 'custom' ? 'border-2' : 'border-border opacity-70 hover:opacity-90'}`}
                style={saline === 'custom' ? { borderColor: '#8B7BB5', background: '#8B7BB515' } : {}}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-sm" style={saline === 'custom' ? { color: '#8B7BB5' } : {}}>Custom Solution</div>
                    <div className="text-xs font-mono text-muted-foreground mt-0.5">{customPct.toFixed(2)}% NaCl | {Math.round(customOsm)} mOsm/L</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: '#8B7BB5' }}>
                    {saline === 'custom' && <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#8B7BB5' }} />}
                  </div>
                </div>
                {saline === 'custom' && (
                  <div className="mt-3 space-y-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-semibold text-muted-foreground w-20">NaCl %</label>
                      <input type="range" min="0" max="10" step="0.01" value={customPct}
                        onChange={e => setCustomPct(parseFloat(e.target.value))}
                        className="flex-1 h-1.5 accent-purple-500" />
                      <span className="text-xs font-mono font-bold w-12 text-right" style={{ color: '#8B7BB5' }}>{customPct.toFixed(2)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentOsm < 280 ? 'Hypotonic — cell swells' : currentOsm > 320 ? 'Hypertonic — cell shrinks' : 'Approximately isotonic'}
                    </p>
                  </div>
                )}
                {saline !== 'custom' && <p className="text-xs text-muted-foreground mt-2">Define your own NaCl concentration</p>}
              </div>
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>Cell Type</h3>
            <div className="flex gap-2">
              {(['RBC', 'WBC', 'Plant Cell'] as CellType[]).map(ct => (
                <button key={ct} data-testid={`button-cell-${ct}`}
                  onClick={() => setCellType(ct)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${cellType === ct ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                  {ct}
                </button>
              ))}
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>IV Rate Control</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-muted-foreground w-28">Infusion Rate</label>
                <input type="range" min="1" max="500" step="1" value={infusionRate}
                  onChange={e => setInfusionRate(parseInt(e.target.value))}
                  className="flex-1 h-1.5 accent-blue-500" />
                <span className="text-xs font-mono font-bold w-20 text-right text-blue-600">{infusionRate} mL/hr</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-muted-foreground w-28">Volume (mL)</label>
                <input type="number" min="100" max="5000" step="100" value={volume}
                  onChange={e => setVolume(Math.max(100, parseInt(e.target.value) || 100))}
                  className="w-24 px-2 py-1 rounded-lg border border-border text-xs font-mono bg-background" />
                <span className="text-xs text-muted-foreground">Time: <span className="font-bold text-foreground">{hours} hrs</span></span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <svg width="30" height="40" viewBox="0 0 30 40">
                  <rect x="8" y="2" width="14" height="24" rx="3" fill={sel.color} opacity="0.25" stroke={sel.color} strokeWidth="1.5"/>
                  <line x1="15" y1="26" x2="15" y2="38" stroke={sel.color} strokeWidth="2" strokeDasharray="3,2"/>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <circle key={i} cx="15" cy={4 + ((animTick * (6 - dripSpeed) + i * 8) % 20)}
                      r="2" fill={sel.color} opacity="0.8" />
                  ))}
                </svg>
                <span className="text-xs text-muted-foreground">Drip rate: <span className="font-bold text-foreground">{infusionRate} drops/min</span></span>
              </div>
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>Clinical Scenario</h3>
            <div className="space-y-2">
              {SCENARIOS.map(sc => (
                <div key={sc.id}
                  data-testid={`button-scenario-${sc.id}`}
                  onClick={() => setScenario(sc.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${scenario === sc.id ? 'border-2' : 'border-border hover:bg-muted/50'}`}
                  style={scenario === sc.id ? { borderColor: '#1A3550', background: 'hsl(var(--muted))' } : {}}>
                  <div className="font-semibold text-sm">{sc.label}</div>
                  {sc.desc && <div className="text-xs text-muted-foreground mt-0.5">{sc.desc}</div>}
                </div>
              ))}
            </div>
            {scenario !== 'none' && (
              <div className={`mt-3 p-3 rounded-xl text-sm ${isCorrect ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}`}>
                {isCorrect
                  ? <span className="text-green-700 font-semibold">Correct treatment choice for {scenObj.label}.</span>
                  : <span className="text-red-700">Not optimal. For {scenObj.label}, the recommended solution is {SALINE_OPTIONS.find(s => s.recommendation.includes(scenario))?.label}.</span>
                }
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'Space Grotesk' }}>{cellType} Response</h3>
            <div className="flex justify-center">
              <svg viewBox="0 0 320 240" className="w-full max-w-sm">
                <path d="M 0 100 Q 40 90 80 100 Q 160 110 240 100 Q 280 95 320 100 L 320 160 Q 280 170 240 160 Q 160 150 80 160 Q 40 165 0 160 Z"
                  fill="#fde8e8" stroke="#fca5a5" strokeWidth="1.5"/>
                <text x="160" y="225" textAnchor="middle" fontSize="9" fill="#8A8A8A">Blood vessel</text>

                <rect x="260" y="10" width="30" height="55" rx="6" fill={sel.color} opacity="0.3" stroke={sel.color} strokeWidth="2"/>
                <text x="275" y="30" textAnchor="middle" fontSize="7" fill={sel.color} fontWeight="700">IV</text>
                <text x="275" y="42" textAnchor="middle" fontSize="7" fill={sel.color}>{saline === 'custom' ? customPct.toFixed(1) : sel.pct}%</text>
                <text x="275" y="52" textAnchor="middle" fontSize="6" fill={sel.color}>NaCl</text>
                <line x1="275" y1="65" x2="275" y2="90" stroke={sel.color} strokeWidth="2" strokeDasharray="4,3"/>
                {Array.from({ length: 3 }).map((_, i) => (
                  <circle key={i} cx="275" cy={67 + ((animTick * (6 - dripSpeed) + i * 8) % 24)}
                    r="2.5" fill={sel.color} opacity="0.7" />
                ))}

                {/* Cell rendering based on type */}
                {cellType === 'RBC' && (
                  <g transform={`translate(140, 130) scale(${cellScale})`}>
                    <ellipse cx="0" cy="0" rx="36" ry="26" fill="#C47B6B" stroke="#C47B6B" strokeWidth="2"/>
                    <ellipse cx="0" cy="0" rx="18" ry="12" fill="#C47B6B" opacity="0.4"/>
                    {currentOsm > 320 && Array.from({ length: 8 }).map((_, i) => {
                      const angle = (i * 45 * Math.PI) / 180;
                      return <circle key={i} cx={Math.cos(angle) * 33} cy={Math.sin(angle) * 24}
                        r="3.5" fill="#C47B6B" stroke="#b91c1c" strokeWidth="0.5" />;
                    })}
                    {currentOsm < 280 && <ellipse cx="0" cy="0" rx="34" ry="24" fill="none" stroke="#C47B6B" strokeWidth="1.5" strokeDasharray="4,2" opacity="0.5"/>}
                  </g>
                )}

                {cellType === 'WBC' && (
                  <g transform={`translate(140, 130) scale(${cellScale})`}>
                    <circle cx="0" cy="0" rx="42" ry="38" fill="#B5ABD0" stroke="#8B7BB5" strokeWidth="2"/>
                    <ellipse cx="-8" cy="-4" rx="14" ry="10" fill="#8B7BB5" opacity="0.5"/>
                    <ellipse cx="10" cy="6" rx="10" ry="7" fill="#8B7BB5" opacity="0.4"/>
                    <ellipse cx="-4" cy="10" rx="8" ry="6" fill="#8B7BB5" opacity="0.3"/>
                    {currentOsm > 320 && Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i * 30 * Math.PI) / 180;
                      return <circle key={i} cx={Math.cos(angle) * 38} cy={Math.sin(angle) * 34}
                        r="3" fill="#8B7BB5" stroke="#6B60A0" strokeWidth="0.5" />;
                    })}
                  </g>
                )}

                {cellType === 'Plant Cell' && (
                  <g transform={`translate(140, 130) scale(${cellScale})`}>
                    <rect x="-44" y="-34" width="88" height="68" rx="6" fill="#A8D5B6" stroke="#6A9B7A" strokeWidth="2.5"/>
                    <rect x="-40" y="-30" width="80" height="60" rx="4" fill="#C5E6CE" stroke="#6A9B7A" strokeWidth="1"/>
                    <rect x="-18" y="-14" width="36" height="28" rx="10" fill="#4ade80" opacity="0.6" stroke="#6A9B7A" strokeWidth="1"/>
                    {currentOsm > 320 && (
                      <>
                        <rect x="-38" y="-28" width="76" height="56" rx="3" fill="none" stroke="#6A9B7A" strokeWidth="1" strokeDasharray="3,2" opacity="0.5"/>
                        <rect x="-14" y="-10" width="28" height="20" rx="8" fill="#4ade80" opacity="0.4"/>
                      </>
                    )}
                  </g>
                )}

                {currentOsm !== 308 && Array.from({ length: 5 }).map((_, i) => {
                  const angle = ((i * 72 + animTick * 4) * Math.PI) / 180;
                  const inward = currentOsm < 308;
                  const startR = inward ? 55 : 40;
                  const endR = inward ? 42 : 52;
                  const startX = 140 + Math.cos(angle) * startR;
                  const startY = 130 + Math.sin(angle) * (startR * 0.7);
                  const endX = 140 + Math.cos(angle) * endR;
                  const endY = 130 + Math.sin(angle) * (endR * 0.7);
                  return (
                    <g key={i}>
                      <circle cx={startX} cy={startY} r="3" fill="#5B7FA5" opacity="0.6"/>
                      <line x1={startX} y1={startY} x2={endX} y2={endY} stroke="#5B7FA5" strokeWidth="1.5" opacity="0.5"
                        markerEnd="url(#wArrow)"/>
                    </g>
                  );
                })}

                <defs>
                  <marker id="wArrow" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                    <path d="M0,0 L5,2.5 L0,5 Z" fill="#5B7FA5" opacity="0.7"/>
                  </marker>
                </defs>

                <text x="80" y="218" textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" fontWeight="600">
                  {currentOsm < 280 ? (cellType === 'Plant Cell' ? 'Turgid (Endosmosis)' : 'Cell Swelling (Endosmosis)') :
                   currentOsm > 320 ? (cellType === 'Plant Cell' ? 'Plasmolysis (Exosmosis)' : 'Cell Crenating (Exosmosis)') :
                   'Normal (No Net Movement)'}
                </text>
              </svg>
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Solute Concentration Comparison</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border-2" style={{ borderColor: '#C47B6B', background: '#FAF5F3' }}>
                <div className="text-xs font-semibold text-red-700 mb-1">Inside Cell</div>
                <div className="text-2xl font-bold font-mono text-red-600">~308</div>
                <div className="text-xs text-red-500">mOsm/L (plasma)</div>
              </div>
              <div className="p-3 rounded-xl border-2" style={{ borderColor: sel.color, background: sel.color + '15' }}>
                <div className="text-xs font-semibold mb-1" style={{ color: sel.color }}>IV Solution</div>
                <div className="text-2xl font-bold font-mono" style={{ color: sel.color }}>{currentOsm}</div>
                <div className="text-xs" style={{ color: sel.color }}>{sel.osmolarity}</div>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: 'hsl(var(--muted))' }}>
              <span className="font-semibold">Net water movement: </span>
              {currentOsm < 280 ? 'Into cell (hypotonic outside → water flows in)' :
               currentOsm > 320 ? 'Out of cell (hypertonic outside → water flows out)' :
               'No net movement (osmotic equilibrium)'}
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Patient Vitals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'HR', value: `${vitals.hr}`, unit: 'bpm', color: vitals.hr > 100 || vitals.hr < 60 ? '#C47B6B' : '#6A9B7A' },
                { label: 'SBP', value: `${vitals.sbp}`, unit: 'mmHg', color: vitals.sbp > 130 || vitals.sbp < 90 ? '#C47B6B' : '#6A9B7A' },
                { label: 'DBP', value: `${vitals.dbp}`, unit: 'mmHg', color: vitals.dbp > 85 || vitals.dbp < 60 ? '#C47B6B' : '#6A9B7A' },
                { label: 'SpO₂', value: `${vitals.o2}`, unit: '%', color: vitals.o2 < 95 ? '#C47B6B' : '#6A9B7A' },
              ].map(v => (
                <div key={v.label} className="p-2 rounded-lg border text-center" style={{ borderColor: v.color + '40', background: v.color + '08' }}>
                  <div className="text-[10px] font-semibold text-muted-foreground">{v.label}</div>
                  <div className="text-lg font-bold font-mono" style={{ color: v.color }}>{v.value}</div>
                  <div className="text-[10px] text-muted-foreground">{v.unit}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Electrolyte Panel</h3>
            <div className="space-y-2">
              {[
                { ion: 'Na⁺', val: electrolytes.na, min: 135, max: 145, unit: 'mEq/L' },
                { ion: 'K⁺', val: electrolytes.k, min: 3.5, max: 5.0, unit: 'mEq/L' },
                { ion: 'Cl⁻', val: electrolytes.cl, min: 96, max: 106, unit: 'mEq/L' },
              ].map(e => {
                const low = e.val < e.min;
                const high = e.val > e.max;
                const normal = !low && !high;
                const flagColor = normal ? '#6A9B7A' : '#C47B6B';
                const flagLabel = normal ? 'Normal' : low ? 'Low' : 'High';
                return (
                  <div key={e.ion} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                    <span className="text-xs font-bold w-10 font-mono">{e.ion}</span>
                    <span className="text-sm font-bold font-mono flex-1">{e.val} <span className="text-[10px] font-normal text-muted-foreground">{e.unit}</span></span>
                    <span className="text-[10px] text-muted-foreground">({e.min}–{e.max})</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: flagColor, background: flagColor + '18' }}>{flagLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Cell Volume Over 30 min</h3>
            <svg viewBox={`0 0 ${chartW + 30} ${chartH + 20}`} className="w-full">
              <line x1={chartPadding + 20} y1={chartPadding} x2={chartPadding + 20} y2={chartH + chartPadding} stroke="#d1d5db" strokeWidth="0.5"/>
              <line x1={chartPadding + 20} y1={chartH + chartPadding} x2={chartW + chartPadding + 20} y2={chartH + chartPadding} stroke="#d1d5db" strokeWidth="0.5"/>
              <text x={chartPadding + 18} y={chartPadding + 4} textAnchor="end" fontSize="6" fill="#8A8A8A">120%</text>
              <text x={chartPadding + 18} y={chartH / 2 + chartPadding + 2} textAnchor="end" fontSize="6" fill="#8A8A8A">100%</text>
              <text x={chartPadding + 18} y={chartH + chartPadding - 2} textAnchor="end" fontSize="6" fill="#8A8A8A">80%</text>
              <line x1={chartPadding + 20} y1={chartH / 2 + chartPadding} x2={chartW + chartPadding + 20} y2={chartH / 2 + chartPadding}
                stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="3,2"/>
              {timeCourseData.length > 1 && (
                <polyline
                  fill="none" stroke={sel.color} strokeWidth="1.5" strokeLinejoin="round"
                  points={timeCourseData.map((v, i) => {
                    const x = chartPadding + 20 + (i / 30) * chartW;
                    const y = chartPadding + chartH - ((v - 75) / 50) * chartH;
                    return `${x},${y}`;
                  }).join(' ')}
                />
              )}
              <text x={chartW / 2 + chartPadding + 20} y={chartH + chartPadding + 14} textAnchor="middle" fontSize="6" fill="#8A8A8A">Time (min)</text>
            </svg>
          </div>

          <div className="sim-panel overflow-x-auto">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Quick Reference</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 text-muted-foreground font-semibold">Solution</th>
                  <th className="text-left py-1.5 text-muted-foreground font-semibold">Cell Effect</th>
                  <th className="text-left py-1.5 text-muted-foreground font-semibold">Clinical Use</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-1.5 font-semibold" style={{ color: '#5B7FA5' }}>0.45% NaCl</td>
                  <td className="py-1.5">Swells / Lyses</td>
                  <td className="py-1.5">Hyponatremia</td>
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-1.5 font-semibold" style={{ color: '#6A9B7A' }}>0.9% NaCl</td>
                  <td className="py-1.5">No change</td>
                  <td className="py-1.5">Dehydration, general IV</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-semibold" style={{ color: '#B89555' }}>3% NaCl</td>
                  <td className="py-1.5">Crenates / Shrinks</td>
                  <td className="py-1.5">Cerebral edema</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
