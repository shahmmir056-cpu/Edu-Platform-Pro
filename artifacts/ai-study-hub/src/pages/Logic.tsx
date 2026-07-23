import { useCallback, useEffect, useMemo, useState } from "react";
import type { CircuitNode, Wire, GateType, Circuit } from "@/features/logic/types";
import { GATE_DEFS } from "@/features/logic/gates";
import { simulate, generateTruthTable, exportJSON } from "@/features/logic/engine";
import { Canvas } from "@/features/logic/Canvas";
import { Palette } from "@/features/logic/Palette";
import { TruthTableView } from "@/features/logic/TruthTableView";
import { Toolbar } from "@/features/logic/Toolbar";

let nextId = 1;
function uid() {
  return `n${nextId++}`;
}

function autoArrange(nodes: CircuitNode[]): CircuitNode[] {
  if (nodes.length === 0) return nodes;

  const inputs = nodes.filter((n) => n.type === "input");
  const gates = nodes.filter((n) => n.type !== "input" && n.type !== "output");
  const outputs = nodes.filter((n) => n.type === "output");

  const updated = [...nodes];
  let x = 80;

  for (const node of inputs) {
    const idx = updated.findIndex((n) => n.id === node.id);
    if (idx !== -1) updated[idx] = { ...updated[idx], x, y: 80 + inputs.indexOf(node) * 80 };
  }
  x += 180;

  for (const node of gates) {
    const idx = updated.findIndex((n) => n.id === node.id);
    if (idx !== -1) updated[idx] = { ...updated[idx], x, y: 60 + gates.indexOf(node) * 90 };
  }
  x += 200;

  for (const node of outputs) {
    const idx = updated.findIndex((n) => n.id === node.id);
    if (idx !== -1) updated[idx] = { ...updated[idx], x, y: 80 + outputs.indexOf(node) * 80 };
  }

  return updated;
}

