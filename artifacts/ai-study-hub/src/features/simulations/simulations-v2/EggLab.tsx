import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Download, Scale, Thermometer } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ErrorBar } from 'recharts';

type Solution = 'hypotonic' | 'isotonic' | 'hypertonic';
type TissueType = 'egg' | 'potato' | 'apple';
type Step = 'decalcify' | 'weigh_initial' | 'immerse' | 'observe' | 'final_weigh';

interface JarData {
  solution: Solution;
  label: string;
  concentration: string;
  color: string;
  liquidColor: string;
  description: string;
}

const JARS: JarData[] = [
  { solution: 'hypotonic',  label: 'Hypotonic',  concentration: 'Distilled water (0%)',   color: '#5B7FA5', liquidColor: '#C5D5E6', description: 'Water moves INTO specimen by osmosis → net mass gain' },
  { solution: 'isotonic',   label: 'Isotonic',   concentration: '~0.9% NaCl or 30% sucrose', color: '#6A9B7A', liquidColor: '#C5E6CE', description: 'No net water movement — mass stays constant' },
  { solution: 'hypertonic', label: 'Hypertonic', concentration: 'Corn syrup (55% sucrose)', color: '#B89555', liquidColor: '#F5EDE0', description: 'Water moves OUT of specimen by osmosis → net mass loss' },
];

const TISSUES: Record<TissueType, { label: string; rate: number; color: string }> = {
  egg:    { label: 'Egg',    rate: 1.0, color: '#B89555' },
  potato: { label: 'Potato', rate: 0.7, color: '#8B4513' },
  apple:  { label: 'Apple',  rate: 1.3, color: '#C47B6B' },
};

const SD = 1.5;
const BASE_MASS = 60;
const INITIAL_MASS = 60;
const INITIAL_VOLUME = 200;

function computeMass(solution: Solution, timeHours: number, tempC: number, tissueType: TissueType, active: boolean): number {
  if (!active) return BASE_MASS;
  const rate = TISSUES[tissueType].rate * (1 + (tempC - 22) * 0.02);
  if (solution === 'isotonic') return BASE_MASS;
  if (solution === 'hypotonic') {
    const change = Math.min(18, timeHours * 2.8 * rate * (1 - Math.exp(-timeHours * 0.08)));
    return BASE_MASS + change;
  }
  const change = Math.min(22, timeHours * 3.2 * rate * (1 - Math.exp(-timeHours * 0.07)));
  return BASE_MASS - change;
}

function computeVolume(solution: Solution, timeHours: number, tempC: number, tissueType: TissueType, active: boolean): number {
  if (!active) return INITIAL_VOLUME;
  const mass = computeMass(solution, timeHours, tempC, tissueType, true);
  const massChange = mass - BASE_MASS;
  if (solution === 'hypotonic') return INITIAL_VOLUME - massChange;
  if (solution === 'hypertonic') return INITIAL_VOLUME + Math.abs(massChange);
  return INITIAL_VOLUME;
}

function EggSVG({ solution, massChange, molecules }: { solution: Solution; massChange: number; molecules: number }) {
  const stretch = solution === 'hypotonic' ? Math.min(1.25, 1 + massChange / 200) : solution === 'hypertonic' ? Math.max(0.7, 1 - massChange / 200) : 1;
  const ry = 28 * stretch;
  const rx = Math.max(18, 26 / stretch);
  const eggColor = solution === 'hypotonic' ? '#B89555' : solution === 'isotonic' ? '#B89555' : '#B89555';

  return (
    <svg viewBox="0 0 80 90" width="100%" style={{ maxWidth: 80 }}>
      {Array.from({ length: molecules }).map((_, i) => {
        const angle = (i / molecules) * Math.PI * 2;
        const fromX = 40 + Math.cos(angle) * (solution === 'hypotonic' ? 38 : rx + 5);
        const fromY = 45 + Math.sin(angle) * (solution === 'hypotonic' ? 42 : ry + 5);
        const toX = 40 + Math.cos(angle) * (rx - 6);
        const toY = 45 + Math.sin(angle) * (ry - 6);
        const x = solution === 'hypotonic' ? fromX + (toX - fromX) * 0.5 : toX + (fromX - toX) * 0.5;
        const y = solution === 'hypotonic' ? fromY + (toY - fromY) * 0.5 : toY + (fromY - toY) * 0.5;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="2" fill="#60a5fa" opacity="0.7"/>
            <text x={x - 1} y={y + 3.5} fontSize="4" fill="white" fontWeight="bold">H₂</text>
          </g>
        );
      })}
      <ellipse cx="40" cy="45" rx={rx} ry={ry} fill={eggColor} stroke="#B89555" strokeWidth="1.5"/>
      <ellipse cx="34" cy="35" rx={rx * 0.4} ry={ry * 0.22} fill="white" opacity="0.35" transform="rotate(-20 34 35)"/>
      <text x="40" y="49" textAnchor="middle" fontSize="7" fill="#7A5A2E" fontWeight="600">
        {solution === 'hypotonic' ? 'Turgid' : solution === 'hypertonic' ? 'Crenated' : 'Normal'}
      </text>
    </svg>
  );
}

