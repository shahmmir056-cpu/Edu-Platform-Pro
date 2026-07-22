import { useRef, useState, useEffect, useCallback } from "react";
import { Pencil, Eraser, Type, Square, Circle, Minus, Undo2, Redo2, Trash2, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface WhiteboardProps {
  onClose: () => void;
  socket: any;
  roomId: string;
}

type Tool = "pen" | "eraser" | "text" | "rect" | "circle" | "line";

interface DrawAction {
  tool: Tool;
  color: string;
  size: number;
  points?: { x: number; y: number }[];
  text?: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  x2?: number;
  y2?: number;
}

const COLORS = ["#ffffff", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];
const SIZES = [2, 4, 6, 10];

export function Whiteboard({ onClose, socket, roomId }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#ffffff");
  const [size, setSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawAction[]>([]);
  const currentActionRef = useRef<DrawAction | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const redraw = useCallback((acts: DrawAction[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const act of acts) {
      ctx.strokeStyle = act.color;
      ctx.fillStyle = act.color;
      ctx.lineWidth = act.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      switch (act.tool) {
        case "pen":
          if (act.points && act.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(act.points[0].x, act.points[0].y);
            for (let i = 1; i < act.points.length; i++) {
              ctx.lineTo(act.points[i].x, act.points[i].y);
            }
            ctx.stroke();
          }
          break;
        case "eraser":
          ctx.globalCompositeOperation = "destination-out";
          if (act.points && act.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(act.points[0].x, act.points[0].y);
            for (let i = 1; i < act.points.length; i++) {
              ctx.lineTo(act.points[i].x, act.points[i].y);
            }
            ctx.stroke();
          }
          ctx.globalCompositeOperation = "source-over";
          break;
        case "rect":
          if (act.x !== undefined && act.y !== undefined && act.w !== undefined && act.h !== undefined) {
            ctx.strokeRect(act.x, act.y, act.w, act.h);
          }
          break;
        case "circle":
          if (act.x !== undefined && act.y !== undefined && act.w !== undefined) {
            ctx.beginPath();
            ctx.ellipse(act.x, act.y, Math.abs(act.w), Math.abs(act.h || act.w), 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case "line":
          if (act.x !== undefined && act.y !== undefined && act.x2 !== undefined && act.y2 !== undefined) {
            ctx.beginPath();
            ctx.moveTo(act.x, act.y);
            ctx.lineTo(act.x2, act.y2);
            ctx.stroke();
          }
          break;
        case "text":
          if (act.text && act.x !== undefined && act.y !== undefined) {
            ctx.font = `${act.size * 4}px sans-serif`;
            ctx.fillText(act.text, act.x, act.y);
          }
          break;
      }
    }
  }, []);

  useEffect(() => {
    redraw(actions);
  }, [actions, redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redraw(actions);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [actions, redraw]);

  useEffect(() => {
    if (!socket) return;
    const handleRemoteDraw = (data: { action: DrawAction }) => {
      setActions((prev) => [...prev, data.action]);
    };
    socket.on("whiteboard-draw", handleRemoteDraw);
    return () => { socket.off("whiteboard-draw", handleRemoteDraw); };
  }, [socket]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const pos = getPos(e);
    setIsDrawing(true);
    startPosRef.current = pos;

    if (tool === "text") {
      const text = prompt("Enter text:");
      if (text) {
        const act: DrawAction = { tool: "text", color, size, text, x: pos.x, y: pos.y };
        setActions((prev) => [...prev, act]);
        setRedoStack([]);
        socket?.emit("whiteboard-draw", { roomId, action: act });
      }
      setIsDrawing(false);
      return;
    }

    currentActionRef.current = {
      tool,
      color: tool === "eraser" ? "#000" : color,
      size: tool === "eraser" ? size * 3 : size,
      points: [pos],
    };
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentActionRef.current) return;
    const pos = getPos(e);

    if (tool === "pen" || tool === "eraser") {
      currentActionRef.current.points!.push(pos);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx && currentActionRef.current.points!.length >= 2) {
        const pts = currentActionRef.current.points!;
        const last = pts[pts.length - 2];
        ctx.strokeStyle = currentActionRef.current.color;
        ctx.lineWidth = currentActionRef.current.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
        }
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        if (tool === "eraser") {
          ctx.globalCompositeOperation = "source-over";
        }
      }
    } else if (startPosRef.current) {
      redraw(actions);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        const s = startPosRef.current;
        if (tool === "rect") {
          ctx.strokeRect(s.x, s.y, pos.x - s.x, pos.y - s.y);
        } else if (tool === "circle") {
          ctx.beginPath();
          ctx.ellipse(
            (s.x + pos.x) / 2, (s.y + pos.y) / 2,
            Math.abs(pos.x - s.x) / 2, Math.abs(pos.y - s.y) / 2,
            0, 0, Math.PI * 2
          );
          ctx.stroke();
        } else if (tool === "line") {
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }
      }
    }
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentActionRef.current) {
      setIsDrawing(false);
      return;
    }

    const pos = "changedTouches" in e
      ? { x: (e as React.TouchEvent).changedTouches[0].clientX, y: (e as React.TouchEvent).changedTouches[0].clientY }
      : (e as React.MouseEvent);

    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (rect) {
      const finalPos = "clientX" in pos ? { x: pos.clientX - rect.left, y: pos.clientY - rect.top } : startPosRef.current;
      if (tool === "rect" || tool === "circle" || tool === "line") {
        const s = startPosRef.current!;
        const act = currentActionRef.current;
        if (tool === "rect") {
          act.w = finalPos!.x - s.x;
          act.h = finalPos!.y - s.y;
          act.x = s.x;
          act.y = s.y;
        } else if (tool === "circle") {
          act.x = (s.x + finalPos!.x) / 2;
          act.y = (s.y + finalPos!.y) / 2;
          act.w = Math.abs(finalPos!.x - s.x) / 2;
          act.h = Math.abs(finalPos!.y - s.y) / 2;
        } else if (tool === "line") {
          act.x = s.x;
          act.y = s.y;
          act.x2 = finalPos!.x;
          act.y2 = finalPos!.y;
        }
      }
    }

    setActions((prev) => [...prev, currentActionRef.current!]);
    setRedoStack([]);
    socket?.emit("whiteboard-draw", { roomId, action: currentActionRef.current });
    currentActionRef.current = null;
    startPosRef.current = null;
    setIsDrawing(false);
  };

  const undo = () => {
    if (actions.length === 0) return;
    const last = actions[actions.length - 1];
    setActions((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, last]);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setActions((prev) => [...prev, last]);
  };

  const clearAll = () => {
    setActions([]);
    setRedoStack([]);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="absolute inset-0 z-40 bg-zinc-950/95 backdrop-blur-sm flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-zinc-800 flex-wrap">
        <div className="flex items-center gap-1">
          {([["pen", Pencil], ["eraser", Eraser], ["rect", Square], ["circle", Circle], ["line", Minus]] as const).map(([t, Icon]) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                tool === t ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-zinc-700" />
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                "w-7 h-7 rounded-full border-2 transition-transform",
                color === c ? "border-white scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="w-px h-6 bg-zinc-700" />
        <div className="flex items-center gap-1">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                size === s ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              )}
            >
              <div className="rounded-full bg-current" style={{ width: s + 2, height: s + 2 }} />
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-zinc-700" />
        <div className="flex items-center gap-1">
          <button onClick={undo} className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center"><Undo2 size={16} /></button>
          <button onClick={redo} className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center"><Redo2 size={16} /></button>
          <button onClick={clearAll} className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center"><Trash2 size={16} /></button>
          <button onClick={download} className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center"><Download size={16} /></button>
        </div>
        <div className="flex-1" />
        <button onClick={onClose} className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 flex items-center justify-center">
          <X size={16} />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className={cn(
            "absolute inset-0 w-full h-full",
            tool === "eraser" ? "cursor-cell" : tool === "text" ? "cursor-text" : "cursor-crosshair"
          )}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>
    </div>
  );
}
