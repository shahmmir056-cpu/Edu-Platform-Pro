import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Download, Crosshair } from 'lucide-react';
import { useLabControls } from './labControls';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Species = 'Arabidopsis' | 'Corn' | 'Cactus';

interface Observation {
  light: number;
  co2: number;
  water: number;
  humidity: number;
  aba: boolean;
  species: Species;
  aperture: number;
  transpiration: number;
  vpd: number;
  time: string;
}

const SPECIES_INFO: Record<Species, { type: string; density: number; description: string; color: string; wueBonus: number }> = {
  Arabidopsis: { type: 'C3', density: 100, description: 'Model C3 plant — opens during day, closes at night', color: '#6A9B7A', wueBonus: 1.0 },
  Corn:        { type: 'C4', density: 25,  description: 'C4 grass — higher water-use efficiency, tighter regulation', color: '#B89555', wueBonus: 1.15 },
  Cactus:      { type: 'CAM', density: 50,  description: 'CAM succulent — opens stomata at NIGHT, closes during day', color: '#8B7BB5', wueBonus: 1.6 },
};

function computeVPD(tempC: number, rh: number): number {
  const vpSat = 0.611 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const vpActual = vpSat * (rh / 100);
  return Math.round((vpSat - vpActual) * 1000) / 1000;
}

function GuardCells({ aperture, stressAba, turgor }: { aperture: number; stressAba: boolean; turgor: number }) {
  const gap = aperture * 0.22;
  const bulge = 8 + aperture * 0.06;
  const cellColor = stressAba ? '#4a7c59' : `hsl(${120 + aperture * 0.5}, 55%, ${35 + aperture * 0.12}%)`;
  const vacColor = stressAba ? '#6a9a79' : `hsl(${130 + aperture * 0.4}, 65%, ${55 + aperture * 0.1}%)`;

  const turgorR = Math.round(200 - turgor * 1.6);
  const turgorG = Math.round(200 + turgor * 0.55);
  const turgorB = Math.round(180 - turgor * 0.8);
  const turgorColor = `rgb(${Math.min(255, Math.max(0, turgorR))},${Math.min(255, Math.max(0, turgorG))},${Math.min(255, Math.max(0, turgorB))})`;

  return (
    <svg viewBox="0 0 200 140" width="100%" style={{ maxWidth: 200 }}>
      <defs>
        <linearGradient id="turgorGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(200,200,180)" />
          <stop offset="100%" stopColor="rgb(38,210,125)" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="200" height="140" fill="#c8e6c9" rx="4"/>
      <rect x="10" y="10" width="55" height="120" rx="8" fill="#a5d6a7" stroke="#66bb6a" strokeWidth="1.5"/>
      <rect x="135" y="10" width="55" height="120" rx="8" fill="#a5d6a7" stroke="#66bb6a" strokeWidth="1.5"/>
      <text x="37" y="75" textAnchor="middle" fontSize="8" fill="#2e7d32" fontWeight="600">Epidermis</text>
      <text x="162" y="75" textAnchor="middle" fontSize="8" fill="#2e7d32" fontWeight="600">Epidermis</text>

      <ellipse cx="100" cy={70 - gap - bulge/2} rx={38 + gap*0.3} ry={bulge} fill={cellColor} stroke="#2e7d32" strokeWidth="1.5"/>
      <ellipse cx="100" cy={70 - gap - bulge/2} rx={28 + gap*0.2} ry={bulge*0.6} fill={vacColor} opacity="0.7"/>
      <ellipse cx="100" cy={70 - gap - bulge/2} rx={18 + gap*0.15} ry={bulge*0.35} fill={turgorColor} opacity="0.5"/>
      <text x="100" y={70 - gap - bulge/2 + 2} textAnchor="middle" fontSize="5" fill="#1b5e20" fontWeight="700">{Math.round(turgor)} kPa</text>

      <ellipse cx="100" cy={70 + gap + bulge/2} rx={38 + gap*0.3} ry={bulge} fill={cellColor} stroke="#2e7d32" strokeWidth="1.5"/>
      <ellipse cx="100" cy={70 + gap + bulge/2} rx={28 + gap*0.2} ry={bulge*0.6} fill={vacColor} opacity="0.7"/>
      <ellipse cx="100" cy={70 + gap + bulge/2} rx={18 + gap*0.15} ry={bulge*0.35} fill={turgorColor} opacity="0.5"/>
      <text x="100" y={70 + gap + bulge/2 + 2} textAnchor="middle" fontSize="5" fill="#1b5e20" fontWeight="700">{Math.round(turgor)} kPa</text>

      {aperture > 2 && <ellipse cx="100" cy="70" rx={aperture * 0.14} ry={gap * 0.85} fill="#1a1a2e" opacity="0.85"/>}
      {aperture <= 2 && <line x1="100" y1={70 - 2} x2="100" y2={70 + 2} stroke="#1a1a2e" strokeWidth="1.5"/>}

      {aperture > 20 && <>
        {[...Array(Math.round(aperture/25))].map((_, i) => (
          <circle key={i} cx={96 + i*4} cy={70} r="1.5" fill="#60a5fa" opacity="0.7"/>
        ))}
      </>}

      {stressAba && <text x="100" y="130" textAnchor="middle" fontSize="8" fill="#c62828" fontWeight="700">ABA — Stomata closing</text>}

      <text x="100" y={70 - gap - bulge - 6} textAnchor="middle" fontSize="7" fill="#1b5e20" fontWeight="600">Guard Cell</text>
      <text x="100" y={70 + gap + bulge + 12} textAnchor="middle" fontSize="7" fill="#1b5e20" fontWeight="600">Guard Cell</text>
      {aperture > 5 && <text x="100" y="72" textAnchor="middle" fontSize="7" fill="white" fontWeight="700">Pore</text>}

      <g transform="translate(2,120)">
        <rect x="0" y="0" width="40" height="8" rx="2" fill="url(#turgorGrad)" />
        <text x="0" y="16" fontSize="4" fill="#1b5e20">Flaccid</text>
        <text x="40" y="16" fontSize="4" fill="#1b5e20" textAnchor="end">Turgid</text>
      </g>
    </svg>
  );
}

