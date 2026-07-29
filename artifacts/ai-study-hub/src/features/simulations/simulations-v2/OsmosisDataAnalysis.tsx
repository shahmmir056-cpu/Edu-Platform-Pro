import { useState, useRef, useCallback, useMemo } from 'react';

interface DataRow {
  concentration: number;
  initialMass: number;
  finalMass: number;
  percentChange: number;
}

const INITIAL_DATA: DataRow[] = [
  { concentration: 0.0, initialMass: 5.12, finalMass: 5.91, percentChange: 15.4 },
  { concentration: 0.2, initialMass: 5.08, finalMass: 5.47, percentChange: 7.7 },
  { concentration: 0.4, initialMass: 5.15, finalMass: 5.15, percentChange: 0.0 },
  { concentration: 0.6, initialMass: 5.21, finalMass: 4.86, percentChange: -6.7 },
  { concentration: 0.8, initialMass: 5.09, finalMass: 4.56, percentChange: -10.4 },
  { concentration: 1.0, initialMass: 5.18, finalMass: 4.41, percentChange: -14.9 },
];

function calcPercentChange(initial: number, final: number): number {
  if (initial === 0) return 0;
  return Math.round(((final - initial) / initial) * 1000) / 10;
}

export default function OsmosisDataAnalysis() {
  const [data, setData] = useState<DataRow[]>(INITIAL_DATA);
  const [plottedPoints, setPlottedPoints] = useState<Set<number>>(new Set());
  const [userIsotonicGuess, setUserIsotonicGuess] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [bestFitDrawn, setBestFitDrawn] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const PLOT_W = 420, PLOT_H = 200;
  const PAD_L = 55, PAD_B = 35, PAD_T = 20, PAD_R = 20;

  const toSVG = (conc: number, pct: number) => ({
    x: PAD_L + (conc / 1.0) * (PLOT_W - PAD_L - PAD_R),
    y: PAD_T + PLOT_H - PAD_B - ((pct + 20) / 40) * (PLOT_H - PAD_T - PAD_B),
  });

  const updateMass = (concentration: number, field: 'initialMass' | 'finalMass', value: string) => {
    const numVal = parseFloat(value);
    setData(prev => prev.map(d => {
      if (d.concentration !== concentration) return d;
      const updated = { ...d, [field]: isNaN(numVal) ? 0 : numVal };
      updated.percentChange = calcPercentChange(updated.initialMass, updated.finalMass);
      return updated;
    }));
  };

  const n = data.length;

  const reg = useMemo(() => {
    const sumX = data.reduce((s, d) => s + d.concentration, 0);
    const sumY = data.reduce((s, d) => s + d.percentChange, 0);
    const sumXY = data.reduce((s, d) => s + d.concentration * d.percentChange, 0);
    const sumX2 = data.reduce((s, d) => s + d.concentration ** 2, 0);
    const meanY = sumY / n;

    const denom = n * sumX2 - sumX ** 2;
    if (denom === 0) return { slope: 0, intercept: meanY, r2: 0, se: 0, ssRes: 0, ssTot: 0 };

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    const ssRes = data.reduce((s, d) => s + (d.percentChange - (slope * d.concentration + intercept)) ** 2, 0);
    const ssTot = data.reduce((s, d) => s + (d.percentChange - meanY) ** 2, 0);
    const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

    const se = Math.sqrt(ssRes / (n - 2));

    return { slope, intercept, r2, se, ssRes, ssTot };
  }, [data, n]);

  const { slope, intercept, r2, se } = reg;
  const lineY0 = intercept;
  const lineY1 = slope * 1.0 + intercept;

  const estimatedIsotonic = slope === 0 ? 0.5 : -intercept / slope;

  const summaryStats = useMemo(() => {
    const pcts = data.map(d => d.percentChange);
    const mean = pcts.reduce((a, b) => a + b, 0) / n;
    const max = Math.max(...pcts);
    const min = Math.min(...pcts);
    return { n, mean, max, min, isotonic: estimatedIsotonic };
  }, [data, n, estimatedIsotonic]);

  const waterPotential = useMemo(() => {
    if (userIsotonicGuess === null || !checked || !isCorrect) return null;
    const i = 1;
    const C = userIsotonicGuess;
    const R = 0.0831;
    const T = 293;
    const psi = -(i * C * R * T);
    return Math.round(psi * 1000) / 1000;
  }, [userIsotonicGuess, checked]);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = (e.clientX - rect.left) * (PLOT_W / rect.width);
    const conc = (svgX - PAD_L) / (PLOT_W - PAD_L - PAD_R);
    if (conc < 0 || conc > 1.1) return;
    const nearest = data.find(d => Math.abs(d.concentration - Math.round(conc * 5) / 5) < 0.12);
    if (nearest) {
      setPlottedPoints(prev => new Set([...prev, nearest.concentration]));
      return;
    }
    if (plottedPoints.size === data.length) {
      setUserIsotonicGuess(Math.round(conc * 10) / 10);
    }
  }, [plottedPoints.size, data]);

  const exportCSV = () => {
    const header = 'Concentration (M),Initial Mass (g),Final Mass (g),% Change\n';
    const rows = data.map(d => `${d.concentration},${d.initialMass},${d.finalMass},${d.percentChange}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'osmosis_data.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const TRUE_ISOTONIC = 0.4;
  const isCorrect = userIsotonicGuess !== null && Math.abs(userIsotonicGuess - TRUE_ISOTONIC) <= 0.1;

  const CI_Y_MIN = -20;
  const CI_Y_MAX = 20;

  return (
    <div className="sim-container">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Data Table */}
        <div className="space-y-4">
          <div className="sim-panel overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Experimental Data</h3>
              <button onClick={exportCSV}
                data-testid="button-export-csv"
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-all hover:scale-105"
                style={{ background: '#1A3550' }}>
                Export CSV
              </button>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Potato strips placed in sucrose solutions for 24 hours. Click rows to plot on graph. Edit mass values to recalculate.</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                  <th className="text-left py-2 text-muted-foreground font-semibold text-xs">Sucrose (M)</th>
                  <th className="text-left py-2 text-muted-foreground font-semibold text-xs">Initial (g)</th>
                  <th className="text-left py-2 text-muted-foreground font-semibold text-xs">Final (g)</th>
                  <th className="text-left py-2 text-muted-foreground font-semibold text-xs">% Change</th>
                  <th className="text-left py-2 text-muted-foreground font-semibold text-xs">Plot</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.concentration}
                    onClick={() => setPlottedPoints(prev => new Set([...prev, row.concentration]))}
                    data-testid={`row-data-${row.concentration}`}
                    className={`border-b border-border/50 cursor-pointer transition-all hover:bg-muted/50 ${plottedPoints.has(row.concentration) ? 'bg-muted/30' : ''}`}>
                    <td className="py-2 font-mono">{row.concentration.toFixed(1)}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={row.initialMass}
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateMass(row.concentration, 'initialMass', e.target.value)}
                        data-testid={`input-initial-${row.concentration}`}
                        className="w-16 px-1 py-0.5 rounded border text-xs font-mono"
                        style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        step="0.01"
                        value={row.finalMass}
                        onClick={e => e.stopPropagation()}
                        onChange={e => updateMass(row.concentration, 'finalMass', e.target.value)}
                        data-testid={`input-final-${row.concentration}`}
                        className="w-16 px-1 py-0.5 rounded border text-xs font-mono"
                        style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }}
                      />
                    </td>
                    <td className="py-2 font-mono font-bold"
                      style={{ color: row.percentChange > 0 ? '#6A9B7A' : row.percentChange < 0 ? '#C47B6B' : '#B89555' }}>
                      {row.percentChange > 0 ? '+' : ''}{row.percentChange}%
                    </td>
                    <td className="py-2">
                      {plottedPoints.has(row.concentration)
                        ? <span className="text-xs text-green-600 font-semibold">Plotted</span>
                        : <span className="text-xs text-muted-foreground">Click</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Stats */}
          {plottedPoints.size === data.length && (
            <div className="sim-panel">
              <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Summary Statistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">n =</span>
                  <span className="ml-1 font-mono font-bold">{summaryStats.n}</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Mean %Δ =</span>
                  <span className="ml-1 font-mono font-bold">{summaryStats.mean.toFixed(1)}%</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Max =</span>
                  <span className="ml-1 font-mono font-bold text-green-600">+{summaryStats.max}%</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Min =</span>
                  <span className="ml-1 font-mono font-bold text-red-600">{summaryStats.min}%</span>
                </div>
                <div className="sm:col-span-2 p-2 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">Isotonic est. =</span>
                  <span className="ml-1 font-mono font-bold" style={{ color: '#8B7BB5' }}>{summaryStats.isotonic.toFixed(3)} M</span>
                  <span className="ml-2 text-muted-foreground">(from best-fit)</span>
                </div>
              </div>
            </div>
          )}

          <div className="sim-panel">
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>Analysis Tools</h3>
            <div className="space-y-2">
              <button
                onClick={() => setPlottedPoints(new Set(data.map(d => d.concentration)))}
                className="w-full py-2 rounded-lg text-sm font-semibold border border-border hover:bg-muted transition-all">
                Plot All Points
              </button>
              <button
                onClick={() => setBestFitDrawn(prev => !prev)}
                disabled={plottedPoints.size < 4}
                className="w-full py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 text-white"
                style={{ background: bestFitDrawn ? '#8B7BB5' : '#1A3550' }}>
                {bestFitDrawn ? 'Hide Best-Fit Line' : 'Draw Best-Fit Line'}
              </button>
              <div className="flex gap-2">
                <input
                  type="number" step="0.05" min="0" max="1"
                  placeholder="Isotonic point (M)"
                  value={userIsotonicGuess ?? ''}
                  onChange={e => { setUserIsotonicGuess(Number(e.target.value)); setChecked(false); }}
                  data-testid="input-isotonic-guess"
                  className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono"
                  style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--background))' }}
                />
                <button
                  onClick={() => setChecked(true)}
                  disabled={userIsotonicGuess === null}
                  data-testid="button-check-answer"
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 disabled:opacity-40 text-white"
                  style={{ background: '#B89555', color: '#1A2A35' }}>
                  Check
                </button>
              </div>
              {checked && userIsotonicGuess !== null && (
                <div className={`p-3 rounded-lg text-sm ${isCorrect ? 'bg-green-50 border border-green-300' : 'bg-red-50 border border-red-300'}`}>
                  {isCorrect
                    ? <span className="text-green-700 font-semibold">Correct! The isotonic point is ~0.4 M sucrose — where the tissue water potential equals the solution.</span>
                    : <span className="text-red-700">Not quite. Hint: find where the % change crosses zero on the graph. Try ~0.35–0.45 M.</span>}
                </div>
              )}

              {/* Water Potential Result */}
              {waterPotential !== null && (
                <div className="p-3 rounded-lg text-sm bg-blue-50 border border-blue-300">
                  <span className="text-blue-800 font-semibold">Water Potential (Ψ):</span>
                  <span className="ml-2 font-mono font-bold text-blue-900">{waterPotential} bars</span>
                  <div className="mt-1 text-xs text-blue-600">
                    Ψ = −iCRT = −(1)({userIsotonicGuess} M)(0.0831)(293 K)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scatter Plot */}
        <div className="sim-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>Scatter Plot</h3>
            <button onClick={() => { setPlottedPoints(new Set()); setBestFitDrawn(false); setUserIsotonicGuess(null); setChecked(false); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-all">
              Clear
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Click data table rows or click on plot to mark points. Click plot to set isotonic guess (after all points plotted).</p>

          <svg ref={svgRef} viewBox={`0 0 ${PLOT_W} ${PLOT_H + PAD_T}`} className="w-full cursor-crosshair"
            onClick={handleSvgClick}>

            {/* 95% Confidence Interval band */}
            {bestFitDrawn && (() => {
              const bandWidth = 1.96 * se;
              const steps = 40;
              const upperPoints: string[] = [];
              const lowerPoints: string[] = [];
              for (let i = 0; i <= steps; i++) {
                const c = (i / steps) * 1.0;
                const yFit = slope * c + intercept;
                const upper = toSVG(c, Math.min(yFit + bandWidth, CI_Y_MAX));
                const lower = toSVG(c, Math.max(yFit - bandWidth, CI_Y_MIN));
                upperPoints.push(`${upper.x},${upper.y}`);
                lowerPoints.push(`${lower.x},${lower.y}`);
              }
              const allPoints = [...upperPoints, ...lowerPoints.reverse()].join(' ');
              return (
                <polygon points={allPoints} fill="#8B7BB5" opacity="0.1" stroke="none" />
              );
            })()}

            {/* Grid lines */}
            {[-20, -10, 0, 10, 20].map(y => {
              const pt = toSVG(0, y);
              return (
                <g key={y}>
                  <line x1={PAD_L} y1={pt.y} x2={PLOT_W - PAD_R} y2={pt.y}
                    stroke={y === 0 ? 'hsl(var(--foreground))' : 'hsl(var(--border))'}
                    strokeWidth={y === 0 ? 1.5 : 0.5}
                    strokeDasharray={y === 0 ? 'none' : '3,3'} />
                  <text x={PAD_L - 5} y={pt.y + 3} textAnchor="end" fontSize="9" fill="hsl(var(--muted-foreground))">{y}%</text>
                </g>
              );
            })}
            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map(c => {
              const pt = toSVG(c, 0);
              return (
                <g key={c}>
                  <line x1={pt.x} y1={PAD_T} x2={pt.x} y2={PLOT_H + PAD_T - PAD_B} stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="3,3" />
                  <text x={pt.x} y={PLOT_H + PAD_T - PAD_B + 12} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">{c.toFixed(1)}</text>
                </g>
              );
            })}

            {/* Axes */}
            <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PLOT_H + PAD_T - PAD_B} stroke="hsl(var(--border))" strokeWidth="1.5" />
            <line x1={PAD_L} y1={PLOT_H + PAD_T - PAD_B} x2={PLOT_W - PAD_R} y2={PLOT_H + PAD_T - PAD_B} stroke="hsl(var(--border))" strokeWidth="1.5" />

            {/* Axis labels */}
            <text x={PLOT_W / 2} y={PLOT_H + PAD_T + 5} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))">Sucrose Concentration (M)</text>
            <text x="12" y={(PLOT_H + PAD_T) / 2} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" transform={`rotate(-90 12 ${(PLOT_H + PAD_T) / 2})`}>% Mass Change</text>

            {/* Best fit line */}
            {bestFitDrawn && (
              <line
                x1={toSVG(0, lineY0).x} y1={toSVG(0, lineY0).y}
                x2={toSVG(1, lineY1).x} y2={toSVG(1, lineY1).y}
                stroke="#8B7BB5" strokeWidth="2" strokeDasharray="6,3" opacity="0.8"
              />
            )}

            {/* True isotonic marker */}
            {bestFitDrawn && (
              <g>
                <line x1={toSVG(TRUE_ISOTONIC, -20).x} y1={toSVG(TRUE_ISOTONIC, -20).y}
                  x2={toSVG(TRUE_ISOTONIC, 20).x} y2={toSVG(TRUE_ISOTONIC, 20).y}
                  stroke="#6A9B7A" strokeWidth="1" strokeDasharray="4,3" opacity="0.7" />
                <text x={toSVG(TRUE_ISOTONIC, 18).x + 3} y={toSVG(TRUE_ISOTONIC, 18).y}
                  fontSize="8" fill="#6A9B7A" fontWeight="600">Isotonic</text>
              </g>
            )}

            {/* User's isotonic guess */}
            {userIsotonicGuess !== null && (
              <line
                x1={toSVG(userIsotonicGuess, -20).x} y1={toSVG(userIsotonicGuess, -20).y}
                x2={toSVG(userIsotonicGuess, 20).x} y2={toSVG(userIsotonicGuess, 20).y}
                stroke="#B89555" strokeWidth="2" strokeDasharray="5,3" opacity="0.9"
              />
            )}

            {/* Data points with error bars */}
            {data.map(row => {
              const pt = toSVG(row.concentration, row.percentChange);
              const isPlotted = plottedPoints.has(row.concentration);
              const errorPx = Math.abs(toSVG(0, 2).y - toSVG(0, 0).y);
              return (
                <g key={row.concentration}>
                  <circle cx={pt.x} cy={pt.y} r="7"
                    fill={isPlotted ? '#5B7FA5' : 'transparent'}
                    stroke="#5B7FA5" strokeWidth="2"
                    opacity={isPlotted ? 0.9 : 0.3}
                    style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                    onClick={e => { e.stopPropagation(); setPlottedPoints(prev => new Set([...prev, row.concentration])); }}
                  />
                  {/* Error bars: ±2% */}
                  {isPlotted && (
                    <g opacity="0.6">
                      <line x1={pt.x} y1={pt.y - errorPx} x2={pt.x} y2={pt.y + errorPx}
                        stroke="#5B7FA5" strokeWidth="1" />
                      <line x1={pt.x - 3} y1={pt.y - errorPx} x2={pt.x + 3} y2={pt.y - errorPx}
                        stroke="#5B7FA5" strokeWidth="1" />
                      <line x1={pt.x - 3} y1={pt.y + errorPx} x2={pt.x + 3} y2={pt.y + errorPx}
                        stroke="#5B7FA5" strokeWidth="1" />
                    </g>
                  )}
                  {isPlotted && (
                    <text x={pt.x + 10} y={pt.y - 5} fontSize="8" fill="hsl(var(--muted-foreground))">
                      ({row.concentration.toFixed(1)}, {row.percentChange}%)
                    </text>
                  )}
                </g>
              );
            })}

            {/* Regression equation and R² */}
            {bestFitDrawn && (
              <g>
                <text x={PAD_L + 5} y={PAD_T + 12} fontSize="9" fontWeight="600" fill="#8B7BB5" fontFamily="monospace">
                  y = {slope.toFixed(2)}x {intercept >= 0 ? '+' : ''}{intercept.toFixed(2)}
                </text>
                <text x={PAD_L + 5} y={PAD_T + 24} fontSize="9" fontWeight="600" fill="#8B7BB5" fontFamily="monospace">
                  R² = {r2.toFixed(4)}
                </text>
                <text x={PAD_L + 5} y={PAD_T + 36} fontSize="8" fill="hsl(var(--muted-foreground))" fontFamily="monospace">
                  95% CI band shown
                </text>
              </g>
            )}

            {/* Legend */}
            <g transform={`translate(${PLOT_W - 120}, ${PAD_T + 5})`}>
              <circle cx="6" cy="6" r="5" fill="#5B7FA5" opacity="0.9" />
              <text x="14" y="9" fontSize="8" fill="hsl(var(--foreground))">Data point</text>
              <g opacity="0.6">
                <line x1="6" y1="14" x2="6" y2="22" stroke="#5B7FA5" strokeWidth="1" />
                <line x1="3" y1="14" x2="9" y2="14" stroke="#5B7FA5" strokeWidth="1" />
                <line x1="3" y1="22" x2="9" y2="22" stroke="#5B7FA5" strokeWidth="1" />
              </g>
              <text x="14" y="20" fontSize="8" fill="hsl(var(--foreground))">±2% err</text>
              {bestFitDrawn && (
                <>
                  <line x1="0" y1="30" x2="14" y2="30" stroke="#8B7BB5" strokeWidth="2" strokeDasharray="5,2" />
                  <text x="17" y="33" fontSize="8" fill="hsl(var(--foreground))">Best-fit</text>
                  <rect x="0" y="38" width="14" height="8" fill="#8B7BB5" opacity="0.15" />
                  <text x="17" y="45" fontSize="8" fill="hsl(var(--foreground))">95% CI</text>
                </>
              )}
              {userIsotonicGuess !== null && (
                <>
                  <line x1="0" y1={bestFitDrawn ? 54 : 34} x2="14" y2={bestFitDrawn ? 54 : 34} stroke="#B89555" strokeWidth="2" strokeDasharray="4,2" />
                  <text x="17" y={bestFitDrawn ? 57 : 37} fontSize="8" fill="hsl(var(--foreground))">Your guess</text>
                </>
              )}
            </g>
          </svg>

          <div className="mt-4 p-3 bg-muted rounded-xl text-xs text-muted-foreground">
            <strong className="text-foreground">Interpretation:</strong> The isotonic point (~0.4 M) is where % mass change = 0. This indicates the sucrose concentration equals the water potential of potato cell cytoplasm.
          </div>
        </div>
      </div>
    </div>
  );
}
