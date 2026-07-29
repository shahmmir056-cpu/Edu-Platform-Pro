import { useState, useMemo } from 'react';

type Enzyme = 'EcoRI' | 'HindIII' | 'BamHI';
type Allele = 'taster' | 'nontaster';

interface EnzymeData {
  id: Enzyme;
  recognition: string;
  cutPattern: string;
  color: string;
  stickyLabel: string;
  overhangBp: number;
  cutsT: number[];
  cutsN: number[];
}

const ENZYMES: EnzymeData[] = [
  {
    id: 'EcoRI',
    recognition: '5\'...GAATTC...3\'',
    cutPattern: 'G|AATTC',
    color: '#C47B6B',
    stickyLabel: "5' overhang",
    overhangBp: 4,
    cutsT: [0, 28, 72, 100],
    cutsN: [0, 45, 100],
  },
  {
    id: 'HindIII',
    recognition: '5\'...AAGCTT...3\'',
    cutPattern: 'A|AGCTT',
    color: '#5B7FA5',
    stickyLabel: "5' overhang",
    overhangBp: 4,
    cutsT: [0, 35, 65, 100],
    cutsN: [0, 60, 100],
  },
  {
    id: 'BamHI',
    recognition: '5\'...GGATCC...3\'',
    cutPattern: 'G|GATCC',
    color: '#6A9B7A',
    stickyLabel: "5' overhang",
    overhangBp: 4,
    cutsT: [0, 20, 55, 80, 100],
    cutsN: [0, 40, 70, 100],
  },
];

const PLASMID_SIZE_KB = 6.0;
const GENE_LENGTH_KB = 4.5;

function getFragments(cuts: number[]): number[] {
  const sorted = [...cuts].sort((a, b) => a - b);
  const frags: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    frags.push(Math.round((sorted[i] - sorted[i - 1]) / 100 * GENE_LENGTH_KB * 1000));
  }
  return frags.sort((a, b) => b - a);
}

function migrationY(bp: number, progress: number, totalH: number): number {
  const maxDist = totalH * 0.82;
  return (1 - Math.log10(bp) / Math.log10(6000)) * maxDist * progress;
}

function generateStarFragments(): number[] {
  const starFrags = [
    Math.floor(Math.random() * 800) + 100,
    Math.floor(Math.random() * 600) + 150,
  ];
  return starFrags;
}

