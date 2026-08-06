import { useState, useEffect, useRef, useCallback } from 'react';
import { Shield, TrendingUp, Activity, Zap, Lock, Unlock, Syringe, BarChart3 } from 'lucide-react';
import { useLabControls } from './labControls';

type PersonState = 'S' | 'E' | 'I' | 'R' | 'D' | 'V';

const COLS = 40;
const ROWS = 30;
const N = COLS * ROWS;

const STATE_COLORS: Record<PersonState, string> = {
  S: '#5B7FA5',
  E: '#B89555',
  I: '#C47B6B',
  R: '#6A9B7A',
  D: '#6b7280',
  V: '#8B7BB5',
};

const STATE_LABELS: Record<PersonState, string> = {
  S: 'Susceptible',
  E: 'Exposed',
  I: 'Infected',
  R: 'Recovered',
  D: 'Dead',
  V: 'Vaccinated',
};

interface SIRPoint { t: number; S: number; E: number; I: number; R: number; D: number; V: number; }

interface Preset {
  label: string;
  transmission: number;
  recovery: number;
  mortality: number;
}

const PRESETS: Record<string, Preset> = {
  'COVID-Original': { label: 'COVID-Original', transmission: 30, recovery: 14, mortality: 2 },
  'COVID-Omicron': { label: 'COVID-Omicron', transmission: 65, recovery: 7, mortality: 1 },
  'Influenza': { label: 'Influenza', transmission: 20, recovery: 5, mortality: 0.1 },
  'Measles': { label: 'Measles', transmission: 80, recovery: 9, mortality: 0.5 },
  'Ebola': { label: 'Ebola', transmission: 25, recovery: 14, mortality: 40 },
  'Custom': { label: 'Custom', transmission: 30, recovery: 14, mortality: 2 },
};

