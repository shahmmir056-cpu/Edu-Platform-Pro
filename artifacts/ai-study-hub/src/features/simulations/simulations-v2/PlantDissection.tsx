import { useState, useEffect, useCallback } from 'react';
import { useLabControls } from './labControls';

interface PlantPart {
  id: string;
  name: string;
  function: string;
  color: string;
  hoverColor: string;
}

type Tool = 'forceps' | 'scalpel' | 'needle';
type Species = 'Hibiscus' | 'Lily';

const PARTS: PlantPart[] = [
  { id: 'petal', name: 'Petal', function: 'Attract pollinators with color, scent, and nectar guides. Part of the corolla.', color: '#C47B6B', hoverColor: '#C47B6B' },
  { id: 'sepal', name: 'Sepal', function: 'Protect the developing flower bud. Form the calyx. Usually green and leaf-like.', color: '#6A9B7A', hoverColor: '#6A9B7A' },
  { id: 'stamen-anther', name: 'Anther', function: 'Produces pollen grains containing male gametophytes. Part of the stamen.', color: '#B89555', hoverColor: '#B89555' },
  { id: 'stamen-filament', name: 'Filament', function: 'Supports the anther, positioning it for pollen dispersal. Part of the stamen.', color: '#B89555', hoverColor: '#B89555' },
  { id: 'pistil-stigma', name: 'Stigma', function: 'Sticky surface that traps pollen. Top of the pistil (female reproductive part).', color: '#8B7BB5', hoverColor: '#8B7BB5' },
  { id: 'pistil-style', name: 'Style', function: 'Connects stigma to ovary. Pollen tubes grow down through the style during fertilization.', color: '#8B7BB5', hoverColor: '#8B7BB5' },
  { id: 'pistil-ovary', name: 'Ovary', function: 'Contains ovules that develop into seeds. The ovary becomes the fruit after fertilization.', color: '#8B7BB5', hoverColor: '#8B7BB5' },
  { id: 'receptacle', name: 'Receptacle', function: 'The enlarged tip of the flower stalk that all floral parts are attached to.', color: '#A8D5B6', hoverColor: '#6A9B7A' },
];

const QUIZ_PARTS = ['Petal', 'Sepal', 'Anther', 'Filament', 'Stigma', 'Style', 'Ovary', 'Receptacle'];

const FLORAL_FORMULAS: Record<Species, { formula: string; explanation: Record<string, string> }> = {
  Hibiscus: {
    formula: '* K5 C5 A(∞) G(∞)',
    explanation: {
      '*': 'Actinomorphic (radially symmetrical) flower',
      'K5': '5 sepals forming the calyx',
      'C5': '5 petals forming the corolla',
      'A(∞)': 'Numerous stamens (monadelphous, fused by filaments)',
      'G(∞)': 'Many carpels in a syncarpous ovary (superior)',
    },
  },
  Lily: {
    formula: '* P3+3 A3+3 G(3)',
    explanation: {
      '*': 'Actinomorphic (radially symmetrical) flower',
      'P3+3': '6 tepals in two whorls of 3 (perianth, undifferentiated sepals and petals)',
      'A3+3': '6 stamens in two whorls of 3',
      'G(3)': '3 fused carpels in a syncarpous ovary (superior)',
    },
  },
};

const PETAL_ANGLES: Record<Species, number[]> = {
  Hibiscus: [0, 72, 144, 216, 288],
  Lily: [0, 120, 240],
};

const SEPAL_ANGLES: Record<Species, number[]> = {
  Hibiscus: [0, 72, 144, 216, 288],
  Lily: [0, 120, 240],
};

const STAMEN_ANGLES: Record<Species, number[]> = {
  Hibiscus: [0, 72, 144, 216, 288],
  Lily: [0, 60, 120, 180, 240, 300],
};

