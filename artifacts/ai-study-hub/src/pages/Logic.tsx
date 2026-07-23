import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CircuitNode, Wire, GateType, Circuit, Settings, ThemeId } from "@/features/logic/types";
import { GATE_DEFS, CATEGORIES, portPos } from "@/features/logic/gates";
import { simulate, generateTruthTable } from "@/features/logic/engine";
import { getTheme, THEMES } from "@/features/logic/themes";
import { cn } from "@/lib/utils";

let _id = 1;
const uid = () => `n${_id++}`;

const GATE_COLORS: Record<string, string> = {
  "Input Controls": "#10b981", "Output Controls": "#f59e0b",
  "Logic Gates": "#6366f1", Combinational: "#8b5cf6", Sequential: "#ec4899",
};

function GateSVG({ type, w, h }: { type: GateType; w: number; h: number }) {
  const m = h / 2;
  switch (type) {
    case "const-0": case "const-1":
      return <rect width={w} height={h} rx={4} fill="#374151" stroke="#4b5563" strokeWidth={1.5} />;
    case "toggle":
      return <rect width={w} height={h} rx={6} fill="#059669" stroke="#047857" strokeWidth={1.5} />;
    case "button":
      return <rect width={w} height={h} rx={6} fill="#d97706" stroke="#b45309" strokeWidth={1.5} />;
    case "clock":
      return <rect width={w} height={h} rx={6} fill="#0891b2" stroke="#0e7490" strokeWidth={1.5} />;
    case "bulb":
      return <circle cx={w / 2} cy={m} r={m - 2} fill="#fbbf24" stroke="#d97706" strokeWidth={1.5} />;
    case "hex-display":
      return <rect width={w} height={h} rx={4} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />;
    case "led":
      return <circle cx={w / 2} cy={m} r={m - 4} fill="#ef4444" stroke="#dc2626" strokeWidth={1.5} />;
    case "buffer":
      return <polygon points={`4,2 ${w - 4},${m} 4,${h - 2}`} fill="#6366f1" stroke="#4f46e5" strokeWidth={1.5} />;
    case "not":
      return (
        <g>
          <polygon points={`4,2 ${w - 12},${m} 4,${h - 2}`} fill="#8b5cf6" stroke="#7c3aed" strokeWidth={1.5} />
          <circle cx={w - 9} cy={m} r={4} fill="#8b5cf6" stroke="#7c3aed" strokeWidth={1.5} />
        </g>
      );
    case "and":
      return (
        <path
          d={`M 4 2 L ${w * 0.5} 2 A ${w * 0.45} ${m - 2} 0 0 1 ${w * 0.5} ${h - 2} L 4 ${h - 2} Z`}
          fill="#3b82f6" stroke="#2563eb" strokeWidth={1.5}
        />
      );
    case "nand":
      return (
        <g>
          <path d={`M 4 2 L ${w * 0.45} 2 A ${w * 0.42} ${m - 2} 0 0 1 ${w * 0.45} ${h - 2} L 4 ${h - 2} Z`} fill="#ec4899" stroke="#db2777" strokeWidth={1.5} />
          <circle cx={w - 8} cy={m} r={4} fill="#ec4899" stroke="#db2777" strokeWidth={1.5} />
        </g>
      );
    case "or":
      return (
        <path
          d={`M 4 2 Q ${w * 0.2} 2 ${w - 4} ${m} Q ${w * 0.2} ${h - 2} 4 ${h - 2} Q ${w * 0.15} ${m} 4 2 Z`}
          fill="#06b6d4" stroke="#0891b2" strokeWidth={1.5}
        />
      );
    case "nor":
      return (
        <g>
          <path d={`M 4 2 Q ${w * 0.2} 2 ${w - 10} ${m} Q ${w * 0.2} ${h - 2} 4 ${h - 2} Q ${w * 0.15} ${m} 4 2 Z`} fill="#f97316" stroke="#ea580c" strokeWidth={1.5} />
          <circle cx={w - 6} cy={m} r={4} fill="#f97316" stroke="#ea580c" strokeWidth={1.5} />
        </g>
      );
    case "xor":
      return (
        <g>
          <path d={`M 10 2 Q ${w * 0.25} 2 ${w - 4} ${m} Q ${w * 0.25} ${h - 2} 10 ${h - 2} Q ${w * 0.18} ${m} 10 2 Z`} fill="#14b8a6" stroke="#0d9488" strokeWidth={1.5} />
          <path d={`M 4 ${h - 2} Q ${w * 0.1} ${m} 4 2`} fill="none" stroke="#0d9488" strokeWidth={2} />
        </g>
      );
    case "xnor":
      return (
        <g>
          <path d={`M 12 2 Q ${w * 0.25} 2 ${w - 10} ${m} Q ${w * 0.25} ${h - 2} 12 ${h - 2} Q ${w * 0.18} ${m} 12 2 Z`} fill="#a855f7" stroke="#9333ea" strokeWidth={1.5} />
          <path d={`M 6 ${h - 2} Q ${w * 0.1} ${m} 6 2`} fill="none" stroke="#9333ea" strokeWidth={2} />
          <circle cx={w - 6} cy={m} r={4} fill="#a855f7" stroke="#9333ea" strokeWidth={1.5} />
        </g>
      );
    default:
      return <rect width={w} height={h} rx={4} fill="#475569" stroke="#334155" strokeWidth={1.5} />;
  }
}

