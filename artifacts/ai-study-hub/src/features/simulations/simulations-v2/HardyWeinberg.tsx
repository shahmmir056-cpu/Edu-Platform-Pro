import { useState } from 'react';
import { useLabControls } from './labControls';

interface GenData {
  gen: number;
  p: number;
  q: number;
  AA: number;
  Aa: number;
  aa: number;
}

interface SimParams {
  initP: number;
  popSize: number;
  generations: number;
  selection: boolean;
  selFitness: number;
  drift: boolean;
  mutation: boolean;
  mutRate: number;
  geneFlow: boolean;
  flowRate: number;
  bottleneck: boolean;
  bottleneckSize: number;
  bottleneckGen: number;
  inbreeding: number;
}

function runHW(params: SimParams): GenData[] {
  const {
    initP, popSize, generations, selection, selFitness,
    drift, mutation, mutRate, geneFlow, flowRate,
    bottleneck, bottleneckSize, bottleneckGen, inbreeding,
  } = params;
  const results: GenData[] = [];
  let p = initP;

  for (let g = 0; g <= generations; g++) {
    const q = 1 - p;
    let AA = p * p;
    let Aa = 2 * p * q;
    let aa = q * q;

    if (inbreeding > 0) {
      const F = inbreeding;
      AA = p * p + F * p * q;
      Aa = 2 * p * q * (1 - F);
      aa = q * q + F * p * q;
    }

    results.push({ gen: g, p, q, AA, Aa, aa });
    if (g === generations) break;

    let effectivePopSize = popSize;
    if (bottleneck && g === bottleneckGen) {
      effectivePopSize = bottleneckSize;
    }

    if (selection) {
      const wAA = 1.0, wAa = 1.0, waa = Math.max(0, selFitness);
      const wBar = AA * wAA + Aa * wAa + aa * waa;
      if (wBar > 0) {
        p = (AA * wAA + 0.5 * Aa * wAa) / wBar;
      }
    }

    if (drift) {
      const alleles = effectivePopSize * 2;
      let headCount = 0;
      for (let i = 0; i < alleles; i++) {
        if (Math.random() < p) headCount++;
      }
      p = headCount / alleles;
    }

    if (mutation) {
      p = p * (1 - mutRate) + (1 - p) * mutRate * 0.1;
    }

    if (geneFlow) {
      p = p * (1 - flowRate) + 0.5 * flowRate;
    }

    p = Math.max(0.001, Math.min(0.999, p));
  }

  return results;
}

function chiSquareTest(AA: number, Aa: number, aa: number, p: number, N: number) {
  const q = 1 - p;
  const expAA = p * p * N;
  const expAa = 2 * p * q * N;
  const expaa = q * q * N;
  const obsAA = AA * N;
  const obsAa = Aa * N;
  const obsaa = aa * N;
  const chi2 =
    (obsAA - expAA) ** 2 / Math.max(expAA, 0.001) +
    (obsAa - expAa) ** 2 / Math.max(expAa, 0.001) +
    (obsaa - expaa) ** 2 / Math.max(expaa, 0.001);
  return { chi2, expAA, expAa, expaa, obsAA, obsAa, obsaa, reject: chi2 > 3.841 };
}

const PRESETS: { name: string; params: SimParams }[] = [
  {
    name: 'Pure Drift',
    params: {
      initP: 0.5, popSize: 50, generations: 50,
      selection: false, selFitness: 0.5, drift: true,
      mutation: false, mutRate: 0.01, geneFlow: false, flowRate: 0.1,
      bottleneck: false, bottleneckSize: 50, bottleneckGen: 25, inbreeding: 0,
    },
  },
  {
    name: 'Selection Sweep',
    params: {
      initP: 0.1, popSize: 500, generations: 50,
      selection: true, selFitness: 0.0, drift: false,
      mutation: false, mutRate: 0.01, geneFlow: false, flowRate: 0.1,
      bottleneck: false, bottleneckSize: 50, bottleneckGen: 25, inbreeding: 0,
    },
  },
  {
    name: 'Balancing Selection',
    params: {
      initP: 0.5, popSize: 500, generations: 50,
      selection: true, selFitness: 0.3, drift: false,
      mutation: false, mutRate: 0.01, geneFlow: false, flowRate: 0.1,
      bottleneck: false, bottleneckSize: 50, bottleneckGen: 25, inbreeding: 0,
    },
  },
  {
    name: 'Population Bottleneck',
    params: {
      initP: 0.5, popSize: 500, generations: 30,
      selection: false, selFitness: 0.5, drift: true,
      mutation: false, mutRate: 0.01, geneFlow: false, flowRate: 0.1,
      bottleneck: true, bottleneckSize: 20, bottleneckGen: 15, inbreeding: 0,
    },
  },
  {
    name: 'Mutation-Drift',
    params: {
      initP: 0.9, popSize: 200, generations: 50,
      selection: false, selFitness: 0.5, drift: true,
      mutation: true, mutRate: 0.01, geneFlow: false, flowRate: 0.1,
      bottleneck: false, bottleneckSize: 50, bottleneckGen: 25, inbreeding: 0,
    },
  },
  {
    name: 'Neutral',
    params: {
      initP: 0.5, popSize: 1000, generations: 20,
      selection: false, selFitness: 0.5, drift: false,
      mutation: false, mutRate: 0.01, geneFlow: false, flowRate: 0.1,
      bottleneck: false, bottleneckSize: 50, bottleneckGen: 25, inbreeding: 0,
    },
  },
];