export default function Logic() {
  const [circuit, setCircuit] = useState<Circuit>({ nodes: [], wires: [] });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [placingType, setPlacingType] = useState<GateType | null>(null);
  const [wireStart, setWireStart] = useState<{
    nodeId: string;
    portId: string;
    side: "left" | "right";
  } | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [showTable, setShowTable] = useState(true);

  const simulated = useMemo(() => {
    if (!isRunning) return circuit;
    return simulate(circuit);
  }, [circuit, isRunning]);

  const truthTable = useMemo(() => generateTruthTable(circuit), [circuit]);

  const inputNodes = useMemo(() => simulated.nodes.filter((n) => n.type === "input"), [simulated]);
  const outputNodes = useMemo(() => simulated.nodes.filter((n) => n.type === "output"), [simulated]);

  const placeNode = useCallback((type: GateType, x: number, y: number) => {
    const def = GATE_DEFS[type];
    if (!def) return;
    const id = uid();
    const inputVals: Record<string, boolean> = {};
    for (const p of def.inputs) inputVals[p.id] = false;
    if (type === "input") inputVals._value = false;

    setCircuit((prev) => ({
      ...prev,
      nodes: [...prev.nodes, { id, type, x, y, inputValues: inputVals, outputValues: {} }],
    }));
    setSelectedNodeId(id);
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setCircuit((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
  }, []);

  const toggleInput = useCallback((nodeId: string, _portId: string) => {
    setCircuit((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId && n.type === "input"
          ? { ...n, inputValues: { ...n.inputValues, _value: !n.inputValues._value } }
          : n
      ),
    }));
  }, []);

  const handlePortMouseDown = useCallback(
    (nodeId: string, portId: string, side: "left" | "right", _e: React.MouseEvent) => {
      if (wireStart) {
        if (wireStart.side === "right" && side === "left") {
          if (wireStart.nodeId !== nodeId) {
            const exists = circuit.wires.some(
              (w) => w.to.nodeId === nodeId && w.to.portId === portId
            );
            if (!exists) {
              const newWire: Wire = {
                id: uid(),
                from: { nodeId: wireStart.nodeId, portId: wireStart.portId },
                to: { nodeId, portId },
              };
              setCircuit((prev) => ({ ...prev, wires: [...prev.wires, newWire] }));
            }
          }
        } else if (wireStart.side === "left" && side === "right") {
          if (wireStart.nodeId !== nodeId) {
            const exists = circuit.wires.some(
              (w) => w.to.nodeId === wireStart.nodeId && w.to.portId === wireStart.portId
            );
            if (!exists) {
              const newWire: Wire = {
                id: uid(),
                from: { nodeId, portId },
                to: { nodeId: wireStart.nodeId, portId: wireStart.portId },
              };
              setCircuit((prev) => ({ ...prev, wires: [...prev.wires, newWire] }));
            }
          }
        }
        setWireStart(null);
      } else {
        setWireStart({ nodeId, portId, side });
      }
    },
    [wireStart, circuit.wires]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedNodeId) return;
    setCircuit((prev) => ({
      nodes: prev.nodes.filter((n) => n.id !== selectedNodeId),
      wires: prev.wires.filter(
        (w) => w.from.nodeId !== selectedNodeId && w.to.nodeId !== selectedNodeId
      ),
    }));
    setSelectedNodeId(null);
  }, [selectedNodeId]);

  const clearCircuit = useCallback(() => {
    setCircuit({ nodes: [], wires: [] });
    setSelectedNodeId(null);
    setPlacingType(null);
    setWireStart(null);
  }, []);

  const handleExport = useCallback(() => {
    const json = exportJSON(circuit);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "circuit.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [circuit]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.nodes && data.wires) {
            setCircuit(data);
            setSelectedNodeId(null);
          }
        } catch {
          /* ignore */
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const handleScreenshot = useCallback(() => {
    const svg = document.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "circuit.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleAutoArrange = useCallback(() => {
    setCircuit((prev) => ({ ...prev, nodes: autoArrange(prev.nodes) }));
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        if (document.activeElement === document.body || (document.activeElement as HTMLElement)?.tagName === "SVG") {
          deleteSelected();
        }
      }
      if (e.key === "Escape") {
        setPlacingType(null);
        setWireStart(null);
        setSelectedNodeId(null);
      }
      if (e.key === "a" && !e.ctrlKey && !e.metaKey) {
        if ((document.activeElement as HTMLElement)?.tagName !== "INPUT") {
          handleAutoArrange();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [deleteSelected, handleAutoArrange]);

  return (
    <div className="h-[calc(100dvh-4.5rem)] flex flex-col bg-zinc-950">
      <Toolbar
        isRunning={isRunning}
        onToggleRun={() => setIsRunning(!isRunning)}
        onClear={clearCircuit}
        onExport={handleExport}
        onImport={handleImport}
        onScreenshot={handleScreenshot}
        onAutoArrange={handleAutoArrange}
      />

      <div className="flex-1 flex overflow-hidden">
        <Palette placingType={placingType} onSelectType={setPlacingType} />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative bg-zinc-950">
            <Canvas
              nodes={simulated.nodes}
              wires={simulated.wires}
              selectedNodeId={selectedNodeId}
              wireStart={wireStart}
              placingType={placingType}
              onSelectNode={setSelectedNodeId}
              onMoveNode={moveNode}
              onPlaceNode={placeNode}
              onPortMouseDown={handlePortMouseDown}
              onInputToggle={toggleInput}
              onDeleteSelected={deleteSelected}
            />

            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <button
                onClick={() => setShowTable(!showTable)}
                className="px-3 py-1.5 rounded-lg bg-zinc-800/90 text-zinc-400 text-xs font-medium border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200 transition-all backdrop-blur-sm"
              >
                {showTable ? "Hide" : "Show"} Truth Table
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-zinc-800/90 text-zinc-500 text-[10px] font-mono border border-zinc-700 backdrop-blur-sm">
                {simulated.nodes.length} nodes · {simulated.wires.length} wires
              </div>
            </div>
          </div>

          {showTable && (
            <div style={{ height: "35%", minHeight: 160, borderTop: "1px solid #27272a" }}>
              <TruthTableView
                rows={truthTable}
                inputNodes={inputNodes}
                outputNodes={outputNodes}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