function NodePorts({ node, onPortDown }: { node: CircuitNode; onPortDown: (nid: string, pid: string, side: "left" | "right", e: React.MouseEvent) => void }) {
  const def = GATE_DEFS[node.type];
  if (!def) return null;
  return (
    <g>
      {def.inputs.map((p, i) => {
        const py = (def.h / (def.inputs.length + 1)) * (i + 1);
        const val = !!node.inputs[p.id];
        return (
          <g key={p.id}>
            <circle cx={0} cy={py} r={5} fill={val ? "#22c55e" : "#1e293b"}
              stroke={val ? "#16a34a" : "#64748b"} strokeWidth={1.5}
              onMouseDown={(e) => { e.stopPropagation(); onPortDown(node.id, p.id, "left", e); }}
              className="cursor-crosshair hover:stroke-yellow-400 transition-colors" />
            <text x={10} y={py} dominantBaseline="central" fill="rgba(255,255,255,0.5)" fontSize={8} fontWeight={600} pointerEvents="none">{p.label}</text>
          </g>
        );
      })}
      {def.outputs.map((p, i) => {
        const py = (def.h / (def.outputs.length + 1)) * (i + 1);
        const px = def.w;
        const val = !!node.outputs[p.id];
        return (
          <g key={p.id}>
            <circle cx={px} cy={py} r={5} fill={val ? "#22c55e" : "#1e293b"}
              stroke={val ? "#16a34a" : "#64748b"} strokeWidth={1.5}
              onMouseDown={(e) => { e.stopPropagation(); onPortDown(node.id, p.id, "right", e); }}
              className="cursor-crosshair hover:stroke-yellow-400 transition-colors" />
            <text x={px - 10} y={py} textAnchor="end" dominantBaseline="central" fill="rgba(255,255,255,0.5)" fontSize={8} fontWeight={600} pointerEvents="none">{p.label}</text>
          </g>
        );
      })}
    </g>
  );
}

