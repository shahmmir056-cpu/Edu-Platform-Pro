import { useState, useCallback, useRef, useEffect, type PointerEvent as ReactPointerEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Lightbulb,
  Zap,
  ChevronRight,
} from "lucide-react";
import type { Simulation, Step } from "./engine/types";
import { SimulationEngine, type SimulationContext } from "./engine/SimulationEngine";
import { trackAction } from "@/features/life-os/tracker";
import { Beaker } from "./equipment/Beaker";
import { Pipette } from "./equipment/Pipette";
import { TestTube } from "./equipment/TestTube";
import { Microscope } from "./equipment/Microscope";
import { GelBox } from "./equipment/GelBox";
import { Thermometer } from "./equipment/Thermometer";
import { Scale } from "./equipment/Scale";

const CAT: Record<string, string> = {
  Biology: "#4CAF50",
  Chemistry: "#FF9F4C",
  Physics: "#2196F3",
  Math: "#E8852E",
};

interface SimViewProps {
  simulation: Simulation;
  onBack: () => void;
}

export default function SimView({ simulation, onBack }: SimViewProps) {
  const cat = CAT[simulation.category] ?? "#FF9F4C";

  return (
    <SimulationEngine simulation={simulation}>
      {(ctx: SimulationContext) => (
        <SimViewInner ctx={ctx} simulation={simulation} cat={cat} onBack={onBack} />
      )}
    </SimulationEngine>
  );
}

