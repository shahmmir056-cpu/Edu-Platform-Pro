import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Ruler, Beaker, AlertTriangle, Droplets, FlaskConical, Eye } from 'lucide-react';

type Sample = { id: string; label: string; color: string; fragments: number[]; amount: number };
type GelPct = '0.8' | '1.0' | '1.5' | '2.0';
type Buffer = 'TAE' | 'TBE' | 'SB';
type GelStep = 'cast' | 'load' | 'run';
type CastStage = 'weigh' | 'heat' | 'pour' | 'done';
type StainType = 'EtBr' | 'SYBR Safe';

const LADDER: number[] = [10000, 6000, 3000, 1500, 1000, 500, 250, 100];

const SAMPLES: Sample[] = [
  { id: 'ladder',  label: 'DNA Ladder', color: '#94a3b8', fragments: LADDER, amount: 10 },
  { id: 'sample1', label: 'Sample A',   color: '#5B7FA5', fragments: [4500, 2200, 800], amount: 0 },
  { id: 'sample2', label: 'Sample B',   color: '#C47B6B', fragments: [7000, 1500, 300], amount: 0 },
  { id: 'sample3', label: 'Sample C',   color: '#6A9B7A', fragments: [3000, 3000, 1000, 250], amount: 0 },
  { id: 'sample4', label: 'Sample D',   color: '#B89555', fragments: [9000, 600], amount: 0 },
];

const GEL_PCT_MU: Record<GelPct, number> = { '0.8': 0.65, '1.0': 0.78, '1.5': 0.95, '2.0': 1.1 };
const BUFFER_SPEED: Record<Buffer, number> = { TAE: 1.0, TBE: 0.95, SB: 1.15 };

function getBandY(bp: number, voltage: number, time: number, gelPct: GelPct, buffer: Buffer, maxY = 220, wellY = 20): number {
  const mu = GEL_PCT_MU[gelPct];
  const speed = BUFFER_SPEED[buffer];
  const mobility = speed * voltage * 0.0012 / (Math.log10(bp) * mu);
  const dist = mobility * time;
  return Math.min(wellY + dist, maxY);
}

function BandIntensity({ amount }: { amount: number }) {
  return Math.min(1, amount / 12);
}