function initGrid(vaccPct: number): PersonState[] {
  const grid: PersonState[] = Array(N).fill('S');
  const vaccCount = Math.round(N * vaccPct / 100);
  const indices = Array.from({ length: N }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (let i = 0; i < vaccCount; i++) grid[indices[i]] = 'V';
  const middle = Math.floor(N / 2);
  if (grid[middle] === 'S') grid[middle] = 'I';
  return grid;
}

export default function EpidemicSimulation() {
  const [transmission, setTransmission] = useState(30);
  const [recovery, setRecovery] = useState(14);
  const [mortality, setMortality] = useState(2);
  const [vaccPct, setVaccPct] = useState(0);
  const [grid, setGrid] = useState<PersonState[]>(() => Array(N).fill('S'));
  const [sirData, setSirData] = useState<SIRPoint[]>([]);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [tick, setTick] = useState(0);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gridRef = useRef<PersonState[]>(grid);
  const infectedDaysRef = useRef<number[]>(Array(N).fill(0));
  const exposedDaysRef = useRef<number[]>(Array(N).fill(0));

  const [preset, setPreset] = useState<string>('COVID-Original');
  const [lockdownActive, setLockdownActive] = useState(false);
  const [lockdownReduction, setLockdownReduction] = useState(50);
  const [vaccRate, setVaccRate] = useState(1);
  const [vaccEfficacy, setVaccEfficacy] = useState(85);
  const [autoVaccinate, setAutoVaccinate] = useState(false);
  const [useSEIR, setUseSEIR] = useState(false);
  const [incubationDays, setIncubationDays] = useState(5);
  const [speed, setSpeed] = useState<0.5 | 1 | 2 | 5>(1);

  const [peakInfected, setPeakInfected] = useState(0);
  const [peakDay, setPeakDay] = useState(0);
  const [totalInfected, setTotalInfected] = useState(0);
  const [totalDead, setTotalDead] = useState(0);

  const effectiveTransmissionRef = useRef(transmission);
  const prevTotalIRef = useRef(0);
  const newCasesDataRef = useRef<{ day: number; cases: number }[]>([]);

  const applyPreset = (name: string) => {
    setPreset(name);
    if (name !== 'Custom') {
      const p = PRESETS[name];
      setTransmission(p.transmission);
      setRecovery(p.recovery);
      setMortality(p.mortality);
    }
  };

  const handleTransmission = (v: number) => {
    setTransmission(v);
    setPreset('Custom');
  };
  const handleRecovery = (v: number) => {
    setRecovery(v);
    setPreset('Custom');
  };
  const handleMortality = (v: number) => {
    setMortality(v);
    setPreset('Custom');
  };

  const R0 = (transmission / 100) * (recovery / 7);
  const counts = { S: 0, E: 0, I: 0, R: 0, D: 0, V: 0 };
  grid.forEach(s => counts[s]++);
  const Re = R0 > 0 ? R0 * (counts.S / N) : 0;
  const herdThreshold = R0 > 1 ? ((1 - 1 / R0) * 100) : 0;

  const updateCounts = useCallback((g: PersonState[], t: number) => {
    const c = { S: 0, E: 0, I: 0, R: 0, D: 0, V: 0 };
    g.forEach(s => c[s]++);
    setSirData(prev => [...prev.slice(-300), { t, ...c }]);

    if (c.I > peakInfected) {
      setPeakInfected(c.I);
      setPeakDay(t);
    }
    setTotalInfected(prev => {
      const newI = c.I;
      const diff = Math.max(0, newI - prevTotalIRef.current);
      prevTotalIRef.current = newI;
      return prev + diff;
    });
    setTotalDead(c.D);
  }, [peakInfected]);

  const step = useCallback(() => {
    const g = [...gridRef.current];
    const days = [...infectedDaysRef.current];
    const eDays = useSEIR ? [...exposedDaysRef.current] : [];
    const newGrid = [...g];
    const currentTransmission = lockdownActive
      ? effectiveTransmissionRef.current * (1 - lockdownReduction / 100)
      : effectiveTransmissionRef.current;

    for (let idx = 0; idx < N; idx++) {
      if (g[idx] === 'E') {
        eDays[idx]++;
        if (eDays[idx] >= incubationDays) {
          newGrid[idx] = 'I';
          days[idx] = 0;
        }
      } else if (g[idx] === 'I') {
        days[idx]++;
        const row = Math.floor(idx / COLS);
        const col = idx % COLS;
        const neighbors = [
          row > 0 ? idx - COLS : -1,
          row < ROWS - 1 ? idx + COLS : -1,
          col > 0 ? idx - 1 : -1,
          col < COLS - 1 ? idx + 1 : -1,
        ].filter(n => n >= 0);

        for (const n of neighbors) {
          if (g[n] === 'S') {
            if (Math.random() * 100 < currentTransmission) {
              if (useSEIR) {
                newGrid[n] = 'E';
                eDays[n] = 0;
              } else {
                newGrid[n] = 'I';
                days[n] = 0;
              }
            }
          } else if (g[n] === 'V') {
            if (Math.random() * 100 < currentTransmission * (1 - vaccEfficacy / 100)) {
              if (useSEIR) {
                newGrid[n] = 'E';
                eDays[n] = 0;
              } else {
                newGrid[n] = 'I';
                days[n] = 0;
              }
            }
          }
        }

        if (days[idx] >= recovery) {
          if (Math.random() * 100 < mortality) {
            newGrid[idx] = 'D';
          } else {
            newGrid[idx] = 'R';
          }
        }
      }
    }

    if (autoVaccinate && started) {
      const susceptible = newGrid.map((s, i) => s === 'S' ? i : -1).filter(i => i >= 0);
      const toVacc = Math.min(susceptible.length, Math.round(susceptible.length * vaccRate / 100));
      const chosen = susceptible.sort(() => Math.random() - 0.5).slice(0, toVacc);
      for (const idx of chosen) newGrid[idx] = 'V';
    }

    gridRef.current = newGrid;
    infectedDaysRef.current = days;
    if (useSEIR) exposedDaysRef.current = eDays;
    return newGrid;
  }, [transmission, recovery, mortality, lockdownActive, lockdownReduction, useSEIR, incubationDays, vaccRate, vaccEfficacy, autoVaccinate, started]);

  useEffect(() => {
    effectiveTransmissionRef.current = transmission;
  }, [transmission]);

  useEffect(() => {
    if (running) {
      const delay = 80 / speed;
      animRef.current = setInterval(() => {
        const newGrid = step();
        setGrid([...newGrid]);
        setTick(t => {
          const newT = t + 1;
          updateCounts(newGrid, newT);

          const hasInfected = newGrid.some(s => s === 'I' || s === 'E');
          if (!hasInfected) {
            setRunning(false);
          }
          return newT;
        });
      }, delay);
    }
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [running, step, updateCounts, speed]);

  const startEpidemic = () => {
    const g = initGrid(vaccPct);
    gridRef.current = g;
    infectedDaysRef.current = Array(N).fill(0);
    exposedDaysRef.current = Array(N).fill(0);
    setGrid(g);
    setSirData([]);
    setTick(0);
    setPeakInfected(0);
    setPeakDay(0);
    setTotalInfected(0);
    setTotalDead(0);
    prevTotalIRef.current = 0;
    newCasesDataRef.current = [];
    setStarted(true);
    setRunning(true);
  };

  const pauseResume = () => setRunning(r => !r);

  const resetSim = () => {
    setRunning(false);
    setStarted(false);
    const g = Array(N).fill('S') as PersonState[];
    gridRef.current = g;
    setGrid(g);
    setSirData([]);
    setTick(0);
    setPeakInfected(0);
    setPeakDay(0);
    setTotalInfected(0);
    setTotalDead(0);
    prevTotalIRef.current = 0;
    newCasesDataRef.current = [];
  };

  const manualStep = useCallback(() => {
    if (running) return;
    const g = step();
    setGrid([...g]);
    setTick(t => {
      const nt = t + 1;
      updateCounts(g, nt);
      return nt;
    });
  }, [running, step, updateCounts]);

  useLabControls(
    {
      canRun: true,
      running,
      progress: ((counts.R + counts.D + counts.I) / N) * 100,
      dataset: {
        name: "Epidemic SIR Data",
        columns: [
          { key: "t", label: "Day" },
          { key: "S", label: "Susceptible" },
          { key: "E", label: "Exposed" },
          { key: "I", label: "Infected" },
          { key: "R", label: "Recovered" },
          { key: "D", label: "Dead" },
          { key: "V", label: "Vaccinated" },
        ],
        rows: sirData,
      },
    },
    {
      onToggleRun: pauseResume,
      onStep: manualStep,
    },
  );

  const vaccinateNow = () => {
    const g = [...gridRef.current];
    const susceptible = g.map((s, i) => s === 'S' ? i : -1).filter(i => i >= 0);
    const toVacc = Math.round(susceptible.length * 0.2);
    const chosen = susceptible.sort(() => Math.random() - 0.5).slice(0, toVacc);
    for (const idx of chosen) g[idx] = 'V';
    gridRef.current = g;
    setGrid([...g]);
  };

  const GRAPH_W = 350, GRAPH_H = 120;

  const chartStates: PersonState[] = useSEIR ? ['S', 'E', 'I', 'R', 'D', 'V'] : ['S', 'I', 'R', 'D', 'V'];

  return (
    <div className="sim-container">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Disease Presets */}
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
              <Shield size={16} /> Disease Preset
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
              {Object.keys(PRESETS).map(name => (
                <button
                  key={name}
                  onClick={() => applyPreset(name)}
                  disabled={started}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    preset === name
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Epidemic Parameters */}
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'Space Grotesk' }}>Epidemic Parameters</h3>

            {[
              { label: 'Transmission Rate', val: transmission, set: handleTransmission, unit: '%', color: '#C47B6B', hint: `R0 ≈ ${R0.toFixed(1)}` },
              { label: 'Recovery Time', val: recovery, set: handleRecovery, min: 3, max: 30, unit: 'days', color: '#6A9B7A', hint: 'Days until infected recover' },
              { label: 'Mortality Rate', val: mortality, set: handleMortality, min: 0, max: 20, unit: '%', color: '#6b7280', hint: `~${Math.round(N * mortality / 100)} expected deaths` },
              { label: 'Initial Vaccination', val: vaccPct, set: setVaccPct, unit: '%', color: '#8B7BB5', hint: `${Math.round(N * vaccPct / 100)} vaccinated at start` },
            ].map(ctrl => (
              <div key={ctrl.label} className="mb-4">
                <div className="flex justify-between mb-1">
                  <div className="sim-label mb-0">{ctrl.label}</div>
                  <span className="font-mono text-sm font-bold" style={{ color: ctrl.color }}>{ctrl.val}{ctrl.unit}</span>
                </div>
                <input type="range"
                  min={'min' in ctrl ? ctrl.min : 0} max={'max' in ctrl ? ctrl.max : 100}
                  value={ctrl.val} onChange={e => ctrl.set(Number(e.target.value))}
                  disabled={started}
                  className="w-full" style={{ accentColor: ctrl.color }}/>
                <p className="text-xs text-muted-foreground">{ctrl.hint}</p>
              </div>
            ))}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
              {!started ? (
                <button onClick={startEpidemic}
                  data-testid="button-start-epidemic"
                  className="col-span-2 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
                  style={{ background: '#dc2626' }}>
                  Start Epidemic
                </button>
              ) : (
                <>
                  <button onClick={pauseResume}
                    data-testid="button-pause-resume"
                    className="py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
                    style={{ background: running ? '#B89555' : '#6A9B7A', color: '#1A2A35' }}>
                    {running ? 'Pause' : 'Resume'}
                  </button>
                  <button onClick={resetSim}
                    data-testid="button-reset"
                    className="py-2.5 rounded-xl font-bold text-sm border border-border hover:bg-muted transition-all">
                    Reset
                  </button>
                  <button onClick={vaccinateNow}
                    data-testid="button-vaccinate"
                    className="col-span-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 text-white"
                    style={{ background: '#8B7BB5' }}>
                    <Syringe size={14} className="inline mr-1" />
                    Vaccinate 20% Now
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Speed Control */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
              <Zap size={14} /> Simulation Speed
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[0.5, 1, 2, 5].map(s => (
                <button
                  key={s}
                  onClick={() => setSpeed(s as 0.5 | 1 | 2 | 5)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    speed === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* SEIR Toggle */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
              <Activity size={14} /> SEIR Model
            </h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">Enable SEIR (Exposed state)</span>
              <button
                onClick={() => setUseSEIR(v => !v)}
                disabled={started}
                className={`relative w-10 h-5 rounded-full transition-all ${useSEIR ? 'bg-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${useSEIR ? 'left-5.5' : 'left-0.5'}`}
                  style={{ left: useSEIR ? '22px' : '2px' }} />
              </button>
            </div>
            {useSEIR && (
              <div>
                <div className="flex justify-between mb-1">
                  <div className="sim-label mb-0">Incubation Days</div>
                  <span className="font-mono text-sm font-bold" style={{ color: '#B89555' }}>{incubationDays}d</span>
                </div>
                <input type="range" min={1} max={10} value={incubationDays}
                  onChange={e => setIncubationDays(Number(e.target.value))}
                  disabled={started}
                  className="w-full" style={{ accentColor: '#B89555' }} />
              </div>
            )}
          </div>

          {/* Lockdown */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
              {lockdownActive ? <Lock size={14} /> : <Unlock size={14} />} Lockdown
            </h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">{lockdownActive ? 'Lockdown Active' : 'Lockdown Off'}</span>
              <button
                onClick={() => setLockdownActive(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-all ${lockdownActive ? 'bg-red-500' : 'bg-muted'}`}
              >
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                  style={{ left: lockdownActive ? '22px' : '2px' }} />
              </button>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <div className="sim-label mb-0">Transmission Reduction</div>
                <span className="font-mono text-sm font-bold" style={{ color: '#C47B6B' }}>{lockdownReduction}%</span>
              </div>
              <input type="range" min={0} max={80} value={lockdownReduction}
                onChange={e => setLockdownReduction(Number(e.target.value))}
                className="w-full" style={{ accentColor: '#C47B6B' }} />
            </div>
          </div>

          {/* Auto-Vaccination */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
              <Shield size={14} /> Auto-Vaccination
            </h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm">Auto-Vaccinate</span>
              <button
                onClick={() => setAutoVaccinate(v => !v)}
                className={`relative w-10 h-5 rounded-full transition-all ${autoVaccinate ? 'bg-purple-500' : 'bg-muted'}`}
              >
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                  style={{ left: autoVaccinate ? '22px' : '2px' }} />
              </button>
            </div>
            {autoVaccinate && (
              <>
                <div className="mb-3">
                  <div className="flex justify-between mb-1">
                    <div className="sim-label mb-0">Rate (% per day)</div>
                    <span className="font-mono text-sm font-bold" style={{ color: '#8B7BB5' }}>{vaccRate}%</span>
                  </div>
                  <input type="range" min={0} max={5} step={0.5} value={vaccRate}
                    onChange={e => setVaccRate(Number(e.target.value))}
                    className="w-full" style={{ accentColor: '#8B7BB5' }} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="sim-label mb-0">Efficacy</div>
                    <span className="font-mono text-sm font-bold" style={{ color: '#6A9B7A' }}>{vaccEfficacy}%</span>
                  </div>
                  <input type="range" min={50} max={100} value={vaccEfficacy}
                    onChange={e => setVaccEfficacy(Number(e.target.value))}
                    className="w-full" style={{ accentColor: '#6A9B7A' }} />
                </div>
              </>
            )}
          </div>

          {/* Counters */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Population Counts</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {chartStates.map(state => {
                const color = STATE_COLORS[state];
                return (
                  <div key={state} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: color + '22' }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: color }}/>
                    <div>
                      <div className="text-xs text-muted-foreground">{STATE_LABELS[state]}</div>
                      <div className="text-sm font-bold font-mono" style={{ color }}>{counts[state]}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-muted-foreground text-center">
              Day {tick} | {running ? 'Spreading...' : started ? 'Paused' : 'Not started'}
              {lockdownActive && started && <span className="ml-1 text-red-400">| Lockdown</span>}
            </div>
          </div>
        </div>

        {/* Grid + Graphs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Population grid */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>
              Population Grid ({COLS} x {ROWS} = {N} people)
              {lockdownActive && started && <span className="ml-2 text-red-400 text-xs">🔒 Lockdown Active</span>}
            </h3>
            <div className="flex justify-center">
              <canvas
                ref={el => {
                  if (!el) return;
                  const ctx = el.getContext('2d');
                  if (!ctx) return;
                  const DOT = 8;
                  const GAP = 1;
                  const CELL = DOT + GAP;
                  el.width = COLS * CELL;
                  el.height = ROWS * CELL;
                  ctx.clearRect(0, 0, el.width, el.height);
                  for (let i = 0; i < N; i++) {
                    const col = i % COLS;
                    const row = Math.floor(i / COLS);
                    ctx.fillStyle = STATE_COLORS[grid[i]];
                    ctx.beginPath();
                    ctx.arc(col * CELL + DOT / 2, row * CELL + DOT / 2, DOT / 2 - 0.5, 0, Math.PI * 2);
                    ctx.fill();
                  }
                }}
                style={{ width: '100%', maxWidth: `${COLS * 9}px`, imageRendering: 'pixelated', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {chartStates.map(s => (
                <div key={s} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ background: STATE_COLORS[s] }}/>
                  <span className="text-muted-foreground">{STATE_LABELS[s]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Re(t) and Peak Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* R_e(t) card */}
            <div className="sim-panel">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                <TrendingUp size={14} /> Effective Reproduction
              </h3>
              <div className="text-center">
                <div className="text-3xl font-bold font-mono" style={{ color: Re > 1 ? '#C47B6B' : '#6A9B7A' }}>
                  Rₑ = {Re.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  R₀ = {R0.toFixed(2)} | S/N = {(counts.S / N * 100).toFixed(1)}%
                </div>
                {R0 > 1 && (
                  <div className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: '#C47B6B22', color: '#C47B6B' }}>
                    Herd Immunity Threshold: {herdThreshold.toFixed(1)}%
                  </div>
                )}
                {Re > 1 ? (
                  <div className="mt-2 text-xs text-red-400 font-bold">Epidemic Growing</div>
                ) : (
                  <div className="mt-2 text-xs text-green-400 font-bold">Epidemic Shrinking</div>
                )}
              </div>
            </div>

            {/* Peak Stats */}
            <div className="sim-panel">
              <h3 className="font-bold text-sm mb-2 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
                <BarChart3 size={14} /> Peak Statistics
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Peak Infected</span>
                  <span className="font-mono text-sm font-bold" style={{ color: '#C47B6B' }}>{peakInfected}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Peak Day</span>
                  <span className="font-mono text-sm font-bold" style={{ color: '#B89555' }}>Day {peakDay}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total Infected</span>
                  <span className="font-mono text-sm font-bold" style={{ color: '#B89555' }}>{totalInfected}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total Dead</span>
                  <span className="font-mono text-sm font-bold" style={{ color: '#6b7280' }}>{totalDead}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIR curve */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>SEIR Curve</h3>
            {sirData.length < 2 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">
                Start the epidemic to see the curve
              </div>
            ) : (
              <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H + 30}`} className="w-full">
                {[0, N/4, N/2, 3*N/4, N].map(v => {
                  const y = 10 + (1 - v / N) * GRAPH_H;
                  return (
                    <g key={v}>
                      <line x1="35" y1={y} x2={GRAPH_W - 10} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5"/>
                      <text x="32" y={y + 3} textAnchor="end" fontSize="7" fill="hsl(var(--muted-foreground))">{Math.round(v)}</text>
                    </g>
                  );
                })}
                <line x1="35" y1="10" x2="35" y2={GRAPH_H + 10} stroke="hsl(var(--border))" strokeWidth="1.5"/>

                {chartStates.map(state => {
                  const color = STATE_COLORS[state];
                  const pathD = sirData.map((pt, i) => {
                    const x = 35 + (i / (sirData.length - 1)) * (GRAPH_W - 45);
                    const y = 10 + (1 - pt[state] / N) * GRAPH_H;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ');
                  return <path key={state} d={pathD} stroke={color} strokeWidth="1.8" fill="none"/>;
                })}

                {chartStates.map((s, i) => (
                  <g key={s} transform={`translate(${40 + i * 52}, ${GRAPH_H + 18})`}>
                    <line x1="0" y1="5" x2="12" y2="5" stroke={STATE_COLORS[s]} strokeWidth="2"/>
                    <text x="16" y="8" fontSize="8" fill="hsl(var(--foreground))">{s}</text>
                  </g>
                ))}
              </svg>
            )}
          </div>

          {/* New Cases Chart */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2" style={{ fontFamily: 'Space Grotesk' }}>
              <Activity size={14} /> New Cases Per Day
            </h3>
            {sirData.length < 2 ? (
              <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">
                Start the epidemic to see new cases
              </div>
            ) : (
              <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H + 30}`} className="w-full">
                {(() => {
                  const newCases: number[] = [];
                  for (let i = 1; i < sirData.length; i++) {
                    const prevR = sirData[i - 1].R + sirData[i - 1].D;
                    const currR = sirData[i].R + sirData[i].D;
                    newCases.push(Math.max(0, currR - prevR));
                  }
                  const maxNew = Math.max(1, ...newCases);
                  return (
                    <>
                      {[0, maxNew / 4, maxNew / 2, (3 * maxNew) / 4, maxNew].map((v, idx) => {
                        const y = 10 + (1 - v / maxNew) * GRAPH_H;
                        return (
                          <g key={idx}>
                            <line x1="35" y1={y} x2={GRAPH_W - 10} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5"/>
                            <text x="32" y={y + 3} textAnchor="end" fontSize="7" fill="hsl(var(--muted-foreground))">{Math.round(v)}</text>
                          </g>
                        );
                      })}
                      <line x1="35" y1="10" x2="35" y2={GRAPH_H + 10} stroke="hsl(var(--border))" strokeWidth="1.5"/>
                      {newCases.map((v, i) => {
                        const x1 = 35 + (i / (newCases.length - 1)) * (GRAPH_W - 45);
                        const x2 = 35 + ((i + 1) / (newCases.length - 1)) * (GRAPH_W - 45);
                        const y1 = 10 + (1 - v / maxNew) * GRAPH_H;
                        const y2 = 10 + (1 - (newCases[i + 1] ?? 0) / maxNew) * GRAPH_H;
                        if (i < newCases.length - 1) {
                          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#B89555" strokeWidth="1.8"/>;
                        }
                        return null;
                      })}
                      {newCases.map((v, i) => {
                        const x = 35 + (i / (newCases.length - 1)) * (GRAPH_W - 45);
                        const y = 10 + (1 - v / maxNew) * GRAPH_H;
                        return <circle key={i} cx={x} cy={y} r="1.5" fill="#B89555"/>;
                      })}
                      <g transform={`translate(${40}, ${GRAPH_H + 18})`}>
                        <line x1="0" y1="5" x2="12" y2="5" stroke="#B89555" strokeWidth="2"/>
                        <text x="16" y="8" fontSize="8" fill="hsl(var(--foreground))">New Cases</text>
                      </g>
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
