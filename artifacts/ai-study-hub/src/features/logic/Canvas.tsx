import { useCallback, useMemo, useRef, useState } from "react";
import type { CircuitNode, Wire, GateType } from "./types";
import { GATE_DEFS, getPortPos } from "./gates";
import { GateNode } from "./GateNode";

interface Props {
  nodes: CircuitNode[];
  wires: Wire[];
  selectedNodeId: string | null;
  wireStart: { nodeId: string; portId: string; side: "left" | "right" } | null;
  placingType: GateType | null;
  onSelectNode: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onPlaceNode: (type: GateType, x: number, y: number) => void;
  onPortMouseDown: (nodeId: string, portId: string, side: "left" | "right", e: React.MouseEvent) => void;
  onInputToggle: (nodeId: string, portId: string) => void;
  onDeleteSelected: () => void;
}

export function Canvas({
  nodes,
  wires,
  selectedNodeId,
  wireStart,
  placingType,
  onSelectNode,
  onMoveNode,
  onPlaceNode,
  onPortMouseDown,
  onInputToggle,
  onDeleteSelected,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const svgPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        setIsPanning(true);
        panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
        e.preventDefault();
        return;
      }

      if (placingType) {
        const pt = svgPoint(e.clientX, e.clientY);
        const def = GATE_DEFS[placingType];
        onPlaceNode(placingType, pt.x - def.width / 2, pt.y - def.height / 2);
        return;
      }

      onSelectNode(null);
    },
    [placingType, pan, zoom, svgPoint, onPlaceNode, onSelectNode]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pt = svgPoint(e.clientX, e.clientY);
      setMousePos(pt);

      if (isPanning) {
        setPan({
          x: panStart.current.px + (e.clientX - panStart.current.x),
          y: panStart.current.py + (e.clientY - panStart.current.y),
        });
        return;
      }

      if (dragging) {
        onMoveNode(dragging.nodeId, pt.x - dragging.offsetX, pt.y - dragging.offsetY);
      }
    },
    [isPanning, dragging, svgPoint, onMoveNode]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragging(null);
  }, []);

  const handleNodeMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const pt = svgPoint(e.clientX, e.clientY);
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      setDragging({ nodeId, offsetX: pt.x - node.x, offsetY: pt.y - node.y });
      onSelectNode(nodeId);
    },
    [nodes, svgPoint, onSelectNode]
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(Math.max(z * delta, 0.2), 3));
  }, []);

  const renderWire = useCallback(
    (wire: Wire) => {
      const srcNode = nodes.find((n) => n.id === wire.from.nodeId);
      const dstNode = nodes.find((n) => n.id === wire.to.nodeId);
      if (!srcNode || !dstNode) return null;

      const srcDef = GATE_DEFS[srcNode.type];
      const dstDef = GATE_DEFS[dstNode.type];
      if (!srcDef || !dstDef) return null;

      const srcPort = srcDef.outputs.find((p) => p.id === wire.from.portId);
      const dstPort = dstDef.inputs.find((p) => p.id === wire.to.portId);
      if (!srcPort || !dstPort) return null;

      const from = getPortPos(srcNode.x, srcNode.y, srcNode.type, wire.from.portId, "right");
      const to = getPortPos(dstNode.x, dstNode.y, dstNode.type, wire.to.portId, "left");

      const dx = Math.abs(to.x - from.x) * 0.5;
      const path = `M${from.x},${from.y} C${from.x + dx},${from.y} ${to.x - dx},${to.y} ${to.x},${to.y}`;

      const val = !!srcNode.outputValues[wire.from.portId];

      return (
        <g key={wire.id}>
          <path
            d={path}
            fill="none"
            stroke={val ? "#22c55e" : "#475569"}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {val && (
            <path
              d={path}
              fill="none"
              stroke="#22c55e"
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.2}
              className="animate-pulse"
            />
          )}
        </g>
      );
    },
    [nodes]
  );

  const tempWire = useMemo(() => {
    if (!wireStart) return null;
    const srcNode = nodes.find((n) => n.id === wireStart.nodeId);
    if (!srcNode) return null;

    const from = getPortPos(
      srcNode.x,
      srcNode.y,
      srcNode.type,
      wireStart.portId,
      wireStart.side
    );

    const dx = Math.abs(mousePos.x - from.x) * 0.4;
    const path =
      wireStart.side === "right"
        ? `M${from.x},${from.y} C${from.x + dx},${from.y} ${mousePos.x - dx},${mousePos.y} ${mousePos.x},${mousePos.y}`
        : `M${from.x},${from.y} C${from.x - dx},${from.y} ${mousePos.x + dx},${mousePos.y} ${mousePos.x},${mousePos.y}`;

    return (
      <path
        d={path}
        fill="none"
        stroke="#facc15"
        strokeWidth={2}
        strokeDasharray="8 4"
        strokeLinecap="round"
        pointerEvents="none"
      />
    );
  }, [wireStart, nodes, mousePos]);

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ cursor: placingType ? "crosshair" : isPanning ? "grabbing" : "default" }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onWheel={handleWheel}
    >
      <defs>
        <pattern id="grid" width={24 * zoom} height={24 * zoom} patternUnits="userSpaceOnUse" x={pan.x % (24 * zoom)} y={pan.y % (24 * zoom)}>
          <circle cx={0.8} cy={0.8} r={0.8} fill="rgba(148,163,184,0.15)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
        {wires.map(renderWire)}
        {tempWire}

        {nodes.map((node) => (
          <GateNode
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
            onPortMouseDown={onPortMouseDown}
            onInputToggle={onInputToggle}
          />
        ))}
      </g>

      {placingType && (
        <text
          x="50%"
          y={32}
          textAnchor="middle"
          fill="rgba(250,204,21,0.7)"
          fontSize={13}
          fontWeight={600}
          fontFamily="system-ui"
        >
          Click to place {GATE_DEFS[placingType]?.label} — press Esc to cancel
        </text>
      )}

      {nodes.length === 0 && !placingType && (
        <g>
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            fill="rgba(148,163,184,0.4)"
            fontSize={18}
            fontWeight={600}
            fontFamily="system-ui"
          >
            Select a component from the palette and click here to place it
          </text>
          <text
            x="50%"
            y="52%"
            textAnchor="middle"
            fill="rgba(148,163,184,0.25)"
            fontSize={13}
            fontFamily="system-ui"
          >
            Drag from output ports to input ports to create wires
          </text>
        </g>
      )}
    </svg>
  );
}