function SimViewInner({
  ctx,
  simulation,
  cat,
  onBack,
}: {
  ctx: SimulationContext;
  simulation: Simulation;
  cat: string;
  onBack: () => void;
}) {
  const [showHint, setShowHint] = useState(false);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [hoveredDrop, setHoveredDrop] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);
  const equipRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const dragOffset = useRef({ x: 0, y: 0 });

  // When a step completes, show the result message
  useEffect(() => {
    const lastStep = simulation.steps.find(
      (s) => !completedSteps.includes(s.id) && ctx.isStepCompleted(s.id)
    );
    if (lastStep) {
      setCompletedSteps((prev) => [...prev, lastStep.id]);
      if (lastStep.result?.message) {
        setMessage(lastStep.result.message);
      }
    }
  }, [ctx.state.completedSteps, simulation.steps, completedSteps]);

  // Track a completed simulation run
  useEffect(() => {
    if (ctx.state.results.isComplete) {
      trackAction(
        "/simulations",
        "simulation-run",
        undefined,
        1,
        simulation.title,
        `Completed all ${simulation.steps.length} steps of ${simulation.title}`
      );
    }
  }, [ctx.state.results.isComplete, simulation.title, simulation.steps.length]);

  const registerEquip = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) equipRefs.current.set(id, el);
    else equipRefs.current.delete(id);
  }, []);

  const findDropTarget = useCallback(
    (x: number, y: number): string | null => {
      for (const equip of simulation.equipment) {
        if (!equip.droppable) continue;
        const el = equipRefs.current.get(equip.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          return equip.id;
        }
      }
      return null;
    },
    [simulation.equipment]
  );

  const handleDragStart = useCallback(
    (equipId: string, e: ReactPointerEvent) => {
      const el = equipRefs.current.get(equipId);
      if (!el) return;
      const board = boardRef.current;
      if (!board) return;
      const boardRect = board.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      dragOffset.current = {
        x: e.clientX - elRect.left,
        y: e.clientY - elRect.top,
      };
      setDragItem(equipId);
      setDragPos({
        x: e.clientX - boardRect.left,
        y: e.clientY - boardRect.top,
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const handleDragMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!dragItem) return;
      const board = boardRef.current;
      if (!board) return;
      const boardRect = board.getBoundingClientRect();
      const x = e.clientX - boardRect.left;
      const y = e.clientY - boardRect.top;
      setDragPos({ x, y });
      setHoveredDrop(findDropTarget(e.clientX, e.clientY));
    },
    [dragItem, findDropTarget]
  );

  const handleDragEnd = useCallback(
    (e: ReactPointerEvent) => {
      if (!dragItem) return;
      const target = findDropTarget(e.clientX, e.clientY);
      if (target) {
        attemptDrop(dragItem, target);
      }
      setDragItem(null);
      setHoveredDrop(null);
    },
    [dragItem, findDropTarget]
  );

  const attemptDrop = useCallback(
    (fromId: string, toId: string) => {
      const step = ctx.currentStep;
      if (!step) return;

      let match = false;
      if (step.trigger.type === "collision") {
        match = step.trigger.items.includes(fromId) && step.trigger.items.includes(toId);
      } else if (step.trigger.type === "drag-complete") {
        match = step.trigger.from === fromId && step.trigger.to === toId;
      }

      if (match) {
        applyVisual(step, fromId, toId);
        ctx.completeStep(step.id, step.result?.data);
      } else {
        setMessage("Try a different combination. Check the instructions above.");
        setTimeout(() => setMessage(null), 3000);
      }
    },
    [ctx]
  );

  const applyVisual = useCallback(
    (step: Step, fromId: string, toId: string) => {
      const v = step.result?.visual;
      if (!v) return;
      switch (v) {
        case "shell-dissolves":
          ctx.updateEquipment("egg", { shell: false, color: "#FFF8E1" });
          ctx.updateEquipment("vinegar-beaker", { fillLevel: 0.5, liquidColor: "#FFF9C4" });
          break;
        case "egg-bare":
          ctx.updateEquipment("vinegar-beaker", { fillLevel: 0.3, liquidColor: "#FFF9C4" });
          break;
        case "egg-shrinks":
          ctx.updateEquipment("syrup-beaker", { fillLevel: 0.6 });
          break;
        case "egg-shrunken":
          break;
        case "egg-swells":
          ctx.updateEquipment("water-beaker", { fillLevel: 0.5 });
          break;
        case "egg-swollen":
          break;
        case "buffer-filled":
          ctx.updateEquipment("gel-box", { fillLevel: 0.8 });
          break;
        case "well1-loaded":
        case "well2-loaded":
        case "well3-loaded":
          break;
        case "gel-running":
          ctx.updateEquipment("gel-box", { isRunning: true, voltage: 120 });
          break;
        case "gel-complete":
          ctx.updateEquipment("gel-box", {
            isRunning: false,
            voltage: 0,
            bands: [
              { position: 0.2, color: "#7B1FA2", label: "5000bp" },
              { position: 0.5, color: "#7B1FA2", label: "2000bp" },
              { position: 0.9, color: "#7B1FA2", label: "500bp" },
            ],
          });
          break;
        case "slide-placed":
          ctx.updateEquipment("microscope", { hasSlide: true });
          break;
        case "objective-4x":
          ctx.updateEquipment("microscope", { magnification: 4, focusLevel: 0 });
          break;
        case "objective-10x":
          ctx.updateEquipment("microscope", { magnification: 10, focusLevel: 0 });
          break;
        case "objective-40x":
          ctx.updateEquipment("microscope", { magnification: 40, focusLevel: 0 });
          break;
        case "coarse-focused":
          ctx.updateEquipment("microscope", { focusLevel: 60 });
          break;
        case "fine-focused":
        case "focused-10x":
        case "focused-40x":
          ctx.updateEquipment("microscope", { focusLevel: 100 });
          break;
      }
    },
    [ctx]
  );

  const handleEquipClick = useCallback(
    (equipId: string, type: string) => {
      const step = ctx.currentStep;
      if (!step) return;

      if (type === "knob") {
        const state = ctx.getEquipmentState(equipId);
        const val = ((state.value as number) || 0) + 15;
        ctx.updateEquipment(equipId, { value: Math.min(100, val) });
        if (step.trigger.type === "value-change" && step.trigger.target === equipId) {
          if (val >= (step.trigger.above ?? 0)) {
            applyVisual(step, equipId, equipId);
            ctx.completeStep(step.id, step.result?.data);
          }
        }
      } else if (type === "objective" || type === "power-supply") {
        if (step.trigger.type === "click" && step.trigger.target === equipId) {
          const state = ctx.getEquipmentState(equipId);
          if (type === "power-supply") {
            ctx.updateEquipment(equipId, { isOn: !(state as Record<string, unknown>).isOn });
          }
          applyVisual(step, equipId, equipId);
          ctx.completeStep(step.id, step.result?.data);
        } else {
          setMessage("Not the right step for this. Follow the instructions.");
          setTimeout(() => setMessage(null), 2500);
        }
      }
    },
    [ctx, applyVisual]
  );

  const draggingEquip = dragItem ? simulation.equipment.find((e) => e.id === dragItem) : null;

  return (
    <div className="min-h-screen pb-24" style={{ background: "#FFF8F0" }}>
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b-2 border-[rgba(120,90,60,0.28)]" style={{ background: "rgba(255,248,240,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]" style={{ background: "rgba(255,255,255,0.7)", color: "#2D2D2D", border: "1.5px solid rgba(255,255,255,0.72)" }}>
              <ArrowLeft size={14} />
              Back
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl">{simulation.icon}</span>
              <div>
                <h1 className="font-bold text-sm" style={{ fontFamily: "'Fraunces', serif", color: "#2D2D2D" }}>{simulation.title}</h1>
                <p className="text-[10px]" style={{ color: "#9A9A9A" }}>{simulation.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono" style={{ color: cat }}>{ctx.state.completedSteps.length}/{simulation.steps.length}</span>
              <div className="w-20 h-1.5 rounded-full" style={{ background: "rgba(45,45,45,0.08)" }}>
                <motion.div className="h-full rounded-full" style={{ background: cat }} animate={{ width: `${ctx.progress}%` }} transition={{ duration: 0.5 }} />
              </div>
            </div>
            <button onClick={() => { ctx.resetSim(); setCompletedSteps([]); setMessage(null); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-[1.02]" style={{ background: "rgba(255,255,255,0.7)", color: "#6B6B6B", border: "1.5px solid rgba(45,45,45,0.1)" }}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ─── Main simulation board ─── */}
          <div className="flex-1">
            <div
              ref={boardRef}
              className="rounded-2xl border-2 border-[rgba(120,90,60,0.28)] overflow-x-auto overflow-y-hidden relative select-none"
              style={{ background: "rgba(255,255,255,0.5)", minHeight: 520, touchAction: "none" }}
              onPointerMove={handleDragMove}
              onPointerUp={handleDragEnd}
            >
              {/* Background grid */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="sim-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,159,76,0.04)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#sim-grid)" />
              </svg>

              {/* Equipment laid out */}
              <div className="relative p-6 flex flex-wrap gap-8 items-start justify-center" style={{ minHeight: 520 }}>
                {simulation.equipment.map((equip) => {
                  const state = ctx.getEquipmentState(equip.id);
                  const isDragging = dragItem === equip.id;
                  const isDropTarget = equip.droppable === true && hoveredDrop === equip.id && dragItem !== null;

                  return (
                    <div
                      key={equip.id}
                      ref={(el) => registerEquip(equip.id, el)}
                      data-equip-id={equip.id}
                      className="flex flex-col items-center gap-1.5 max-w-full"
                      style={{
                        opacity: isDragging ? 0.4 : 1,
                        cursor: equip.draggable ? "grab" : "default",
                        transition: "opacity 0.2s",
                      }}
                      onPointerDown={
                        equip.draggable
                          ? (e) => handleDragStart(equip.id, e)
                          : undefined
                      }
                    >
                      <div
                        className="rounded-xl transition-all"
                        style={{
                          outline: isDropTarget ? `3px solid ${cat}` : "none",
                          outlineOffset: 4,
                          background: isDropTarget ? `${cat}10` : "transparent",
                          borderRadius: 12,
                        }}
                      >
                        {renderEquip(equip.type, equip.id, state, {
                          isDropTarget,
                          isHovered: isDropTarget,
                        })}
                      </div>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          background: isDropTarget ? `${cat}20` : "rgba(45,45,45,0.04)",
                          color: isDropTarget ? cat : "#6B6B6B",
                        }}
                      >
                        {equip.label}
                      </span>
                      {equip.draggable && (
                        <span className="text-[8px]" style={{ color: "#BFBFBF" }}>⬆ drag me</span>
                      )}
                      {equip.droppable && (
                        <span className="text-[8px]" style={{ color: "#BFBFBF" }}>⬇ drop here</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dragging ghost */}
              {dragItem && draggingEquip && (
                <div
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: dragPos.x - 30,
                    top: dragPos.y - 30,
                    opacity: 0.8,
                    transform: "scale(1.1)",
                  }}
                >
                  {renderEquip(draggingEquip.type, draggingEquip.id, ctx.getEquipmentState(dragItem), {})}
                </div>
              )}

              {/* Timer overlay */}
              {ctx.currentStep?.trigger.type === "timer" && !ctx.state.results.isComplete && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 pointer-events-none">
                  <div className="px-6 py-4 rounded-2xl text-center" style={{ background: "rgba(255,248,240,0.95)", border: "1.5px solid rgba(255,255,255,0.72)" }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: "#2D2D2D" }}>
                      ⏳ {ctx.currentStep.instruction}
                    </p>
                    <div className="flex items-center gap-3 justify-center">
                      <div className="w-40 h-2 rounded-full" style={{ background: "rgba(45,45,45,0.08)" }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: cat }}
                          animate={{ width: `${((ctx.state.timer ?? 0) / (ctx.currentStep.trigger.duration)) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono" style={{ color: cat }}>
                        {ctx.state.timer ?? 0}s / {ctx.currentStep.trigger.duration}s
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Completion overlay */}
              {Boolean(ctx.state.results.isComplete) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="px-8 py-6 rounded-2xl text-center" style={{ background: "rgba(255,248,240,0.97)", border: "3px solid #4CAF50" }}>
                    <CheckCircle2 size={36} className="mx-auto mb-2" style={{ color: "#4CAF50" }} />
                    <h3 className="font-bold text-lg mb-1" style={{ fontFamily: "'Fraunces', serif", color: "#2D2D2D" }}>Experiment Complete!</h3>
                    <p className="text-sm" style={{ color: "#6B6B6B" }}>You completed all {simulation.steps.length} steps successfully.</p>
                    <button
                      onClick={() => { ctx.resetSim(); setCompletedSteps([]); setMessage(null); }}
                      className="mt-4 px-6 py-2 rounded-lg text-sm font-semibold text-white pointer-events-auto transition-all hover:scale-105"
                      style={{ background: cat, border: "1.5px solid rgba(255,255,255,0.72)" }}
                    >
                      Run Again
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ─── Right panel ─── */}
          <div className="w-full lg:w-80 space-y-3">
            {/* Current instruction */}
            {ctx.currentStep && !ctx.state.results.isComplete && (
              <motion.div
                key={ctx.currentStep.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 border-2 border-[rgba(120,90,60,0.28)]"
                style={{ background: `${cat}08` }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg mt-0.5">📋</span>
                  <div className="flex-1">
                    <p className="text-[10px] font-medium mb-1" style={{ color: "#9A9A9A" }}>
                      Step {ctx.state.completedSteps.length + 1} of {simulation.steps.length}
                    </p>
                    <p className="text-sm font-semibold leading-snug" style={{ color: "#2D2D2D", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      {ctx.currentStep.instruction}
                    </p>
                  </div>
                </div>

                {/* Manual step button */}
                {ctx.currentStep.trigger.type === "manual" && (
                  <button
                    onClick={() => {
                      applyVisual(ctx.currentStep!, ctx.currentStep!.id, ctx.currentStep!.id);
                      ctx.completeStep(ctx.currentStep!.id, ctx.currentStep!.result?.data);
                    }}
                    className="mt-3 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                    style={{ background: cat, border: "1.5px solid rgba(255,255,255,0.72)" }}
                  >
                    Continue →
                  </button>
                )}

                {/* Timer step progress */}
                {ctx.currentStep.trigger.type === "timer" && (
                  <div className="mt-2">
                    <div className="w-full h-2 rounded-full" style={{ background: "rgba(45,45,45,0.08)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: cat }}
                        animate={{ width: `${((ctx.state.timer ?? 0) / (ctx.currentStep.trigger.duration)) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Hint */}
                {ctx.currentStep.hint && (
                  <div className="mt-2">
                    <button onClick={() => setShowHint(!showHint)} className="flex items-center gap-1 text-xs" style={{ color: "#FF9F4C" }}>
                      <Lightbulb size={12} />
                      {showHint ? "Hide hint" : "Show hint"}
                    </button>
                    {showHint && (
                      <p className="mt-1.5 text-xs p-2.5 rounded-lg leading-relaxed" style={{ background: "rgba(255,159,76,0.08)", color: "#6B6B6B" }}>
                        💡 {ctx.currentStep.hint}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Message toast */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl p-3 border-2 border-[rgba(120,90,60,0.28)]"
                  style={{ background: "rgba(255,248,240,0.95)" }}
                >
                  <p className="text-xs leading-relaxed" style={{ color: "#2D2D2D" }}>{message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Results log */}
            {Object.keys(ctx.state.results).length > 0 && (
              <div className="rounded-xl p-4 border-2 border-[rgba(120,90,60,0.28)]" style={{ background: "rgba(255,255,255,0.5)" }}>
                <h3 className="font-semibold text-xs mb-2" style={{ color: "#2D2D2D" }}>📊 Results Log</h3>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {Object.entries(ctx.state.results)
                    .filter(([k]) => k !== "isComplete")
                    .map(([key, value], i) => (
                      <div key={i} className="flex justify-between text-xs" style={{ color: "#6B6B6B" }}>
                        <span className="font-mono truncate">{key}</span>
                        <span className="font-mono font-semibold ml-2" style={{ color: cat }}>
                          {typeof value === "number" ? value.toFixed(1) : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Step checklist */}
            <div className="rounded-xl p-4 border-2 border-[rgba(120,90,60,0.28)]" style={{ background: "rgba(255,255,255,0.5)" }}>
              <h3 className="font-semibold text-xs mb-2" style={{ color: "#2D2D2D" }}>📝 Protocol</h3>
              <div className="space-y-1">
                {simulation.steps.map((step, i) => {
                  const done = completedSteps.includes(step.id);
                  const current = ctx.currentStep?.id === step.id && !done;
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 text-[11px] py-1.5 px-2 rounded-lg transition-all"
                      style={{
                        background: current ? `${cat}10` : "transparent",
                        color: done ? "#BFBFBF" : current ? "#2D2D2D" : "#D0D0D0",
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {done ? (
                        <CheckCircle2 size={12} style={{ color: "#4CAF50" }} />
                      ) : current ? (
                        <ChevronRight size={12} style={{ color: cat }} />
                      ) : (
                        <span className="w-3 h-3 rounded-full border" style={{ borderColor: "#D0D0D0" }} />
                      )}
                      <span className="flex-1 leading-tight">{step.instruction}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Equipment Renderer ─── */
function renderEquip(
  type: string,
  id: string,
  state: Record<string, unknown>,
  opts: { isDropTarget?: boolean; isHovered?: boolean }
) {
  const s = state as Record<string, any>;

  switch (type) {
    case "beaker":
      return (
        <Beaker
          fillLevel={s.fillLevel ?? 0.5}
          liquidColor={s.liquidColor ?? "#4FC3F7"}
          label={s.label}
          isDropTarget={opts.isDropTarget}
          isHovered={opts.isHovered}
          temperature={s.temperature}
          width={120}
          height={160}
        />
      );

    case "pipette":
      return (
        <Pipette
          liquidLevel={s.liquidLevel ?? 0.5}
          liquidColor={s.liquidColor ?? "#CE93D8"}
          isDispensing={opts.isDropTarget}
          isHovered={opts.isHovered}
          width={40}
          height={180}
        />
      );

    case "test-tube":
      return (
        <TestTube
          fillLevel={s.fillLevel ?? 0.5}
          liquidColor={s.liquidColor ?? "#CE93D8"}
          isDropTarget={opts.isDropTarget}
          isHovered={opts.isHovered}
          width={30}
          height={120}
        />
      );

    case "microscope":
      return (
        <Microscope
          magnification={s.magnification ?? 4}
          focusLevel={s.focusLevel ?? 0}
          isHovered={opts.isHovered}
          width={160}
          height={240}
        />
      );

    case "gel-box":
      return (
        <GelBox
          isRunning={s.isRunning ?? false}
          voltage={s.voltage ?? 0}
          time={s.time ?? 0}
          bands={s.bands ?? []}
          isHovered={opts.isHovered}
          width={220}
          height={280}
        />
      );

    case "thermometer":
      return (
        <Thermometer
          temperature={s.temperature ?? 25}
          isHovered={opts.isHovered}
          width={30}
          height={160}
        />
      );

    case "scale":
      return (
        <Scale
          mass={s.mass ?? 0}
          panTilt={s.panTilt ?? 0}
          isHovered={opts.isHovered}
          width={160}
          height={140}
        />
      );

    case "knob":
      return (
        <button
          className="w-16 h-16 rounded-full border-2 border-[rgba(120,90,60,0.28)] flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{ background: "rgba(255,159,76,0.08)" }}
        >
          <div className="w-9 h-9 rounded-full border-2 border-[#FF9F4C] flex items-center justify-center relative">
            <div
              className="w-1 h-3.5 rounded-full bg-[#FF9F4C] absolute"
              style={{ transform: `rotate(${((s.value as number) || 0) * 2.7}deg)`, transformOrigin: "center 14px" }}
            />
          </div>
        </button>
      );

    case "objective":
      return (
        <button
          className="px-4 py-2.5 rounded-xl border-2 border-[rgba(120,90,60,0.28)] text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: "rgba(255,159,76,0.08)", color: "#2D2D2D", fontFamily: "monospace" }}
        >
          {(s.power as number) ?? "?"}×
        </button>
      );

    case "power-supply":
      return (
        <button
          className="w-24 h-20 rounded-xl border-2 border-[rgba(120,90,60,0.28)] flex flex-col items-center justify-center gap-1 transition-all hover:scale-105"
          style={{ background: s.isOn ? "rgba(76,175,80,0.1)" : "rgba(45,45,45,0.04)" }}
        >
          <Zap size={20} style={{ color: s.isOn ? "#4CAF50" : "#9A9A9A" }} />
          <span className="text-[10px] font-mono font-bold" style={{ color: s.isOn ? "#4CAF50" : "#9A9A9A" }}>
            {s.isOn ? "ON ●" : "OFF ○"}
          </span>
        </button>
      );

    case "slide":
      return (
        <div className="w-24 h-8 rounded border-2 border-[rgba(120,90,60,0.28)] flex items-center justify-center" style={{ background: "rgba(200,220,240,0.3)" }}>
          <span className="text-[10px] font-mono font-bold" style={{ color: "#6B6B6B" }}>
            {(s.specimen as string) || "slide"}
          </span>
        </div>
      );

    case "egg":
      return (
        <svg width="100%" height="100%" viewBox="0 0 60 72" style={{ maxWidth: 60, maxHeight: 72 }}>
          <ellipse cx="30" cy="38" rx="24" ry="30" fill={(s.color as string) || "#F5E6CA"} stroke="#2D2D2D" strokeWidth={2} />
          {s.shell === false && (
            <>
              <ellipse cx="30" cy="38" rx="22" ry="28" fill="none" stroke="#E8852E" strokeWidth={0.8} strokeDasharray="3 2" />
              <text x="30" y="42" textAnchor="middle" fontSize="8" fill="#E8852E" fontFamily="monospace">membrane</text>
            </>
          )}
          {s.shell !== false && (
            <text x="30" y="42" textAnchor="middle" fontSize="7" fill="#2D2D2D" fontFamily="monospace" opacity={0.4}>shell</text>
          )}
        </svg>
      );

    default:
      return (
        <div className="w-16 h-16 rounded-lg border-2 border-dashed border-[#D0D0D0] flex items-center justify-center">
          <span className="text-xs" style={{ color: "#9A9A9A" }}>{type}</span>
        </div>
      );
  }
}
