import { useState, useRef, useEffect, useCallback } from 'react';
import { useLabControls } from './labControls';
import {
  Calculator,
  Download,
  Clock,
  Beaker,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  RotateCcw,
  Target,
  Activity,
  FlaskConical,
} from 'lucide-react';

interface Solution {
  id: string;
  label: string;
  color: string;
  displayColor: string;
  absorbance: (wl: number) => number;
}

const SOLUTIONS: Solution[] = [
  {
    id: 'blank',
    label: 'Water Blank',
    color: 'rgba(200,230,255,0.3)',
    displayColor: '#e0f2fe',
    absorbance: () => 0.001,
  },
  {
    id: 'copper',
    label: 'Copper Sulfate (Blue)',
    color: '#5B7FA5',
    displayColor: '#93c5fd',
    absorbance: (wl) => {
      const peak1 = Math.exp(-((wl - 625) ** 2) / (2 * 45 ** 2)) * 1.4;
      return Math.max(0.01, peak1);
    },
  },
  {
    id: 'red',
    label: 'Red Food Dye',
    color: '#C47B6B',
    displayColor: '#fca5a5',
    absorbance: (wl) => {
      const peak = Math.exp(-((wl - 505) ** 2) / (2 * 35 ** 2)) * 1.8;
      return Math.max(0.01, peak);
    },
  },
  {
    id: 'chlorophyll',
    label: 'Chlorophyll Extract',
    color: '#6A9B7A',
    displayColor: '#A8D5B6',
    absorbance: (wl) => {
      const peak1 = Math.exp(-((wl - 430) ** 2) / (2 * 25 ** 2)) * 1.6;
      const peak2 = Math.exp(-((wl - 680) ** 2) / (2 * 20 ** 2)) * 1.2;
      return Math.max(0.01, peak1 + peak2);
    },
  },
];

type CuvetteType = 'glass' | 'plastic' | 'quartz';

const CUVETTE_OFFSET: Record<CuvetteType, number> = {
  glass: 0.015,
  plastic: 0.008,
  quartz: 0.0,
};

interface ReadingRecord {
  id: number;
  wavelength: number;
  absorbance: number;
  transmittance: number;
  timestamp: string;
}

function wavelengthToColor(wl: number): string {
  let r = 0, g = 0, b = 0;
  if (wl >= 380 && wl < 440) { r = -(wl - 440) / 60; g = 0; b = 1; }
  else if (wl >= 440 && wl < 490) { r = 0; g = (wl - 440) / 50; b = 1; }
  else if (wl >= 490 && wl < 510) { r = 0; g = 1; b = -(wl - 510) / 20; }
  else if (wl >= 510 && wl < 580) { r = (wl - 510) / 70; g = 1; b = 0; }
  else if (wl >= 580 && wl < 645) { r = 1; g = -(wl - 645) / 65; b = 0; }
  else if (wl >= 645 && wl <= 700) { r = 1; g = 0; b = 0; }
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}

interface ScanPoint { wl: number; abs: number; }