export default function Logic() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [circuit, setCircuit] = useState<Circuit>({ nodes: [], wires: [] });
  const [selected, setSelected] = useState<string | null>(null);
  const [placing, setPlacing] = useState<GateType | null>(null);
  const [wireFrom, setWireFrom] = useState<{ nodeId: string; portId: string; side: "left" | "right" } | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState<{ nodeId: string; ox: number; oy: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [panning, setPanning] = useState(false);
  const panRef = useRef({ sx: 0, sy: 0, px: 0, py: 0 });
  const [settings, setSettings] = useState<Settings>({ showGrid: true, theme: "dark" });
  const [showTruthTable, setShowTruthTable] = useState(true);
  const [showKMap, setShowKMap] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerilog, setShowVerilog] = useState(false);
  const [verilogCode, setVerilogCode] = useState("// Verilog HDL\nmodule circuit(\n  input A, B,\n  output Y\n);\n  assign Y = A & B;\nendmodule");
  const [saved, setSaved] = useState(true);

  const theme = useMemo(() => getTheme(settings.theme), [settings.theme]);

  const simulated = useMemo(() => simulate(circuit), [circuit]);
  const tt = useMemo(() => generateTruthTable(circuit), [circuit]);

  const inputNodes = simulated.nodes.filter((n) => ["toggle", "const-0", "const-1", "button"].includes(n.type));
  const outputNodes = simulated.nodes.filter((n) => ["bulb", "hex-display", "led"].includes(n.type));

  const svgCoord = useCallback((cx: number, cy: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return { x: (cx - r.left - pan.x) / zoom, y: (cy - r.top - pan.y) / zoom };
  }, [pan, zoom]);

  const placeNode = useCallback((type: GateType, x: number, y: number) => {
    const def = GATE_DEFS[type];
    if (!def) return;
    const id = uid();
    const inputs: Record<string, boolean> = {};
    const outputs: Record<string, boolean> = {};
    def.inputs.forEach((p) => { inputs[p.id] = false; });
    def.outputs.forEach((p) => { outputs[p.id] = false; });
    if (type === "const-1") outputs.out = true;
    if (type === "toggle") outputs.out = false;
    setCircuit((c) => ({ ...c, nodes: [...c.nodes, { id, type, x, y, inputs, outputs }] }));
    setSelected(id);
    setSaved(false);
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setCircuit((c) => ({ ...c, nodes: c.nodes.map((n) => n.id === id ? { ...n, x, y } : n) }));
  }, []);

  const toggleInput = useCallback((id: string) => {
    setCircuit((c) => ({
      ...c,
      nodes: c.nodes.map((n) => n.id === id ? { ...n, outputs: { ...n.outputs, out: !n.outputs.out } } : n),
    }));
    setSaved(false);
  }, []);

  const handlePortDown = useCallback((nid: string, pid: string, side: "left" | "right", e: React.MouseEvent) => {
    e.stopPropagation();
    if (wireFrom) {
      if (wireFrom.side !== side && wireFrom.nodeId !== nid) {
        const fromNode = wireFrom.side === "right" ? wireFrom.nodeId : nid;
        const fromPort = wireFrom.side === "right" ? wireFrom.portId : pid;
        const toNode = wireFrom.side === "right" ? nid : wireFrom.nodeId;
        const toPort = wireFrom.side === "right" ? pid : wireFrom.portId;
        const exists = circuit.wires.some((w) => w.toNode === toNode && w.toPort === toPort);
        if (!exists) {
          setCircuit((c) => ({ ...c, wires: [...c.wires, { id: uid(), fromNode, fromPort, toNode, toPort }] }));
          setSaved(false);
        }
      }
      setWireFrom(null);
    } else {
      setWireFrom({ nodeId: nid, portId: pid, side });
    }
  }, [wireFrom, circuit.wires]);

  const deleteNode = useCallback((id: string) => {
    setCircuit((c) => ({
      nodes: c.nodes.filter((n) => n.id !== id),
      wires: c.wires.filter((w) => w.fromNode !== id && w.toNode !== id),
    }));
    setSelected(null);
    setSaved(false);
  }, []);

  const clearAll = useCallback(() => {
    setCircuit({ nodes: [], wires: [] });
    setSelected(null);
    setPlacing(null);
    setWireFrom(null);
    setSaved(false);
  }, []);

  const autoArrange = useCallback(() => {
    setCircuit((c) => {
      const inputs = c.nodes.filter((n) => ["toggle", "const-0", "const-1", "button", "clock"].includes(n.type));
      const gates = c.nodes.filter((n) => !["toggle", "const-0", "const-1", "button", "clock", "bulb", "hex-display", "led"].includes(n.type));
      const outputs = c.nodes.filter((n) => ["bulb", "hex-display", "led"].includes(n.type));
      const updated = [...c.nodes];
      let x = 60;
      inputs.forEach((n, i) => {
        const idx = updated.findIndex((u) => u.id === n.id);
        if (idx >= 0) updated[idx] = { ...updated[idx], x, y: 40 + i * 70 };
      });
      x += 160;
      gates.forEach((n, i) => {
        const idx = updated.findIndex((u) => u.id === n.id);
        if (idx >= 0) updated[idx] = { ...updated[idx], x, y: 30 + i * 80 };
      });
      x += 180;
      outputs.forEach((n, i) => {
        const idx = updated.findIndex((u) => u.id === n.id);
        if (idx >= 0) updated[idx] = { ...updated[idx], x, y: 40 + i * 70 };
      });
      return { ...c, nodes: updated };
    });
  }, []);

  const exportCircuit = useCallback(() => {
    const blob = new Blob([JSON.stringify(circuit, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "circuit.json";
    a.click();
  }, [circuit]);

  const importCircuit = useCallback(() => {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".json";
    inp.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.nodes && data.wires) { setCircuit(data); setSelected(null); }
        } catch { /* */ }
      };
      reader.readAsText(f);
    };
    inp.click();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selected) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") deleteNode(selected);
      }
      if (e.key === "Escape") { setPlacing(null); setWireFrom(null); setSelected(null); }
      if (e.key === "a" && !e.ctrlKey && !e.metaKey) {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA") autoArrange();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, deleteNode, autoArrange]);

  return (
    <div className="h-[calc(100dvh-4.5rem)] flex flex-col" style={{ background: theme.bg }}>
      {/* Toolbar */}
      <div className="h-10 flex items-center px-3 gap-1 shrink-0 border-b" style={{ background: theme.toolbar, borderColor: theme.border }}>
        <div className="flex items-center gap-2 mr-3">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: theme.accent }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
          </div>
          <span className="text-sm font-bold" style={{ color: theme.text }}>Logic</span>
        </div>

        <div className="w-px h-5" style={{ background: theme.border }} />

        {[
          { label: "New", icon: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z", action: clearAll },
          { label: "Save", icon: "M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z", action: exportCircuit },
          { label: "Load", icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3", action: importCircuit },
        ].map((b) => (
          <button key={b.label} onClick={b.action}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors hover:bg-white/5"
            style={{ color: theme.textMuted }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={b.icon} /></svg>
            {b.label}
          </button>
        ))}

        <div className="w-px h-5" style={{ background: theme.border }} />

        <button onClick={() => setShowTruthTable(!showTruthTable)}
          className={cn("px-2 py-1 rounded text-[11px] font-medium transition-colors", showTruthTable ? "text-white" : "")}
          style={showTruthTable ? { background: theme.accent + "30", color: theme.accent } : { color: theme.textMuted }}>
          Truth Table
        </button>
        <button onClick={() => setShowKMap(!showKMap)}
          className={cn("px-2 py-1 rounded text-[11px] font-medium transition-colors", showKMap ? "text-white" : "")}
          style={showKMap ? { background: theme.accent + "30", color: theme.accent } : { color: theme.textMuted }}>
          K-Map
        </button>
        <button onClick={() => setShowVerilog(!showVerilog)}
          className={cn("px-2 py-1 rounded text-[11px] font-medium transition-colors", showVerilog ? "text-white" : "")}
          style={showVerilog ? { background: theme.accent + "30", color: theme.accent } : { color: theme.textMuted }}>
          Verilog
        </button>

        <div className="flex-1" />

        <button onClick={() => setShowSettings(true)} className="px-2 py-1 rounded text-[11px] font-medium transition-colors hover:bg-white/5" style={{ color: theme.textMuted }}>
          Settings
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Palette */}
        <div className="w-56 flex flex-col overflow-hidden border-r shrink-0" style={{ background: theme.sidebar, borderColor: theme.border }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: theme.border }}>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Components</span>
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {CATEGORIES.map((cat) => {
              const gates = Object.values(GATE_DEFS).filter((g) => g.category === cat);
              return (
                <PaletteCategory key={cat} category={cat} gates={gates} placing={placing} onSelect={(t) => setPlacing(placing === t ? null : t)} theme={theme} />
              );
            })}
          </div>
        </div>

        {/* Canvas + Panels */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Canvas */}
            <div className="flex-1 relative" style={{ background: theme.canvasBg }}>
              <svg ref={svgRef} className="w-full h-full"
                style={{ cursor: placing ? "crosshair" : panning ? "grabbing" : "default" }}
                onMouseDown={(e) => {
                  if (e.button === 1 || (e.button === 0 && e.altKey)) {
                    setPanning(true);
                    panRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
                    return;
                  }
                  if (placing) {
                    const pt = svgCoord(e.clientX, e.clientY);
                    const def = GATE_DEFS[placing];
                    placeNode(placing, pt.x - def.w / 2, pt.y - def.h / 2);
                    return;
                  }
                  setSelected(null);
                  setWireFrom(null);
                }}
                onMouseMove={(e) => {
                  const pt = svgCoord(e.clientX, e.clientY);
                  setMouse(pt);
                  if (panning) {
                    setPan({ x: panRef.current.px + (e.clientX - panRef.current.sx), y: panRef.current.py + (e.clientY - panRef.current.sy) });
                    return;
                  }
                  if (dragging) moveNode(dragging.nodeId, pt.x - dragging.ox, pt.y - dragging.oy);
                }}
                onMouseUp={() => { setPanning(false); setDragging(null); }}
                onMouseLeave={() => { setPanning(false); setDragging(null); }}
                onWheel={(e) => { e.preventDefault(); setZoom((z) => Math.min(Math.max(z * (e.deltaY > 0 ? 0.92 : 1.08), 0.15), 4)); }}
              >
                {settings.showGrid && (
                  <defs>
                    <pattern id="grid-dots" width={20 * zoom} height={20 * zoom} patternUnits="userSpaceOnUse" x={pan.x % (20 * zoom)} y={pan.y % (20 * zoom)}>
                      <circle cx={1} cy={1} r={0.8} fill={theme.gridDot} />
                    </pattern>
                  </defs>
                )}
                {settings.showGrid && <rect width="100%" height="100%" fill="url(#grid-dots)" />}

                <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
                  {/* Wires */}
                  {simulated.wires.map((w) => {
                    const src = simulated.nodes.find((n) => n.id === w.fromNode);
                    const dst = simulated.nodes.find((n) => n.id === w.toNode);
                    if (!src || !dst) return null;
                    const from = portPos(src.x, src.y, src.type, w.fromPort, "right");
                    const to = portPos(dst.x, dst.y, dst.type, w.toPort, "left");
                    const val = !!src.outputs[w.fromPort];
                    const dx = Math.abs(to.x - from.x) * 0.5;
                    return (
                      <g key={w.id}>
                        <path d={`M${from.x},${from.y} C${from.x + dx},${from.y} ${to.x - dx},${to.y} ${to.x},${to.y}`}
                          fill="none" stroke={val ? "#22c55e" : "#475569"} strokeWidth={2} strokeLinecap="round" />
                      </g>
                    );
                  })}

                  {/* Temp wire */}
                  {wireFrom && (() => {
                    const src = simulated.nodes.find((n) => n.id === wireFrom.nodeId);
                    if (!src) return null;
                    const from = portPos(src.x, src.y, src.type, wireFrom.portId, wireFrom.side);
                    const dx = Math.abs(mouse.x - from.x) * 0.4;
                    const d = wireFrom.side === "right"
                      ? `M${from.x},${from.y} C${from.x + dx},${from.y} ${mouse.x - dx},${mouse.y} ${mouse.x},${mouse.y}`
                      : `M${from.x},${from.y} C${from.x - dx},${from.y} ${mouse.x + dx},${mouse.y} ${mouse.x},${mouse.y}`;
                    return <path d={d} fill="none" stroke="#facc15" strokeWidth={1.5} strokeDasharray="6 4" />;
                  })()}

                  {/* Nodes */}
                  {simulated.nodes.map((node) => {
                    const def = GATE_DEFS[node.type];
                    if (!def) return null;
                    const isSel = node.id === selected;
                    const cat = def.category;
                    const color = GATE_COLORS[cat] || "#64748b";
                    const isInput = ["toggle", "const-0", "const-1", "button", "clock"].includes(node.type);
                    const isOutput = ["bulb", "hex-display", "led"].includes(node.type);

                    return (
                      <g key={node.id} transform={`translate(${node.x},${node.y})`}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (isInput && node.type === "toggle") { toggleInput(node.id); return; }
                          if (isInput && node.type === "const-0") return;
                          if (isInput && node.type === "const-1") return;
                          const pt = svgCoord(e.clientX, e.clientY);
                          setDragging({ nodeId: node.id, ox: pt.x - node.x, oy: pt.y - node.y });
                          setSelected(node.id);
                        }}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        {isSel && (
                          <rect x={-3} y={-3} width={def.w + 6} height={def.h + 6} rx={6}
                            fill="none" stroke="#facc15" strokeWidth={2} strokeDasharray="4 2" opacity={0.7} />
                        )}

                        <g style={{ color }}>
                          <GateSVG type={node.type} w={def.w} h={def.h} />
                        </g>

                        <text x={def.w / 2} y={def.h / 2} textAnchor="middle" dominantBaseline="central"
                          fill="white" fontSize={10} fontWeight={700} fontFamily="system-ui" pointerEvents="none">
                          {isInput ? (node.type === "const-0" ? "0" : node.type === "const-1" ? "1" : node.outputs.out ? "1" : "0")
                            : isOutput ? (node.inputs.in || node.inputs.r ? "ON" : "OFF")
                            : def.label}
                        </text>

                        <NodePorts node={node} onPortDown={handlePortDown} />
                      </g>
                    );
                  })}
                </g>

                {placing && (
                  <text x="50%" y={20} textAnchor="middle" fill={theme.accent} fontSize={11} fontWeight={600} fontFamily="system-ui" opacity={0.7}>
                    Click to place {GATE_DEFS[placing]?.label} — Esc to cancel
                  </text>
                )}

                {simulated.nodes.length === 0 && !placing && (
                  <text x="50%" y="50%" textAnchor="middle" fill={theme.textMuted} fontSize={14} fontFamily="system-ui" opacity={0.4}>
                    Select a component from the palette and click here to place it
                  </text>
                )}
              </svg>

              {/* Canvas status */}
              <div className="absolute bottom-2 left-2 flex gap-2">
                <span className="px-2 py-1 rounded text-[10px] font-mono border" style={{ background: theme.card, borderColor: theme.border, color: theme.textMuted }}>
                  {simulated.nodes.length} nodes · {simulated.wires.length} wires · {Math.round(zoom * 100)}%
                </span>
                {wireFrom && (
                  <span className="px-2 py-1 rounded text-[10px] font-semibold border" style={{ background: theme.accent + "20", borderColor: theme.accent + "40", color: theme.accent }}>
                    Click an input port to connect — Esc to cancel
                  </span>
                )}
              </div>
            </div>

            {/* Truth Table Panel */}
            {showTruthTable && (
              <div className="w-80 border-l overflow-auto" style={{ background: theme.panel, borderColor: theme.border }}>
                <TruthTablePanel tt={tt} theme={theme} />
              </div>
            )}
          </div>

          {/* K-Map Panel */}
          {showKMap && (
            <div className="h-52 border-t overflow-auto" style={{ background: theme.panel, borderColor: theme.border }}>
              <KMapPanel tt={tt} theme={theme} />
            </div>
          )}

          {/* Verilog Panel */}
          {showVerilog && (
            <div className="h-48 border-t flex flex-col" style={{ background: theme.panel, borderColor: theme.border }}>
              <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: theme.border }}>
                <span className="text-[11px] font-bold" style={{ color: theme.textMuted }}>Verilog IDE</span>
                <div className="flex gap-1">
                  <button className="px-2 py-0.5 rounded text-[10px] font-medium" style={{ background: theme.accent + "20", color: theme.accent }}>Run</button>
                </div>
              </div>
              <textarea value={verilogCode} onChange={(e) => setVerilogCode(e.target.value)}
                className="flex-1 w-full p-3 text-xs font-mono resize-none outline-none"
                style={{ background: theme.canvasBg, color: theme.text }} />
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60" onClick={() => setShowSettings(false)}>
          <div className="w-96 rounded-xl border p-5 shadow-2xl" style={{ background: theme.card, borderColor: theme.border }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold" style={{ color: theme.text }}>Settings</h3>
              <button onClick={() => setShowSettings(false)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10" style={{ color: theme.textMuted }}>×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: theme.textMuted }}>Canvas Color</label>
                <div className="flex gap-2">
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => setSettings((s) => ({ ...s, theme: t.id }))}
                      className={cn("flex-1 py-2 rounded-lg text-[11px] font-medium border transition-all",
                        settings.theme === t.id ? "ring-2" : "")}
                      style={{
                        background: t.canvasBg, borderColor: t.border, color: t.text,
                        ringColor: t.accent,
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium" style={{ color: theme.text }}>Show Grid</label>
                <button onClick={() => setSettings((s) => ({ ...s, showGrid: !s.showGrid }))}
                  className={cn("w-9 h-5 rounded-full transition-colors relative", settings.showGrid ? "" : "opacity-50")}
                  style={{ background: settings.showGrid ? theme.accent : theme.border }}>
                  <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                    settings.showGrid ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t" style={{ borderColor: theme.border }}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.textMuted }}>Keyboard Shortcuts</h4>
              <div className="grid grid-cols-2 gap-1 text-[10px]" style={{ color: theme.textMuted }}>
                {[
                  ["Delete Selected", "Delete"], ["Cancel", "Esc"], ["Auto Arrange", "A"],
                  ["Zoom In", "Scroll Up"], ["Zoom Out", "Scroll Down"], ["Pan", "Alt+Drag"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k}</span>
                    <kbd className="px-1 rounded border text-[9px] font-mono" style={{ borderColor: theme.border }}>{v}</kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PaletteCategory({ category, gates, placing, onSelect, theme }: {
  category: string; gates: ReturnType<typeof Object.values>[0][]; placing: string | null;
  onSelect: (t: GateType) => void; theme: AppTheme;
}) {
  const [open, setOpen] = useState(category === "Logic Gates");
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-white/5"
        style={{ color: open ? theme.accent : theme.textMuted }}>
        <svg className={cn("w-2.5 h-2.5 transition-transform", open && "rotate-90")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        {category}
      </button>
      {open && (
        <div className="px-2 pb-2 space-y-0.5">
          {gates.map((g) => {
            const active = placing === g.type;
            return (
              <button key={g.type} onClick={() => onSelect(g.type)}
                className={cn("w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                  active ? "border-current" : "border-transparent hover:bg-white/5")}
                style={{
                  background: active ? theme.accent + "20" : undefined,
                  color: active ? theme.accent : theme.textMuted,
                }}>
                <span className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: GATE_COLORS[g.category] + "30" }}>
                  <span className="w-2 h-2 rounded-sm" style={{ background: GATE_COLORS[g.category] }} />
                </span>
                <span className="truncate">{g.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TruthTablePanel({ tt, theme }: { tt: ReturnType<typeof generateTruthTable>; theme: AppTheme }) {
  if (tt.rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4" style={{ color: theme.textMuted }}>
        <p className="text-xs font-medium">No inputs or outputs</p>
        <p className="text-[10px] mt-1 opacity-60">Add Switch/Input and Bulb/LED components</p>
      </div>
    );
  }
  const inputs = tt.inputNodes || [];
  const outputs = tt.outputNodes || [];
  return (
    <div className="p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: theme.textMuted }}>Truth Table</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: theme.accent + "20", color: theme.accent }}>{tt.rows.length} rows</span>
      </div>
      <table className="w-full text-[10px] border-collapse">
        <thead>
          <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
            <th className="px-2 py-1 text-left font-bold" style={{ color: theme.textMuted }}>#</th>
            {inputs.map((n) => <th key={n.id} className="px-2 py-1 text-center font-bold" style={{ color: "#22c55e" }}>{n.id.slice(0, 5)}</th>)}
            <th className="w-px" style={{ background: theme.border }} />
            {outputs.map((n) => <th key={n.id} className="px-2 py-1 text-center font-bold" style={{ color: "#f59e0b" }}>{n.id.slice(0, 5)}</th>)}
          </tr>
        </thead>
        <tbody>
          {tt.rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${theme.border}20`, background: i % 2 ? theme.canvasBg + "40" : undefined }}>
              <td className="px-2 py-1 font-mono" style={{ color: theme.textMuted }}>{i}</td>
              {inputs.map((n) => (
                <td key={n.id} className="px-2 py-1 text-center">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded font-mono font-bold"
                    style={{ background: row.inputs[n.id] ? "#22c55e20" : theme.canvasBg, color: row.inputs[n.id] ? "#22c55e" : theme.textMuted }}>
                    {row.inputs[n.id] ? "1" : "0"}
                  </span>
                </td>
              ))}
              <td className="w-px" style={{ background: theme.border + "40" }} />
              {outputs.map((n) => (
                <td key={n.id} className="px-2 py-1 text-center">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded font-mono font-bold"
                    style={{ background: row.outputs[n.id] ? "#f59e0b20" : theme.canvasBg, color: row.outputs[n.id] ? "#f59e0b" : theme.textMuted }}>
                    {row.outputs[n.id] ? "1" : "0"}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function KMapPanel({ tt, theme }: { tt: ReturnType<typeof generateTruthTable>; theme: AppTheme }) {
  if (tt.rows.length === 0 || !tt.inputNodes || tt.inputNodes.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4" style={{ color: theme.textMuted }}>
        <p className="text-xs font-medium">K-Map requires at least 2 inputs</p>
        <p className="text-[10px] mt-1 opacity-60">Add at least 2 Switch/Input components</p>
      </div>
    );
  }

  const n = Math.min(tt.inputNodes.length, 4);
  const vars = tt.inputNodes.slice(0, n);
  const outNode = tt.outputNodes?.[0];

  const grayCode = (bits: number): number[] => {
    if (bits === 1) return [0, 1];
    const prev = grayCode(bits - 1);
    return [...prev, ...prev.reverse().map((v) => v + (1 << (bits - 1)))];
  };

  const rows = n <= 2 ? 2 : 4;
  const cols = n <= 2 ? 2 : 4;
  const rowCode = grayCode(Math.log2(rows));
  const colCode = grayCode(Math.log2(cols));

  const getVal = (r: number, c: number): boolean => {
    const idx = (r << Math.log2(cols)) | c;
    const match = tt.rows[idx];
    return match && outNode ? !!match.outputs[outNode.id] : false;
  };

  return (
    <div className="p-3">
      <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: theme.textMuted }}>Karnaugh Map</span>
      <div className="inline-flex flex-col">
        <div className="flex">
          <div className="w-10 h-8" />
          {colCode.map((c) => (
            <div key={c} className="w-10 h-8 flex items-center justify-center text-[10px] font-mono font-bold" style={{ color: theme.textMuted }}>
              {c.toString(2).padStart(Math.log2(cols), "0")}
            </div>
          ))}
        </div>
        {rowCode.map((r, ri) => (
          <div key={r} className="flex">
            <div className="w-10 h-8 flex items-center justify-center text-[10px] font-mono font-bold" style={{ color: theme.textMuted }}>
              {r.toString(2).padStart(Math.log2(rows), "0")}
            </div>
            {colCode.map((c, ci) => {
              const val = getVal(ri, ci);
              return (
                <div key={c} className="w-10 h-8 flex items-center justify-center rounded m-0.5 text-[11px] font-mono font-bold transition-colors"
                  style={{ background: val ? theme.accent + "30" : theme.canvasBg, color: val ? theme.accent : theme.textMuted, border: `1px solid ${theme.border}` }}>
                  {val ? "1" : "0"}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