function WatchGlass({ mass, label }: { mass: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex items-center justify-center" style={{ width: 80, height: 40 }}>
        <svg viewBox="0 0 80 40" width="100%" style={{ maxWidth: 80 }}>
          <ellipse cx="40" cy="30" rx="38" ry="14" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
          <ellipse cx="40" cy="30" rx="30" ry="10" fill="#f1f5f9" opacity="0.8"/>
          <text x="40" y="34" textAnchor="middle" fontSize="10" fill="#3A3A3A" fontWeight="700">{mass.toFixed(1)}g</text>
        </svg>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ElectronicBalance({ reading, showEgg }: { reading: number; showEgg: boolean }) {
  return (
    <svg viewBox="0 0 220 150" width="100%" style={{ maxWidth: 220 }} className="mx-auto">
      <ellipse cx="110" cy="142" rx="85" ry="6" fill="#000" opacity="0.06"/>
      <rect x="20" y="120" width="180" height="20" rx="6" fill="#374151" stroke="#1f2937" strokeWidth="2"/>
      <rect x="25" y="118" width="170" height="4" rx="2" fill="#4b5563"/>
      <rect x="25" y="15" width="95" height="55" rx="6" fill="#1f2937" stroke="#374151" strokeWidth="1.5"/>
      <rect x="30" y="20" width="85" height="42" rx="3" fill="#052e16"/>
      <rect x="30" y="20" width="85" height="42" rx="3" fill="#6A9B7A" opacity="0.04"/>
      <text x="72" y="50" textAnchor="middle" fontSize="22" fill="#6A9B7A" fontFamily="'Courier New', monospace" fontWeight="bold">
        {reading.toFixed(2)}
      </text>
      <text x="103" y="50" fontSize="11" fill="#6A9B7A" fontFamily="'Courier New', monospace">g</text>
      <text x="72" y="68" textAnchor="middle" fontSize="4.5" fill="#6A9B7A" opacity="0.4" letterSpacing="2">PRECISION BALANCE</text>
      <circle cx="40" cy="78" r="4" fill="#374151" stroke="#4b5563" strokeWidth="0.5"/>
      <circle cx="55" cy="78" r="4" fill="#374151" stroke="#4b5563" strokeWidth="0.5"/>
      <circle cx="70" cy="78" r="4" fill="#374151" stroke="#4b5563" strokeWidth="0.5"/>
      <text x="40" y="80" textAnchor="middle" fontSize="3.5" fill="#9ca3af">TARE</text>
      <text x="55" y="80" textAnchor="middle" fontSize="3.5" fill="#9ca3af">CAL</text>
      <text x="70" y="80" textAnchor="middle" fontSize="3.5" fill="#9ca3af">UNIT</text>
      <rect x="140" y="80" width="55" height="6" rx="2" fill="#9ca3af" stroke="#6b7280" strokeWidth="1"/>
      <rect x="155" y="86" width="25" height="34" rx="3" fill="#374151" stroke="#1f2937" strokeWidth="1.5"/>
      <rect x="150" y="86" width="35" height="3" rx="1" fill="#4b5563"/>
      {showEgg && (
        <g>
          <ellipse cx="167" cy="72" rx="15" ry="19" fill="#B89555" stroke="#B89555" strokeWidth="1.5">
            <animate attributeName="cy" from="30" to="72" dur="0.6s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
            <animate attributeName="opacity" from="0" to="1" dur="0.4s" fill="freeze"/>
          </ellipse>
          <ellipse cx="163" cy="64" rx="5" ry="4" fill="white" opacity="0.3" transform="rotate(-15 163 64)">
            <animate attributeName="cy" from="22" to="64" dur="0.6s" fill="freeze" calcMode="spline" keySplines="0.25 0.1 0.25 1"/>
          </ellipse>
          <animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze"/>
        </g>
      )}
      {!showEgg && (
        <text x="167" y="78" textAnchor="middle" fontSize="6" fill="#6b7280" opacity="0.5">Place egg</text>
      )}
    </svg>
  );
}

export default function EggLab() {
  const [step, setStep] = useState<Step>('decalcify');
  const [timeHours, setTimeHours] = useState(0);
  const [running, setRunning] = useState(false);
  const [hypothesis, setHypothesis] = useState<Record<Solution, string>>({ hypotonic: '', isotonic: '', hypertonic: '' });
  const [showHypo, setShowHypo] = useState(false);
  const [massRecords, setMassRecords] = useState<{ t: number; hypo: number; iso: number; hyper: number; hypoErr: number; isoErr: number; hyperErr: number }[]>([
    { t: 0, hypo: 60, iso: 60, hyper: 60, hypoErr: SD, isoErr: SD, hyperErr: SD }
  ]);
  const [tempC, setTempC] = useState(22);
  const [tissueType, setTissueType] = useState<TissueType>('egg');
  const [balancePlaced, setBalancePlaced] = useState(false);
  const [balanceReadings, setBalanceReadings] = useState<Record<Solution, number>>({
    hypotonic: 60, isotonic: 60, hypertonic: 60
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempCRef = useRef(tempC);
  const tissueTypeRef = useRef(tissueType);

  useEffect(() => { tempCRef.current = tempC; }, [tempC]);
  useEffect(() => { tissueTypeRef.current = tissueType; }, [tissueType]);
  useEffect(() => { if (step !== 'weigh_initial') setBalancePlaced(false); }, [step]);

  const active = step === 'observe' || step === 'final_weigh';
  const hypoMass = computeMass('hypotonic', timeHours, tempC, tissueType, active);
  const isoMass = computeMass('isotonic', timeHours, tempC, tissueType, active);
  const hyperMass = computeMass('hypertonic', timeHours, tempC, tissueType, active);
  const hypoVol = computeVolume('hypotonic', timeHours, tempC, tissueType, active);
  const isoVol = computeVolume('isotonic', timeHours, tempC, tissueType, active);
  const hyperVol = computeVolume('hypertonic', timeHours, tempC, tissueType, active);

  useEffect(() => {
    if (running && step === 'observe') {
      timerRef.current = setInterval(() => {
        setTimeHours(t => {
          const next = Math.min(72, t + 0.25);
          if (next % 2 < 0.26) {
            const hyo = computeMass('hypotonic', next, tempCRef.current, tissueTypeRef.current, true);
            const hyper = computeMass('hypertonic', next, tempCRef.current, tissueTypeRef.current, true);
            setMassRecords(prev => [...prev.filter(r => r.t !== Math.round(next)), {
              t: Math.round(next),
              hypo: +hyo.toFixed(2),
              iso: +BASE_MASS.toFixed(2),
              hyper: +hyper.toFixed(2),
              hypoErr: SD,
              isoErr: SD,
              hyperErr: SD,
            }].sort((a, b) => a.t - b.t));
          }
          if (next >= 72) setRunning(false);
          return next;
        });
      }, 80);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, step]);

  const steps: { id: Step; label: string; desc: string }[] = [
    { id: 'decalcify', label: '1. Decalcify', desc: 'Soak egg in vinegar (acetic acid) for 24–48h to dissolve CaCO₃ shell, leaving semi-permeable membrane' },
    { id: 'weigh_initial', label: '2. Weigh Initial', desc: 'Blot egg dry and record initial mass on the electronic balance' },
    { id: 'immerse', label: '3. Immerse', desc: 'Place each specimen into its solution jar' },
    { id: 'observe', label: '4. Observe', desc: 'Run the time-lapse to observe osmosis in real time' },
    { id: 'final_weigh', label: '5. Final Weigh', desc: 'Remove specimens, blot dry, and record final masses' },
  ];

  const stepIndex = steps.findIndex(s => s.id === step);
  const canNext = step !== 'final_weigh';
  const canPrev = stepIndex > 0;

  const pctChange = (final: number) => (((final - INITIAL_MASS) / INITIAL_MASS) * 100).toFixed(1);
  const molecules = Math.round(timeHours / 6);

  const handlePlaceEggs = () => {
    setBalancePlaced(true);
    setBalanceReadings({
      hypotonic: BASE_MASS + (Math.random() * 0.1 - 0.05),
      isotonic: BASE_MASS + (Math.random() * 0.1 - 0.05),
      hypertonic: BASE_MASS + (Math.random() * 0.1 - 0.05),
    });
  };

  const finalMass = (s: Solution) => s === 'hypotonic' ? hypoMass : s === 'isotonic' ? isoMass : hyperMass;

  return (
    <div className="sim-container">
      {/* Step progress */}
      <div className="flex items-center gap-0 mb-5 overflow-x-auto pb-1 flex-wrap">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button onClick={() => setStep(s.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${step === s.id ? 'text-white' : i < stepIndex ? 'text-green-700 bg-green-100' : 'text-muted-foreground bg-muted'}`}
              style={step === s.id ? { background: '#1A3550' } : {}}>
              {s.label}
            </button>
            {i < steps.length - 1 && <div className={`w-4 h-0.5 mx-0.5 ${i < stepIndex ? 'bg-green-400' : 'bg-border'}`}/>}
          </div>
        ))}
      </div>

      <div className="sim-panel mb-4">
        <p className="text-sm">{steps.find(s => s.id === step)!.desc}</p>
      </div>

      {step === 'decalcify' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {JARS.map(jar => (
            <div key={jar.solution} className="sim-panel text-center">
              <div className="text-sm font-bold mb-1" style={{ color: jar.color }}>{jar.label}</div>
              <div className="text-xs text-muted-foreground mb-2">{jar.concentration}</div>
              <svg viewBox="0 0 80 90" width="100%" style={{ maxWidth: 80 }} className="mx-auto">
                <ellipse cx="40" cy="55" rx="32" ry="28" fill="#f7e7c8" stroke="#B89555" strokeWidth="2"/>
                <ellipse cx="40" cy="55" rx="22" ry="18" fill="#B89555" opacity="0.8"/>
                <text x="40" y="59" textAnchor="middle" fontSize="8" fill="#7A5A2E" fontWeight="700">Shell</text>
                <text x="40" y="70" textAnchor="middle" fontSize="7" fill="#B89555">CaCO₃</text>
                <g>
                  {[20,35,50,65].map((x,i) => (
                    <circle key={i} cx={x} cy={78} r="2.5" fill="#60a5fa" opacity="0.7"/>
                  ))}
                </g>
                <text x="40" y="88" textAnchor="middle" fontSize="7" fill="#1e40af">CH₃COOH</text>
              </svg>
              <p className="text-xs text-muted-foreground mt-2">Dissolving shell in vinegar → CO₂ bubbles visible</p>
            </div>
          ))}
        </div>
      )}

      {step === 'weigh_initial' && (
        <div className="space-y-4">
          <div className="sim-panel">
            <div className="flex items-center gap-3 mb-4">
              <Scale className="w-5 h-5 text-primary" />
              <h3 className="font-bold" style={{ fontFamily: 'Space Grotesk' }}>Record Initial Masses</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {JARS.map(jar => (
                <div key={jar.solution} className="flex flex-col items-center gap-1">
                  <div className="text-xs font-semibold" style={{ color: jar.color }}>{jar.label} Egg</div>
                  <ElectronicBalance reading={balanceReadings[jar.solution]} showEgg={balancePlaced} />
                </div>
              ))}
            </div>
            {!balancePlaced && (
              <button onClick={handlePlaceEggs}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white mb-3"
                style={{ background: '#1A3550' }}>
                Place Eggs on Balances
              </button>
            )}
            {balancePlaced && (
              <div className="text-xs text-center text-muted-foreground mb-3 bg-green-50 dark:bg-green-950 rounded-lg py-2 px-3">
                Readings stabilized — record masses above. Variation of ±0.05g is normal instrument noise.
              </div>
            )}
          </div>

          <div className="sim-panel">
            <div className="flex items-center gap-3 mb-3">
              <svg viewBox="0 0 20 20" width="18" height="18" className="text-primary"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Select Tissue Type</h3>
            </div>
            <div className="flex gap-2 mb-1 flex-wrap">
              {(Object.keys(TISSUES) as TissueType[]).map(t => (
                <button key={t} onClick={() => setTissueType(t)}
                  className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all ${tissueType === t ? 'text-white border-transparent shadow-sm' : 'border-border hover:bg-muted text-foreground'}`}
                  style={tissueType === t ? { background: TISSUES[t].color } : {}}>
                  <span className="block text-base mb-0.5">{t === 'egg' ? '🥚' : t === 'potato' ? '🥔' : '🍎'}</span>
                  {TISSUES[t].label}
                  <span className="block text-[10px] mt-0.5 opacity-80">{TISSUES[t].rate}x rate</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Tissue permeability affects osmosis rate. Denser tissues (potato) absorb/release water more slowly; porous tissues (apple) faster.</p>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3">Write Your Hypothesis</h3>
            {JARS.map(jar => (
              <div key={jar.solution} className="mb-3">
                <label className="text-xs font-semibold block mb-1" style={{ color: jar.color }}>
                  {jar.label} solution — what do you predict will happen?
                </label>
                <textarea value={hypothesis[jar.solution]} onChange={e => setHypothesis(prev => ({ ...prev, [jar.solution]: e.target.value }))}
                  placeholder={`e.g. The ${TISSUES[tissueType].label.toLowerCase()} in ${jar.label} solution will...`}
                  rows={2} className="w-full text-xs p-2 rounded-lg border border-border bg-background resize-none"/>
              </div>
            ))}
          </div>
        </div>
      )}

      {(step === 'immerse' || step === 'observe' || step === 'final_weigh') && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="sim-panel">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Jars & Specimens</h3>
                {step === 'observe' && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => setRunning(r => !r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                      style={{ background: running ? '#C47B6B' : '#1A3550' }}>
                      {running ? <Pause className="w-3 h-3"/> : <Play className="w-3 h-3"/>}
                      {running ? 'Pause' : 'Run'}
                    </button>
                    <button onClick={() => { setTimeHours(0); setRunning(false); setMassRecords([{ t: 0, hypo: 60, iso: 60, hyper: 60, hypoErr: SD, isoErr: SD, hyperErr: SD }]); }}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted">
                      <RotateCcw className="w-3 h-3"/>
                    </button>
                    <span className="font-mono text-sm">{timeHours.toFixed(1)}h</span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {JARS.map(jar => {
                  const m = jar.solution === 'hypotonic' ? hypoMass : jar.solution === 'isotonic' ? isoMass : hyperMass;
                  const vol = jar.solution === 'hypotonic' ? hypoVol : jar.solution === 'isotonic' ? isoVol : hyperVol;
                  const mc = active ? m - INITIAL_MASS : 0;
                  const volChange = vol - INITIAL_VOLUME;
                  const liquidHeight = 63 * (vol / INITIAL_VOLUME);
                  return (
                    <div key={jar.solution} className="flex flex-col items-center gap-1">
                      <div className="text-xs font-bold text-center" style={{ color: jar.color }}>{jar.label}</div>
                      <svg viewBox="0 0 90 125" width="100%" style={{ maxWidth: 90 }}>
                        {/* Jar */}
                        <rect x="10" y="20" width="70" height="90" rx="4" fill={jar.liquidColor} stroke={jar.color} strokeWidth="2"/>
                        {/* Water level (white overlay) */}
                        <rect x="10" y="20" width="70" height={active ? Math.max(0, 90 - liquidHeight) : 0} rx="4" fill="white" opacity="0.5"/>
                        {/* Lid */}
                        <rect x="5" y="14" width="80" height="10" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5"/>
                        {/* Temperature on lid */}
                        {active && <text x="72" y="22" textAnchor="middle" fontSize="5" fill="#B89555" fontWeight="600">{tempC}°C</text>}
                        {/* Liquid label */}
                        <text x="45" y="40" textAnchor="middle" fontSize="7" fill={jar.color} fontWeight="600">{jar.concentration.split(' ')[0]}</text>
                        {/* Egg */}
                        <EggSVG solution={jar.solution} massChange={active ? Math.abs(mc) : 0} molecules={active && timeHours > 2 ? Math.min(molecules, 4) : 0}/>
                        {/* Mass label */}
                        {active && <text x="45" y="108" textAnchor="middle" fontSize="7" fill={jar.color} fontWeight="700">{m.toFixed(1)}g</text>}
                        {/* Volume label */}
                        {active && <text x="45" y="116" textAnchor="middle" fontSize="5.5" fill="#6b7280">{vol.toFixed(0)} mL</text>}
                        {/* Tissue type label */}
                        <text x="45" y="123" textAnchor="middle" fontSize="5" fill={TISSUES[tissueType].color} fontWeight="600">{TISSUES[tissueType].label}</text>
                      </svg>
                      <div className={`text-xs font-bold ${mc > 0.5 ? 'text-blue-600' : mc < -0.5 ? 'text-amber-600' : 'text-green-600'}`}>
                        {active ? `${mc >= 0 ? '+' : ''}${mc.toFixed(1)}g` : '—'}
                      </div>
                      {active && (
                        <div className="text-[10px] text-muted-foreground">
                          Vol Δ{volChange >= 0 ? '+' : ''}{volChange.toFixed(1)} mL
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {step === 'observe' && (
                <>
                  <input type="range" min={0} max={72} value={timeHours} step={0.25}
                    onChange={e => { const v = Number(e.target.value); setTimeHours(v); }}
                    className="w-full mt-3" style={{ accentColor: '#1A3550' }}/>
                  <div className="flex justify-between text-xs text-muted-foreground"><span>0h</span><span>24h</span><span>48h</span><span>72h</span></div>
                </>
              )}
            </div>

            {step === 'observe' && (
              <div className="sim-panel">
                <div className="flex items-center gap-3">
                  <Thermometer className="w-4 h-4 text-orange-500"/>
                  <span className="text-xs font-semibold">Temperature Control</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input type="range" min={5} max={40} value={tempC} step={1}
                    onChange={e => setTempC(Number(e.target.value))}
                    className="flex-1" style={{ accentColor: '#B89555' }}/>
                  <span className="text-sm font-mono font-bold w-12 text-right" style={{ color: tempC > 30 ? '#C47B6B' : tempC < 10 ? '#5B7FA5' : '#B89555' }}>{tempC}°C</span>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>5°C (cold)</span>
                  <span>22°C (room)</span>
                  <span>40°C (warm)</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-2 bg-orange-50 dark:bg-orange-950 rounded-lg py-1.5 px-2">
                  Rate modifier: {(1 + (tempC - 22) * 0.02).toFixed(3)}x — Higher temperature increases molecular kinetic energy, accelerating osmosis.
                </div>
              </div>
            )}

            {step === 'final_weigh' && (
              <div className="sim-panel">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-4 h-4 text-primary"/>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Final Mass Results</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {JARS.map(jar => {
                    const m = finalMass(jar.solution);
                    const vol = jar.solution === 'hypotonic' ? hypoVol : jar.solution === 'isotonic' ? isoVol : hyperVol;
                    const chg = m - INITIAL_MASS;
                    const volChange = vol - INITIAL_VOLUME;
                    return (
                      <div key={jar.solution} className="bg-muted rounded-xl p-3 text-center">
                        <div className="text-xs font-bold mb-1" style={{ color: jar.color }}>{jar.label}</div>
                        <WatchGlass mass={m} label="Final"/>
                        <div className="text-xs mt-1 font-mono"><b>Δ{chg >= 0 ? '+' : ''}{chg.toFixed(1)}g</b></div>
                        <div className="text-xs text-muted-foreground">({pctChange(m)}%)</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Vol: {vol.toFixed(0)} mL (Δ{volChange >= 0 ? '+' : ''}{volChange.toFixed(1)})</div>
                        <div className={`text-xs mt-1 font-semibold ${chg > 0.5 ? 'text-blue-600' : chg < -0.5 ? 'text-amber-600' : 'text-green-600'}`}>
                          {chg > 0.5 ? '↑ Net H₂O gain' : chg < -0.5 ? '↓ Net H₂O loss' : '= No net flow'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="sim-panel">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Mass Change Over Time</h3>
                <button onClick={() => {
                  const header = 'Time(h),Hypotonic(g),Hypotonic_SD,Iso(g),Iso_SD,Hyper(g),Hyper_SD\n';
                  const rows = massRecords.map(r => `${r.t},${r.hypo},${r.hypoErr},${r.iso},${r.isoErr},${r.hyper},${r.hyperErr}`).join('\n');
                  const blob = new Blob([header + rows], { type: 'text/csv' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'egg_osmosis.csv'; a.click();
                }} className="p-1.5 rounded-lg border border-border hover:bg-muted">
                  <Download className="w-3 h-3"/>
                </button>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={massRecords} margin={{ top: 4, right: 12, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))"/>
                    <XAxis dataKey="t" tick={{ fontSize: 9 }} label={{ value: 'Time (h)', position: 'insideBottom', offset: -2, fontSize: 9 }}/>
                    <YAxis tick={{ fontSize: 9 }} domain={[20, 95]} label={{ value: 'Mass (g)', angle: -90, position: 'insideLeft', fontSize: 9 }}/>
                    <ReferenceLine y={INITIAL_MASS} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Initial', fontSize: 8, fill: '#94a3b8' }}/>
                    <Tooltip formatter={(v: number, name: string) => [name.includes('Err') ? `±${v.toFixed(1)}g` : `${v.toFixed(2)}g`, name.replace('Err', ' SD')]}/>
                    <Legend wrapperStyle={{ fontSize: 10 }}/>
                    <Line type="monotone" dataKey="hypo" stroke="#5B7FA5" strokeWidth={2} dot={false} name="Hypotonic">
                      <ErrorBar dataKey="hypoErr" width={4} strokeWidth={1} stroke="#5B7FA5" opacity={0.35}/>
                    </Line>
                    <Line type="monotone" dataKey="iso"  stroke="#6A9B7A" strokeWidth={2} dot={false} name="Isotonic">
                      <ErrorBar dataKey="isoErr" width={4} strokeWidth={1} stroke="#6A9B7A" opacity={0.35}/>
                    </Line>
                    <Line type="monotone" dataKey="hyper" stroke="#B89555" strokeWidth={2} dot={false} name="Hypertonic">
                      <ErrorBar dataKey="hyperErr" width={4} strokeWidth={1} stroke="#B89555" opacity={0.35}/>
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5 flex-wrap">
                <svg width="20" height="10"><line x1="2" y1="5" x2="18" y2="5" stroke="#94a3b8" strokeWidth="1"/><line x1="10" y1="1" x2="10" y2="9" stroke="#94a3b8" strokeWidth="1"/><line x1="7" y1="1" x2="13" y2="1" stroke="#94a3b8" strokeWidth="0.8"/><line x1="7" y1="9" x2="13" y2="9" stroke="#94a3b8" strokeWidth="0.8"/></svg>
                Error bars show ±{SD}g (simulated triplicate SD)
              </div>
            </div>

            {showHypo ? (
              <div className="sim-panel">
                <h3 className="font-bold text-sm mb-3">Your Hypotheses vs. Results</h3>
                {JARS.map(jar => (
                  <div key={jar.solution} className="mb-3 p-2 rounded-lg bg-muted text-xs">
                    <div className="font-bold mb-0.5" style={{ color: jar.color }}>{jar.label}</div>
                    <div className="text-muted-foreground mb-1"><em>You wrote:</em> {hypothesis[jar.solution] || '(no hypothesis)'}</div>
                    <div className="text-foreground"><em>Result:</em> {jar.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={() => setShowHypo(true)} className="w-full py-2 rounded-xl border border-border text-sm hover:bg-muted">
                Show Hypothesis Comparison
              </button>
            )}

            <div className="sim-panel border-l-4 border-blue-500">
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Membrane Permeability Note:</strong> The {TISSUES[tissueType].label.toLowerCase()} membrane is permeable to water but not to large molecules like sucrose or corn syrup. Water (H₂O, MW 18 Da) passes freely through aquaporin channels in the semi-permeable membrane, while sucrose (C₁₂H₂₂O₁₁, MW 342 Da) and corn syrup molecules are too large to cross. This is why only water movement drives the osmotic pressure changes observed in this experiment.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 mt-4 flex-wrap">
        {canPrev && <button onClick={() => setStep(steps[stepIndex - 1].id)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted">← Previous</button>}
        {canNext && <button onClick={() => setStep(steps[stepIndex + 1].id)} className="px-4 py-2 rounded-xl text-sm text-white font-semibold" style={{ background: '#1A3550' }}>Next Step →</button>}
      </div>
    </div>
  );
}