export default function Spectrophotometer() {
  const [wavelength, setWavelength] = useState(540);
  const [solution, setSolution] = useState<string>('copper');
  const [scanData, setScanData] = useState<ScanPoint[]>([]);
  const [scanning, setScanning] = useState(false);

  const [cuvetteType, setCuvetteType] = useState<CuvetteType>('glass');

  const [calibrated, setCalibrated] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [blankSolution, setBlankSolution] = useState('blank');
  const [calibratedAt, setCalibratedAt] = useState<number | null>(null);

  const [standardMode, setStandardMode] = useState(false);
  const [standardConcs, setStandardConcs] = useState<number[]>([0, 0.25, 0.5, 0.75, 1.0]);
  const [unknownAbs, setUnknownAbs] = useState('');
  const [useStandardWl, setUseStandardWl] = useState(625);

  const [dilutionMode, setDilutionMode] = useState(false);
  const [dilutionStep, setDilutionStep] = useState(0);

  const [kineticsMode, setKineticsMode] = useState(false);
  const [kineticsRunning, setKineticsRunning] = useState(false);
  const [kineticsData, setKineticsData] = useState<{ t: number; abs: number }[]>([]);
  const kineticsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const kineticsStartRef = useRef<number>(0);
  const [kineticsTemp, setKineticsTemp] = useState(25);

  const [readings, setReadings] = useState<ReadingRecord[]>([]);
  const readingIdRef = useRef(1);

  const sol = SOLUTIONS.find(s => s.id === solution)!;
  const rawAbs = sol.absorbance(wavelength);
  const cuvetteOffset = CUVETTE_OFFSET[cuvetteType];
  const adjustedRawAbs = rawAbs + (calibrated ? 0 : cuvetteOffset);
  const effectiveAbs = calibrated ? rawAbs : adjustedRawAbs;
  const transmission = Math.max(0.1, Math.min(100, Math.pow(10, 2 - effectiveAbs) * 1));
  const absorbance = Math.max(0, 2 - Math.log10(transmission));
  const wlColor = wavelengthToColor(wavelength);

  const scan = () => {
    setScanning(true);
    const points: ScanPoint[] = [];
    for (let wl = 380; wl <= 700; wl += 10) {
      const rawA = sol.absorbance(wl);
      const T = Math.max(0.1, Math.min(100, Math.pow(10, 2 - rawA)));
      const A = Math.max(0, 2 - Math.log10(T));
      points.push({ wl, abs: A });
    }
    setScanData(points);
    setTimeout(() => setScanning(false), 800);
  };

  const doCalibrate = () => {
    setCalibrating(true);
    setTimeout(() => {
      setCalibrating(false);
      setCalibrated(true);
      setCalibratedAt(wavelength);
    }, 1000);
  };

  const doRecalibrate = () => {
    setCalibrated(false);
    setCalibratedAt(null);
  };

  const showDisplay = calibrated;

  const PLOT_W = 420, PLOT_H = 180;
  const maxAbs = Math.max(2, ...scanData.map(p => p.abs));

  const exportCSV = () => {
    if (scanData.length === 0) return;
    const header = 'Wavelength (nm),Absorbance,Transmittance (%)\n';
    const rows = scanData.map(p => {
      const T = Math.max(0.1, Math.min(100, Math.pow(10, 2 - p.abs)));
      return `${p.wl},${p.abs.toFixed(4)},${T.toFixed(2)}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `spectrum_${sol.label.replace(/\s+/g, '_')}_${wavelength}nm.csv`;
    a.click();
  };

  const addReading = () => {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setReadings(prev => [
      ...prev,
      {
        id: readingIdRef.current++,
        wavelength,
        absorbance,
        transmittance: transmission,
        timestamp: ts,
      },
    ]);
  };

  const clearReadings = () => {
    setReadings([]);
    readingIdRef.current = 1;
  };

  // Standard curve calculations
  const standardAbsorbances = standardConcs.map(c => {
    return sol.absorbance(useStandardWl) * c;
  });

  const linearRegression = (xs: number[], ys: number[]) => {
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, b, i) => a + b * ys[i], 0);
    const sumX2 = xs.reduce((a, b) => a + b * b, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const yMean = sumY / n;
    const ssTot = ys.reduce((a, b) => a + (b - yMean) ** 2, 0);
    const ssRes = ys.reduce((a, b, i) => a + (b - (slope * xs[i] + intercept)) ** 2, 0);
    const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
    return { slope, intercept, r2 };
  };

  const { slope: regSlope, intercept: regIntercept, r2 } = linearRegression(standardConcs, standardAbsorbances);
  const unknownConcVal = parseFloat(unknownAbs);
  const unknownConcentration = (!isNaN(unknownConcVal) && regSlope > 0)
    ? (unknownConcVal - regIntercept) / regSlope
    : null;

  // Dilution series
  const stockConc = 1.0;
  const dilutionTubes = Array.from({ length: 6 }, (_, i) => ({
    tube: i + 1,
    concentration: stockConc / Math.pow(2, i),
    volume: 5,
  }));

  // Dilution chart data
  const dilutionScanData: ScanPoint[] = dilutionMode
    ? dilutionTubes.map(dt => ({
        wl: dt.tube,
        abs: sol.absorbance(wavelength) * dt.concentration,
      }))
    : [];

  // Kinetics
  const startKinetics = useCallback(() => {
    setKineticsRunning(true);
    setKineticsData([]);
    kineticsStartRef.current = Date.now();
    kineticsRef.current = setInterval(() => {
      const elapsed = (Date.now() - kineticsStartRef.current) / 1000;
      const tempFactor = Math.pow(1.05, (kineticsTemp - 25) / 10);
      const baseAbs = sol.absorbance(wavelength) * (1 - Math.exp(-0.1 * tempFactor * elapsed));
      setKineticsData(prev => [...prev, { t: parseFloat(elapsed.toFixed(1)), abs: parseFloat(baseAbs.toFixed(4)) }]);
    }, 200);
  }, [sol, wavelength, kineticsTemp]);

  const stopKinetics = useCallback(() => {
    setKineticsRunning(false);
    if (kineticsRef.current) {
      clearInterval(kineticsRef.current);
      kineticsRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (kineticsRef.current) clearInterval(kineticsRef.current);
    };
  }, []);

  useLabControls(
    {
      canRun: true,
      running: kineticsRunning,
      dataset: {
        name: "Spectrophotometer Readings",
        columns: [
          { key: "timestamp", label: "Time" },
          { key: "wavelength", label: "Wavelength (nm)" },
          { key: "absorbance", label: "Absorbance" },
          { key: "transmittance", label: "Transmittance (%)" },
        ],
        rows: readings,
      },
    },
    {
      onToggleRun: kineticsRunning ? stopKinetics : startKinetics,
    },
  );

  const kineticsSlope = (() => {
    if (kineticsData.length < 2) return 0;
    const xs = kineticsData.map(d => d.t);
    const ys = kineticsData.map(d => d.abs);
    const n = xs.length;
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, b, i) => a + b * ys[i], 0);
    const sumX2 = xs.reduce((a, b) => a + b * b, 0);
    const denom = n * sumX2 - sumX * sumX;
    return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  })();

  const KINETICS_W = 380, KINETICS_H = 160;
  const kMaxT = kineticsData.length > 0 ? Math.max(10, ...kineticsData.map(d => d.t)) : 10;
  const kMaxAbs = kineticsData.length > 0 ? Math.max(0.5, ...kineticsData.map(d => d.abs)) : 0.5;

  // Standard curve chart
  const STD_W = 300, STD_H = 200;
  const stdMaxConc = 1.2;
  const stdMaxAbs = Math.max(0.5, ...standardAbsorbances.map(a => a * 1.2));

  return (
    <div className="sim-container">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Machine & Controls */}
        <div className="space-y-4">
          {/* SVG Spectrophotometer */}
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'Space Grotesk' }}>Spectrophotometer</h3>
            <div className="flex justify-center">
              <svg viewBox="0 0 320 180" className="w-full max-w-sm">
                <rect x="10" y="30" width="300" height="130" rx="12" fill="#1A3550" stroke="#2a5a8c" strokeWidth="2"/>
                <rect x="10" y="30" width="300" height="30" rx="12" fill="#1A2A35"/>
                <rect x="10" y="47" width="300" height="13" fill="#1A2A35"/>
                <text x="30" y="52" fill="#7eb8d4" fontSize="10" fontWeight="bold" fontFamily="Space Mono">SPECTRO-200</text>
                <circle cx="260" cy="20" r="6" fill={wlColor} opacity="0.9"/>
                <text x="260" y="10" textAnchor="middle" fontSize="7" fill="#7eb8d4">{wavelength}nm</text>
                <rect x="40" y="75" width="20" height="30" rx="4" fill="#1A2A35" stroke="#3a7ac8" strokeWidth="1.5"/>
                <text x="50" y="108" textAnchor="middle" fontSize="7" fill="#7eb8d4">Lamp</text>
                <rect x="62" y="86" width="40" height="8" rx="2" fill={wlColor} opacity="0.6"/>
                <rect x="103" y="72" width="30" height="36" rx="4" fill="#1A2A35" stroke="#3a7ac8" strokeWidth="1.5"/>
                <text x="118" y="107" textAnchor="middle" fontSize="6" fill="#7eb8d4">Mono</text>
                <text x="118" y="115" textAnchor="middle" fontSize="6" fill="#7eb8d4">chrom</text>
                <rect x="134" y="86" width="30" height="8" rx="2" fill={wlColor} opacity="0.8"/>
                <rect x="165" y="68" width="34" height="44" rx="4" fill="#1A2A35" stroke="#f5a623" strokeWidth="2"/>
                <text x="182" y="118" textAnchor="middle" fontSize="6" fill="#f5a623">Cuvette</text>
                <rect x="172" y="74" width="20" height="32" rx="2"
                  fill={solution === 'blank' ? 'rgba(200,240,255,0.3)' : sol.color} opacity="0.7" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
                <rect x="200" y="86" width="30" height="8" rx="2" fill={wlColor} opacity={0.8 - absorbance * 0.35}/>
                <rect x="231" y="72" width="30" height="36" rx="4" fill="#1A2A35" stroke="#3a7ac8" strokeWidth="1.5"/>
                <text x="246" y="108" textAnchor="middle" fontSize="7" fill="#7eb8d4">Detector</text>
                <rect x="35" y="140" width="250" height="12" rx="4" fill="#001010" stroke="#3a7ac8" strokeWidth="1"/>
                <text x="50" y="149" fontSize="8" fill="#0d9" fontFamily="Space Mono">
                  {showDisplay
                    ? `T: ${transmission.toFixed(1)}%  |  A: ${absorbance.toFixed(3)}`
                    : `#####  UNCALIBRATED`
                  }
                </text>
              </svg>
            </div>
          </div>

          {/* Blank Calibration */}
          <div className="sim-panel">
            <div className="sim-label flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> Blank Calibration
            </div>
            <div className="flex flex-wrap items-end gap-3 mb-3">
              <div className="flex-1 min-w-[140px]">
                <label className="text-xs text-muted-foreground mb-1 block">Blank Solution</label>
                <select value={blankSolution} onChange={e => setBlankSolution(e.target.value)}
                  className="w-full p-2 rounded-lg border border-border bg-background text-sm">
                  <option value="blank">Water Blank</option>
                  <option value="air">Air (No Sample)</option>
                </select>
              </div>
              {!calibrated && !calibrating ? (
                <button onClick={doCalibrate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all hover:scale-105 active:scale-95"
                  style={{ background: '#1A3550' }}>
                  <Target className="w-3.5 h-3.5" /> Auto-Zero (Blank)
                </button>
              ) : calibrating ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: '#B8955522', color: '#B89555' }}>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" /> Calibrating...
                </div>
              ) : (
                <button onClick={doRecalibrate}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-all">
                  <RotateCcw className="w-3.5 h-3.5" /> Recalibrate
                </button>
              )}
            </div>
            {calibrated && !calibrating && (
              <div className="flex items-center gap-2 p-2 rounded-lg text-xs"
                style={{ background: '#6A9B7A15', color: '#6A9B7A' }}>
                <CheckCircle className="w-3.5 h-3.5" /> Calibrated at {calibratedAt}nm
              </div>
            )}
            {!calibrated && !calibrating && (
              <div className="flex items-center gap-2 p-2 rounded-lg text-xs"
                style={{ background: '#C47B6B15', color: '#C47B6B' }}>
                <AlertTriangle className="w-3.5 h-3.5" /> Display shows "#####" — calibrate before measuring
              </div>
            )}
          </div>

          {/* Cuvette Selection */}
          <div className="sim-panel">
            <div className="sim-label flex items-center gap-1.5">
              <Beaker className="w-3.5 h-3.5" /> Cuvette Selection
            </div>
            <div className="flex gap-2">
              {(['glass', 'plastic', 'quartz'] as CuvetteType[]).map(ct => (
                <button key={ct}
                  onClick={() => setCuvetteType(ct)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    cuvetteType === ct ? 'border-2 border-foreground bg-muted' : 'border-border opacity-70 hover:opacity-90'
                  }`}>
                  {ct.charAt(0).toUpperCase() + ct.slice(1)}
                </button>
              ))}
            </div>
            {wavelength < 350 && cuvetteType !== 'quartz' && (
              <div className="mt-2 flex items-center gap-2 p-2 rounded-lg text-xs"
                style={{ background: '#B8955518', color: '#B89555' }}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Glass/plastic absorbs UV light — use quartz cuvette below 350nm
              </div>
            )}
            <div className="mt-2 text-xs text-muted-foreground">
              Baseline offset: {CUVETTE_OFFSET[cuvetteType].toFixed(3)} AU ({cuvetteType})
            </div>
          </div>

          {/* Solution selector */}
          <div className="sim-panel">
            <div className="sim-label">Select Solution</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOLUTIONS.map(s => (
                <button key={s.id}
                  data-testid={`button-solution-${s.id}`}
                  onClick={() => { setSolution(s.id); setScanData([]); }}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${solution === s.id ? 'border-2' : 'border-border opacity-70 hover:opacity-90'}`}
                  style={solution === s.id ? { borderColor: s.color === 'rgba(200,230,255,0.3)' ? '#94a3b8' : s.color, background: (s.color === 'rgba(200,230,255,0.3)' ? '#94a3b8' : s.color) + '22' } : {}}>
                  <div className="w-5 h-5 rounded-full border border-white/20" style={{ background: s.displayColor }}/>
                  <span className="text-xs leading-tight">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Wavelength */}
          <div className="sim-panel">
            <div className="flex justify-between items-center mb-1">
              <div className="sim-label mb-0">Wavelength</div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ background: wlColor }}/>
                <span className="font-mono text-base font-bold">{wavelength} nm</span>
              </div>
            </div>
            <div className="w-full h-5 rounded-lg mb-2 overflow-hidden" style={{
              background: 'linear-gradient(to right, #6600aa, #0000ff, #00aaff, #00ff00, #ffff00, #ff6600, #ff0000)'
            }}>
              <div className="relative w-full h-full">
                <div className="absolute top-0 bottom-0 w-1 bg-white opacity-70 rounded-full" style={{
                  left: `${((wavelength - 380) / 320) * 100}%`,
                  transform: 'translateX(-50%)'
                }}/>
              </div>
            </div>
            <input type="range" min="380" max="700" value={wavelength}
              data-testid="slider-wavelength"
              onChange={e => { setWavelength(Number(e.target.value)); setScanData([]); }}
              className="w-full" style={{ accentColor: wlColor }}/>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>380nm (UV)</span><span>540nm</span><span>700nm (IR)</span>
            </div>
          </div>
        </div>

        {/* Readings & Spectrum */}
        <div className="space-y-4">
          {/* Meters */}
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'Space Grotesk' }}>Measurements at {wavelength}nm</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                <div className="text-xs text-muted-foreground mb-1">%Transmittance</div>
                <div className="text-3xl font-extrabold font-mono" style={{ color: '#5B7FA5', fontFamily: 'Space Mono' }}>
                  {showDisplay ? (
                    <>{transmission.toFixed(1)}<span className="text-sm ml-0.5">%</span></>
                  ) : '#####'}
                </div>
                <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${showDisplay ? transmission : 0}%`, background: '#5B7FA5' }}/>
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'hsl(var(--muted))' }}>
                <div className="text-xs text-muted-foreground mb-1">Absorbance (A)</div>
                <div className="text-3xl font-extrabold font-mono" style={{ color: '#C47B6B', fontFamily: 'Space Mono' }}>
                  {showDisplay ? absorbance.toFixed(3) : '#####'}
                </div>
                <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${showDisplay ? Math.min(100, absorbance * 50) : 0}%`, background: '#C47B6B' }}/>
                </div>
              </div>
            </div>
            <div className="mt-3 p-2.5 rounded-lg bg-muted text-xs text-muted-foreground">
              <span className="font-mono text-foreground">A = 2 - log₁₀(%T)</span> = 2 - log₁₀({showDisplay ? transmission.toFixed(1) : '---'}) = {showDisplay ? absorbance.toFixed(3) : '---'}
            </div>
          </div>

          {/* Add Reading Button */}
          <div className="sim-panel">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Saved Readings</h3>
              <div className="flex gap-2">
                <button onClick={addReading} disabled={!showDisplay}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted disabled:opacity-40 transition-all">
                  <Plus className="w-3 h-3" /> Add Reading
                </button>
                {readings.length > 0 && (
                  <button onClick={clearReadings}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-all">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
            {readings.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-2">No readings saved yet. Click "Add Reading" to record.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1 px-2 font-semibold text-muted-foreground">#</th>
                      <th className="text-left py-1 px-2 font-semibold text-muted-foreground">λ (nm)</th>
                      <th className="text-left py-1 px-2 font-semibold text-muted-foreground">Abs</th>
                      <th className="text-left py-1 px-2 font-semibold text-muted-foreground">%T</th>
                      <th className="text-left py-1 px-2 font-semibold text-muted-foreground">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((r, i) => (
                      <tr key={r.id} className="border-b border-border/50">
                        <td className="py-1 px-2 font-mono">{i + 1}</td>
                        <td className="py-1 px-2 font-mono">{r.wavelength}</td>
                        <td className="py-1 px-2 font-mono">{r.absorbance.toFixed(3)}</td>
                        <td className="py-1 px-2 font-mono">{r.transmittance.toFixed(1)}%</td>
                        <td className="py-1 px-2 font-mono text-muted-foreground">{r.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Mode Toggles */}
          <div className="sim-panel">
            <div className="sim-label flex items-center gap-1.5 mb-2">Advanced Modes</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setStandardMode(!standardMode); if (!standardMode) { setDilutionMode(false); setKineticsMode(false); stopKinetics(); } }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  standardMode ? 'border-2 border-foreground bg-muted' : 'border-border opacity-70 hover:opacity-90'
                }`}>
                <Calculator className="w-3.5 h-3.5" /> Standard Curve
              </button>
              <button onClick={() => { setDilutionMode(!dilutionMode); if (!dilutionMode) { setStandardMode(false); setKineticsMode(false); stopKinetics(); } }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  dilutionMode ? 'border-2 border-foreground bg-muted' : 'border-border opacity-70 hover:opacity-90'
                }`}>
                <FlaskConical className="w-3.5 h-3.5" /> Dilution Series
              </button>
              <button onClick={() => { setKineticsMode(!kineticsMode); if (!kineticsMode) { setStandardMode(false); setDilutionMode(false); } }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  kineticsMode ? 'border-2 border-foreground bg-muted' : 'border-border opacity-70 hover:opacity-90'
                }`}>
                <Activity className="w-3.5 h-3.5" /> Kinetics
              </button>
            </div>
          </div>

          {/* Standard Curve Mode */}
          {standardMode && (
            <div className="sim-panel">
              <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                <span className="flex items-center gap-2"><Calculator className="w-4 h-4" /> Standard Curve</span>
              </h3>
              <div className="mb-3">
                <label className="text-xs text-muted-foreground mb-1 block">Measurement Wavelength (nm)</label>
                <input type="number" value={useStandardWl} min={380} max={700}
                  onChange={e => setUseStandardWl(Number(e.target.value))}
                  className="w-24 p-1.5 rounded-lg border border-border bg-background text-sm font-mono" />
              </div>

              <div className="text-xs text-muted-foreground mb-2">Copper Sulfate Standards (mM)</div>
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1 px-2 font-semibold text-muted-foreground">Conc (mM)</th>
                      <th className="text-left py-1 px-2 font-semibold text-muted-foreground">Absorbance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standardConcs.map((c, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1 px-2 font-mono">
                          <input type="number" step={0.25} min={0} max={5} value={c}
                            onChange={e => {
                              const newConcs = [...standardConcs];
                              newConcs[i] = Number(e.target.value);
                              setStandardConcs(newConcs);
                            }}
                            className="w-16 p-1 rounded border border-border bg-background text-xs font-mono" />
                        </td>
                        <td className="py-1 px-2 font-mono" style={{ color: '#5B7FA5' }}>
                          {standardAbsorbances[i].toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Standard curve chart */}
              <svg viewBox={`0 0 ${STD_W} ${STD_H + 30}`} className="w-full mb-3">
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1.0].map(a => {
                  const y = STD_H - (a / stdMaxAbs) * (STD_H - 20);
                  return (
                    <g key={a}>
                      <line x1="40" y1={y} x2={STD_W - 10} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5"/>
                      <text x="36" y={y + 3} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">{a.toFixed(2)}</text>
                    </g>
                  );
                })}
                <line x1="40" y1="10" x2="40" y2={STD_H} stroke="hsl(var(--border))" strokeWidth="1.5"/>
                <line x1="40" y1={STD_H} x2={STD_W - 10} y2={STD_H} stroke="hsl(var(--border))" strokeWidth="1.5"/>

                {/* Regression line */}
                {regSlope > 0 && (
                  <line
                    x1={40}
                    y1={STD_H - (regIntercept / stdMaxAbs) * (STD_H - 20)}
                    x2={40 + (stdMaxConc / stdMaxConc) * (STD_W - 50)}
                    y2={STD_H - ((regSlope * stdMaxConc + regIntercept) / stdMaxAbs) * (STD_H - 20)}
                    stroke="#C47B6B" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.7"
                  />
                )}

                {/* Data points */}
                {standardConcs.map((c, i) => {
                  const x = 40 + (c / stdMaxConc) * (STD_W - 50);
                  const y = STD_H - (standardAbsorbances[i] / stdMaxAbs) * (STD_H - 20);
                  return (
                    <circle key={i} cx={x} cy={y} r="4" fill="#5B7FA5" stroke="white" strokeWidth="1.5"/>
                  );
                })}

                {/* Unknown sample marker */}
                {!isNaN(unknownConcVal) && unknownConcentration !== null && unknownConcentration >= 0 && (
                  <>
                    <line x1={40 + ((unknownConcVal) / stdMaxAbs) * (STD_W - 50) / (stdMaxAbs / stdMaxConc)}
                      y1={STD_H - (unknownConcVal / stdMaxAbs) * (STD_H - 20)}
                      x2={40}
                      y2={STD_H - (unknownConcVal / stdMaxAbs) * (STD_H - 20)}
                      stroke="#B89555" strokeWidth="1" strokeDasharray="3,2" opacity="0.7"/>
                    <circle cx={40 + ((unknownConcentration) / stdMaxConc) * (STD_W - 50)}
                      cy={STD_H - (unknownConcVal / stdMaxAbs) * (STD_H - 20)}
                      r="5" fill="#B89555" stroke="white" strokeWidth="1.5"/>
                  </>
                )}

                {/* Axis labels */}
                {[0, 0.25, 0.5, 0.75, 1.0].map(c => (
                  <text key={c} x={40 + (c / stdMaxConc) * (STD_W - 50)} y={STD_H + 12}
                    textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{c.toFixed(2)}</text>
                ))}
                <text x={STD_W / 2} y={STD_H + 25} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">Concentration (mM)</text>
                <text x="10" y={STD_H / 2} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" transform={`rotate(-90 10 ${STD_H / 2})`}>Absorbance</text>
              </svg>

              {/* Regression stats */}
              <div className="p-2.5 rounded-lg bg-muted text-xs space-y-1">
                <div className="font-mono text-foreground">
                  A = εcl → A = {regSlope.toFixed(4)} × c + {regIntercept.toFixed(4)}
                </div>
                <div className="flex gap-4">
                  <span className="text-muted-foreground">R² = <span className="text-foreground font-semibold">{r2.toFixed(6)}</span></span>
                  <span className="text-muted-foreground">ε = <span className="text-foreground font-semibold">{(regSlope * 1000).toFixed(1)} M⁻¹cm⁻¹</span></span>
                </div>
              </div>

              {/* Unknown sample */}
              <div className="mt-3">
                <div className="sim-label">Unknown Sample</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Measured Absorbance</label>
                    <input type="number" step={0.01} min={0} max={5} value={unknownAbs}
                      placeholder="Enter A value..."
                      onChange={e => setUnknownAbs(e.target.value)}
                      className="w-full p-2 rounded-lg border border-border bg-background text-sm font-mono" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground mb-1 block">Calculated Concentration</label>
                    <div className="p-2 rounded-lg text-sm font-mono font-bold" style={{ background: 'hsl(var(--muted))', color: '#B89555' }}>
                      {unknownConcentration !== null && unknownConcentration >= 0
                        ? `${unknownConcentration.toFixed(4)} mM`
                        : '---'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dilution Series Mode */}
          {dilutionMode && (
            <div className="sim-panel">
              <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                <span className="flex items-center gap-2"><FlaskConical className="w-4 h-4" /> 2-Fold Serial Dilution</span>
              </h3>

              <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
                {dilutionTubes.map((dt, i) => (
                  <div key={i} className="flex items-end gap-0 min-w-[60px]">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">{dt.concentration.toFixed(3)} mM</div>
                      <div className="relative mx-auto rounded-b-lg overflow-hidden" style={{
                        width: 30,
                        height: 50,
                        background: `rgba(59, 130, 246, ${0.1 + dt.concentration * 0.7})`,
                        border: dilutionStep > i ? '2px solid #6A9B7A' : '1.5px solid rgba(59,130,246,0.4)',
                      }}>
                        <div className="absolute bottom-0 left-0 right-0" style={{
                          height: `${Math.min(100, dt.concentration * 100)}%`,
                          background: `rgba(59, 130, 246, ${0.3 + dt.concentration * 0.6})`,
                        }}/>
                      </div>
                      <div className="text-xs font-bold mt-1">T{dt.tube}</div>
                    </div>
                    {i < dilutionTubes.length - 1 && (
                      <div className="text-center px-0.5">
                        <div className="text-lg text-muted-foreground leading-none">→</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mb-3">
                <button onClick={() => setDilutionStep(Math.min(5, dilutionStep + 1))}
                  disabled={dilutionStep >= 5}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted disabled:opacity-40 transition-all">
                  <Plus className="w-3 h-3" /> Pipette Next
                </button>
                <button onClick={() => setDilutionStep(0)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted transition-all">
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="text-xs text-muted-foreground mb-2">
                Tube {Math.max(1, dilutionStep)}: {dilutionStep === 0 ? 'No transfers yet' : `Stock → T1 → T${dilutionStep} complete`}
              </div>

              {dilutionStep > 0 && (
                <svg viewBox={`0 0 300 120`} className="w-full">
                  {[0, 1, 2, 3, 4, 5].map(i => {
                    if (i >= dilutionStep) return null;
                    const conc = dilutionTubes[i].concentration;
                    const abs = sol.absorbance(wavelength) * conc;
                    const x = 30 + i * 45;
                    const barH = Math.min(90, (abs / (sol.absorbance(wavelength) * 1.2)) * 90);
                    return (
                      <g key={i}>
                        <rect x={x} y={90 - barH} width="30" height={barH} rx="3" fill="#5B7FA5" opacity="0.8"/>
                        <text x={x + 15} y={105} textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">T{i + 1}</text>
                        <text x={x + 15} y={85 - barH} textAnchor="middle" fontSize="7" fill="#5B7FA5" fontWeight="600">{abs.toFixed(3)}</text>
                      </g>
                    );
                  })}
                  <text x="150" y="118" textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">Tube #</text>
                </svg>
              )}
            </div>
          )}

          {/* Kinetics Mode */}
          {kineticsMode && (
            <div className="sim-panel">
              <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> Kinetics Mode</span>
              </h3>

              <div className="flex items-center gap-3 mb-3">
                <button onClick={kineticsRunning ? stopKinetics : startKinetics}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95 ${
                    kineticsRunning ? 'bg-red-500' : ''
                  }`}
                  style={!kineticsRunning ? { background: '#1A3550' } : {}}>
                  {kineticsRunning ? (
                    <><RotateCcw className="w-3.5 h-3.5" /> Stop</>
                  ) : (
                    <><Clock className="w-3.5 h-3.5" /> Start Kinetics</>
                  )}
                </button>
                <div className="text-xs text-muted-foreground font-mono">
                  λ = {wavelength}nm | {sol.label}
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-muted-foreground">Temperature: {kineticsTemp}°C</label>
                  <span className="text-xs text-muted-foreground">Rate factor: {Math.pow(1.05, (kineticsTemp - 25) / 10).toFixed(3)}x</span>
                </div>
                <input type="range" min={4} max={80} value={kineticsTemp}
                  onChange={e => setKineticsTemp(Number(e.target.value))}
                  className="w-full" style={{ accentColor: kineticsTemp > 50 ? '#C47B6B' : kineticsTemp < 10 ? '#5B7FA5' : '#6A9B7A' }}/>
                <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                  <span>4°C</span><span>25°C</span><span>80°C</span>
                </div>
              </div>

              {kineticsData.length === 0 ? (
                <div className="h-40 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                  Click "Start Kinetics" to begin real-time measurement
                </div>
              ) : (
                <svg viewBox={`0 0 ${KINETICS_W} ${KINETICS_H + 30}`} className="w-full">
                  {/* Grid */}
                  {[0, 0.25, 0.5, 0.75].filter(a => a <= kMaxAbs).map(a => {
                    const y = KINETICS_H - (a / kMaxAbs) * (KINETICS_H - 20);
                    return (
                      <g key={a}>
                        <line x1="40" y1={y} x2={KINETICS_W - 10} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5"/>
                        <text x="36" y={y + 3} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">{a.toFixed(2)}</text>
                      </g>
                    );
                  })}
                  <line x1="40" y1="10" x2="40" y2={KINETICS_H} stroke="hsl(var(--border))" strokeWidth="1.5"/>
                  <line x1="40" y1={KINETICS_H} x2={KINETICS_W - 10} y2={KINETICS_H} stroke="hsl(var(--border))" strokeWidth="1.5"/>

                  {/* Data line */}
                  {kineticsData.length > 1 && (
                    <path
                      d={kineticsData.map((p, i) => {
                        const x = 40 + (p.t / kMaxT) * (KINETICS_W - 50);
                        const y = KINETICS_H - (p.abs / kMaxAbs) * (KINETICS_H - 20);
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      stroke="#5B7FA5" strokeWidth="2" fill="none" strokeLinejoin="round"
                    />
                  )}

                  {/* Data points */}
                  {kineticsData.map((p, i) => {
                    const x = 40 + (p.t / kMaxT) * (KINETICS_W - 50);
                    const y = KINETICS_H - (p.abs / kMaxAbs) * (KINETICS_H - 20);
                    return <circle key={i} cx={x} cy={y} r="2" fill="#5B7FA5"/>;
                  })}

                  {/* Axis labels */}
                  <text x={KINETICS_W / 2} y={KINETICS_H + 22} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">Time (s)</text>
                  <text x="12" y={KINETICS_H / 2} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" transform={`rotate(-90 12 ${KINETICS_H / 2})`}>Absorbance</text>
                </svg>
              )}

              {kineticsData.length >= 2 && (
                <div className="mt-2 p-2.5 rounded-lg bg-muted text-xs space-y-1">
                  <div className="font-mono text-foreground">
                    Rate (slope): {kineticsSlope.toFixed(5)} ΔA/s
                  </div>
                  <div className="text-muted-foreground">
                    Data points: {kineticsData.length} | Duration: {kineticsData[kineticsData.length - 1].t}s
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Scan button + Chart */}
          <div className="sim-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Absorbance Spectrum</h3>
              <div className="flex gap-2">
                <button onClick={exportCSV} disabled={scanData.length === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:bg-muted disabled:opacity-40 transition-all">
                  <Download className="w-3 h-3" /> CSV
                </button>
                <button onClick={scan} disabled={scanning}
                  data-testid="button-scan"
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 text-white"
                  style={{ background: '#1A3550' }}>
                  {scanning ? 'Scanning...' : 'Scan Full Spectrum'}
                </button>
              </div>
            </div>

            {scanData.length === 0 ? (
              <div className="h-44 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
                Click "Scan Full Spectrum" to plot absorbance curve
              </div>
            ) : (
              <svg viewBox={`0 0 ${PLOT_W} ${PLOT_H + 30}`} className="w-full">
                {[0, 0.5, 1.0, 1.5, 2.0].map(a => {
                  const y = PLOT_H - (a / maxAbs) * (PLOT_H - 20);
                  return (
                    <g key={a}>
                      <line x1="40" y1={y} x2={PLOT_W - 10} y2={y} stroke="hsl(var(--border))" strokeWidth="0.5"/>
                      <text x="36" y={y+3} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">{a.toFixed(1)}</text>
                    </g>
                  );
                })}
                <line x1="40" y1="10" x2="40" y2={PLOT_H} stroke="hsl(var(--border))" strokeWidth="1.5"/>
                <line x1="40" y1={PLOT_H} x2={PLOT_W - 10} y2={PLOT_H} stroke="hsl(var(--border))" strokeWidth="1.5"/>

                <defs>
                  <linearGradient id="spectrumGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6600aa" stopOpacity="0.2"/>
                    <stop offset="25%" stopColor="#0000ff" stopOpacity="0.2"/>
                    <stop offset="40%" stopColor="#00aaff" stopOpacity="0.2"/>
                    <stop offset="55%" stopColor="#00ff00" stopOpacity="0.2"/>
                    <stop offset="70%" stopColor="#ffff00" stopOpacity="0.2"/>
                    <stop offset="85%" stopColor="#ff6600" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#ff0000" stopOpacity="0.2"/>
                  </linearGradient>
                </defs>
                <rect x="40" y="10" width={PLOT_W - 50} height={PLOT_H - 10} fill="url(#spectrumGrad)"/>

                {scanData.length > 1 && (
                  <path
                    d={scanData.map((p, i) => {
                      const x = 40 + ((p.wl - 380) / 320) * (PLOT_W - 50);
                      const y = PLOT_H - (p.abs / maxAbs) * (PLOT_H - 20);
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke={solution === 'blank' ? '#94a3b8' : sol.color}
                    strokeWidth="2.5" fill="none" strokeLinejoin="round"
                  />
                )}

                {/* Dilution series overlay on spectrum chart */}
                {dilutionMode && dilutionStep > 0 && scanData.length > 1 && dilutionTubes.slice(0, dilutionStep).map((dt, i) => (
                  <path key={i}
                    d={scanData.map((p, j) => {
                      const x = 40 + ((p.wl - 380) / 320) * (PLOT_W - 50);
                      const concScaled = dt.concentration;
                      const abs = sol.absorbance(p.wl) * concScaled;
                      const y = PLOT_H - (abs / maxAbs) * (PLOT_H - 20);
                      return `${j === 0 ? 'M' : 'L'} ${x} ${y}`;
                    }).join(' ')}
                    stroke="#5B7FA5" strokeWidth="1.5" fill="none" strokeLinejoin="round"
                    opacity={0.3 + dt.concentration * 0.7}
                    strokeDasharray={i > 2 ? '4,2' : 'none'}
                  />
                ))}

                <line
                  x1={40 + ((wavelength - 380) / 320) * (PLOT_W - 50)} y1="10"
                  x2={40 + ((wavelength - 380) / 320) * (PLOT_W - 50)} y2={PLOT_H}
                  stroke={wlColor} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.8"
                />

                {[380, 450, 520, 590, 660, 700].map(wl => (
                  <text key={wl} x={40 + ((wl - 380) / 320) * (PLOT_W - 50)} y={PLOT_H + 12}
                    textAnchor="middle" fontSize="8" fill="hsl(var(--muted-foreground))">{wl}</text>
                ))}
                <text x={PLOT_W / 2} y={PLOT_H + 25} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">Wavelength (nm)</text>
                <text x="12" y={PLOT_H / 2} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))" transform={`rotate(-90 12 ${PLOT_H/2})`}>Absorbance</text>
                <text x={PLOT_W - 10} y="16" textAnchor="end" fontSize="9" fill={sol.color} fontWeight="600">{sol.label}</text>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