export default function PlantDissection() {
  const [dissected, setDissected] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [quizMode, setQuizMode] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [tool, setTool] = useState<Tool>('forceps');
  const [species, setSpecies] = useState<Species>('Hibiscus');
  const [microscopicView, setMicroscopicView] = useState<'anther' | 'stigma' | 'petal' | null>(null);
  const [showCrossSection, setShowCrossSection] = useState(false);
  const [pollinationActive, setPollinationActive] = useState(false);
  const [pollinationStage, setPollinationStage] = useState<number>(0);

  const progress = (dissected.size / PARTS.length) * 100;

  const { advancedOpen } = useLabControls({
    hasAdvanced: true,
    dataset: {
      name: "Dissected Flower Parts",
      columns: [
        { key: "part", label: "Part" },
        { key: "function", label: "Function" },
      ],
      rows: [...dissected].map(id => {
        const p = PARTS.find(pp => pp.id === id);
        return p ? { part: p.name, function: p.function } : { part: id, function: '' };
      }),
    },
  });

  const handlePartClick = (partId: string) => {
    if (quizMode) return;

    if (tool === 'scalpel' && partId === 'pistil-ovary') {
      setShowCrossSection(true);
      setSelected(partId);
      return;
    }

    if (tool === 'needle') {
      if (partId === 'stamen-anther') {
        setMicroscopicView('anther');
        setSelected(partId);
        return;
      }
      if (partId === 'pistil-stigma') {
        setMicroscopicView('stigma');
        setSelected(partId);
        return;
      }
      if (partId === 'petal') {
        setMicroscopicView('petal');
        setSelected(partId);
        return;
      }
    }

    setDissected(prev => new Set([...prev, partId]));
    setSelected(partId);
  };

  const selectedPart = PARTS.find(p => p.id === selected);

  const handleQuizSubmit = () => setQuizSubmitted(true);
  const correctCount = Object.entries(quizAnswers).filter(([id, ans]) => {
    const part = PARTS.find(p => p.id === id);
    return part && ans.toLowerCase().trim() === part.name.toLowerCase();
  }).length;

  const resetAll = () => {
    setDissected(new Set());
    setSelected(null);
    setQuizMode(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setTool('forceps');
    setMicroscopicView(null);
    setShowCrossSection(false);
    setPollinationActive(false);
    setPollinationStage(0);
  };

  const startPollination = useCallback(() => {
    setPollinationActive(true);
    setPollinationStage(0);

    const stages = [
      { delay: 0, stage: 1 },
      { delay: 1200, stage: 2 },
      { delay: 2800, stage: 3 },
      { delay: 4200, stage: 4 },
    ];

    const timers = stages.map(({ delay, stage }) =>
      setTimeout(() => setPollinationStage(stage), delay)
    );

    setTimeout(() => {
      setPollinationActive(false);
      setPollinationStage(0);
    }, 6000);

    return () => timers.forEach(clearTimeout);
  }, []);

  const petalAngles = PETAL_ANGLES[species];
  const sepalAngles = SEPAL_ANGLES[species];
  const stamenAngles = STAMEN_ANGLES[species];
  const formula = FLORAL_FORMULAS[species];

  const renderFlowerSvg = (isQuiz: boolean) => {
    const fillFn = (partId: string, baseColor: string, hoverColor: string) => {
      if (isQuiz) return '#e5e7eb';
      return dissected.has(partId) ? hoverColor : baseColor;
    };
    const strokeFn = (partId: string) => {
      if (isQuiz) return 'none';
      return selected === partId ? '#1A2A35' : 'none';
    };
    const handleClick = (partId: string) => {
      if (isQuiz) return undefined;
      return () => handlePartClick(partId);
    };
    const pointerStyle = isQuiz ? {} : { cursor: 'pointer' as const };

    return (
      <svg viewBox="0 0 300 340" className="w-full max-w-xs cursor-pointer" style={{ cursor: isQuiz ? 'default' : 'crosshair' }}>
        <rect x="145" y="270" width="10" height="60" rx="3" fill={isQuiz ? '#94a3b8' : '#6A9B7A'} />
        <ellipse cx="130" cy="295" rx="22" ry="10" fill={isQuiz ? '#cbd5e1' : '#6A9B7A'} transform="rotate(-30 130 295)" />
        <ellipse cx="170" cy="308" rx="22" ry="10" fill={isQuiz ? '#cbd5e1' : '#6A9B7A'} transform="rotate(30 170 308)" />

        <ellipse cx="150" cy="265" rx="18" ry="8"
          fill={fillFn('receptacle', PARTS.find(p => p.id === 'receptacle')!.color, PARTS.find(p => p.id === 'receptacle')!.hoverColor)}
          stroke={strokeFn('receptacle')} strokeWidth="2"
          className="transition-all hover:opacity-90"
          onClick={handleClick('receptacle')} style={pointerStyle} />

        {sepalAngles.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 150 + Math.cos(rad) * 42;
          const cy = 175 + Math.sin(rad) * 35;
          return (
            <ellipse key={`sepal-${i}`} cx={cx} cy={cy} rx="14" ry="28"
              fill={fillFn('sepal', PARTS.find(p => p.id === 'sepal')!.color, PARTS.find(p => p.id === 'sepal')!.hoverColor)}
              stroke={strokeFn('sepal')} strokeWidth="1.5"
              transform={`rotate(${angle} ${cx} ${cy})`}
              className="transition-all hover:opacity-90" opacity="0.85"
              onClick={handleClick('sepal')} style={pointerStyle} />
          );
        })}

        {petalAngles.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 150 + Math.cos(rad) * 58;
          const cy = 155 + Math.sin(rad) * 50;
          return (
            <ellipse key={`petal-${i}`} cx={cx} cy={cy} rx="22" ry="40"
              fill={fillFn('petal', PARTS.find(p => p.id === 'petal')!.color, PARTS.find(p => p.id === 'petal')!.hoverColor)}
              stroke={strokeFn('petal')} strokeWidth="1.5"
              transform={`rotate(${angle} ${cx} ${cy})`}
              className="transition-all hover:opacity-90" opacity="0.9"
              onClick={handleClick('petal')} style={pointerStyle} />
          );
        })}

        {stamenAngles.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const ax = 150 + Math.cos(rad) * 30;
          const ay = 165 + Math.sin(rad) * 25;
          return (
            <g key={`stamen-${i}`}>
              <line x1={150 + Math.cos(rad) * 8} y1={165 + Math.sin(rad) * 8} x2={ax} y2={ay}
                stroke={isQuiz ? '#d1d5db' : (dissected.has('stamen-filament') ? PARTS.find(p => p.id === 'stamen-filament')!.hoverColor : '#B89555')}
                strokeWidth="2.5" onClick={handleClick('stamen-filament')} style={pointerStyle} />
              <ellipse cx={ax} cy={ay} rx="6" ry="4"
                fill={fillFn('stamen-anther', PARTS.find(p => p.id === 'stamen-anther')!.color, PARTS.find(p => p.id === 'stamen-anther')!.hoverColor)}
                stroke={strokeFn('stamen-anther')} strokeWidth="1.5"
                className="transition-all hover:opacity-90"
                onClick={handleClick('stamen-anther')} style={pointerStyle} />
            </g>
          );
        })}

        <ellipse cx="150" cy="185" rx="14" ry="10"
          fill={fillFn('pistil-ovary', PARTS.find(p => p.id === 'pistil-ovary')!.color, PARTS.find(p => p.id === 'pistil-ovary')!.hoverColor)}
          stroke={strokeFn('pistil-ovary')} strokeWidth="2"
          onClick={handleClick('pistil-ovary')} style={pointerStyle} />
        <rect x="147" y="148" width="6" height="38"
          fill={fillFn('pistil-style', PARTS.find(p => p.id === 'pistil-style')!.color, PARTS.find(p => p.id === 'pistil-style')!.hoverColor)}
          onClick={handleClick('pistil-style')} style={pointerStyle} />
        <ellipse cx="150" cy="145" rx="11" ry="7"
          fill={fillFn('pistil-stigma', PARTS.find(p => p.id === 'pistil-stigma')!.color, PARTS.find(p => p.id === 'pistil-stigma')!.hoverColor)}
          stroke={strokeFn('pistil-stigma')} strokeWidth="2"
          onClick={handleClick('pistil-stigma')} style={pointerStyle} />

        {!isQuiz && dissected.has('petal') && <text x="220" y="100" fontSize="9" fill={PARTS.find(p => p.id === 'petal')!.hoverColor} fontWeight="600">Petal</text>}
        {!isQuiz && dissected.has('sepal') && <text x="10" y="200" fontSize="9" fill={PARTS.find(p => p.id === 'sepal')!.hoverColor} fontWeight="600">Sepal</text>}
        {!isQuiz && dissected.has('stamen-anther') && <text x="10" y="130" fontSize="9" fill={PARTS.find(p => p.id === 'stamen-anther')!.hoverColor} fontWeight="600">Anther</text>}
        {!isQuiz && dissected.has('pistil-stigma') && <text x="170" y="140" fontSize="9" fill={PARTS.find(p => p.id === 'pistil-stigma')!.hoverColor} fontWeight="600">Stigma</text>}
        {!isQuiz && dissected.has('pistil-style') && <text x="168" y="160" fontSize="9" fill={PARTS.find(p => p.id === 'pistil-style')!.hoverColor} fontWeight="600">Style</text>}
        {!isQuiz && dissected.has('pistil-ovary') && <text x="168" y="192" fontSize="9" fill={PARTS.find(p => p.id === 'pistil-ovary')!.hoverColor} fontWeight="600">Ovary</text>}
      </svg>
    );
  };

  return (
    <div className="sim-container">
      {advancedOpen && (
        <div className="sim-panel mb-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
              Floral Formula — {species}
            </h3>
            <button
              onClick={() => setSpecies(s => (s === 'Hibiscus' ? 'Lily' : 'Hibiscus'))}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border"
              style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }}
            >
              Switch to {species === 'Hibiscus' ? 'Lily' : 'Hibiscus'}
            </button>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-mono text-base font-bold px-3 py-1.5 rounded-lg" style={{ background: 'rgba(232,133,46,0.12)', color: '#C46A10' }}>
              {FLORAL_FORMULAS[species].formula}
            </span>
            <span className="text-[10px]" style={{ color: '#9A9A9A' }}>Actinomorphic floral formula (floral structure shorthand)</span>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="px-3 py-1.5 text-[10px] font-bold uppercase" style={{ color: '#2D2D2D', borderBottom: '1px solid rgba(45,45,45,0.12)' }}>Symbol</th>
                  <th className="px-3 py-1.5 text-[10px] font-bold uppercase" style={{ color: '#2D2D2D', borderBottom: '1px solid rgba(45,45,45,0.12)' }}>Meaning</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(FLORAL_FORMULAS[species].explanation).map(([k, v]) => (
                  <tr key={k}>
                    <td className="px-3 py-1 text-[11px] font-mono font-bold" style={{ color: '#C46A10' }}>{k}</td>
                    <td className="px-3 py-1 text-[11px]" style={{ color: '#4A4A4A' }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="sim-panel">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>
              {quizMode ? 'Label the Diagram' : microscopicView ? `Microscopic: ${microscopicView === 'anther' ? 'Pollen Grains' : microscopicView === 'stigma' ? 'Papillae' : 'Trichomes'}` : showCrossSection ? 'Ovary Cross-Section' : 'Flower Dissection'}
            </h3>
            <div className="flex gap-2 flex-wrap">
              {(microscopicView || showCrossSection) && (
                <button
                  onClick={() => { setMicroscopicView(null); setShowCrossSection(false); }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={resetAll}
                className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                Reset
              </button>
              {progress === 100 && !quizMode && (
                <button
                  onClick={() => setQuizMode(true)}
                  data-testid="button-start-quiz"
                  className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-all hover:scale-105"
                  style={{ background: '#B89555', color: '#1A2A35' }}
                >
                  Take Quiz
                </button>
              )}
            </div>
          </div>

          {!quizMode && !microscopicView && !showCrossSection && (
            <>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground">Tool:</span>
                {(['forceps', 'scalpel', 'needle'] as Tool[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTool(t)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                      tool === t ? 'border-primary bg-primary/10 font-semibold' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <span>{t === 'forceps' ? '🔧' : t === 'scalpel' ? '🔪' : '🔬'}</span>
                    <span className="capitalize">{t}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground">Species:</span>
                {(['Hibiscus', 'Lily'] as Species[]).map(s => (
                  <button
                    key={s}
                    onClick={() => { setSpecies(s); resetAll(); }}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      species === s ? 'border-primary bg-primary/10 font-semibold' : 'border-border hover:bg-muted'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {tool === 'scalpel' && <p className="text-xs text-muted-foreground mb-2">Scalpel active — click the ovary for a cross-section view.</p>}
              {tool === 'needle' && <p className="text-xs text-muted-foreground mb-2">Microscope active — click anther, stigma, or petal for microscopic detail.</p>}
              {tool === 'forceps' && <p className="text-xs text-muted-foreground mb-4">Click each part of the flower to dissect and learn about its function.</p>}
            </>
          )}

          {microscopicView && (
            <div className="flex justify-center">
              <svg viewBox="0 0 300 300" className="w-full max-w-xs" style={{ background: '#3A3A3A', borderRadius: 12 }}>
                <circle cx="150" cy="150" r="140" fill="none" stroke="#475569" strokeWidth="2" />
                <circle cx="150" cy="150" r="138" fill="#2A2A2A" />

                {microscopicView === 'anther' && (
                  <g>
                    <text x="150" y="28" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">Pollen Grains (×400)</text>
                    {Array.from({ length: 18 }).map((_, i) => {
                      const angle = (i * 360 / 18) * Math.PI / 180;
                      const r = 30 + Math.random() * 70;
                      const cx = 150 + Math.cos(angle) * r;
                      const cy = 160 + Math.sin(angle) * r;
                      const size = 8 + Math.random() * 6;
                      return (
                        <g key={i}>
                          <circle cx={cx} cy={cy} r={size} fill="#B89555" stroke="#B89555" strokeWidth="1" />
                          {Array.from({ length: 6 }).map((_, j) => {
                            const sa = (j * 60) * Math.PI / 180;
                            return (
                              <line key={j} x1={cx + Math.cos(sa) * size} y1={cy + Math.sin(sa) * size}
                                x2={cx + Math.cos(sa) * (size + 4)} y2={cy + Math.sin(sa) * (size + 4)}
                                stroke="#B89555" strokeWidth="1" />
                            );
                          })}
                          <circle cx={cx - size * 0.2} cy={cy - size * 0.2} r={size * 0.25} fill="#B89555" opacity="0.7" />
                        </g>
                      );
                    })}
                    <text x="150" y="290" textAnchor="middle" fontSize="9" fill="#94a3b8">Pollen: male gametophytes with exine wall</text>
                  </g>
                )}

                {microscopicView === 'stigma' && (
                  <g>
                    <text x="150" y="28" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">Stigma Papillae (×200)</text>
                    <rect x="40" y="160" width="220" height="100" rx="8" fill="#8B7BB5" opacity="0.3" />
                    {Array.from({ length: 12 }).map((_, i) => {
                      const x = 60 + (i % 4) * 60;
                      const baseY = 165;
                      const height = 40 + Math.random() * 25;
                      return (
                        <g key={i}>
                          <path d={`M${x},${baseY} Q${x - 5},${baseY - height / 2} ${x},${baseY - height}`}
                            fill="none" stroke="#8B7BB5" strokeWidth="3" strokeLinecap="round" />
                          <ellipse cx={x} cy={baseY - height} rx="5" ry="3" fill="#8B7BB5" />
                        </g>
                      );
                    })}
                    {Array.from({ length: 4 }).map((_, i) => {
                      const x = 80 + i * 50;
                      const y = 100 - Math.random() * 20;
                      return (
                        <circle key={`dust-${i}`} cx={x} cy={y} r="3" fill="#B89555" opacity="0.8" />
                      );
                    })}
                    <text x="150" y="290" textAnchor="middle" fontSize="9" fill="#94a3b8">Papillae: sticky projections trap pollen grains</text>
                  </g>
                )}

                {microscopicView === 'petal' && (
                  <g>
                    <text x="150" y="28" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="600">Petal Surface (×100)</text>
                    <rect x="30" y="40" width="240" height="220" rx="8" fill="#C47B6B" opacity="0.2" />
                    {Array.from({ length: 8 }).map((_, i) => {
                      const x1 = 50 + Math.random() * 200;
                      const y1 = 50 + Math.random() * 180;
                      const angle = Math.random() * 360;
                      const len = 15 + Math.random() * 10;
                      const rad = (angle * Math.PI) / 180;
                      return (
                        <g key={i}>
                          <line x1={x1} y1={y1} x2={x1 + Math.cos(rad) * len} y2={y1 + Math.sin(rad) * len}
                            stroke="#C47B6B" strokeWidth="1" opacity="0.6" />
                          <ellipse cx={x1 + Math.cos(rad) * len} cy={y1 + Math.sin(rad) * len}
                            rx="2" ry="4" fill="#C47B6B" opacity="0.5"
                            transform={`rotate(${angle} ${x1 + Math.cos(rad) * len} ${y1 + Math.sin(rad) * len})`} />
                        </g>
                      );
                    })}
                    {Array.from({ length: 6 }).map((_, i) => {
                      const startX = 40 + i * 40;
                      const points = Array.from({ length: 8 }).map((_, j) => {
                        const y = 50 + j * 28;
                        const x = startX + Math.sin(j * 0.8) * 15;
                        return `${j === 0 ? 'M' : 'L'}${x},${y}`;
                      }).join(' ');
                      return <path key={i} d={points} fill="none" stroke="#C47B6B" strokeWidth="1.5" opacity="0.5" />;
                    })}
                    <text x="150" y="290" textAnchor="middle" fontSize="9" fill="#94a3b8">Trichomes & veins: surface detail at high magnification</text>
                  </g>
                )}
              </svg>
            </div>
          )}

          {showCrossSection && (
            <div className="flex justify-center">
              <svg viewBox="0 0 300 300" className="w-full max-w-xs">
                <circle cx="150" cy="150" r="130" fill="#fdf2f8" stroke="#8B7BB5" strokeWidth="3" />
                <circle cx="150" cy="150" r="120" fill="#fce7f3" stroke="#8B7BB5" strokeWidth="1" />
                <circle cx="150" cy="150" r="20" fill="#8B7BB5" stroke="#8B7BB5" strokeWidth="2" />
                {species === 'Hibiscus' ? (
                  <>
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                      const rad = (angle * Math.PI) / 180;
                      const ox = 150 + Math.cos(rad) * 55;
                      const oy = 150 + Math.sin(rad) * 55;
                      return (
                        <g key={`ovule-outer-${i}`}>
                          <ellipse cx={ox} cy={oy} rx="10" ry="7" fill="#B89555" stroke="#B89555" strokeWidth="1" />
                          <ellipse cx={ox} cy={oy} rx="4" ry="3" fill="#B89555" />
                        </g>
                      );
                    })}
                    {[0, 90, 180, 270].map((angle, i) => {
                      const rad = (angle * Math.PI) / 180;
                      const ox = 150 + Math.cos(rad) * 85;
                      const oy = 150 + Math.sin(rad) * 85;
                      return (
                        <g key={`ovule-inner-${i}`}>
                          <ellipse cx={ox} cy={oy} rx="10" ry="7" fill="#B89555" stroke="#B89555" strokeWidth="1" />
                          <ellipse cx={ox} cy={oy} rx="4" ry="3" fill="#B89555" />
                        </g>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {[0, 72, 144, 216, 288].map((angle, i) => {
                      const rad = (angle * Math.PI) / 180;
                      const ox = 150 + Math.cos(rad) * 65;
                      const oy = 150 + Math.sin(rad) * 65;
                      return (
                        <g key={`ovule-${i}`}>
                          <ellipse cx={ox} cy={oy} rx="10" ry="7" fill="#B89555" stroke="#B89555" strokeWidth="1" />
                          <ellipse cx={ox} cy={oy} rx="4" ry="3" fill="#B89555" />
                        </g>
                      );
                    })}
                  </>
                )}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  const x1 = 150 + Math.cos(rad) * 20;
                  const y1 = 150 + Math.sin(rad) * 20;
                  const x2 = 150 + Math.cos(rad) * 120;
                  const y2 = 150 + Math.sin(rad) * 120;
                  return <line key={`locule-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8B7BB5" strokeWidth="1" opacity="0.4" />;
                })}
                <text x="150" y="28" textAnchor="middle" fontSize="11" fill="#8B7BB5" fontWeight="700" fontFamily="Space Grotesk">
                  Axile Placentation
                </text>
                <text x="150" y="290" textAnchor="middle" fontSize="10" fill="#6b7280">
                  Ovules: {species === 'Hibiscus' ? '10' : '5'} | Locules: {species === 'Hibiscus' ? '6' : '5'}
                </text>
              </svg>
            </div>
          )}

          {!quizMode && !microscopicView && !showCrossSection && (
            <>
              <div className="flex justify-center">
                {renderFlowerSvg(false)}
              </div>

              {progress === 100 && !pollinationActive && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={startPollination}
                    className="text-sm px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:scale-105 animate-pulse"
                    style={{ background: 'linear-gradient(135deg, #B89555, #C47B6B)' }}
                  >
                    🌸 Pollination Animation
                  </button>
                </div>
              )}

              {pollinationActive && (
                <div className="mt-4 flex justify-center">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                    <span className="text-sm font-semibold text-amber-800">
                      {pollinationStage === 0 && 'Starting pollination...'}
                      {pollinationStage === 1 && 'Pollen released from anther...'}
                      {pollinationStage === 2 && 'Pollen landing on stigma...'}
                      {pollinationStage === 3 && 'Pollen tube growing down style...'}
                      {pollinationStage === 4 && 'Fertilization complete! 🎉'}
                    </span>
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold">Dissection Progress</span>
                  <span className="font-mono text-primary">{dissected.size}/{PARTS.length} parts</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: '#B89555' }} />
                </div>
              </div>
            </>
          )}

          {quizMode && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-4">Match each numbered label to its correct plant part name.</p>
              <svg viewBox="0 0 300 250" className="w-full max-w-xs mx-auto block">
                <rect x="145" y="200" width="10" height="40" rx="3" fill="#94a3b8" />
                <ellipse cx="150" cy="195" rx="18" ry="8" fill="#d1d5db" />
                {sepalAngles.map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  const cx = 150 + Math.cos(rad) * 42;
                  const cy = 120 + Math.sin(rad) * 35;
                  return <ellipse key={i} cx={cx} cy={cy} rx="14" ry="28" fill="#e5e7eb" transform={`rotate(${angle} ${cx} ${cy})`} opacity="0.8" />;
                })}
                {petalAngles.map((angle, i) => {
                  const rad = (angle * Math.PI) / 180;
                  const cx = 150 + Math.cos(rad) * 58;
                  const cy = 100 + Math.sin(rad) * 50;
                  return <ellipse key={i} cx={cx} cy={cy} rx="22" ry="40" fill="#e5e7eb" transform={`rotate(${angle} ${cx} ${cy})`} opacity="0.8" />;
                })}
                <ellipse cx="150" cy="130" rx="14" ry="10" fill="#d1d5db" />
                <rect x="147" y="93" width="6" height="38" fill="#d1d5db" />
                <ellipse cx="150" cy="90" rx="11" ry="7" fill="#d1d5db" />
                {[
                  [215, 55, '1'], [20, 95, '2'], [10, 170, '3'],
                  [175, 85, '4'], [175, 110, '5'], [175, 135, '6'],
                  [190, 200, '7'], [195, 185, '8'],
                ].map(([x, y, n]) => (
                  <g key={n}>
                    <circle cx={Number(x)} cy={Number(y)} r="8" fill="#1A2A35" />
                    <text x={Number(x)} y={Number(y) + 3} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">{n}</text>
                  </g>
                ))}
              </svg>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {[['1', 'petal'], ['2', 'sepal'], ['3', 'sepal'], ['4', 'pistil-stigma'], ['5', 'pistil-style'], ['6', 'pistil-ovary'], ['7', 'receptacle'], ['8', 'stamen-anther']].map(([num, partId]) => (
                  <div key={num} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold text-white flex-shrink-0" style={{ background: '#1A2A35' }}>{num}</span>
                    <input
                      type="text"
                      placeholder="Name this part..."
                      value={quizAnswers[partId] || ''}
                      onChange={e => setQuizAnswers(prev => ({ ...prev, [partId]: e.target.value }))}
                      disabled={quizSubmitted}
                      className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-all ${
                        quizSubmitted
                          ? quizAnswers[partId]?.toLowerCase().trim() === PARTS.find(p => p.id === partId)?.name.toLowerCase()
                            ? 'border-green-500 bg-green-50'
                            : 'border-red-400 bg-red-50'
                          : 'border-border bg-background'
                      }`}
                    />
                    {quizSubmitted && (
                      <span className="text-xs font-semibold" style={{ color: quizAnswers[partId]?.toLowerCase().trim() === PARTS.find(p => p.id === partId)?.name.toLowerCase() ? '#6A9B7A' : '#C47B6B' }}>
                        {PARTS.find(p => p.id === partId)?.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {!quizSubmitted ? (
                <button onClick={handleQuizSubmit} className="w-full mt-3 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-105"
                      style={{ background: '#B89555', color: '#1A2A35' }}>
                  Check Answers
                </button>
              ) : (
                <div className="p-3 rounded-xl text-center" style={{ background: correctCount >= 6 ? '#F2F8F4' : '#FAF5F3', borderColor: correctCount >= 6 ? '#A8D5B6' : '#C47B6B' }}>
                  <p className="font-bold text-lg" style={{ color: correctCount >= 6 ? '#6A9B7A' : '#C47B6B' }}>
                    {correctCount}/8 Correct
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {correctCount === 8 ? 'Perfect score! You know your flower anatomy.' : 'Review the parts and try again.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {selectedPart && !microscopicView && !showCrossSection && (
            <div className="sim-panel border-l-4" style={{ borderLeftColor: selectedPart.hoverColor }}>
              <div className="text-xs font-semibold text-muted-foreground mb-1">Selected Part</div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: selectedPart.hoverColor }}>
                {selectedPart.name}
              </h3>
              <p className="text-sm leading-relaxed text-foreground">{selectedPart.function}</p>
            </div>
          )}

          {microscopicView && (
            <div className="sim-panel border-l-4" style={{ borderLeftColor: '#818cf8' }}>
              <div className="text-xs font-semibold text-muted-foreground mb-1">Microscopic View</div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#818cf8' }}>
                {microscopicView === 'anther' ? 'Pollen Grains' : microscopicView === 'stigma' ? 'Stigma Papillae' : 'Petal Trichomes'}
              </h3>
              <p className="text-sm leading-relaxed text-foreground">
                {microscopicView === 'anther' && 'Pollen grains are male gametophytes enclosed in a tough exine wall. The spiky surface helps them adhere to pollinators and the stigma surface.'}
                {microscopicView === 'stigma' && 'Papillae are finger-like projections on the stigma surface. They produce a sticky secretion that traps pollen grains and provides moisture for pollen germination.'}
                {microscopicView === 'petal' && 'Petal surfaces show trichomes (tiny hairs) and intricate vein patterns. These structures influence color perception and create nectar guides for pollinators.'}
              </p>
            </div>
          )}

          {showCrossSection && (
            <div className="sim-panel border-l-4" style={{ borderLeftColor: '#8B7BB5' }}>
              <div className="text-xs font-semibold text-muted-foreground mb-1">Cross-Section View</div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk', color: '#8B7BB5' }}>
                Ovary · Axile Placentation
              </h3>
              <p className="text-sm leading-relaxed text-foreground">
                In axile placentation, ovules are attached to a central axis where septa (walls) meet at the center.
                {species === 'Hibiscus'
                  ? ' Hibiscus ovary has 6 locules with 10 ovules arranged around the central column.'
                  : ' Lily ovary has 3 locules with ovules arranged around the central axis.'}
              </p>
            </div>
          )}

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>Floral Formula — {species}</h3>
            <div className="text-lg font-mono font-bold text-center py-3 rounded-xl mb-3" style={{ background: 'hsl(var(--muted))', color: '#B89555' }}>
              {formula.formula}
            </div>
            <div className="space-y-1.5">
              {Object.entries(formula.explanation).map(([symbol, desc]) => (
                <div key={symbol} className="flex items-start gap-2">
                  <span className="text-sm font-mono font-bold text-primary min-w-[2.5rem]">{symbol}</span>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>Parts Reference</h3>
            <div className="space-y-2">
              {PARTS.map(part => (
                <div key={part.id}
                  onClick={() => handlePartClick(part.id)}
                  data-testid={`button-part-${part.id}`}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${dissected.has(part.id) ? 'opacity-100' : 'opacity-60 hover:opacity-80'}`}
                  style={selected === part.id ? { background: 'hsl(var(--muted))' } : {}}>
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: dissected.has(part.id) ? part.hoverColor : '#d1d5db' }} />
                  <span className="text-sm font-medium">{part.name}</span>
                  {dissected.has(part.id) && <span className="ml-auto text-xs text-green-600 font-semibold">Dissected</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="sim-panel bg-muted/50">
            <div className="sim-label">Instructions</div>
            <ol className="text-sm text-foreground space-y-1.5">
              <li className="flex gap-2"><span className="font-mono text-primary">1.</span> Select a tool: Forceps (normal), Scalpel (cross-section), Microscope (detail)</li>
              <li className="flex gap-2"><span className="font-mono text-primary">2.</span> Choose a species: Hibiscus (5 petals, dicot) or Lily (3 petals, monocot)</li>
              <li className="flex gap-2"><span className="font-mono text-primary">3.</span> Click flower parts to dissect and learn their functions</li>
              <li className="flex gap-2"><span className="font-mono text-primary">4.</span> Dissect all 8 parts to unlock quiz and pollination animation</li>
              <li className="flex gap-2"><span className="font-mono text-primary">5.</span> Compare floral formulas between dicot and monocot species</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
