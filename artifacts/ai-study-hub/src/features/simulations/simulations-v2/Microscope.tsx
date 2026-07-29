import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, ZoomIn, Lightbulb, Crosshair, Camera, AlertTriangle, Droplets } from 'lucide-react';

type Specimen = 'onion' | 'cheek' | 'bacteria' | 'blood' | 'mitosis';
type Objective = '4x' | '10x' | '40x' | '100x';
type Stain = 'none' | 'iodine' | 'methylene' | 'eosin';
type Eyepiece = 'WF10x' | 'WF15x';

const OBJECTIVES: { id: Objective; mag: number; color: string; na: string }[] = [
  { id: '4x',   mag: 40,   color: '#C47B6B', na: '0.10' },
  { id: '10x',  mag: 100,  color: '#B89555', na: '0.25' },
  { id: '40x',  mag: 400,  color: '#6A9B7A', na: '0.65' },
  { id: '100x', mag: 1000, color: '#5B7FA5', na: '1.25' },
];

const SPECIMENS: { id: Specimen; label: string; desc: string; domain: string; wall: string; size: string }[] = [
  { id: 'onion',    label: 'Onion Epidermis',    desc: 'Large rectangular cells with visible cell walls and central vacuole', domain: 'Eukaryote', wall: 'Yes (cellulose)', size: '~50–100 µm' },
  { id: 'cheek',    label: 'Human Cheek Cells',  desc: 'Irregular squamous epithelial cells with a large central nucleus', domain: 'Eukaryote', wall: 'None', size: '~60–80 µm' },
  { id: 'bacteria', label: 'E. coli (Bacteria)', desc: 'Rod-shaped prokaryotes — no nucleus, no membrane-bound organelles', domain: 'Prokaryote', wall: 'Yes (peptidoglycan)', size: '~1–3 µm' },
  { id: 'blood',    label: 'Blood Smear',        desc: 'Biconcave RBCs, white blood cells, and platelets visible at high magnification', domain: 'Eukaryote', wall: 'None', size: '6–8 µm (RBC)' },
  { id: 'mitosis',  label: 'Onion Root Tip',     desc: 'Actively dividing cells showing all stages of mitosis', domain: 'Eukaryote', wall: 'Yes (cellulose)', size: '~15–30 µm' },
];

const STAINS: { id: Stain; label: string; color: string; targets: string }[] = [
  { id: 'none',      label: 'No Stain',       color: 'transparent', targets: 'Natural color' },
  { id: 'iodine',    label: 'Iodine (Lugol)',  color: '#b45309',     targets: 'Starch — turns blue/black; cytoplasm yellow-brown' },
  { id: 'methylene', label: 'Methylene Blue',  color: '#1d4ed8',     targets: 'Nucleus and DNA — deep blue' },
  { id: 'eosin',     label: 'Eosin Y',         color: '#C47B6B',     targets: 'Cytoplasm and proteins — pink' },
];

const PERFECT = 65;