export default function HardyWeinberg() {
  const [initP, setInitP] = useState(0.6);
  const [popSize, setPopSize] = useState(500);
  const [gens, setGens] = useState(10);
  const [selection, setSelection] = useState(false);
  const [selFitness, setSelFitness] = useState(0.5);
  const [drift, setDrift] = useState(false);
  const [mutation, setMutation] = useState(false);
  const [mutRate, setMutRate] = useState(0.01);
  const [geneFlow, setGeneFlow] = useState(false);
  const [flowRate, setFlowRate] = useState(0.1);
  const [bottleneck, setBottleneck] = useState(false);
  const [bottleneckSize, setBottleneckSize] = useState(50);
  const [bottleneckGen, setBottleneckGen] = useState(5);
  const [inbreeding, setInbreeding] = useState(0);
  const [replicates, setReplicates] = useState(1);
  const [results, setResults] = useState<GenData[]>([]);
  const [allReplicateResults, setAllReplicateResults] = useState<GenData[][]>([]);
  const [ran, setRan] = useState(false);

  const applyPreset = (params: SimParams) => {
    setInitP(params.initP);
    setPopSize(params.popSize);
    setGens(params.generations);
    setSelection(params.selection);
    setSelFitness(params.selFitness);
    setDrift(params.drift);
    setMutation(params.mutation);
    setMutRate(params.mutRate);
    setGeneFlow(params.geneFlow);
    setFlowRate(params.flowRate);
    setBottleneck(params.bottleneck);
    setBottleneckSize(params.bottleneckSize);
    setBottleneckGen(params.bottleneckGen);
    setInbreeding(params.inbreeding);
    setRan(false);
  };

  const runSimulation = () => {
    const baseParams: SimParams = {
      initP, popSize, generations: gens, selection, selFitness,
      drift, mutation, mutRate, geneFlow, flowRate,
      bottleneck, bottleneckSize, bottleneckGen, inbreeding,
    };
    const allResults: GenData[][] = [];
    for (let r = 0; r < replicates; r++) {
      allResults.push(runHW(baseParams));
    }
    setAllReplicateResults(allResults);
    setResults(allResults[0]);
    setRan(true);
  };

  const lastGen = results[results.length - 1];
  const hwCheck = lastGen
    ? {
        expectedAA: lastGen.p ** 2,
        expectedAa: 2 * lastGen.p * lastGen.q,
        expectedaa: lastGen.q ** 2,
      }
    : null;

  const chiSquare = lastGen
    ? chiSquareTest(lastGen.AA, lastGen.Aa, lastGen.aa, lastGen.p, popSize)
    : null;

  const replicateStats =
    allReplicateResults.length > 1 && allReplicateResults[0].length > 0
      ? Array.from({ length: allReplicateResults[0].length }, (_, i) => {
          const pVals = allReplicateResults.map((r) => r[i].p);
          const meanP = pVals.reduce((a, b) => a + b, 0) / pVals.length;
          const variance =
            pVals.reduce((a, b) => a + (b - meanP) ** 2, 0) / pVals.length;
          return { gen: i, meanP, sdP: Math.sqrt(variance) };
        })
      : null;

  const { advancedOpen } = useLabControls({
    hasAdvanced: true,
    dataset: {
      name: "Hardy-Weinberg Generation Data",
      columns: [
        { key: "gen", label: "Generation" },
        { key: "p", label: "p" },
        { key: "q", label: "q" },
        { key: "AA", label: "AA" },
        { key: "Aa", label: "Aa" },
        { key: "aa", label: "aa" },
      ],
      rows: results,
    },
  });

  const GRAPH_W = 380, GRAPH_H = 180;

  const noForces =
    !selection && !drift && !mutation && !geneFlow && !bottleneck && inbreeding === 0;

  return (
    <div className="sim-container">
      {advancedOpen && (
        <div className="sim-panel mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
              Replicate Trial Statistics (Randomized)
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(232,133,46,0.12)', color: '#C46A10' }}>
              {replicates} replicate{replicates > 1 ? 's' : ''}
            </span>
          </div>
          {ran && allReplicateResults.length > 1 ? (
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-1.5 text-[10px] font-bold uppercase" style={{ color: '#2D2D2D', borderBottom: '1px solid rgba(45,45,45,0.12)' }}>Gen</th>
                    {allReplicateResults.map((_, r) => (
                      <th key={r} className="px-3 py-1.5 text-[10px] font-bold uppercase" style={{ color: '#2D2D2D', borderBottom: '1px solid rgba(45,45,45,0.12)' }}>Trial {r + 1} p</th>
                    ))}
                    <th className="px-3 py-1.5 text-[10px] font-bold uppercase" style={{ color: '#C46A10', borderBottom: '1px solid rgba(45,45,45,0.12)' }}>Mean p ± SD</th>
                  </tr>
                </thead>
                <tbody>
                  {allReplicateResults[0].map((_, i) => (
                    <tr key={i}>
                      <td className="px-3 py-1 text-[11px] font-mono" style={{ color: '#4A4A4A' }}>{allReplicateResults[0][i].gen}</td>
                      {allReplicateResults.map((rep, r) => (
                        <td key={r} className="px-3 py-1 text-[11px] font-mono" style={{ color: '#4A4A4A' }}>{rep[i].p.toFixed(4)}</td>
                      ))}
                      <td className="px-3 py-1 text-[11px] font-mono font-bold" style={{ color: '#C46A10' }}>
                        {replicateStats ? `${replicateStats[i].meanP.toFixed(4)} ± ${replicateStats[i].sdP.toFixed(4)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs" style={{ color: '#9A9A9A' }}>
              Set Replicates to 2+ and run the simulation to compare randomized trial outcomes and see the mean ± SD allele frequency drift.
            </p>
          )}
        </div>
      )}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          {/* Presets */}
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>Presets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset.params)}
                  className="px-2 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95 border"
                  style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--muted))' }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Population Parameters */}
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-4" style={{ fontFamily: 'Space Grotesk' }}>Population Parameters</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <div className="sim-label mb-0">Initial p (dominant allele freq)</div>
                  <span className="font-mono text-sm font-bold text-primary">{initP.toFixed(2)}</span>
                </div>
                <input type="range" min="0.01" max="0.99" step="0.01" value={initP}
                  data-testid="slider-init-p"
                  onChange={(e) => setInitP(Number(e.target.value))}
                  className="w-full" style={{ accentColor: '#B89555' }} />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>p = {initP.toFixed(2)}</span>
                  <span>q = {(1 - initP).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <div className="sim-label mb-0">Population Size</div>
                  <span className="font-mono text-sm font-bold">{popSize}</span>
                </div>
                <input type="range" min="50" max="5000" step="50" value={popSize}
                  data-testid="slider-pop-size"
                  onChange={(e) => setPopSize(Number(e.target.value))}
                  className="w-full" style={{ accentColor: '#B89555' }} />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <div className="sim-label mb-0">Generations</div>
                  <span className="font-mono text-sm font-bold">{gens}</span>
                </div>
                <input type="range" min="5" max="50" step="5" value={gens}
                  data-testid="slider-generations"
                  onChange={(e) => setGens(Number(e.target.value))}
                  className="w-full" style={{ accentColor: '#B89555' }} />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <div className="sim-label mb-0">Replicates</div>
                  <span className="font-mono text-sm font-bold">{replicates}</span>
                </div>
                <input type="range" min="1" max="20" step="1" value={replicates}
                  data-testid="slider-replicates"
                  onChange={(e) => setReplicates(Number(e.target.value))}
                  className="w-full" style={{ accentColor: '#B89555' }} />
                {replicates > 1 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Run {replicates} simulations, show mean +/- SD
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HW Violations */}
          <div className="sim-panel">
            <h3 className="font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>HW Violations</h3>
            <div className="space-y-3">
              {[
                {
                  label: 'Natural Selection', val: selection, set: setSelection, color: '#dc2626',
                  sub: selection ? (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>aa fitness (w)</span>
                        <span className="font-mono">{selFitness.toFixed(2)}</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.05" value={selFitness}
                        onChange={(e) => setSelFitness(Number(e.target.value))}
                        className="w-full" style={{ accentColor: '#dc2626' }} />
                    </div>
                  ) : null,
                },
                { label: 'Genetic Drift', val: drift, set: setDrift, color: '#8B7BB5', sub: null },
                {
                  label: 'Mutation', val: mutation, set: setMutation, color: '#B89555',
                  sub: mutation ? (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Mutation rate</span>
                        <span className="font-mono">{mutRate.toFixed(3)}</span>
                      </div>
                      <input type="range" min="0.001" max="0.05" step="0.001" value={mutRate}
                        onChange={(e) => setMutRate(Number(e.target.value))}
                        className="w-full" style={{ accentColor: '#B89555' }} />
                    </div>
                  ) : null,
                },
                {
                  label: 'Gene Flow', val: geneFlow, set: setGeneFlow, color: '#5B7FA5',
                  sub: geneFlow ? (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Flow rate (from p=0.5 pop)</span>
                        <span className="font-mono">{flowRate.toFixed(2)}</span>
                      </div>
                      <input type="range" min="0.01" max="0.3" step="0.01" value={flowRate}
                        onChange={(e) => setFlowRate(Number(e.target.value))}
                        className="w-full" style={{ accentColor: '#5B7FA5' }} />
                    </div>
                  ) : null,
                },
                {
                  label: 'Population Bottleneck', val: bottleneck, set: setBottleneck, color: '#ea580c',
                  sub: bottleneck ? (
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Bottleneck size</span>
                          <span className="font-mono">{bottleneckSize}</span>
                        </div>
                        <input type="range" min="10" max="500" step="10" value={bottleneckSize}
                          onChange={(e) => setBottleneckSize(Number(e.target.value))}
                          className="w-full" style={{ accentColor: '#ea580c' }} />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>At generation</span>
                          <span className="font-mono">{bottleneckGen}</span>
                        </div>
                        <input type="range" min="1" max="50" step="1" value={bottleneckGen}
                          onChange={(e) => setBottleneckGen(Number(e.target.value))}
                          className="w-full" style={{ accentColor: '#ea580c' }} />
                      </div>
                    </div>
                  ) : null,
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => item.set(!item.val)}>
                    <div
                      className={`w-10 h-5 rounded-full transition-all flex items-center px-0.5 ${item.val ? 'justify-end' : 'justify-start'}`}
                      style={{ background: item.val ? item.color : 'hsl(var(--muted))' }}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </div>
                    <span className={`text-sm font-semibold ${item.val ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {item.label}
                    </span>
                  </div>
                  {item.val && item.sub && <div className="mt-2 ml-13 pl-13">{item.sub}</div>}
                </div>
              ))}

              <div>
                <div className="flex justify-between mb-1">
                  <div className="sim-label mb-0">Inbreeding Coefficient (F)</div>
                  <span className="font-mono text-sm font-bold">{inbreeding.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.05" value={inbreeding}
                  data-testid="slider-inbreeding"
                  onChange={(e) => setInbreeding(Number(e.target.value))}
                  className="w-full" style={{ accentColor: '#C47B6B' }} />
                {inbreeding > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Increases homozygosity, decreases heterozygosity
                  </div>
                )}
              </div>
            </div>

            <button onClick={runSimulation}
              data-testid="button-run-simulation"
              className="w-full mt-4 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 text-white"
              style={{ background: '#1A3550' }}
            >
              Run {gens} Generations{replicates > 1 ? ` x ${replicates}` : ''}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {!ran ? (
            <div className="sim-panel h-64 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-3 opacity-30">p + q = 1</div>
                <p className="text-sm">Configure parameters and click "Run" to see allele frequency change across generations</p>
              </div>
            </div>
          ) : (
            <>
              {/* Graph */}
              <div className="sim-panel">
                <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                  Allele Frequency Over Generations{replicateStats ? ` (n=${replicates})` : ''}
                </h3>
                <svg viewBox={`0 0 ${GRAPH_W} ${GRAPH_H + 30}`} className="w-full">
                  {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
                    const y = 10 + (1 - v) * GRAPH_H;
                    return (
                      <g key={v}>
                        <line x1="35" y1={y} x2={GRAPH_W - 10} y2={y}
                          stroke="hsl(var(--border))" strokeWidth={v === 0.5 ? 1 : 0.5}
                          strokeDasharray={v === 0.5 ? '3,3' : 'none'} />
                        <text x="32" y={y + 3} textAnchor="end" fontSize="8" fill="hsl(var(--muted-foreground))">
                          {v.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                  <line x1="35" y1="10" x2="35" y2={GRAPH_H + 10} stroke="hsl(var(--border))" strokeWidth="1.5" />
                  <line x1="35" y1={GRAPH_H + 10} x2={GRAPH_W - 10} y2={GRAPH_H + 10} stroke="hsl(var(--border))" strokeWidth="1.5" />

                  {/* Bottleneck indicator */}
                  {bottleneck && bottleneckGen <= gens && (
                    <g>
                      <line
                        x1={35 + (bottleneckGen / gens) * (GRAPH_W - 45)}
                        y1="10"
                        x2={35 + (bottleneckGen / gens) * (GRAPH_W - 45)}
                        y2={GRAPH_H + 10}
                        stroke="#ea580c" strokeWidth="1" strokeDasharray="4,4" opacity="0.6"
                      />
                      <text
                        x={35 + (bottleneckGen / gens) * (GRAPH_W - 45)}
                        y="8" textAnchor="middle" fontSize="7" fill="#ea580c" fontWeight="bold"
                      >
                        BN
                      </text>
                    </g>
                  )}

                  {/* Shaded SD region for replicates */}
                  {replicateStats && replicateStats.length > 1 && (() => {
                    const n = replicateStats.length;
                    const getX = (i: number) => 35 + (i / (n - 1)) * (GRAPH_W - 45);
                    const getY = (v: number) => 10 + (1 - Math.max(0, Math.min(1, v))) * GRAPH_H;
                    const upper = replicateStats
                      .map((s, i) => `${getX(i)},${getY(s.meanP + s.sdP)}`)
                      .join(' L ');
                    const lower = [...replicateStats]
                      .reverse()
                      .map((s, i) => {
                        const idx = n - 1 - i;
                        return `${getX(idx)},${getY(Math.max(0, s.meanP - s.sdP))}`;
                      })
                      .join(' L ');
                    return <path d={`M ${upper} L ${lower} Z`} fill="#5B7FA5" opacity="0.15" />;
                  })()}

                  {/* Allele frequency lines */}
                  {results.length > 1 && (
                    replicateStats ? (
                      <g>
                        <path
                          d={replicateStats.map((s, i) => {
                            const x = 35 + (i / (replicateStats.length - 1)) * (GRAPH_W - 45);
                            const y = 10 + (1 - s.meanP) * GRAPH_H;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          stroke="#5B7FA5" strokeWidth="2.5" fill="none"
                        />
                        <path
                          d={replicateStats.map((s, i) => {
                            const x = 35 + (i / (replicateStats.length - 1)) * (GRAPH_W - 45);
                            const y = 10 + (1 - (1 - s.meanP)) * GRAPH_H;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          }).join(' ')}
                          stroke="#C47B6B" strokeWidth="2.5" fill="none" strokeDasharray="6,3"
                        />
                        <line x1={GRAPH_W - 65} y1="18" x2={GRAPH_W - 50} y2="18" stroke="#5B7FA5" strokeWidth="2.5" />
                        <text x={GRAPH_W - 48} y="21" fontSize="8" fill="#5B7FA5">mean p</text>
                        <rect x={GRAPH_W - 67} y="26" width="17" height="10" fill="#5B7FA5" opacity="0.15" rx="1" />
                        <text x={GRAPH_W - 48} y="34" fontSize="8" fill="#5B7FA5">+/- SD</text>
                        <line x1={GRAPH_W - 65} y1="42" x2={GRAPH_W - 50} y2="42" stroke="#C47B6B" strokeWidth="2.5" strokeDasharray="6,3" />
                        <text x={GRAPH_W - 48} y="45" fontSize="8" fill="#C47B6B">mean q</text>
                      </g>
                    ) : (
                      (['p', 'q'] as const).map((key, ki) => {
                        const colors = ['#5B7FA5', '#C47B6B'];
                        const labels = ['p (dominant)', 'q (recessive)'];
                        const pathD = results
                          .map((d, i) => {
                            const x = 35 + (i / (results.length - 1)) * (GRAPH_W - 45);
                            const y = 10 + (1 - d[key]) * GRAPH_H;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          })
                          .join(' ');
                        return (
                          <g key={key}>
                            <path d={pathD} stroke={colors[ki]} strokeWidth="2.5" fill="none" />
                            {results.map((d, i) => (
                              <circle
                                key={i}
                                cx={35 + (i / (results.length - 1)) * (GRAPH_W - 45)}
                                cy={10 + (1 - d[key]) * GRAPH_H}
                                r="3" fill={colors[ki]}
                              />
                            ))}
                            <text x={GRAPH_W - 8} y={ki * 14 + 18} textAnchor="end" fontSize="9" fill={colors[ki]}>
                              {labels[ki]}
                            </text>
                          </g>
                        );
                      })
                    )
                  )}

                  {/* Gen axis labels */}
                  {results.map(
                    (d, i) =>
                      i % Math.ceil(results.length / 5) === 0 && (
                        <text
                          key={i}
                          x={35 + (i / (results.length - 1)) * (GRAPH_W - 45)}
                          y={GRAPH_H + 23}
                          textAnchor="middle" fontSize="8"
                          fill="hsl(var(--muted-foreground))"
                        >
                          {d.gen}
                        </text>
                      )
                  )}
                  <text x={GRAPH_W / 2} y={GRAPH_H + 32} textAnchor="middle" fontSize="9" fill="hsl(var(--muted-foreground))">
                    Generation
                  </text>
                </svg>
              </div>

              {/* Genotype frequencies */}
              {lastGen && (
                <div className="sim-panel">
                  <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                    Generation {lastGen.gen} Genotype Frequencies
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {[
                      { label: 'AA', val: lastGen.AA, color: '#5B7FA5' },
                      { label: 'Aa', val: lastGen.Aa, color: '#8B7BB5' },
                      { label: 'aa', val: lastGen.aa, color: '#C47B6B' },
                    ].map((g) => (
                      <div key={g.label} className="p-3 rounded-xl text-center" style={{ background: 'hsl(var(--muted))' }}>
                        <div className="text-lg font-bold font-mono" style={{ color: g.color }}>
                          {(g.val * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs font-mono font-bold">{g.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Stacked bar */}
                  <div className="h-8 flex rounded-lg overflow-hidden">
                    <div className="h-full transition-all" style={{ width: `${lastGen.AA * 100}%`, background: '#5B7FA5' }} />
                    <div className="h-full transition-all" style={{ width: `${lastGen.Aa * 100}%`, background: '#8B7BB5' }} />
                    <div className="h-full transition-all" style={{ width: `${lastGen.aa * 100}%`, background: '#C47B6B' }} />
                  </div>

                  {/* HW equilibrium check */}
                  {hwCheck && (
                    <div className="mt-4 p-3 rounded-lg text-xs" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="font-semibold text-foreground mb-2">Hardy-Weinberg Equilibrium Check:</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Expected AA (p^2):</span>
                          <span className="font-mono">
                            {(hwCheck.expectedAA * 100).toFixed(1)}% | Observed: {(lastGen.AA * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expected Aa (2pq):</span>
                          <span className="font-mono">
                            {(hwCheck.expectedAa * 100).toFixed(1)}% | Observed: {(lastGen.Aa * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expected aa (q^2):</span>
                          <span className="font-mono">
                            {(hwCheck.expectedaa * 100).toFixed(1)}% | Observed: {(lastGen.aa * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 font-semibold" style={{ color: noForces ? '#6A9B7A' : '#B89555' }}>
                        {noForces
                          ? 'Population is in HW equilibrium -- no evolutionary forces active'
                          : 'Population has deviated from HW equilibrium due to active evolutionary forces'}
                      </div>
                    </div>
                  )}

                  {/* Chi-Square Test */}
                  {chiSquare && (
                    <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: 'hsl(var(--muted))' }}>
                      <div className="font-semibold text-foreground mb-2">Chi-Square Test (df = 1):</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Chi-sq statistic:</span>
                          <span className="font-mono font-bold">{chiSquare.chi2.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Critical value (alpha = 0.05):</span>
                          <span className="font-mono">3.841</span>
                        </div>
                        <div className="flex justify-between">
                          <span>p-value threshold:</span>
                          <span className="font-mono">p &lt; 0.05</span>
                        </div>
                      </div>
                      <div
                        className="mt-2 p-2 rounded font-semibold text-center"
                        style={{
                          background: chiSquare.reject ? 'rgba(220,38,38,0.1)' : 'rgba(22,163,74,0.1)',
                          color: chiSquare.reject ? '#dc2626' : '#6A9B7A',
                        }}
                      >
                        {chiSquare.reject
                          ? `Reject H0 -- chi-sq = ${chiSquare.chi2.toFixed(2)} > 3.841 -- Population is NOT in HW equilibrium`
                          : `Fail to reject H0 -- chi-sq = ${chiSquare.chi2.toFixed(2)} <= 3.841 -- No significant deviation from HW equilibrium`}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* De Finetti Diagram */}
              {lastGen && (
                <div className="sim-panel">
                  <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'Space Grotesk' }}>De Finetti Diagram</h3>
                  <svg viewBox="0 0 220 200" className="w-full" style={{ maxWidth: '320px', margin: '0 auto', display: 'block' }}>
                    {/* Triangle outline */}
                    <polygon points="20,180 200,180 110,10" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />

                    {/* Grid lines */}
                    {[0.2, 0.4, 0.6, 0.8].map((f) => {
                      const x1 = (1 - f) * 20 + f * 110;
                      const y1 = (1 - f) * 180 + f * 10;
                      const x2 = f * 200 + (1 - f) * 110;
                      const y2 = f * 180 + (1 - f) * 10;
                      return <line key={f} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />;
                    })}
                    {[0.2, 0.4, 0.6, 0.8].map((f) => {
                      const x1 = (1 - f) * 20 + f * 200;
                      const y1 = 180;
                      const x2 = f * 110;
                      const y2 = (1 - f) * 180 + f * 10;
                      return <line key={`b${f}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />;
                    })}
                    {[0.2, 0.4, 0.6, 0.8].map((f) => {
                      const x1 = (1 - f) * 200 + f * 20;
                      const y1 = 180;
                      const x2 = (1 - f) * 110 + f * 110;
                      const y2 = (1 - f) * 10 + f * 180;
                      return <line key={`c${f}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.4" />;
                    })}

                    {/* HW equilibrium parabola */}
                    <path
                      d={Array.from({ length: 100 }, (_, i) => {
                        const t = i / 99;
                        const x = t * t * 20 + 2 * t * (1 - t) * 110 + (1 - t) * (1 - t) * 200;
                        const y = t * t * 180 + 2 * t * (1 - t) * 10 + (1 - t) * (1 - t) * 180;
                        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                      }).join(' ')}
                      stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeDasharray="4,3"
                    />

                    {/* Population trajectory points */}
                    {results.map((d, i) => {
                      const x = d.AA * 20 + d.Aa * 110 + d.aa * 200;
                      const y = d.AA * 180 + d.Aa * 10 + d.aa * 180;
                      const opacity = 0.3 + 0.7 * (i / Math.max(results.length - 1, 1));
                      const isLast = i === results.length - 1;
                      return (
                        <circle
                          key={i}
                          cx={x} cy={y}
                          r={isLast ? 5 : 2.5}
                          fill={isLast ? '#B89555' : '#5B7FA5'}
                          opacity={opacity}
                          stroke={isLast ? '#1a1a1a' : 'none'}
                          strokeWidth={isLast ? 1.5 : 0}
                        />
                      );
                    })}

                    {/* Vertex labels */}
                    <text x="8" y="196" fontSize="10" fontWeight="bold" fill="#5B7FA5">AA</text>
                    <text x="193" y="196" fontSize="10" fontWeight="bold" fill="#C47B6B">aa</text>
                    <text x="110" y="6" fontSize="10" fontWeight="bold" fill="#8B7BB5" textAnchor="middle">Aa</text>
                  </svg>
                  <div className="flex flex-wrap justify-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#5B7FA5]" /> generations
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-[#B89555] border border-black" /> final gen
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-4 border-t border-dashed border-[#94a3b8]" /> HW equilibrium
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