export default function RestrictionFragment() {
  const [selectedEnzymes, setSelectedEnzymes] = useState<Enzyme[]>(['EcoRI']);
  const [digested, setDigested] = useState(false);
  const [loadingDyeAdded, setLoadingDyeAdded] = useState(false);
  const [gelRan, setGelRan] = useState(false);
  const [gelProgress, setGelProgress] = useState(0);
  const [uvOn, setUvOn] = useState(false);
  const [tempC, setTempC] = useState(37);
  const [incubationTime, setIncubationTime] = useState(60);
  const [starFrags, setStarFrags] = useState<number[]>([]);

  const enzymeMap = useMemo(() => {
    const map = new Map<Enzyme, EnzymeData>();
    ENZYMES.forEach(e => map.set(e.id, e));
    return map;
  }, []);

  const primaryEnzyme = enzymeMap.get(selectedEnzymes[0])!;

  const combinedCutsT = useMemo(() => {
    if (selectedEnzymes.length === 1) return primaryEnzyme.cutsT;
    const allCuts = new Set<number>();
    selectedEnzymes.forEach(eid => {
      const e = enzymeMap.get(eid)!;
      e.cutsT.forEach(c => allCuts.add(c));
    });
    return [...allCuts].sort((a, b) => a - b);
  }, [selectedEnzymes, primaryEnzyme, enzymeMap]);

  const combinedCutsN = useMemo(() => {
    if (selectedEnzymes.length === 1) return primaryEnzyme.cutsN;
    const allCuts = new Set<number>();
    selectedEnzymes.forEach(eid => {
      const e = enzymeMap.get(eid)!;
      e.cutsN.forEach(c => allCuts.add(c));
    });
    return [...allCuts].sort((a, b) => a - b);
  }, [selectedEnzymes, primaryEnzyme, enzymeMap]);

  const tasterFrags = useMemo(() => getFragments(combinedCutsT), [combinedCutsT]);
  const nontasterFrags = useMemo(() => getFragments(combinedCutsN), [combinedCutsN]);

  const activityLevel = tempC <= 25 ? 0.5 : tempC >= 50 ? 0 : tempC <= 37 ? 1.0 : 1.0 - (tempC - 37) / 13;
  const isStarRisk = tempC > 42;

  const digest = () => {
    setDigested(true);
    if (isStarRisk) {
      setStarFrags(generateStarFragments());
    }
  };

  const addLoadingDye = () => {
    setLoadingDyeAdded(true);
  };

  const runGel = () => {
    setGelRan(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 0.015;
      setGelProgress(Math.min(1, prog));
      if (prog >= 1) clearInterval(interval);
    }, 60);
  };

  const reset = () => {
    setDigested(false);
    setLoadingDyeAdded(false);
    setGelRan(false);
    setGelProgress(0);
    setUvOn(false);
    setStarFrags([]);
  };

  const toggleEnzyme = (eid: Enzyme) => {
    if (selectedEnzymes.includes(eid)) {
      if (selectedEnzymes.length === 1) return;
      setSelectedEnzymes(prev => prev.filter(e => e !== eid));
    } else {
      if (selectedEnzymes.length >= 2) return;
      setSelectedEnzymes(prev => [...prev, eid]);
    }
  };

  const GEL_H = 280, GEL_W = 360;
  const WELL_Y = 28;
  const LADDER_FRAGS = [100, 250, 500, 1000, 2000, 4000];

  const gelSamples = useMemo(() => {
    const samples: { label: string; frags: number[]; color: string }[] = [
      { label: 'Ladder', frags: LADDER_FRAGS, color: '#94a3b8' },
      { label: 'Taster', frags: tasterFrags, color: '#8B7BB5' },
      { label: 'Non-Taster', frags: nontasterFrags, color: '#5B7FA5' },
    ];
    if (isStarRisk && starFrags.length > 0) {
      samples[1] = { label: 'Taster', frags: [...tasterFrags, ...starFrags], color: '#8B7BB5' };
      samples[2] = { label: 'Non-Taster', frags: [...nontasterFrags, ...starFrags], color: '#5B7FA5' };
    }
    return samples;
  }, [tasterFrags, nontasterFrags, isStarRisk, starFrags]);

  const LANE_W = GEL_W / gelSamples.length;

  const PLASMID_R = 90;
  const PLASMID_CX = 110;
  const PLASMID_CY = 110;

  const plasmidRestrictionSites = useMemo(() => {
    const sites: { angle: number; color: string; label: string; enzymeId: Enzyme }[] = [];
    selectedEnzymes.forEach(eid => {
      const e = enzymeMap.get(eid)!;
      e.cutsT.slice(1, -1).forEach(pos => {
        const angle = (pos / 100) * 360 - 90;
        sites.push({ angle, color: e.color, label: e.id, enzymeId: eid });
      });
    });
    return sites;
  }, [selectedEnzymes, enzymeMap]);

  const enzymeColors = selectedEnzymes.map(eid => enzymeMap.get(eid)!.color);

  return (
    <div className="sim-container">
      {/* Star Activity Warning Banner */}
      {isStarRisk && (
        <div className="mb-4 p-3 rounded-xl border-2 flex items-center gap-2"
          style={{ background: '#F5EDE0', borderColor: '#B89555' }}>
          <span className="text-lg">⚠️</span>
          <div>
            <div className="font-bold text-sm text-amber-800">Star Activity Risk</div>
            <div className="text-xs text-amber-700">
              Temperature {tempC}°C exceeds {42}°C. Non-specific cuts may occur, producing extra bands on the gel.
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls Column */}
        <div className="space-y-4">
          {/* Plasmid Map */}
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'Space Grotesk' }}>Plasmid Map</h3>
            <p className="text-xs text-muted-foreground mb-3">Circular plasmid showing restriction sites. Select enzymes to see cut positions.</p>
            <div className="flex justify-center">
              <svg width="100%" height={PLASMID_CY * 2 + 40} viewBox={`${-20} ${-20} ${PLASMID_CX * 2 + 40} ${PLASMID_CY * 2 + 40}`}>
                {/* Plasmid backbone */}
                <circle cx={PLASMID_CX} cy={PLASMID_CY} r={PLASMID_R}
                  fill="none" stroke="#d1d5db" strokeWidth="4" strokeDasharray="2,1" />
                {/* Gene region arc */}
                <path
                  d={(() => {
                    const startAngle = 0;
                    const endAngle = 360;
                    const arcStart = (-90 + startAngle) * Math.PI / 180;
                    const arcEnd = (-90 + endAngle * 0.6) * Math.PI / 180;
                    const x1 = PLASMID_CX + PLASMID_R * Math.cos(arcStart);
                    const y1 = PLASMID_CY + PLASMID_R * Math.sin(arcStart);
                    const x2 = PLASMID_CX + PLASMID_R * Math.cos(arcEnd);
                    const y2 = PLASMID_CY + PLASMID_R * Math.sin(arcEnd);
                    return `M ${x1} ${y1} A ${PLASMID_R} ${PLASMID_R} 0 1 1 ${x2} ${y2}`;
                  })()}
                  fill="none" stroke="#B5ABD0" strokeWidth="6" strokeLinecap="round"
                />
                {/* Gene label */}
                <text x={PLASMID_CX} y={PLASMID_CY - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="#6B60A0" fontFamily="Space Grotesk">
                  TAS2R38
                </text>
                <text x={PLASMID_CX} y={PLASMID_CY + 2} textAnchor="middle" fontSize="8" fill="#8B7BB5">
                  {PLASMID_SIZE_KB} kb plasmid
                </text>
                {/* Origin of replication marker */}
                <g transform={`translate(${PLASMID_CX}, ${PLASMID_CY}) rotate(180) translate(-${PLASMID_CX}, -${PLASMID_CY})`}>
                  <text x={PLASMID_CX} y={PLASMID_CY - PLASMID_R - 10} textAnchor="middle" fontSize="7" fill="#9ca3af">
                    ori
                  </text>
                </g>
                {/* Restriction site tick marks */}
                {plasmidRestrictionSites.map((site, i) => {
                  const rad = (site.angle * Math.PI) / 180;
                  const x1 = PLASMID_CX + (PLASMID_R - 8) * Math.cos(rad);
                  const y1 = PLASMID_CY + (PLASMID_R - 8) * Math.sin(rad);
                  const x2 = PLASMID_CX + (PLASMID_R + 8) * Math.cos(rad);
                  const y2 = PLASMID_CY + (PLASMID_R + 8) * Math.sin(rad);
                  const labelX = PLASMID_CX + (PLASMID_R + 18) * Math.cos(rad);
                  const labelY = PLASMID_CY + (PLASMID_R + 18) * Math.sin(rad);
                  return (
                    <g key={i}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={site.color} strokeWidth="2.5" strokeLinecap="round" />
                      <circle cx={PLASMID_CX + PLASMID_R * Math.cos(rad)} cy={PLASMID_CY + PLASMID_R * Math.sin(rad)} r="3" fill={site.color} />
                      <text x={labelX} y={labelY + 3} textAnchor="middle" fontSize="7" fontWeight="700" fill={site.color}>
                        {site.label}
                      </text>
                    </g>
                  );
                })}
                {/* Arrow for direction */}
                <defs>
                  <marker id="plasmidArrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                    <polygon points="0 0, 6 2, 0 4" fill="#B5ABD0" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          {/* Gene Schematic */}
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-2" style={{ fontFamily: 'Space Grotesk' }}>TAS2R38 Gene Schematic</h3>
            <p className="text-xs text-muted-foreground mb-4">The TAS2R38 gene encodes a bitter taste receptor. SNPs create different restriction sites between tasters (PAV/PAV) and non-tasters (AVI/AVI).</p>

            {(['taster', 'nontaster'] as Allele[]).map(allele => {
              const cuts = allele === 'taster' ? combinedCutsT : combinedCutsN;
              const frags = getFragments(cuts);
              return (
                <div key={allele} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-xs font-bold" style={{ color: allele === 'taster' ? '#8B7BB5' : '#5B7FA5' }}>
                      {allele === 'taster' ? 'Taster Allele (PAV)' : 'Non-Taster Allele (AVI)'}
                    </div>
                    <div className="text-xs text-muted-foreground">{GENE_LENGTH_KB} kb total</div>
                  </div>
                  <div className="relative h-8 bg-muted rounded-full overflow-hidden">
                    <div className="absolute inset-0 rounded-full" style={{ background: allele === 'taster' ? 'linear-gradient(90deg, #ddd6fe, #B5ABD0)' : 'linear-gradient(90deg, #C5D5E6, #8BAEC5)' }} />
                    {cuts.slice(1, -1).map((pos, i) => (
                      <div key={i}
                        className="absolute top-0 bottom-0 w-0.5"
                        style={{ left: `${pos}%`, background: enzymeMap.get(selectedEnzymes.find(se => {
                          const e = enzymeMap.get(se)!;
                          return e.cutsT.includes(pos) || e.cutsN.includes(pos);
                        }) || selectedEnzymes[0])!.color }}>
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                          style={{ background: enzymeMap.get(selectedEnzymes.find(se => {
                            const e = enzymeMap.get(se)!;
                            return e.cutsT.includes(pos) || e.cutsN.includes(pos);
                          }) || selectedEnzymes[0])!.color }} />
                        {digested && (
                          <div className="absolute top-0 bottom-0 w-2 -left-0.5"
                            style={{ background: 'hsl(var(--background))', opacity: 0.8 }} />
                        )}
                      </div>
                    ))}
                    {digested && frags.map((frag, i) => {
                      const startPos = i === 0 ? 0 : cuts[i];
                      const endPos = cuts[i + 1];
                      const midPos = (startPos + endPos) / 2;
                      return (
                        <div key={i} className="absolute top-1/2 -translate-y-1/2 text-xs font-bold font-mono"
                          style={{ left: `${midPos}%`, transform: 'translate(-50%,-50%)', color: allele === 'taster' ? '#5B5090' : '#1e3a8a', fontSize: '9px' }}>
                          {frag >= 1000 ? `${(frag / 1000).toFixed(1)}kb` : `${frag}bp`}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enzyme Selector (Multi-Enzyme) */}
          <div className="sim-panel">
            <div className="sim-label">Restriction Enzymes</div>
            <p className="text-xs text-muted-foreground mb-3">Select 1 or 2 enzymes for single or double digest.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              {ENZYMES.map(e => {
                const isSelected = selectedEnzymes.includes(e.id);
                return (
                  <button key={e.id}
                    data-testid={`button-enzyme-${e.id}`}
                    onClick={() => toggleEnzyme(e.id)}
                    className={`p-3 rounded-xl border text-sm font-bold transition-all relative ${isSelected ? 'border-2 text-white' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                    style={isSelected ? { borderColor: e.color, background: e.color } : {}}>
                    {e.id}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-xs font-bold flex items-center justify-center"
                        style={{ color: e.color, fontSize: '10px' }}>
                        {selectedEnzymes.indexOf(e.id) + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-3 rounded-lg bg-muted text-xs font-mono">
              {selectedEnzymes.length === 1
                ? primaryEnzyme.recognition
                : `${enzymeMap.get(selectedEnzymes[0])!.id} + ${enzymeMap.get(selectedEnzymes[1])!.id} double digest`}
            </div>
            {selectedEnzymes.length === 2 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Combined cut sites from both enzymes will produce a union fragment set.
              </div>
            )}
          </div>

          {/* Sticky vs Blunt Ends Visualization */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Cleavage Pattern & Ends</h3>
            <div className="space-y-3">
              {selectedEnzymes.map(eid => {
                const e = enzymeMap.get(eid)!;
                const parts = e.cutPattern.split('|');
                const leftPart = parts[0];
                const rightPart = parts[1];
                return (
                  <div key={eid} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs" style={{ color: e.color }}>{e.id}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: e.color + '20', color: e.color }}>
                        {e.stickyLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-muted-foreground mb-0.5">5'</span>
                        <div className="flex items-center">
                          <span className="px-1 rounded" style={{ background: '#e5e7eb' }}>{leftPart}</span>
                          <span className="text-red-500 font-bold mx-0.5">↓</span>
                          <span className="px-1 rounded" style={{ background: e.color + '30' }}>{rightPart.slice(0, 1)}</span>
                          <span className="text-muted-foreground">{rightPart.slice(1)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-sm mt-1">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center">
                          <span className="text-muted-foreground">{leftPart.slice(0, -1)}</span>
                          <span className="px-1 rounded" style={{ background: e.color + '30' }}>{leftPart.slice(-1)}</span>
                          <span className="text-red-500 font-bold mx-0.5">↓</span>
                          <span className="px-1 rounded" style={{ background: '#e5e7eb' }}>{rightPart}</span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-0.5">3'</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                      <span className="text-xs text-muted-foreground">
                        {e.overhangBp}bp {e.stickyLabel.toLowerCase()} — produces compatible cohesive ends
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Incubation Controls */}
          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Incubation Conditions</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold">Temperature</label>
                  <span className="text-xs font-mono font-bold" style={{
                    color: isStarRisk ? '#B89555' : tempC < 30 ? '#5B7FA5' : '#6A9B7A'
                  }}>
                    {tempC}°C
                    {tempC === 37 && ' (optimal)'}
                    {tempC <= 25 && ' (50% activity)'}
                    {tempC > 42 && ' (⚠ star risk)'}
                  </span>
                </div>
                <input
                  type="range" min={25} max={50} step={1} value={tempC}
                  onChange={e => setTempC(Number(e.target.value))}
                  disabled={digested}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-50"
                  style={{
                    background: `linear-gradient(90deg, #5B7FA5 0%, #6A9B7A 50%, #B89555 75%, #C47B6B 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                  <span>25°C</span>
                  <span>37°C</span>
                  <span>42°C</span>
                  <span>50°C</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold">Incubation Time</label>
                  <span className="text-xs font-mono font-bold">{incubationTime} min</span>
                </div>
                <input
                  type="range" min={15} max={120} step={5} value={incubationTime}
                  onChange={e => setIncubationTime(Number(e.target.value))}
                  disabled={digested}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                  <span>15 min</span>
                  <span>60 min</span>
                  <span>120 min</span>
                </div>
              </div>

              <div className="p-2 rounded-lg text-xs" style={{
                background: isStarRisk ? '#F5EDE0' : activityLevel < 0.7 ? '#dbeafe' : '#F2F8F4',
                borderLeft: `3px solid ${isStarRisk ? '#B89555' : activityLevel < 0.7 ? '#5B7FA5' : '#6A9B7A'}`
              }}>
                <div className="font-bold" style={{
                  color: isStarRisk ? '#7A5A2E' : activityLevel < 0.7 ? '#1e40af' : '#166534'
                }}>
                  Activity: {Math.round(activityLevel * 100)}%
                </div>
                <p className="mt-0.5" style={{
                  color: isStarRisk ? '#a16207' : activityLevel < 0.7 ? '#1d4ed8' : '#15803d'
                }}>
                  {tempC <= 25
                    ? 'Low temperature reduces enzyme activity. Digestion may be incomplete.'
                    : isStarRisk
                      ? 'High temperature causes non-specific cutting (star activity). Extra bands may appear.'
                      : tempC === 37
                        ? 'Optimal temperature for restriction enzyme activity.'
                        : 'Acceptable temperature range for digestion.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="sim-panel">
            <div className="sim-label">Protocol Steps</div>
            <div className="space-y-2">
              {!digested && (
                <button onClick={digest}
                  data-testid="button-digest"
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
                  style={{ background: '#1A3550' }}>
                  Digest DNA
                </button>
              )}
              {digested && !loadingDyeAdded && (
                <button onClick={addLoadingDye}
                  data-testid="button-loading-dye"
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
                  style={{ background: '#8B7BB5' }}>
                  Add Loading Dye
                </button>
              )}
              {digested && loadingDyeAdded && !gelRan && (
                <button onClick={runGel}
                  data-testid="button-run-gel"
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
                  style={{ background: '#6A9B7A' }}>
                  Run Gel
                </button>
              )}
              {digested && !loadingDyeAdded && (
                <div className="text-xs text-muted-foreground italic">Next: Add loading dye before running gel</div>
              )}
              {digested && loadingDyeAdded && !gelRan && (
                <div className="text-xs text-muted-foreground italic">Next: Load samples and run electrophoresis</div>
              )}
              {gelRan && (
                <div className="text-xs font-semibold text-green-600">✓ Gel running — {Math.round(gelProgress * 100)}% complete</div>
              )}
              <button onClick={reset}
                className="w-full py-2.5 rounded-xl font-semibold text-sm border border-border hover:bg-muted transition-all">
                Reset Experiment
              </button>
            </div>
          </div>

          {/* Fragment Table */}
          {digested && (
            <div className="sim-panel">
              <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                Fragment Sizes ({selectedEnzymes.length === 1 ? 'Single' : 'Double'} Digest)
              </h3>
              {selectedEnzymes.length === 2 && (
                <div className="text-xs text-muted-foreground mb-2">
                  Fragments from {enzymeMap.get(selectedEnzymes[0])!.id} + {enzymeMap.get(selectedEnzymes[1])!.id}
                </div>
              )}
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 text-muted-foreground font-semibold">Band</th>
                    <th className="text-left py-1.5 font-semibold" style={{ color: '#8B7BB5' }}>Taster (PAV)</th>
                    <th className="text-left py-1.5 font-semibold" style={{ color: '#5B7FA5' }}>Non-Taster (AVI)</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(tasterFrags.length, nontasterFrags.length) }).map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1.5 font-mono">Band {i + 1}</td>
                      <td className="py-1.5 font-mono" style={{ color: '#8B7BB5' }}>
                        {tasterFrags[i] ? `${tasterFrags[i]}bp` : '-'}
                      </td>
                      <td className="py-1.5 font-mono" style={{ color: '#5B7FA5' }}>
                        {nontasterFrags[i] ? `${nontasterFrags[i]}bp` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {isStarRisk && starFrags.length > 0 && (
                <div className="mt-2 p-2 rounded-lg text-xs" style={{ background: '#F5EDE0', borderLeft: '3px solid #B89555' }}>
                  <div className="font-bold text-amber-800">Extra bands due to star activity</div>
                  <p className="text-amber-700 mt-0.5">
                    {starFrags.map(f => `${f}bp`).join(', ')} — these non-specific fragments would appear on the gel.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gel Visualization */}
        <div className="sim-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Gel Electrophoresis</h3>
            {gelProgress > 0.3 && (
              <button onClick={() => setUvOn(v => !v)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-all"
                style={{ background: uvOn ? '#8B7BB5' : '#1A3550' }}>
                {uvOn ? 'UV: ON' : 'UV: OFF'}
              </button>
            )}
          </div>

          {!gelRan ? (
            <div className="h-64 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm text-center px-4">
              {!digested
                ? 'Select enzyme(s) and digest DNA to begin'
                : !loadingDyeAdded
                  ? 'Add loading dye before running the gel'
                  : 'Ready to run — click Run Gel'}
            </div>
          ) : (
            <div className="flex justify-center">
              <div>
                <div className="flex justify-between mb-1 text-xs font-mono px-2" style={{ width: GEL_W + 20 }}>
                  <span style={{ color: '#C47B6B' }}>(-) Wells</span>
                  <span style={{ color: '#5B7FA5' }}>(+) Migration</span>
                </div>
                <svg width="100%" height={GEL_H + 20}>
                  <rect x="10" y="10" width={GEL_W} height={GEL_H} rx="8"
                    fill={uvOn ? '#05051a' : '#f5f5e8'} stroke="#d1d5db" strokeWidth="2" />
                  <rect x="10" y="8" width={GEL_W} height="4" rx="2" fill="#C47B6B" opacity="0.7" />
                  <rect x="10" y={GEL_H + 8} width={GEL_W} height="4" rx="2" fill="#5B7FA5" opacity="0.7" />

                  {gelSamples.map((sample, si) => {
                    const cx = 10 + si * LANE_W + LANE_W / 2;
                    return (
                      <g key={sample.label}>
                        <rect x={cx - 14} y={WELL_Y - 4} width="28" height="12" rx="3"
                          fill={uvOn ? '#0d0d2a' : '#c8c8b0'} stroke={uvOn ? '#333' : '#aaa'} strokeWidth="1" />
                        <text x={cx} y={GEL_H + 14} textAnchor="middle" fontSize="9"
                          fill={uvOn ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'} fontWeight="600">
                          {sample.label}
                        </text>
                        {sample.frags.map((bp, bi) => {
                          const dist = migrationY(bp, gelProgress, GEL_H - 55);
                          const bandY = WELL_Y + 12 + dist;
                          const bColor = uvOn
                            ? `rgba(160,220,255,0.9)`
                            : sample.color + 'cc';
                          return (
                            <g key={`${si}-${bi}`}>
                              <rect x={cx - LANE_W * 0.37} y={bandY - 3} width={LANE_W * 0.74} height={6} rx="2"
                                fill={bColor} />
                              {uvOn && gelProgress > 0.3 && (
                                <rect x={cx - LANE_W * 0.37} y={bandY - 6} width={LANE_W * 0.74} height={12} rx="4"
                                  fill="rgba(140,200,255,0.1)" filter="url(#g2)" />
                              )}
                              {sample.label === 'Ladder' && gelProgress > 0.8 && (
                                <text x={cx + LANE_W * 0.42} y={bandY + 3} fontSize="7.5"
                                  fill={uvOn ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)'}>
                                  {bp >= 1000 ? `${bp / 1000}kb` : `${bp}bp`}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </g>
                    );
                  })}

                  <defs>
                    <filter id="g2" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                </svg>
              </div>
            </div>
          )}

          {/* Interpretation */}
          {gelProgress > 0.8 && (
            <div className="mt-4 space-y-2">
              <div className="p-3 rounded-xl text-xs" style={{ background: '#F0ECF5', borderLeft: '3px solid #8B7BB5' }}>
                <div className="font-bold text-purple-800 mb-1">Taster Pattern</div>
                <p className="text-purple-700">Shows {tasterFrags.length} bands at {tasterFrags.map(f => f >= 1000 ? `${(f / 1000).toFixed(1)}kb` : `${f}bp`).join(', ')}. More cut sites = more bands = PTC taster genotype (PAV allele).</p>
              </div>
              <div className="p-3 rounded-xl text-xs" style={{ background: '#EEF2F6', borderLeft: '3px solid #5B7FA5' }}>
                <div className="font-bold text-blue-800 mb-1">Non-Taster Pattern</div>
                <p className="text-blue-700">Shows {nontasterFrags.length} bands at {nontasterFrags.map(f => f >= 1000 ? `${(f / 1000).toFixed(1)}kb` : `${f}bp`).join(', ')}. Fewer/different cut sites = non-taster genotype (AVI allele).</p>
              </div>
              {isStarRisk && (
                <div className="p-3 rounded-xl text-xs" style={{ background: '#F5EDE0', borderLeft: '3px solid #B89555' }}>
                  <div className="font-bold text-amber-800 mb-1">⚠ Star Activity Observed</div>
                  <p className="text-amber-700">Extra non-specific bands visible due to incubation at {tempC}°C. These extra fragments ({starFrags.map(f => `${f}bp`).join(', ')}) result from the enzyme cutting at degenerate recognition sites at elevated temperature.</p>
                </div>
              )}
              {selectedEnzymes.length === 2 && (
                <div className="p-3 rounded-xl text-xs" style={{ background: '#F2F8F4', borderLeft: '3px solid #6A9B7A' }}>
                  <div className="font-bold text-green-800 mb-1">Double Digest Result</div>
                  <p className="text-green-700">Using {enzymeMap.get(selectedEnzymes[0])!.id} + {enzymeMap.get(selectedEnzymes[1])!.id} produces {Math.max(tasterFrags.length, nontasterFrags.length)} bands (taster) and {nontasterFrags.length} bands (non-taster) from the union of all cut sites.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