function Potometer({ transpirationRate }: { transpirationRate: number }) {
  const maxBubbleTravel = 160;
  const bubblePos = Math.min(transpirationRate / 10, 1) * maxBubbleTravel;

  return (
    <svg viewBox="0 0 200 50" width="100%" height="50">
      <rect x="5" y="15" width="30" height="20" rx="3" fill="#66bb6a" stroke="#2e7d32" strokeWidth="1"/>
      <text x="20" y="28" textAnchor="middle" fontSize="5" fill="#1b5e20" fontWeight="600">Stem</text>

      <rect x="35" y="20" width="140" height="10" rx="2" fill="#e0e0e0" stroke="#bdbdbd" strokeWidth="0.8"/>
      <rect x="35" y="21" width="140" height="8" rx="1" fill="#bbdefb" opacity="0.4"/>
      <rect x="35" y="21" width={bubblePos} height="8" rx="1" fill="#64b5f6" opacity="0.6"/>

      {transpirationRate > 0.1 && (
        <ellipse cx={35 + bubblePos} cy="25" rx="4" ry="3.5" fill="white" stroke="#90caf9" strokeWidth="0.8" opacity="0.9">
          <animate attributeName="cx" from={35} to={35 + maxBubbleTravel} dur={`${Math.max(2, 20 / Math.max(transpirationRate, 0.5))}s`} repeatCount="indefinite"/>
        </ellipse>
      )}

      {[0, 40, 80, 120, 160].map((x) => (
        <g key={x}>
          <line x1={35 + x} y1="30" x2={35 + x} y2="34" stroke="#9e9e9e" strokeWidth="0.5"/>
          <text x={35 + x} y="38" textAnchor="middle" fontSize="3" fill="#757575">{x}um</text>
        </g>
      ))}

      <text x="105" y="48" textAnchor="middle" fontSize="5" fill="#1565c0" fontWeight="600">
        Capillary Tube (Bubble speed = Transpiration rate)
      </text>
    </svg>
  );
}