function SpecimenSVG({ specimen, zoom, blur, brightness, stain, offsetX, offsetY }: {
  specimen: Specimen; zoom: number; blur: number; brightness: number; stain: Stain; offsetX: number; offsetY: number;
}) {
  const stainObj = STAINS.find(s => s.id === stain)!;
  const tint = stain !== 'none' ? stainObj.color : null;

  return (
    <g transform={`translate(${offsetX}, ${offsetY}) scale(${zoom})`} style={{ filter: `blur(${blur}px) brightness(${brightness})` }}>
      {specimen === 'onion' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#f5e8c8' : '#f5e8d0'} />
          {[[-80,-80],[0,-80],[80,-80],[-80,-20],[0,-20],[80,-20],[-80,40],[0,40],[80,40]].map(([x,y], i) => (
            <g key={i} transform={`translate(${x},${y})`}>
              <rect x="0" y="0" width="70" height="52" rx="4" fill={tint === '#b45309' ? '#d4a44a' : tint === '#1d4ed8' ? '#dbeafe' : tint === '#C47B6B' ? '#fce7f3' : '#e8c890'}
                stroke={tint ? tint : '#c8956c'} strokeWidth="2.5" opacity="0.9"/>
              <ellipse cx="35" cy="26" rx="14" ry="10" fill={tint === '#1d4ed8' ? '#1d4ed8' : tint === '#b45309' ? '#7A5A2E' : '#a0784a'} opacity={stain !== 'none' ? 0.9 : 0.5}/>
              <ellipse cx="35" cy="26" rx="7" ry="5" fill={tint === '#1d4ed8' ? '#1e40af' : '#7a5a36'} opacity="0.8"/>
              <ellipse cx="35" cy="26" rx="3" ry="2" fill={tint ? '#000' : '#3a2810'} opacity="0.5"/>
              <rect x="4" y="0" width="1.5" height="52" fill={tint ? tint : '#c8956c'} opacity="0.4"/>
            </g>
          ))}
        </g>
      )}
      {specimen === 'cheek' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#fdf0ec' : '#fdf0e8'} />
          {[[50,50,0],[130,40,25],[80,120,15],[160,110,-20],[30,150,30],[145,170,-10],[95,55,40],[60,100,-15]].map(([cx,cy,rot],i) => (
            <g key={i} transform={`translate(${cx},${cy}) rotate(${rot})`}>
              <ellipse cx="0" cy="0" rx="32" ry="22" fill={tint === '#C47B6B' ? '#f9a8d4' : tint === '#1d4ed8' ? '#bfdbfe' : '#f5c8b0'}
                stroke={tint ? tint : '#d49080'} strokeWidth="2" opacity="0.85"/>
              <ellipse cx="0" cy="0" rx="10" ry="7" fill={tint === '#1d4ed8' ? '#1d4ed8' : '#b06840'} opacity={stain !== 'none' ? 0.9 : 0.65}/>
              <ellipse cx="0" cy="0" rx="5" ry="3.5" fill={tint === '#1d4ed8' ? '#1e40af' : '#803028'} opacity="0.8"/>
            </g>
          ))}
        </g>
      )}
      {specimen === 'bacteria' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#e0f0f0' : '#e8f4f4'} />
          {Array.from({length:30},(_, i) => {
            const x = ((i * 43 + 10) % 300) - 80;
            const y = ((i * 61 + 15) % 260) - 80;
            const angle = (i * 53) % 180;
            return (
              <g key={i} transform={`translate(${x},${y}) rotate(${angle})`}>
                <rect x="-12" y="-5" width="24" height="10" rx="5" fill={tint ? tint : '#5a9898'} opacity="0.8"/>
                <ellipse cx="-12" cy="0" r="5" fill={tint ? tint : '#4a8888'} opacity="0.7"/>
                <ellipse cx="12" cy="0" r="5" fill={tint ? tint : '#4a8888'} opacity="0.7"/>
                {tint === '#1d4ed8' && <ellipse cx="0" cy="0" rx="4" ry="2" fill="#1e40af" opacity="0.6"/>}
              </g>
            );
          })}
        </g>
      )}
      {specimen === 'blood' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint === '#C47B6B' ? '#fff0f8' : '#fff8f8'} />
          {/* RBCs */}
          {[[40,40],[100,35],[165,50],[55,100],[120,95],[185,90],[30,155],[100,150],[170,145],[70,70],[145,75]].map(([cx,cy],i) => (
            <g key={i} transform={`translate(${cx},${cy}) rotate(${i*17})`}>
              <ellipse cx="0" cy="0" rx="16" ry="11" fill={tint === '#C47B6B' ? '#fbb6ce' : '#C47B6B'} stroke="#dc2626" strokeWidth="1" opacity="0.85"/>
              <ellipse cx="0" cy="0" rx="8" ry="5.5" fill={tint === '#C47B6B' ? '#f9a8d4' : '#C47B6B'} opacity="0.6"/>
            </g>
          ))}
          {/* WBC */}
          <g transform="translate(130,60)">
            <ellipse cx="0" cy="0" rx="22" ry="18" fill={tint === '#1d4ed8' ? '#93c5fd' : '#e0e7ff'} stroke="#818cf8" strokeWidth="1.5" opacity="0.9"/>
            <ellipse cx="0" cy="0" rx="14" ry="11" fill={tint === '#1d4ed8' ? '#5B7FA5' : '#8B7BB5'} opacity={stain !== 'none' ? 0.8 : 0.6}/>
            <text x="0" y="3" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">WBC</text>
          </g>
        </g>
      )}
      {specimen === 'mitosis' && (
        <g>
          <rect x="-200" y="-200" width="600" height="500" fill={tint ? '#f0f4e8' : '#f2f5e8'} />
          {/* Cells in different mitosis stages */}
          {[
            {x:30, y:30, stage:'interphase', chromosomes:[[0,-14],[6,-12],[-6,-12],[0,-8],[4,-6],[-4,-6]]},
            {x:120, y:35, stage:'prophase', chromosomes:[[0,-16],[8,-10],[-8,-10],[0,-4],[6,2],[-6,2]]},
            {x:55, y:115, stage:'metaphase', chromosomes:[[0,-14],[8,-8],[-8,-8],[0,-2],[8,8],[-8,8]]},
            {x:145, y:110, stage:'anaphase', chromosomes:[[0,-18],[6,-14],[-6,-14],[0,12],[6,16],[-6,16]]},
            {x:85, y:50, stage:'telophase', chromosomes:[[0,-10],[5,-7],[-5,-7]]},
          ].map((cell, ci) => (
            <g key={ci} transform={`translate(${cell.x},${cell.y})`}>
              <ellipse cx="0" cy="0" rx="38" ry="30" fill={tint === '#C47B6B' ? '#fce7f3' : tint === '#1d4ed8' ? '#dbeafe' : '#e8f5e9'}
                stroke={tint ? tint : '#66bb6a'} strokeWidth="1.5" opacity="0.8"/>
              {cell.stage !== 'metaphase' && cell.stage !== 'anaphase' && (
                <ellipse cx="0" cy="0" rx="16" ry="13" fill="none" stroke={tint === '#1d4ed8' ? '#1d4ed8' : '#388e3c'} strokeWidth="1" opacity="0.5"/>
              )}
              {cell.chromosomes.map(([cx,cy], i) => (
                <ellipse key={i} cx={cx} cy={cy} rx="4" ry="2.5"
                  fill={tint === '#1d4ed8' ? '#1d4ed8' : tint === '#C47B6B' ? '#C47B6B' : '#2e7d32'}
                  transform={`rotate(${cell.stage === 'metaphase' ? 90 : 0} ${cx} ${cy})`}
                  opacity="0.85"/>
              ))}
              <text x="0" y="26" textAnchor="middle" fontSize="7" fill={tint ? tint : '#1b5e20'} fontWeight="600">{cell.stage}</text>
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

export default function Microscope() {
  const [specimen, setSpecimen] = useState<Specimen>('onion');
  const [objective, setObjective] = useState<Objective>('10x');
  const [coarse, setCoarse] = useState(40);
  const [fine, setFine] = useState(50);
  const [light, setLight] = useState(70);
  const [diaphragm, setDiaphragm] = useState(80);
  const [stain, setStain] = useState<Stain>('none');
  const [stained, setStained] = useState(false);
  const [perfectAchieved, setPerfectAchieved] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [scaleBar, setScaleBar] = useState(true);
  const [observations, setObservations] = useState<string[]>([]);
  const [obsInput, setObsInput] = useState('');
  const viewerRef = useRef<HTMLDivElement>(null);

  // Feature 1: Eyepiece Selection
  const [eyepiece, setEyepiece] = useState<Eyepiece>('WF10x');

  // Feature 2: Stage X/Y Controls
  const [stageX, setStageX] = useState(0);
  const [stageY, setStageY] = useState(0);

  // Feature 3: Condenser Height
  const [condenser, setCondenser] = useState(50);

  // Feature 5: Oil Immersion
  const [oilApplied, setOilApplied] = useState(false);

  // Feature 6: Measurement Tool
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);

  // Feature 8: Coarse Focus Warning
  const [coarseWarning, setCoarseWarning] = useState('');
  const prevCoarseRef = useRef(coarse);

  const obj = OBJECTIVES.find(o => o.id === objective)!;
  const zoomMap: Record<Objective, number> = { '4x': 0.5, '10x': 1, '40x': 2.2, '100x': 4 };
  const zoom = zoomMap[objective] * (eyepiece === 'WF15x' ? 1.5 : 1);

  const focusScore = Math.abs(coarse - PERFECT) * 0.6 + Math.abs(fine - 50) * 0.12;
  let blur = Math.min(focusScore * 0.35, 8);
  // Feature 5: Oil immersion reduces blur
  if (oilApplied && objective === '100x') blur *= 0.6;
  const sharpness = Math.max(0, 100 - focusScore * 2);
  const isPerfect = focusScore < 4;
  // Feature 3: Condenser brightness modifier
  const condenserMod = 1 - Math.abs(condenser - 50) / 80;
  const brightness = (light / 100) * (diaphragm / 100) * 1.4 + 0.3;
  const adjustedBrightness = brightness * condenserMod;
  const scaleBarMicron = Math.round(100 / (zoom) * 10) / 10;

  useEffect(() => {
    if (isPerfect && !perfectAchieved) setPerfectAchieved(true);
  }, [isPerfect, perfectAchieved]);

  const specimenInfo = SPECIMENS.find(s => s.id === specimen)!;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (measureMode) {
      // Feature 6: Measurement tool click handler
      const svg = (e.target as SVGElement).closest('svg');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * 300;
      const svgY = ((e.clientY - rect.top) / rect.height) * 300;
      setMeasurePoints(prev => {
        if (prev.length >= 2) return [{ x: svgX, y: svgY }];
        return [...prev, { x: svgX, y: svgY }];
      });
      return;
    }
    setDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart) return;
    const maxOff = 80;
    setOffsetX(Math.max(-maxOff, Math.min(maxOff, e.clientX - dragStart.x)));
    setOffsetY(Math.max(-maxOff, Math.min(maxOff, e.clientY - dragStart.y)));
  };
  const handleMouseUp = () => setDragging(false);

  const resetSlide = () => {
    setCoarse(40); setFine(50); setPerfectAchieved(false);
    setOffsetX(0); setOffsetY(0); setStained(false); setStain('none');
    setStageX(0); setStageY(0);
  };
  const applyStain = () => { if (stain !== 'none') setStained(true); };
  const addObs = () => { if (obsInput.trim()) { setObservations(prev => [...prev, obsInput.trim()]); setObsInput(''); } };

  // Feature 4: Parfocal — auto-adjust coarse when objective changes
  const prevObjectiveRef = useRef(objective);
  useEffect(() => {
    if (prevObjectiveRef.current !== objective) {
      prevObjectiveRef.current = objective;
      setCoarse(prev => Math.round(prev + (PERFECT - prev) * 0.3));
    }
  }, [objective]);

  // Feature 8: Coarse focus warning at high power
  useEffect(() => {
    const delta = Math.abs(coarse - prevCoarseRef.current);
    if ((objective === '40x' || objective === '100x') && delta > 10) {
      setCoarseWarning('Caution: Coarse focus at high power may damage the slide!');
    }
    prevCoarseRef.current = coarse;
  }, [coarse, objective]);

  useEffect(() => {
    if (!coarseWarning) return;
    const timer = setTimeout(() => setCoarseWarning(''), 3000);
    return () => clearTimeout(timer);
  }, [coarseWarning]);

  // Feature 5: Reset oil when leaving 100x
  useEffect(() => {
    if (objective !== '100x') setOilApplied(false);
  }, [objective]);

  // Feature 6: Measurement line coordinates
  const measureLineLength = measurePoints.length === 2
    ? Math.sqrt(
        Math.pow(measurePoints[1].x - measurePoints[0].x, 2) +
        Math.pow(measurePoints[1].y - measurePoints[0].y, 2)
      ) : 0;
  const measureMicron = measureLineLength > 0
    ? (measureLineLength * scaleBarMicron / 60).toFixed(1)
    : '0';

  // Feature 7: Screenshot
  const handleCapture = () => {
    const svgEl = viewerRef.current?.querySelector('svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `microscope-${specimen}-${obj.mag}x.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sim-container space-y-4">
      {/* Top: Compact Controls + Eyepiece side by side */}
      <div className="grid lg:grid-cols-[260px,1fr] gap-4 items-start">
        {/* Compact Controls */}
        <div className="sim-panel p-2 sm:p-3 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wide text-muted-foreground" style={{ fontFamily: 'Space Grotesk' }}>Controls</h3>

          {/* Objective buttons - tiny inline */}
          <div>
            <div className="sim-label mb-1">Objective</div>
            <div className="flex gap-1">
              {OBJECTIVES.map(ob => (
                <button key={ob.id} onClick={() => setObjective(ob.id)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold border transition-all ${objective === ob.id ? 'text-white' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                  style={objective === ob.id ? { background: ob.color, borderColor: ob.color } : {}}>
                  {ob.id}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x | NA: {obj.na}
            </p>
          </div>

          {/* Eyepiece tiny */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground font-semibold">Eyepiece:</span>
            {(['WF10x', 'WF15x'] as Eyepiece[]).map(ep => (
              <button key={ep} onClick={() => setEyepiece(ep)}
                className={`text-[10px] px-2 py-0.5 rounded border font-bold transition-all ${eyepiece === ep ? 'text-white border-transparent' : 'border-border text-muted-foreground'}`}
                style={eyepiece === ep ? { background: '#1A3550' } : {}}>
                {ep}
              </button>
            ))}
          </div>

          {/* Oil immersion inline */}
          {objective === '100x' && !oilApplied && (
            <div className="flex items-center gap-1 p-1.5 rounded text-[10px]" style={{ background: '#FAF8F2', border: '1px solid #B89555' }}>
              <Droplets className="w-3 h-3 text-amber-500" />
              <span className="text-amber-800 font-semibold flex-1">Oil required</span>
              <button onClick={() => setOilApplied(true)} className="px-2 py-0.5 rounded text-[10px] font-bold text-white" style={{ background: '#B89555' }}>Apply</button>
            </div>
          )}
          {objective === '100x' && oilApplied && (
            <div className="flex items-center gap-1 text-[10px] text-green-700 font-semibold">
              <Droplets className="w-3 h-3" /> Oil applied
            </div>
          )}

          {/* Coarse warning inline */}
          {coarseWarning && (
            <div className="flex items-center gap-1 p-1.5 rounded text-[10px] animate-pulse" style={{ background: '#FAF5F3', border: '1px solid #C47B6B' }}>
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span className="text-red-700 font-semibold">{coarseWarning}</span>
            </div>
          )}

          {/* Sliders - compact */}
          {[
            { label: 'Coarse', val: coarse, set: setCoarse, min: 0, max: 100, color: '#1A3550', test: 'slider-coarse-focus' },
            { label: 'Fine', val: fine, set: setFine, min: 0, max: 100, color: '#5B7FA5', test: 'slider-fine-focus' },
            { label: 'Light', val: light, set: setLight, min: 10, max: 100, color: '#B89555', test: 'slider-light' },
            { label: 'Diaphragm', val: diaphragm, set: setDiaphragm, min: 10, max: 100, color: '#8B7BB5', test: 'slider-diaphragm' },
            { label: 'Condenser', val: condenser, set: setCondenser, min: 0, max: 100, color: '#B89555', test: 'slider-condenser' },
          ].map(ctrl => (
            <div key={ctrl.label} className="flex items-center gap-1 sm:gap-2">
              <span className="text-[10px] text-muted-foreground w-10 sm:w-14 flex-shrink-0">{ctrl.label}</span>
              <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.val}
                data-testid={ctrl.test}
                onChange={e => ctrl.set(Number(e.target.value))}
                className="flex-1 h-1 min-w-0" style={{ accentColor: ctrl.color }} />
              <span className="text-[10px] font-mono w-5 sm:w-6 text-right flex-shrink-0" style={{ color: ctrl.color }}>{ctrl.val}</span>
            </div>
          ))}

          {/* Stage X/Y - inline */}
          <div className="p-2 rounded border" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-semibold">Stage</span>
              <button onClick={() => { setStageX(0); setStageY(0); }}
                className="text-[9px] px-1.5 py-0.5 rounded border border-border hover:bg-muted font-semibold">Reset</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
              <div className="flex-1 flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground w-3">X</span>
                <input type="range" min={-50} max={50} value={stageX}
                  onChange={e => setStageX(Number(e.target.value))}
                  className="flex-1 h-1 min-w-0" style={{ accentColor: '#059669' }} />
                <span className="text-[10px] font-mono w-5 text-right flex-shrink-0" style={{ color: '#059669' }}>{stageX > 0 ? '+' : ''}{stageX}</span>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground w-3">Y</span>
                <input type="range" min={-50} max={50} value={stageY}
                  onChange={e => setStageY(Number(e.target.value))}
                  className="flex-1 h-1 min-w-0" style={{ accentColor: '#059669' }} />
                <span className="text-[10px] font-mono w-5 text-right flex-shrink-0" style={{ color: '#059669' }}>{stageY > 0 ? '+' : ''}{stageY}</span>
              </div>
            </div>
          </div>

          {/* Focus quality bar */}
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] text-muted-foreground">Focus</span>
              <span className={`text-[10px] font-bold ${isPerfect ? 'text-green-600' : sharpness > 60 ? 'text-amber-500' : 'text-red-500'}`}>
                {isPerfect ? 'In Focus!' : `${Math.round(sharpness)}%`}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${sharpness}%`, background: isPerfect ? '#6A9B7A' : sharpness > 60 ? '#B89555' : '#C47B6B' }} />
            </div>
          </div>
        </div>

        {/* Eyepiece Viewer */}
        <div className="sim-panel">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
            <h3 className="font-bold text-sm sm:text-base" style={{ fontFamily: 'Space Grotesk' }}>Eyepiece View</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <button onClick={handleCapture}
                className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded border border-border hover:bg-muted flex items-center gap-1">
                <Camera className="w-3 h-3" /> Capture
              </button>
              <button onClick={() => { setMeasureMode(m => !m); setMeasurePoints([]); }}
                className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded border flex items-center gap-1 transition-all ${measureMode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-border hover:bg-muted'}`}>
                <Crosshair className="w-3 h-3" /> {measureMode ? 'Measuring' : 'Measure'}
              </button>
              <button onClick={() => setScaleBar(s => !s)} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-1 rounded border border-border hover:bg-muted">
                {scaleBar ? 'Hide' : 'Show'} Scale
              </button>
              <div className="text-[10px] sm:text-xs font-mono bg-muted px-1.5 sm:px-2 py-1 rounded">{Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x</div>
            </div>
          </div>

          <div className="flex justify-center">
            <div ref={viewerRef}
              className={`relative overflow-hidden aspect-square w-full max-w-[300px] max-sm:max-w-[200px] touch-none ${measureMode ? 'cursor-crosshair' : dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              style={{
                borderRadius: '50%',
                boxShadow: `0 0 0 12px #1A2A35, 0 0 0 16px #1A3550, 0 0 60px rgba(0,0,0,0.7), inset 0 0 ${light/3}px rgba(${Math.round(255*light/100)},${Math.round(240*light/100)},${Math.round(200*light/100)},0.15)`,
                background: `rgba(${Math.round(245*light/100)},${Math.round(238*light/100)},${Math.round(208*light/100)},1)`,
              }}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
              <svg width="100%" height="100%" viewBox="0 0 300 300">
                <clipPath id="circleMask">
                  <circle cx="150" cy="150" r="148" />
                </clipPath>
                <g clipPath="url(#circleMask)">
                  <SpecimenSVG
                    specimen={specimen} zoom={zoom} blur={blur}
                    brightness={adjustedBrightness} stain={stained ? stain : 'none'}
                    offsetX={150 + offsetX + stageX} offsetY={150 + offsetY + stageY}
                  />
                </g>
                <line x1="150" y1="30" x2="150" y2="270" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <line x1="30" y1="150" x2="270" y2="150" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                <circle cx="150" cy="150" r="55" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <circle cx="150" cy="150" r="110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                {measureMode && measurePoints.length === 2 && (
                  <g>
                    <line x1={measurePoints[0].x} y1={measurePoints[0].y} x2={measurePoints[1].x} y2={measurePoints[1].y}
                      stroke="#C47B6B" strokeWidth="2" strokeDasharray="4 2" />
                    <circle cx={measurePoints[0].x} cy={measurePoints[0].y} r="4" fill="#C47B6B" stroke="white" strokeWidth="1.5" />
                    <circle cx={measurePoints[1].x} cy={measurePoints[1].y} r="4" fill="#C47B6B" stroke="white" strokeWidth="1.5" />
                    <rect x={(measurePoints[0].x + measurePoints[1].x) / 2 - 35} y={(measurePoints[0].y + measurePoints[1].y) / 2 - 14}
                      width="70" height="18" rx="4" fill="rgba(0,0,0,0.8)" />
                    <text x={(measurePoints[0].x + measurePoints[1].x) / 2} y={(measurePoints[0].y + measurePoints[1].y) / 2}
                      textAnchor="middle" dominantBaseline="central" fontSize="10" fill="white" fontWeight="bold">
                      {measureMicron} µm
                    </text>
                  </g>
                )}
                {measureMode && measurePoints.length === 1 && (
                  <circle cx={measurePoints[0].x} cy={measurePoints[0].y} r="4" fill="#C47B6B" stroke="white" strokeWidth="1.5" />
                )}
                {scaleBar && isPerfect && (
                  <g transform="translate(30,270)">
                    <rect x="0" y="-8" width="60" height="4" fill="white" opacity="0.8"/>
                    <line x1="0" y1="-8" x2="0" y2="-2" stroke="white" strokeWidth="1.5" opacity="0.8"/>
                    <line x1="60" y1="-8" x2="60" y2="-2" stroke="white" strokeWidth="1.5" opacity="0.8"/>
                    <text x="30" y="-11" textAnchor="middle" fontSize="8" fill="white" opacity="0.8">{scaleBarMicron} µm</text>
                  </g>
                )}
                <circle cx="150" cy="150" r="148" fill="none" stroke="black" strokeWidth="8" opacity="0.7" />
                <radialGradient id="vig" cx="50%" cy="50%" r="50%">
                  <stop offset="70%" stopColor="transparent"/>
                  <stop offset="100%" stopColor="rgba(0,0,0,0.6)"/>
                </radialGradient>
                <circle cx="150" cy="150" r="148" fill="url(#vig)"/>
                {light < 20 && <circle cx="150" cy="150" r="148" fill={`rgba(0,0,0,${(20-light)/25})`}/>}
                {objective === '100x' && oilApplied && <circle cx="150" cy="150" r="148" fill="rgba(200,220,255,0.06)" />}
                {objective === '100x' && !oilApplied && <circle cx="150" cy="150" r="148" fill="rgba(200,220,255,0.04)" />}
              </svg>
              <div className="absolute bottom-2 right-2 text-xs text-white/50 pointer-events-none select-none">
                {measureMode ? 'Click to measure' : 'drag to pan'}
              </div>
            </div>
          </div>

          {isPerfect && perfectAchieved && (
            <div className="mt-3 rounded-xl p-3 flex items-start gap-2 border" style={{ background: '#F2F8F4', borderColor: '#A8D5B6' }}>
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-800">
                <strong>In focus at {Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x!</strong> You can see {specimenInfo.desc.toLowerCase()}. Drag the slide to explore different areas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Specimen, Data, Notebook */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Specimen Selection */}
        <div className="sim-panel">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Specimen</h3>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {SPECIMENS.map(s => (
              <button key={s.id} onClick={() => { setSpecimen(s.id); resetSlide(); }}
                className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${specimen === s.id ? 'border-primary' : 'border-border hover:border-primary/40'}`}
                style={specimen === s.id ? { background: 'hsl(var(--primary)/0.08)' } : {}}>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.id === 'onion' ? '#c8956c' : s.id === 'cheek' ? '#e8b4a0' : s.id === 'bacteria' ? '#7ec8c8' : s.id === 'blood' ? '#C47B6B' : '#66bb6a' }} />
                <div>
                  <div className="text-sm font-semibold">{s.label}</div>
                  <div className="text-xs text-muted-foreground">{s.size}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="sim-label">Staining</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
            {STAINS.map(s => (
              <button key={s.id} onClick={() => setStain(s.id)}
                className={`p-2 rounded-lg border text-xs font-semibold transition-all ${stain === s.id ? 'border-2 text-white' : 'border-border text-muted-foreground'}`}
                style={stain === s.id ? { borderColor: s.id === 'none' ? '#94a3b8' : s.color, background: s.id === 'none' ? '#94a3b8' : s.color } : {}}>
                {s.label}
              </button>
            ))}
          </div>
          {stain !== 'none' && !stained && (
            <button onClick={applyStain} className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: STAINS.find(s=>s.id===stain)!.color }}>
              Apply Stain to Slide
            </button>
          )}
          {stained && <div className="text-xs text-green-600 font-semibold p-2 rounded-lg bg-green-50">Stain applied</div>}
          {stain !== 'none' && <p className="text-xs text-muted-foreground mt-1">{STAINS.find(s=>s.id===stain)!.targets}</p>}
        </div>

        {/* Specimen Data */}
        <div className="sim-panel">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Specimen Data</h3>
          <p className="text-sm text-foreground mb-3">{specimenInfo.desc}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { label: 'Domain', val: specimenInfo.domain },
              { label: 'Cell Wall', val: specimenInfo.wall },
              { label: 'Size', val: specimenInfo.size },
            ].map(item => (
              <div key={item.label} className="bg-muted rounded-lg p-2">
                <div className="text-xs text-muted-foreground mb-0.5">{item.label}</div>
                <div className="text-xs font-semibold">{item.val}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 rounded-lg bg-muted text-xs text-muted-foreground">
            <Lightbulb className="w-3 h-3 inline mr-1" />
            <strong>Tip:</strong> {objective === '4x' ? 'Start here to find your sample. Use coarse focus.' : objective === '10x' ? 'Good for tissue-level view. Use coarse then fine focus.' : objective === '40x' ? 'Use only fine focus here — coarse may crack the slide.' : 'Use oil immersion for maximum resolution. Fine focus only.'}
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
              <ZoomIn className="w-3 h-3 text-primary" />
              <h3 className="font-bold text-xs" style={{ fontFamily: 'Space Grotesk' }}>Optical Properties</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Magnification', val: `${Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x` },
                { label: 'NA', val: obj.na },
                { label: 'Resolution', val: `${(0.61 * 550 / (parseFloat(obj.na) * 1000)).toFixed(2)} µm` },
                { label: 'Depth of Field', val: objective === '4x' ? '~700 µm' : objective === '10x' ? '~100 µm' : objective === '40x' ? '~10 µm' : '~1 µm' },
              ].map(item => (
                <div key={item.label} className="bg-muted rounded-lg p-2">
                  <div className="text-muted-foreground">{item.label}</div>
                  <div className="font-mono font-bold">{item.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lab Notebook */}
        <div className="sim-panel">
          <h3 className="font-bold text-sm mb-2" style={{ fontFamily: 'Space Grotesk' }}>Lab Notebook</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <input type="text" value={obsInput} onChange={e => setObsInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addObs()}
              placeholder={`Observation at ${Math.round(obj.mag * (eyepiece === 'WF15x' ? 1.5 : 1))}x...`}
              className="flex-1 px-3 py-2 text-xs rounded-lg border" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }} />
            <button onClick={addObs} className="px-3 py-2 rounded-lg text-xs font-semibold text-white" style={{ background: '#1A3550' }}>Add</button>
          </div>
          {observations.map((o, i) => (
            <div key={i} className="text-xs px-2 py-1 rounded bg-muted mb-1 flex gap-2">
              <span className="text-muted-foreground font-mono">{i+1}.</span>
              <span>{o}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