export default function GelElectrophoresis() {
  const [samples, setSamples] = useState<Sample[]>(SAMPLES.map(s => ({ ...s })));
  const [voltage, setVoltage] = useState(100);
  const [gelPct, setGelPct] = useState<GelPct>('1.0');
  const [buffer, setBuffer] = useState<Buffer>('TAE');
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [uvLight, setUvLight] = useState(false);
  const [rulerMode, setRulerMode] = useState(false);
  const [rulerY, setRulerY] = useState<number | null>(null);
  const [loadingWell, setLoadingWell] = useState<string | null>(null);
  const [loadAmounts, setLoadAmounts] = useState<Record<string, number>>({ sample1: 8, sample2: 8, sample3: 8, sample4: 8 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gelRef = useRef<SVGSVGElement>(null);

  // --- NEW STATE: Gel Casting ---
  const [gelStep, setGelStep] = useState<GelStep>('cast');
  const [castStage, setCastStage] = useState<CastStage>('weigh');
  const [castProgress, setCastProgress] = useState(0);
  const [castRunning, setCastRunning] = useState(false);
  const castTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // --- NEW STATE: Staining ---
  const [stained, setStained] = useState(false);
  const [stainType, setStainType] = useState<StainType>('EtBr');
  const [showStainMenu, setShowStainMenu] = useState(false);

  // --- NEW STATE: Band Selection ---
  const [selectedBand, setSelectedBand] = useState<{ laneIdx: number; bandIdx: number; bp: number; x: number; y: number } | null>(null);

  // --- NEW STATE: Error Conditions ---
  const [errorConditions, setErrorConditions] = useState<string[]>([]);

  // --- NEW STATE: Standard Curve ---
  const [showStandardCurve, setShowStandardCurve] = useState(false);

  const loaded = samples.filter(s => s.id !== 'ladder' && s.amount > 0);

  // Well positions
  const wellCount = 6;
  const gelWidth = 340;
  const wellSpacing = gelWidth / (wellCount + 1);
  const wellXs = Array.from({ length: wellCount }, (_, i) => wellSpacing * (i + 1));
  const lanes = [samples[0], samples[1], samples[2], samples[3], samples[4], null];
  const WELL_Y = 28;
  const MAX_Y = 230;

  // --- Gel Casting Logic ---
  const agaroseWeight = (parseFloat(gelPct) * 100 * 0.01).toFixed(1); // grams for 100mL

  const startCasting = useCallback(() => {
    if (castRunning) return;
    setCastRunning(true);
    setCastStage('weigh');
    setCastProgress(0);

    let stage: CastStage = 'weigh';
    let progress = 0;

    castTimerRef.current = setInterval(() => {
      progress += 2;
      setCastProgress(progress);

      if (progress >= 100) {
        if (stage === 'weigh') {
          stage = 'heat';
          setCastStage('heat');
          progress = 0;
          setCastProgress(0);
        } else if (stage === 'heat') {
          stage = 'pour';
          setCastStage('pour');
          progress = 0;
          setCastProgress(0);
        } else if (stage === 'pour') {
          stage = 'done';
          setCastStage('done');
          setCastRunning(false);
          if (castTimerRef.current) clearInterval(castTimerRef.current);
          setTimeout(() => setGelStep('load'), 600);
        }
      }
    }, 60);
  }, [castRunning]);

  useEffect(() => {
    return () => { if (castTimerRef.current) clearInterval(castTimerRef.current); };
  }, []);

  // --- Error Conditions ---
  useEffect(() => {
    const errs: string[] = [];
    if (running && voltage > 170) errs.push('High voltage warning: Band smiling may occur');
    if (time > 250 && running) errs.push('Bands approaching gel edge — consider stopping');
    for (const s of samples) {
      if (s.id !== 'ladder' && s.amount > 15) {
        errs.push(`Overloaded well: ${s.label} — Band smearing detected`);
      }
    }
    if (gelPct === '0.8') {
      for (const s of samples) {
        if (s.id !== 'ladder' && s.amount > 0) {
          for (const bp of s.fragments) {
            if (bp < 200) {
              errs.push('Small fragments may run off gel at this concentration');
              break;
            }
          }
        }
      }
    }
    setErrorConditions(errs);
  }, [voltage, running, time, gelPct, samples]);

  // --- Main Gel Run Timer ---
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTime(t => {
          if (t >= 300) { setRunning(false); return t; }
          return t + 1;
        });
      }, 80);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running]);

  const reset = () => {
    setTime(0);
    setRunning(false);
    setSamples(SAMPLES.map(s => ({ ...s })));
    setGelStep('cast');
    setCastStage('weigh');
    setCastProgress(0);
    setCastRunning(false);
    setStained(false);
    setSelectedBand(null);
    setShowStandardCurve(false);
    setUvLight(false);
    setRulerMode(false);
    setRulerY(null);
  };

  const loadSample = (id: string) => {
    setSamples(prev => prev.map(s => s.id === id ? { ...s, amount: loadAmounts[id] || 8 } : s));
    setLoadingWell(null);
  };

  const allLoaded = [samples[1], samples[2], samples[3], samples[4]].every(s => s.amount > 0);

  // Ruler interpolation
  const rulerBp = rulerY !== null ? (() => {
    const ladderBands = LADDER.map(bp => ({
      bp,
      y: getBandY(bp, voltage, time, gelPct, buffer, MAX_Y, WELL_Y),
    })).sort((a, b) => a.y - b.y);
    for (let i = 0; i < ladderBands.length - 1; i++) {
      const lo = ladderBands[i], hi = ladderBands[i + 1];
      if (rulerY >= lo.y && rulerY <= hi.y) {
        const frac = (rulerY - lo.y) / (hi.y - lo.y);
        return Math.round(lo.bp * Math.pow(hi.bp / lo.bp, frac));
      }
    }
    return null;
  })() : null;

  // --- Standard Curve Data ---
  const standardCurveData = LADDER.map(bp => {
    const y = getBandY(bp, voltage, Math.max(time, 50), gelPct, buffer, MAX_Y, WELL_Y);
    return { bp, logBp: Math.log10(bp), distance: y - WELL_Y };
  }).sort((a, b) => a.distance - b.distance);

  const trendlineSlope = (() => {
    if (standardCurveData.length < 2) return { m: 0, b: 0 };
    const n = standardCurveData.length;
    const xs = standardCurveData.map(d => d.distance);
    const ys = standardCurveData.map(d => d.logBp);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, b, i) => a + b * ys[i], 0);
    const sumX2 = xs.reduce((a, b) => a + b * b, 0);
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    return { m, b };
  })();

  const rSquared = (() => {
    if (standardCurveData.length < 2) return 0;
    const ys = standardCurveData.map(d => d.logBp);
    const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
    const ssTotal = ys.reduce((a, y) => a + (y - yMean) ** 2, 0);
    const ssRes = standardCurveData.reduce((a, d) => {
      const predicted = trendlineSlope.m * d.distance + trendlineSlope.b;
      return a + (d.logBp - predicted) ** 2;
    }, 0);
    return ssTotal === 0 ? 1 : 1 - ssRes / ssTotal;
  })();

  // Stain opacity multiplier
  const stainOpacityMult = stained ? 1.0 : 0.12;

  return (
    <div className="sim-container">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">

          {/* --- GEL STEP INDICATOR --- */}
          <div className="sim-panel">
            <div className="flex items-center gap-2 mb-4">
              {(['cast', 'load', 'run'] as GelStep[]).map((step, idx) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    gelStep === step ? 'text-white' : gelStep === (['cast', 'load', 'run'] as GelStep[])[idx - 1] ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  }`} style={gelStep === step ? { background: '#1A3550' } : {}}>
                    {step === 'cast' && <FlaskConical className="w-3 h-3"/>}
                    {step === 'load' && <Droplets className="w-3 h-3"/>}
                    {step === 'run' && <Play className="w-3 h-3"/>}
                    {step === 'cast' ? '1. Cast' : step === 'load' ? '2. Load' : '3. Run'}
                  </div>
                  {idx < 2 && <div className={`w-6 h-0.5 ${gelStep === (['cast', 'load', 'run'] as GelStep[])[idx + 1] || gelStep === 'run' ? 'bg-green-400' : 'bg-border'}`}/>}
                </div>
              ))}
            </div>
          </div>

          {/* --- GEL CASTING PANEL --- */}
          {gelStep === 'cast' && (
            <div className="sim-panel">
              <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'Space Grotesk' }}>
                <FlaskConical className="w-4 h-4 inline mr-2"/>Gel Casting
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="sim-label">Agarose Concentration</div>
                  <div className="flex gap-2 mb-2">
                    {(['0.8', '1.0', '1.5', '2.0'] as GelPct[]).map(p => (
                      <button key={p} onClick={() => !castRunning && setGelPct(p)}
                        className={`flex-1 py-2 text-sm rounded-lg border font-semibold transition-all ${gelPct === p ? 'text-white border-transparent' : 'border-border text-muted-foreground'}`}
                        style={gelPct === p ? { background: '#1A3550' } : {}}>
                        {p}%
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {gelPct === '0.8' ? 'Best for large DNA (5–30 kb)' :
                     gelPct === '1.0' ? 'General purpose (200 bp – 10 kb)' :
                     gelPct === '1.5' ? 'Good for small–medium (100 bp – 3 kb)' :
                     'High resolution for small fragments (50–1000 bp)'}
                  </p>
                </div>
                <div>
                  <div className="sim-label">Running Buffer</div>
                  <div className="flex gap-2 mb-2">
                    {(['TAE', 'TBE', 'SB'] as Buffer[]).map(b => (
                      <button key={b} onClick={() => !castRunning && setBuffer(b)}
                        className={`flex-1 py-2 text-sm rounded-lg border font-semibold transition-all ${buffer === b ? 'text-white border-transparent' : 'border-border text-muted-foreground'}`}
                        style={buffer === b ? { background: '#5B7FA5' } : {}}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sim-label">Preparation</div>
              <div className="bg-muted/50 rounded-lg p-3 mb-4 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Agarose weight:</span>
                  <span className="font-mono font-bold">{agaroseWeight} g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buffer volume:</span>
                  <span className="font-mono font-bold">100 mL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total volume:</span>
                  <span className="font-mono font-bold">100 mL</span>
                </div>
              </div>

              {/* Cast Stage Progress */}
              {castRunning && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {(['weigh', 'heat', 'pour'] as CastStage[]).map((s, idx) => (
                      <div key={s} className="flex items-center gap-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          castStage === s ? 'text-white' : idx < (['weigh', 'heat', 'pour'] as CastStage[]).indexOf(castStage) ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                        }`} style={castStage === s ? { background: '#C47B6B' } : {}}>
                          {idx < (['weigh', 'heat', 'pour'] as CastStage[]).indexOf(castStage) ? '✓' : idx + 1}
                        </div>
                        <span className={`text-xs ${castStage === s ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                          {s === 'weigh' ? 'Weigh' : s === 'heat' ? 'Heat' : 'Pour'}
                        </span>
                        {idx < 2 && <div className="w-4 h-0.5 bg-border mx-1"/>}
                      </div>
                    ))}
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${castProgress}%`, background: '#C47B6B' }}/>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {castStage === 'weigh' && 'Measuring agarose powder...'}
                    {castStage === 'heat' && 'Microwaving solution — watch for boiling!'}
                    {castStage === 'pour' && 'Pouring gel into tray & inserting comb...'}
                  </p>
                </div>
              )}

              {/* Casting Tray SVG */}
              <div className="flex justify-center mb-4">
                <svg viewBox="0 0 300 120" className="w-full" style={{ maxWidth: 300, background: '#f5f0e8', borderRadius: 8, border: '2px solid #e2e8f0' }}>
                  {/* Tray body */}
                  <rect x="40" y="30" width="220" height="60" rx="4" fill="#d4c9a8" stroke="#b8a87a" strokeWidth="1.5"/>
                  {/* Gel inside tray */}
                  <rect x="44" y="34" width="212" height="52" rx="2"
                    fill={castStage === 'pour' && castProgress > 50 ? '#e8dcc4' : castStage === 'done' ? '#f5edd8' : 'none'}
                    stroke={castStage === 'pour' || castStage === 'done' ? '#c4b896' : 'none'} strokeWidth="1"/>
                  {/* Comb */}
                  <g transform={`translate(0, ${castStage === 'pour' && castProgress > 70 ? 0 : -20})`}
                    style={{ transition: 'transform 0.5s ease' }}>
                    <rect x="80" y="12" width="140" height="10" rx="2" fill="#555" stroke="#333" strokeWidth="1"/>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <rect key={i} x={95 + i * 22} y="22" width="6" height="14" rx="1" fill="#555"/>
                    ))}
                  </g>
                  {/* Labels */}
                  <text x="150" y="100" textAnchor="middle" fontSize="8" fill="#888">
                    {castStage === 'weigh' ? 'Preparing agarose...' :
                     castStage === 'heat' ? '🔥 Heating...' :
                     castStage === 'pour' ? 'Gel solidifying...' : 'Gel ready!'}
                  </text>
                  {/* Microwave icon */}
                  {castStage === 'heat' && (
                    <g>
                      <rect x="220" y="5" width="30" height="22" rx="3" fill="#666" stroke="#444" strokeWidth="1"/>
                      <rect x="223" y="8" width="20" height="13" rx="1" fill="#aaddff"/>
                      <circle cx="248" cy="18" r="2" fill="#888"/>
                      {castProgress % 10 < 5 && (
                        <text x="233" y="17" fontSize="8" fill="#ff6600">~</text>
                      )}
                    </g>
                  )}
                </svg>
              </div>

              {!castRunning && castStage !== 'done' && (
                <button onClick={startCasting}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: '#C47B6B' }}>
                  <FlaskConical className="w-4 h-4 inline mr-1.5"/>Cast Gel
                </button>
              )}
              {castStage === 'done' && (
                <div className="text-center text-sm font-semibold text-green-600">
                  ✓ Gel cast successfully — proceeding to sample loading...
                </div>
              )}
            </div>
          )}

          {/* --- VOLTAGE + GEL SETUP (shown during load and run steps) --- */}
          {gelStep !== 'cast' && (
            <>
              <div className="sim-panel">
                <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'Space Grotesk' }}>Gel Setup</h3>
                <div className="sim-label">Agarose Concentration</div>
                <div className="flex gap-2 mb-4">
                  {(['0.8', '1.0', '1.5', '2.0'] as GelPct[]).map(p => (
                    <button key={p} onClick={() => setGelPct(p)}
                      className={`flex-1 py-2 text-sm rounded-lg border font-semibold transition-all ${gelPct === p ? 'text-white border-transparent' : 'border-border text-muted-foreground'}`}
                      style={gelPct === p ? { background: '#1A3550' } : {}}>
                      {p}%
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {gelPct === '0.8' ? 'Best for large DNA (5–30 kb) — poor resolution for small fragments' :
                   gelPct === '1.0' ? 'General purpose (200 bp – 10 kb)' :
                   gelPct === '1.5' ? 'Good for small–medium (100 bp – 3 kb)' :
                   'High resolution for small fragments (50–1000 bp)'}
                </p>

                <div className="sim-label">Running Buffer</div>
                <div className="flex gap-2 mb-4">
                  {(['TAE', 'TBE', 'SB'] as Buffer[]).map(b => (
                    <button key={b} onClick={() => setBuffer(b)}
                      className={`flex-1 py-2 text-sm rounded-lg border font-semibold transition-all ${buffer === b ? 'text-white border-transparent' : 'border-border text-muted-foreground'}`}
                      style={buffer === b ? { background: '#5B7FA5' } : {}}>
                      {b}
                    </button>
                  ))}
                </div>

                <div className="sim-label">Voltage</div>
                <div className="flex items-center gap-3 mb-1">
                  <input type="range" min={30} max={200} value={voltage} onChange={e => setVoltage(Number(e.target.value))}
                    className="flex-1" style={{ accentColor: '#C47B6B' }} />
                  <span className="text-sm font-mono font-bold w-16">{voltage} V</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {voltage > 150 ? '⚠ High voltage — faster migration but band smearing may occur' :
                   voltage < 60 ? 'Low voltage — sharp bands, longer run time' : 'Optimal voltage range'}
                </p>
              </div>
            </>
          )}

          {/* --- SAMPLE LOADING PANEL --- */}
          {gelStep === 'load' && (
            <div className="sim-panel">
              <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                <Droplets className="w-4 h-4 inline mr-2"/>Load Samples
              </h3>
              <p className="text-xs text-muted-foreground mb-3">Set loading volume (µL) and load each sample into its well</p>
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-purple-50 border border-purple-200">
                <Droplets className="w-3.5 h-3.5 text-purple-500 flex-shrink-0"/>
                <span className="text-xs text-purple-700">Loading dye (bromophenol blue) added to all samples for tracking migration</span>
              </div>
              {samples.filter(s => s.id !== 'ladder').map(s => (
                <div key={s.id} className="flex items-center gap-3 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }}/>
                  <span className="text-xs w-20">{s.label}</span>
                  <input type="number" min={2} max={20} value={loadAmounts[s.id] ?? 8}
                    onChange={e => setLoadAmounts(prev => ({ ...prev, [s.id]: Number(e.target.value) }))}
                    className="w-14 px-2 py-1 text-xs rounded border border-border bg-background" />
                  <span className="text-xs text-muted-foreground">µL</span>
                  <button onClick={() => loadSample(s.id)}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all ${s.amount > 0 ? 'bg-green-100 text-green-700 border border-green-300' : 'text-white'}`}
                    style={s.amount === 0 ? { background: s.color } : {}}>
                    {s.amount > 0 ? '✓ Loaded' : 'Load →'}
                  </button>
                </div>
              ))}
              {allLoaded && (
                <button onClick={() => setGelStep('run')}
                  className="w-full mt-3 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ background: '#1A3550' }}>
                  <Play className="w-4 h-4 inline mr-1.5"/>Proceed to Run
                </button>
              )}
            </div>
          )}

          {/* --- RUN GEL PANEL --- */}
          {gelStep === 'run' && (
            <div className="sim-panel">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Run Gel</h3>
                <span className="text-xs text-muted-foreground ml-auto font-mono">{time}s / 300s</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all" style={{ width: `${(time / 300) * 100}%`, background: '#C47B6B' }} />
              </div>

              {/* Running Indicator */}
              {running && (
                <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-red-50 border border-red-200">
                  <div className="relative">
                    <Beaker className="w-5 h-5 text-red-500"/>
                    {/* Animated bubbles */}
                    <div className="absolute -top-0.5 left-1 w-1 h-1 rounded-full bg-red-300" style={{ animation: 'bubbleUp 1s infinite 0s' }}/>
                    <div className="absolute top-0 left-2.5 w-0.5 h-0.5 rounded-full bg-red-400" style={{ animation: 'bubbleUp 1.2s infinite 0.3s' }}/>
                    <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 rounded-full bg-red-300" style={{ animation: 'bubbleUp 0.9s infinite 0.6s' }}/>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-red-700">Electrophoresis Running</div>
                    <div className="text-xs text-red-500 font-mono">{voltage}V • {buffer} • {gelPct}%</div>
                  </div>
                  <div className="text-lg font-mono font-bold text-red-600">{time}s</div>
                </div>
              )}

              <style>{`
                @keyframes bubbleUp {
                  0% { transform: translateY(0); opacity: 1; }
                  100% { transform: translateY(-10px); opacity: 0; }
                }
              `}</style>

              <div className="flex gap-2">
                <button onClick={() => setRunning(r => !r)}
                  disabled={!allLoaded && !running}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all ${!allLoaded && !running ? 'opacity-50' : 'hover:scale-105'}`}
                  style={{ background: running ? '#C47B6B' : '#1A3550' }}>
                  {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {running ? 'Pause' : 'Run Gel'}
                </button>
                <button onClick={reset} className="p-2 rounded-xl border border-border hover:bg-muted">
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Staining Section */}
              {time >= 300 && !running && (
                <div className="mt-4 pt-3 border-t border-border">
                  <h4 className="font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                    <Eye className="w-4 h-4 inline mr-1.5"/>Stain Gel
                  </h4>
                  {!stained ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-2">Bands are barely visible without staining. Select a stain:</p>
                      <div className="flex gap-2">
                        {(['EtBr', 'SYBR Safe'] as StainType[]).map(st => (
                          <button key={st} onClick={() => { setStainType(st); setStained(true); }}
                            className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-all">
                            {st === 'EtBr' ? '🔬 Ethidium Bromide' : '🟢 SYBR Safe'}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                      <Eye className="w-3.5 h-3.5 text-green-500"/>
                      <span className="text-xs text-green-700">Gel stained with {stainType} — bands visible under UV</span>
                    </div>
                  )}
                </div>
              )}

              {/* Standard Curve */}
              {time > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <button onClick={() => setShowStandardCurve(c => !c)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition-all">
                    <FlaskConical className="w-3.5 h-3.5"/>
                    {showStandardCurve ? 'Hide' : 'Show'} Standard Curve
                  </button>
                  {showStandardCurve && (
                    <div className="mt-2">
                      <svg viewBox="0 0 240 160" className="w-full" style={{ maxWidth: 240, background: '#fafafa', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                        {/* Axes */}
                        <line x1="40" y1="10" x2="40" y2="140" stroke="#ccc" strokeWidth="1"/>
                        <line x1="40" y1="140" x2="230" y2="140" stroke="#ccc" strokeWidth="1"/>
                        <text x="5" y="80" fontSize="7" fill="#666" transform="rotate(-90 5 80)">log₁₀(bp)</text>
                        <text x="130" y="155" fontSize="7" fill="#666" textAnchor="middle">Migration Distance (px)</text>

                        {standardCurveData.length > 0 && (() => {
                          const maxDist = Math.max(...standardCurveData.map(d => d.distance), 1);
                          const minLog = Math.min(...standardCurveData.map(d => d.logBp));
                          const maxLog = Math.max(...standardCurveData.map(d => d.logBp));
                          const logRange = maxLog - minLog || 1;

                          const scaleX = (d: number) => 40 + (d / maxDist) * 180;
                          const scaleY = (l: number) => 140 - ((l - minLog) / logRange) * 120;

                          const trendStartX = 0;
                          const trendEndX = maxDist;
                          const trendStartY = trendlineSlope.m * trendStartX + trendlineSlope.b;
                          const trendEndY = trendlineSlope.m * trendEndX + trendlineSlope.b;

                          return (
                            <>
                              {/* Trendline */}
                              <line x1={scaleX(trendStartX)} y1={scaleY(trendStartY)}
                                x2={scaleX(trendEndX)} y2={scaleY(trendEndY)}
                                stroke="#8B7BB5" strokeWidth="1" strokeDasharray="4 2"/>

                              {/* Data points */}
                              {standardCurveData.map((d, i) => (
                                <circle key={i} cx={scaleX(d.distance)} cy={scaleY(d.logBp)}
                                  r="3" fill="#8B7BB5" stroke="white" strokeWidth="1"/>
                              ))}

                              {/* R² value */}
                              <text x="170" y="20" fontSize="8" fill="#8B7BB5" fontWeight="bold">
                                R² = {rSquared.toFixed(4)}
                              </text>

                              {/* Y axis ticks */}
                              {[minLog, (minLog + maxLog) / 2, maxLog].map((v, i) => (
                                <g key={i}>
                                  <line x1="37" y1={scaleY(v)} x2="40" y2={scaleY(v)} stroke="#ccc"/>
                                  <text x="35" y={scaleY(v) + 3} textAnchor="end" fontSize="6" fill="#888">
                                    {v.toFixed(1)}
                                  </text>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                      <p className="text-xs text-muted-foreground mt-1">log₁₀(bp) vs. migration distance for DNA ladder</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* --- ERROR CONDITIONS --- */}
          {errorConditions.length > 0 && (
            <div className="sim-panel">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500"/>
                <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Warnings</h3>
              </div>
              {errorConditions.map((err, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-200 mb-1 last:mb-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"/>
                  <span className="text-xs text-amber-700">{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gel View */}
        <div className="space-y-4">
          <div className="sim-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Gel Image</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setRulerMode(m => !m)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all ${rulerMode ? 'text-white border-transparent' : 'border-border'}`}
                  style={rulerMode ? { background: '#8B7BB5' } : {}}>
                  <Ruler className="w-3 h-3" /> Ruler
                </button>
                <button onClick={() => setUvLight(u => !u)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${uvLight ? 'text-white border-transparent' : 'border-border'}`}
                  style={uvLight ? { background: '#8B7BB5' } : {}}>
                  UV {uvLight ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <svg ref={gelRef} viewBox="0 0 380 270" className="w-full" style={{ maxWidth: 380, background: uvLight ? '#1a0033' : '#f5f0e8', borderRadius: 8, border: '2px solid #e2e8f0', cursor: rulerMode ? 'crosshair' : 'default' }}
                onClick={e => {
                  if (!rulerMode || !gelRef.current) return;
                  const rect = gelRef.current.getBoundingClientRect();
                  const svgY = ((e.clientY - rect.top) / rect.height) * 270;
                  setRulerY(svgY);
                }}>

                {/* Gel body */}
                <rect x="20" y="10" width={gelWidth} height={MAX_Y + 20} rx="4"
                  fill={uvLight ? '#120022' : '#f5f0d8'} stroke={uvLight ? '#4c1d95' : '#d4c9a8'} strokeWidth="1.5"/>

                {/* Stain overlay effect */}
                {stained && stainType === 'SYBR Safe' && uvLight && (
                  <rect x="20" y="10" width={gelWidth} height={MAX_Y + 20} rx="4"
                    fill="rgba(0,255,100,0.03)" stroke="none"/>
                )}

                {/* Wells */}
                {lanes.map((lane, i) => (
                  <rect key={`well-${i}`} x={wellXs[i] - 14} y={WELL_Y - 14} width="28" height="14" rx="2"
                    fill={uvLight ? '#2d1b69' : '#d4c9a8'}
                    stroke={lane ? lane.color : '#aaa'} strokeWidth={lane?.amount ? 2 : 0.5}/>
                ))}

                {/* Well filling with loading dye (samples loaded visual) */}
                {lanes.map((lane, i) => {
                  if (!lane || lane.amount === 0) return null;
                  if (gelStep !== 'load' && gelStep !== 'run') return null;
                  return (
                    <rect key={`dye-${i}`} x={wellXs[i] - 12} y={WELL_Y - 12} width="24" height="10" rx="1"
                      fill={uvLight ? `${lane.color}44` : `${lane.color}88`}
                      opacity={0.7}/>
                  );
                })}

                {/* Lane labels */}
                {lanes.map((lane, i) => (
                  <text key={`label-${i}`} x={wellXs[i]} y={WELL_Y + 12} textAnchor="middle" fontSize="7"
                    fill={uvLight ? '#c4b5fd' : '#64748b'} fontWeight="500">
                    {lane ? (lane.id === 'ladder' ? 'L' : lane.label.replace('Sample ', '')) : ''}
                  </text>
                ))}

                {/* Bands */}
                {lanes.map((lane, li) => {
                  if (!lane || lane.amount === 0) return null;
                  const intensity = BandIntensity({ amount: lane.amount });
                  return lane.fragments.map((bp, bi) => {
                    const y = getBandY(bp, voltage, time, gelPct, buffer, MAX_Y, WELL_Y);
                    const baseSmear = voltage > 150 ? (voltage - 150) * 0.03 : 0;
                    const overloadSmear = lane.amount > 15 ? (lane.amount - 15) * 0.2 : 0;
                    const smear = baseSmear + overloadSmear;

                    const effectiveIntensity = intensity * stainOpacityMult;

                    const isSelected = selectedBand && selectedBand.laneIdx === li && selectedBand.bandIdx === bi;
                    const smilingOffset = voltage > 170 ? Math.sin((wellXs[li] / gelWidth) * Math.PI * 3) * 2 : 0;

                    const bandColor = uvLight
                      ? `rgba(${lane.id === 'ladder' ? '200,180,255' : '80,220,120'},${0.3 + effectiveIntensity * 0.65})`
                      : `rgba(${lane.id === 'ladder' ? '80,80,120' : lane.color.startsWith('#') ? parseInt(lane.color.slice(1, 3), 16) + ',' + parseInt(lane.color.slice(3, 5), 16) + ',' + parseInt(lane.color.slice(5, 7), 16) : '60,60,60'},${0.2 + effectiveIntensity * 0.65})`;

                    const bandWidth = 26;
                    const bandHeight = 3 + smear + (lane.amount * 0.15);

                    // Blur filter for overloaded bands
                    const useBlur = lane.amount > 15;

                    return (
                      <g key={`${li}-${bi}`}
                        style={{ cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (gelStep === 'run' || time > 0) {
                            setSelectedBand(isSelected ? null : {
                              laneIdx: li,
                              bandIdx: bi,
                              bp,
                              x: wellXs[li],
                              y: y + smilingOffset,
                            });
                          }
                        }}>
                        {useBlur && (
                          <defs>
                            <filter id={`blur-${li}-${bi}`}>
                              <feGaussianBlur stdDeviation="1.5"/>
                            </filter>
                          </defs>
                        )}
                        <rect x={wellXs[li] - bandWidth / 2} y={y - 1.5 - smear / 2 + smilingOffset}
                          width={bandWidth} height={bandHeight}
                          fill={bandColor} rx="1"
                          filter={useBlur ? `url(#blur-${li}-${bi})` : undefined}
                          stroke={isSelected ? '#B89555' : 'none'} strokeWidth={isSelected ? 1.5 : 0}/>
                        {lane.id === 'ladder' && (
                          <text x={wellXs[li] + 18} y={y + 1.5 + smilingOffset} fontSize="7"
                            fill={uvLight ? '#8B7BB5' : '#64748b'}>
                            {bp >= 1000 ? `${bp / 1000}k` : bp}
                          </text>
                        )}
                      </g>
                    );
                  });
                })}

                {/* Band Selection Tooltip */}
                {selectedBand && (
                  <g>
                    <rect x={selectedBand.x - 45} y={selectedBand.y - 22} width="90" height="18" rx="4"
                      fill="#1a1a2e" stroke="#B89555" strokeWidth="1"/>
                    <text x={selectedBand.x} y={selectedBand.y - 10} textAnchor="middle" fontSize="7" fill="#f5e6b8" fontWeight="bold">
                      {selectedBand.bp >= 1000 ? `${(selectedBand.bp / 1000).toFixed(1)}k` : selectedBand.bp} bp
                    </text>
                    <text x={selectedBand.x} y={selectedBand.y + 2} textAnchor="middle" fontSize="6" fill="#c8b87a">
                      {(() => {
                        const lane = lanes[selectedBand.laneIdx];
                        if (!lane) return '';
                        const conc = (BandIntensity({ amount: lane.amount }) * lane.amount * 2.5).toFixed(1);
                        return `${conc} ng/µL`;
                      })()}
                    </text>
                  </g>
                )}

                {/* Ruler line */}
                {rulerMode && rulerY !== null && (
                  <g>
                    <line x1="20" y1={rulerY} x2={gelWidth + 20} y2={rulerY} stroke="#B89555" strokeWidth="1.5" strokeDasharray="4 3"/>
                    {rulerBp && (
                      <text x={gelWidth + 18} y={rulerY - 3} textAnchor="end" fontSize="9"
                        fill="#B89555" fontWeight="700">~ {rulerBp} bp</text>
                    )}
                  </g>
                )}

                {/* Buffer direction arrow */}
                <text x="372" y="80" fontSize="8" fill={uvLight ? '#8B7BB5' : '#94a3b8'} transform="rotate(90 372 80)">+ → −</text>
              </svg>
            </div>

            {rulerMode && <p className="text-xs text-center text-purple-600 mt-1">Click on gel to measure band size at that position</p>}
          </div>

          {/* Band Size Table */}
          {time > 0 && (
            <div className="sim-panel">
              <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Band Size Analysis</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1 pr-2 text-muted-foreground">Lane</th>
                      <th className="text-left py-1 pr-2 text-muted-foreground">Bands (bp)</th>
                      <th className="text-left py-1 text-muted-foreground">Migration (px)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lanes.filter(Boolean).map((lane, i) => {
                      if (!lane || lane.amount === 0) return null;
                      return (
                        <tr key={i} className="border-b border-border/50">
                          <td className="py-1 pr-2 font-semibold" style={{ color: lane.color }}>{lane.label}</td>
                          <td className="py-1 pr-2">
                            {lane.fragments.map(bp => bp >= 1000 ? `${(bp / 1000).toFixed(1)}k` : bp).join(', ')}
                          </td>
                          <td className="py-1">
                            {lane.fragments.map(bp =>
                              Math.round(getBandY(bp, voltage, time, gelPct, buffer, MAX_Y, WELL_Y) - WELL_Y)
                            ).join(', ')} mm
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