function StomatalDensityCounter({ species }: { species: Species }) {
  const info = SPECIES_INFO[species];
  const [counted, setCounted] = useState<Set<number>>(new Set());
  const gridRows = 8;
  const gridCols = 10;
  const totalCells = gridRows * gridCols;

  const cellStomata = useRef<number[]>([]);
  if (cellStomata.current.length === 0) {
    const targetCount = Math.round(info.density * 0.03);
    const indices = new Set<number>();
    while (indices.size < targetCount) {
      indices.add(Math.floor(Math.random() * totalCells));
    }
    cellStomata.current = Array.from(indices);
  }

  useEffect(() => {
    cellStomata.current = [];
    setCounted(new Set());
  }, [species]);

  const toggleCell = (idx: number) => {
    setCounted(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const area = ((gridCols * 0.05) * (gridRows * 0.05)).toFixed(3);
  const density = counted.size > 0 ? (counted.size / parseFloat(area)).toFixed(0) : '0';
  const targetDensity = info.density;

  const trueStomata = new Set(cellStomata.current);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Crosshair className="w-3 h-3" style={{ color: info.color }} />
        <span className="text-xs font-semibold">Click cells containing stomata to count density</span>
      </div>

      <svg viewBox={`0 0 ${gridCols * 20} ${gridRows * 20}`} width="100%" style={{ maxHeight: '160px' }}>
        {[...Array(gridRows)].map((_, r) =>
          [...Array(gridCols)].map((_, c) => {
            const idx = r * gridCols + c;
            const hasStoma = cellStomata.current.includes(idx);
            const isSelected = counted.has(idx);
            const isCorrect = isSelected && hasStoma;
            const isMissed = !isSelected && hasStoma;
            return (
              <g key={idx} onClick={() => toggleCell(idx)} style={{ cursor: 'pointer' }}>
                <rect
                  x={c * 20 + 1} y={r * 20 + 1} width={18} height={18} rx={4}
                  fill={isSelected ? (isCorrect ? '#C5E6CE' : '#fecaca') : isMissed ? '#e0e0e0' : '#e8f5e9'}
                  stroke={isSelected ? (isCorrect ? '#6A9B7A' : '#C47B6B') : '#a5d6a7'}
                  strokeWidth={isSelected ? 1.5 : 0.8}
                />
                {hasStoma && (
                  <g>
                    <ellipse cx={c * 20 + 10} cy={r * 20 + 9} rx={3} ry={1.8} fill="none" stroke="#2e7d32" strokeWidth="1"/>
                    <circle cx={c * 20 + 10} cy={r * 20 + 9} r={0.8} fill="#1a1a2e"/>
                  </g>
                )}
                {isSelected && (
                  <text x={c * 20 + 10} y={r * 20 + 16} textAnchor="middle" fontSize="7" fill={isCorrect ? '#6A9B7A' : '#C47B6B'} fontWeight="700">
                    {isCorrect ? '' : 'X'}
                  </text>
                )}
              </g>
            );
          })
        )}
      </svg>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
        <div className="bg-muted rounded-lg p-2 text-center">
          <div className="text-xs text-muted-foreground">Your Count</div>
          <div className="font-bold text-sm" style={{ color: info.color }}>{counted.size}</div>
        </div>
        <div className="bg-muted rounded-lg p-2 text-center">
          <div className="text-xs text-muted-foreground">Density</div>
          <div className="font-bold text-sm">{density}/mm²</div>
        </div>
        <div className="bg-muted rounded-lg p-2 text-center">
          <div className="text-xs text-muted-foreground">Typical ({species})</div>
          <div className="font-bold text-sm">{targetDensity}/mm²</div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Area: {area} mm² — {info.type} plant typical density: {targetDensity}/mm²</p>
    </div>
  );
}

export default function Stomata() {
  const [light, setLight] = useState(60);
  const [co2, setCo2] = useState(400);
  const [water, setWater] = useState(70);
  const [humidity, setHumidity] = useState(60);
  const [aba, setAba] = useState(false);
  const [tempC, setTempC] = useState(22);
  const [time, setTime] = useState(0);
  const [timeLapse, setTimeLapse] = useState(false);
  const [species, setSpecies] = useState<Species>('Arabidopsis');
  const [showDensity, setShowDensity] = useState(false);
  const [observations, setObservations] = useState<Observation[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const computeAperture = (l: number, c: number, w: number, a: boolean, t: number, sp: Species) => {
    if (a) return Math.max(0, 5 - Math.random() * 2);

    const waterFactor = w < 30 ? 0.3 : w < 50 ? 0.7 : 1.0;
    const co2Factor = c > 600 ? 0.6 : c > 400 ? 0.85 : 1.0;
    const lightFactor = l < 10 ? 0.05 : l < 30 ? 0.4 : l / 100;
    const tempFactor = t < 5 ? 0.2 : t > 38 ? 0.4 : 1.0;

    let diurnalFactor: number;
    if (sp === 'Cactus') {
      const diurnal = Math.sin(((t - 6) / 12) * Math.PI);
      diurnalFactor = diurnal > 0 ? 0.08 : 0.5 + Math.abs(diurnal) * 0.5;
    } else if (sp === 'Corn') {
      const diurnal = Math.sin(((t - 5.5) / 12) * Math.PI);
      diurnalFactor = diurnal < 0 ? 0.05 : 0.55 + diurnal * 0.45;
    } else {
      const diurnal = Math.sin(((t - 6) / 12) * Math.PI);
      diurnalFactor = diurnal < 0 ? 0.1 : 0.5 + diurnal * 0.5;
    }

    let humidityFactor = 1.0;
    if (humidity < 40) humidityFactor = 0.8;

    const base = 85 * lightFactor * waterFactor * co2Factor * tempFactor * diurnalFactor * humidityFactor;
    return Math.max(0, Math.min(100, base));
  };

  const aperture = computeAperture(light, co2, water, aba, time, species);
  const turgor = Math.min(100, Math.max(0, aperture * 1.1));
  const transpiration = aperture > 5 ? Math.round((aperture / 100) * (tempC / 25) * 8.5 * 10) / 10 : 0;
  const wuE = transpiration > 0 ? Math.round((aperture / transpiration) * SPECIES_INFO[species].wueBonus * 10) / 10 : 0;
  const vpd = computeVPD(tempC, humidity);

  useEffect(() => {
    if (timeLapse) {
      timerRef.current = setInterval(() => setTime(t => (t + 0.5) % 24), 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timeLapse]);

  const diurnalData = Array.from({length: 25}, (_, h) => ({
    hour: h,
    label: `${h}:00`,
    aperture: Math.round(computeAperture(light, co2, water, aba, h, species)),
    current: h === Math.round(time),
  }));

  const addObservation = () => {
    setObservations(prev => [...prev, {
      light, co2, water, humidity, aba, species,
      aperture: Math.round(aperture),
      transpiration,
      vpd,
      time: `${Math.floor(time)}:${time % 1 >= 0.5 ? '30' : '00'}`,
    }]);
  };

  const exportCSV = () => {
    const header = 'Species,Light (%),CO2 (ppm),Water (%),Humidity (%),ABA,Aperture (%),Transpiration (mmol/m2/s),VPD (kPa),WUE,Time\n';
    const rows = observations.map(o => `${o.species},${o.light},${o.co2},${o.water},${o.humidity},${o.aba},${o.aperture},${o.transpiration},${o.vpd},${Math.round((o.aperture / Math.max(o.transpiration, 0.1)) * SPECIES_INFO[o.species].wueBonus * 10) / 10},${o.time}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'stomata_data.csv'; a.click();
  };

  useLabControls(
    {
      canRun: true,
      running: timeLapse,
      progress: (time / 24) * 100,
      dataset: {
        name: "Stomata Observations",
        columns: [
          { key: "species", label: "Species" },
          { key: "light", label: "Light (%)" },
          { key: "co2", label: "CO2 (ppm)" },
          { key: "water", label: "Water (%)" },
          { key: "humidity", label: "Humidity (%)" },
          { key: "aba", label: "ABA" },
          { key: "aperture", label: "Aperture (%)" },
          { key: "transpiration", label: "Transpiration" },
          { key: "vpd", label: "VPD (kPa)" },
          { key: "time", label: "Time" },
        ],
        rows: observations,
      },
    },
    {
      onToggleRun: () => setTimeLapse(t => !t),
      onStep: () => setTime(t => (t + 0.5) % 24),
    },
  );

  const speciesInfo = SPECIES_INFO[species];

  const vpdEffect = vpd > 3 ? 'Very high VPD — strong stomatal closure signal to prevent water loss'
    : vpd > 1.5 ? 'Moderate VPD — mild transpiration pull, partial closure possible'
    : vpd > 0.5 ? 'Low VPD — minimal transpiration pull, stomata can stay open'
    : 'Very low VPD — near-saturated air, stomata wide open, minimal transpiration';

  const currentDiurnalNote = species === 'Cactus'
    ? 'CAM plants open stomata at night to fix CO\u2082, close during the day to conserve water'
    : species === 'Corn'
    ? 'C4 plants open stomata during the day with higher water-use efficiency than C3'
    : 'C3 stomata typically open at dawn and close at dusk';

  return (
    <div className="sim-container">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'Space Grotesk' }}>Species</h3>
            <div className="flex gap-2 mb-4 flex-wrap">
              {(Object.keys(SPECIES_INFO) as Species[]).map(sp => (
                <button key={sp} onClick={() => setSpecies(sp)}
                  className="flex-1 py-2 px-2 rounded-lg text-xs font-semibold border-2 transition-all"
                  style={{
                    borderColor: species === sp ? SPECIES_INFO[sp].color : 'hsl(var(--border))',
                    background: species === sp ? `${SPECIES_INFO[sp].color}18` : 'transparent',
                    color: species === sp ? SPECIES_INFO[sp].color : 'inherit',
                  }}>
                  {sp} ({SPECIES_INFO[sp].type})
                </button>
              ))}
            </div>
            <div className="bg-muted rounded-lg p-2 text-xs text-muted-foreground">{speciesInfo.description}</div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'Space Grotesk' }}>Environmental Controls</h3>

            {[
              { label: 'Light Intensity', val: light, set: setLight, min: 0, max: 100, unit: '%', color: '#B89555', step: 1 },
              { label: 'CO\u2082 Concentration', val: co2, set: setCo2, min: 100, max: 1500, unit: 'ppm', color: '#6b7280', step: 10 },
              { label: 'Leaf Water Status', val: water, set: setWater, min: 0, max: 100, unit: '%', color: '#5B7FA5', step: 1 },
              { label: 'Temperature', val: tempC, set: setTempC, min: 0, max: 45, unit: '\u00b0C', color: '#C47B6B', step: 1 },
              { label: 'Relative Humidity', val: humidity, set: setHumidity, min: 20, max: 100, unit: '%', color: '#5B7FA5', step: 1 },
            ].map(ctrl => (
              <div key={ctrl.label} className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="sim-label mb-0 text-xs">{ctrl.label}</span>
                  <span className="text-xs font-mono font-bold" style={{ color: ctrl.color }}>{ctrl.val} {ctrl.unit}</span>
                </div>
                <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.val} step={ctrl.step}
                  onChange={e => ctrl.set(Number(e.target.value))}
                  className="w-full" style={{ accentColor: ctrl.color }} />
                {ctrl.label === 'Relative Humidity' && humidity < 40 && (
                  <p className="text-xs mt-1" style={{ color: '#C47B6B' }}>Low humidity: aperture reduced by 20% (negative feedback)</p>
                )}
              </div>
            ))}

            <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: aba ? '#C47B6B' : 'hsl(var(--border))' }}>
              <button onClick={() => setAba(a => !a)}
                className={`relative w-12 h-6 rounded-full transition-colors ${aba ? 'bg-red-500' : 'bg-muted-foreground/30'}`}>
                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${aba ? 'translate-x-6' : ''}`} />
              </button>
              <div>
                <div className="text-sm font-semibold">Abscisic Acid (ABA)</div>
                <div className="text-xs text-muted-foreground">{aba ? 'Stress hormone active \u2014 stomata closing' : 'Normal conditions'}</div>
              </div>
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>Time of Day</h3>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <button onClick={() => setTimeLapse(t => !t)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: timeLapse ? '#C47B6B' : '#1A3550' }}>
                {timeLapse ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {timeLapse ? 'Pause' : 'Time-lapse'}
              </button>
              <button onClick={() => { setTime(0); setTimeLapse(false); }}
                className="p-2 rounded-lg border border-border hover:bg-muted">
                <RotateCcw className="w-3 h-3" />
              </button>
              <span className="font-mono text-sm font-bold">
                {String(Math.floor(time)).padStart(2,'0')}:{time % 1 >= 0.5 ? '30' : '00'}
              </span>
            </div>
            <input type="range" min={0} max={24} value={time} step={0.5}
              onChange={e => setTime(Number(e.target.value))}
              className="w-full" style={{ accentColor: '#B89555' }} />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Midnight</span><span>6am</span><span>Noon</span><span>6pm</span><span>Midnight</span>
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>Measurements</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {[
                { label: 'Aperture', val: `${Math.round(aperture)}%`, color: aperture < 20 ? '#C47B6B' : aperture < 50 ? '#B89555' : '#6A9B7A' },
                { label: 'Transpiration', val: `${transpiration} mmol/m\u00b2/s`, color: '#5B7FA5' },
                { label: 'Water-Use Efficiency', val: `${wuE}`, color: '#8B7BB5' },
                { label: 'VPD', val: `${vpd} kPa`, color: vpd > 3 ? '#C47B6B' : vpd > 1.5 ? '#B89555' : '#6A9B7A' },
                { label: 'Turgor Pressure', val: `${Math.round(turgor)} kPa`, color: turgor > 60 ? '#6A9B7A' : turgor > 30 ? '#B89555' : '#C47B6B' },
                { label: 'Status', val: aperture < 10 ? 'Closed' : aperture < 40 ? 'Partial' : 'Open', color: aperture < 10 ? '#C47B6B' : aperture < 40 ? '#B89555' : '#6A9B7A' },
              ].map(m => (
                <div key={m.label} className="bg-muted rounded-xl p-3">
                  <div className="text-xs text-muted-foreground mb-0.5">{m.label}</div>
                  <div className="font-bold text-sm" style={{ color: m.color }}>{m.val}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={addObservation} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#1A3550' }}>
                <Plus className="w-3 h-3" /> Record
              </button>
              {observations.length > 0 && (
                <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted">
                  <Download className="w-3 h-3" /> CSV
                </button>
              )}
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>Vapor Pressure Deficit (VPD)</h3>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">VP = VPsat \u00d7 RH/100</span>
                <span className="font-mono font-bold" style={{ color: vpd > 3 ? '#C47B6B' : '#6A9B7A' }}>{vpd} kPa</span>
              </div>
              <div className="h-2 bg-background rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (vpd / 5) * 100)}%`, background: vpd > 3 ? '#C47B6B' : vpd > 1.5 ? '#B89555' : '#6A9B7A' }}/>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{vpdEffect}</p>
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>Potometer</h3>
            <Potometer transpirationRate={transpiration} />
            <p className="text-xs text-muted-foreground mt-1">Air bubble moves along capillary at rate proportional to transpiration</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="sim-panel flex flex-col items-center">
            <h3 className="font-bold text-base mb-3 w-full" style={{ fontFamily: 'Space Grotesk' }}>
              Guard Cell View — {species} ({speciesInfo.type})
            </h3>
            <GuardCells aperture={aperture} stressAba={aba} turgor={turgor} />
            <div className="w-full mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Stomatal Aperture</span>
                <span className="text-xs font-mono font-bold">{Math.round(aperture)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${aperture}%`, background: aperture < 20 ? '#C47B6B' : aperture < 50 ? '#B89555' : '#6A9B7A' }}/>
              </div>
            </div>
            <div className="w-full mt-2">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-muted-foreground">Guard Cell Turgor</span>
                <span className="text-xs font-mono font-bold" style={{ color: turgor > 60 ? '#6A9B7A' : turgor > 30 ? '#B89555' : '#C47B6B' }}>{Math.round(turgor)} kPa</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${turgor}%`, background: 'linear-gradient(90deg, #d4cfa0, #26d27d)' }}/>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center leading-relaxed">
              {aba ? 'ABA binds guard cell receptors \u2192 K\u207a efflux \u2192 turgor loss \u2192 closure' :
               species === 'Cactus' ? (time >= 6 && time <= 18 ? 'CAM: Stomata closed during day to minimize water loss' : 'CAM: Stomata open at night, fixing CO\u2082 into malate') :
               aperture > 50 ? 'K\u207a and Cl\u207b import raises guard cell turgor \u2192 stomata open' :
               aperture > 10 ? 'Partial opening \u2014 K\u207a uptake in progress' :
               'Stomata closed \u2014 no K\u207a uptake, guard cells flaccid'}
            </p>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>24-Hour Diurnal Pattern</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={diurnalData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Aperture']} />
                  <Line type="monotone" dataKey="aperture" stroke={speciesInfo.color} strokeWidth={2} dot={false} />
                  {time !== undefined && (
                    <Line type="monotone" dataKey={(d: {hour:number; aperture:number}) => d.hour === Math.round(time) ? d.aperture : null}
                      stroke="#f5a623" strokeWidth={0} dot={{ fill: '#f5a623', r: 5 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{currentDiurnalNote}</p>
          </div>

          <div className="sim-panel">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Stomatal Density Counter</h3>
              <button onClick={() => setShowDensity(d => !d)}
                className="text-xs px-2 py-1 rounded-lg border border-border hover:bg-muted flex items-center gap-1">
                <Crosshair className="w-3 h-3" /> {showDensity ? 'Hide' : 'Show'}
              </button>
            </div>
            {showDensity && <StomatalDensityCounter species={species} />}
          </div>

          {observations.length > 0 && (
            <div className="sim-panel">
              <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Recorded Observations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1 pr-2 text-muted-foreground">Species</th>
                      <th className="text-left py-1 pr-2 text-muted-foreground">Light</th>
                      <th className="text-left py-1 pr-2 text-muted-foreground">CO\u2082</th>
                      <th className="text-left py-1 pr-2 text-muted-foreground">H\u2082O</th>
                      <th className="text-left py-1 pr-2 text-muted-foreground">RH%</th>
                      <th className="text-left py-1 pr-2 text-muted-foreground">ABA</th>
                      <th className="text-left py-1 pr-2 text-muted-foreground">Aperture</th>
                      <th className="text-left py-1 pr-2 text-muted-foreground">Transpir.</th>
                      <th className="text-left py-1 text-muted-foreground">VPD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.map((o, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-1 pr-2" style={{ color: SPECIES_INFO[o.species].color, fontWeight: 600 }}>{o.species}</td>
                        <td className="py-1 pr-2">{o.light}%</td>
                        <td className="py-1 pr-2">{o.co2}</td>
                        <td className="py-1 pr-2">{o.water}%</td>
                        <td className="py-1 pr-2">{o.humidity}%</td>
                        <td className="py-1 pr-2">{o.aba ? '\u2713' : '-'}</td>
                        <td className="py-1 pr-2 font-bold" style={{ color: o.aperture < 20 ? '#C47B6B' : o.aperture < 50 ? '#B89555' : '#6A9B7A' }}>{o.aperture}%</td>
                        <td className="py-1 pr-2">{o.transpiration}</td>
                        <td className="py-1">{o.vpd}</td>
                      </tr>
                    ))}
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
