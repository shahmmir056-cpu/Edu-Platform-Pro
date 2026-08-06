import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import {
  Check,
  Copy,
  Database,
  Download,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  StepForward,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

export interface LabDataset {
  name: string;
  columns: { key: string; label: string }[];
  rows: readonly object[];
}

export interface LabControlInfo {
  canRun?: boolean;
  running?: boolean;
  progress?: number | null;
  dataset?: LabDataset | null;
  hasAdvanced?: boolean;
  hasStep?: boolean;
}

interface LabControlsValue {
  register: (info: LabControlInfo | null) => void;
  runSeq: number;
  stepSeq: number;
  advancedOpen: boolean;
  requestRun: () => void;
  requestStep: () => void;
  toggleAdvanced: () => void;
}

const LabControlsCtx = createContext<LabControlsValue | null>(null);
const LabInfoCtx = createContext<LabControlInfo | null>(null);

function useControls(): LabControlsValue {
  const ctx = useContext(LabControlsCtx);
  if (!ctx) throw new Error("LabControlsProvider missing");
  return ctx;
}

function useLabInfo(): LabControlInfo | null {
  return useContext(LabInfoCtx);
}

export function LabControlsProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<LabControlInfo | null>(null);
  const [runSeq, setRunSeq] = useState(0);
  const [stepSeq, setStepSeq] = useState(0);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const register = useCallback((i: LabControlInfo | null) => setInfo(i), []);
  const requestRun = useCallback(() => setRunSeq((s) => s + 1), []);
  const requestStep = useCallback(() => setStepSeq((s) => s + 1), []);
  const toggleAdvanced = useCallback(() => setAdvancedOpen((o) => !o), []);

  const value = useMemo(
    () => ({ register, runSeq, stepSeq, advancedOpen, requestRun, requestStep, toggleAdvanced }),
    [register, runSeq, stepSeq, advancedOpen, requestRun, requestStep, toggleAdvanced],
  );

  return (
    <LabControlsCtx.Provider value={value}>
      <LabInfoCtx.Provider value={info}>{children}</LabInfoCtx.Provider>
    </LabControlsCtx.Provider>
  );
}

interface LabHandlers {
  onToggleRun?: () => void;
  onStep?: () => void;
}

export function useLabControls(info: LabControlInfo, handlers: LabHandlers = {}) {
  const ctx = useControls();
  const infoRef = useRef(info);
  const handlersRef = useRef(handlers);
  const lastSeq = useRef({ run: ctx.runSeq, step: ctx.stepSeq });
  infoRef.current = info;
  handlersRef.current = handlers;

  const sig = useMemo(
    () =>
      JSON.stringify([
        !!info.canRun,
        !!info.running,
        info.progress ?? null,
        !!info.hasAdvanced,
        !!info.hasStep,
        info.dataset ?? null,
      ]),
    [info.canRun, info.running, info.progress, info.hasAdvanced, info.hasStep, info.dataset],
  );

  useEffect(() => {
    ctx.register({
      canRun: !!infoRef.current.canRun,
      running: !!infoRef.current.running,
      progress: infoRef.current.progress ?? null,
      dataset: infoRef.current.dataset ?? null,
      hasAdvanced: !!infoRef.current.hasAdvanced,
      hasStep: !!infoRef.current.hasStep || !!handlersRef.current.onStep,
    });
  }, [ctx, sig]);

  useEffect(() => () => ctx.register(null), [ctx]);

  useEffect(() => {
    if (ctx.runSeq !== lastSeq.current.run) {
      lastSeq.current.run = ctx.runSeq;
      handlersRef.current.onToggleRun?.();
    }
  }, [ctx.runSeq]);

  useEffect(() => {
    if (ctx.stepSeq !== lastSeq.current.step) {
      lastSeq.current.step = ctx.stepSeq;
      handlersRef.current.onStep?.();
    }
  }, [ctx.stepSeq]);

  return { advancedOpen: ctx.advancedOpen };
}

function escapeCsv(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export function datasetToCSV(ds: LabDataset): string {
  const header = ds.columns.map((c) => escapeCsv(c.label)).join(",");
  const rows = ds.rows.map((r) =>
    ds.columns.map((c) => escapeCsv(String((r as Record<string, unknown>)[c.key] ?? ""))).join(","),
  );
  return [header, ...rows].join("\r\n");
}

export function downloadCSV(ds: LabDataset) {
  const blob = new Blob(["\ufeff" + datasetToCSV(ds)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ds.name.replace(/[^a-z0-9-_]+/gi, "_").toLowerCase()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ToolButton({
  onClick,
  disabled,
  title,
  active,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center gap-1 h-7 min-w-7 px-1.5 rounded-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: active ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function DataDrawer({
  dataset,
  onClose,
  onCopy,
  onDownload,
  copied,
}: {
  dataset: LabDataset;
  onClose: () => void;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}) {
  return (
    <div
      className="absolute top-0 right-0 bottom-0 w-full sm:w-[420px] z-10 flex flex-col"
      style={{ background: "#fff", borderLeft: "1px solid rgba(45,45,45,0.15)" }}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ background: "#FFF8F0", borderBottom: "1px solid rgba(45,45,45,0.1)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Database size={14} style={{ color: "#E8852E" }} />
          <span className="text-xs font-bold truncate" style={{ color: "#2D2D2D" }}>
            {dataset.name}
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: "rgba(232,133,46,0.12)", color: "#C46A10" }}
          >
            {dataset.rows.length} rows
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-black/5 shrink-0"
          aria-label="Close data panel"
        >
          <X size={14} style={{ color: "#6B6B6B" }} />
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {dataset.rows.length === 0 ? (
          <div className="p-4 text-[11px]" style={{ color: "#9A9A9A" }}>
            No data points recorded yet. Run the experiment to collect data.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr>
                {dataset.columns.map((c) => (
                  <th
                    key={c.key}
                    className="sticky top-0 px-3 py-2 text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      background: "#FFF8F0",
                      color: "#2D2D2D",
                      borderBottom: "1px solid rgba(45,45,45,0.12)",
                    }}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.rows.map((r, i) => (
                <tr key={i} className="odd:bg-white even:bg-[#FAFAFA]">
                  {dataset.columns.map((c) => (
                    <td
                      key={c.key}
                      className="px-3 py-1.5 text-[11px] font-mono"
                      style={{
                        color: "#4A4A4A",
                        borderBottom: "1px solid rgba(45,45,45,0.06)",
                      }}
                    >
                      {typeof (r as Record<string, unknown>)[c.key] === "number"
                        ? Math.round((r as Record<string, unknown>)[c.key] as number) * 1000 / 1000
                        : String((r as Record<string, unknown>)[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div
        className="flex gap-2 px-3 py-2.5"
        style={{ background: "#FFF8F0", borderTop: "1px solid rgba(45,45,45,0.1)" }}
      >
        <button
          onClick={onCopy}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-white transition-all"
          style={{ background: "#2D2D2D" }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy CSV"}
        </button>
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold text-white transition-all"
          style={{ background: "linear-gradient(135deg, #FF9F4C, #E8852E)" }}
        >
          <Download size={12} /> Download CSV
        </button>
      </div>
    </div>
  );
}

export function LabToolbar({ title, children }: { title: string; children: ReactNode }) {
  const info = useLabInfo();
  const ctx = useControls();
  const fsRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isFs, setIsFs] = useState(false);
  const [dataOpen, setDataOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resetNonce, setResetNonce] = useState(0);

  const zoomIn = () => setZoom((z) => Math.min(2, Math.round((z + 0.25) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100));
  const resetSim = () => {
    setResetNonce((n) => n + 1);
    setDataOpen(false);
  };

  const toggleFs = () => {
    if (!document.fullscreenElement) fsRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    fsRef.current?.focus();
  }, []);

  const copyData = async () => {
    if (!info?.dataset) return;
    try {
      await navigator.clipboard.writeText(datasetToCSV(info.dataset));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const k = e.key;
    if (k === " " || k === "Enter") {
      e.preventDefault();
      if (info?.canRun) ctx.requestRun();
    } else if (k === "r" || k === "R") {
      e.preventDefault();
      resetSim();
    } else if (k === "f" || k === "F") {
      e.preventDefault();
      toggleFs();
    } else if (k === "+" || k === "=") {
      e.preventDefault();
      zoomIn();
    } else if (k === "-") {
      e.preventDefault();
      zoomOut();
    } else if (k === "." || k === ">") {
      e.preventDefault();
      if (info?.canRun && info?.hasStep) ctx.requestStep();
    } else if (k === "d" || k === "D") {
      e.preventDefault();
      if (info?.dataset) setDataOpen((o) => !o);
    } else if (k === "a" || k === "A") {
      e.preventDefault();
      if (info?.hasAdvanced) ctx.toggleAdvanced();
    }
  };

  const refocus = () => fsRef.current?.focus();

  return (
    <div
      ref={fsRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="lg-card overflow-hidden focus:outline-none"
      style={{ background: "#fff" }}
    >
      <div
        className="flex items-center gap-1.5 px-3 py-2 flex-wrap"
        style={{ background: "#2D2D2D" }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: info?.running ? "#6A9B7A" : "#9A9A9A" }}
        />
        <span className="text-[11px] font-semibold text-white/90 truncate max-w-[180px]">
          {title}
        </span>
        {info?.canRun && info?.progress != null && (
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="h-1.5 w-24 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.max(0, Math.min(100, info.progress))}%`,
                  background: "#E8852E",
                }}
              />
            </div>
            <span className="text-[10px] font-mono text-white/70">
              {Math.round(Math.max(0, Math.min(100, info.progress)))}%
            </span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-1">
          <ToolButton
            onClick={() => {
              ctx.requestRun();
              refocus();
            }}
            disabled={!info?.canRun}
            title={info?.canRun ? "Play / Pause (Space)" : "Run control not available for this simulation"}
          >
            {info?.canRun && info?.running ? <Pause size={14} /> : <Play size={14} />}
          </ToolButton>
          <ToolButton
            onClick={() => {
              ctx.requestStep();
              refocus();
            }}
            disabled={!info?.canRun || !info?.hasStep}
            title={info?.hasStep ? "Step one tick (.)" : "Step control not available for this simulation"}
          >
            <StepForward size={14} />
          </ToolButton>
          <ToolButton onClick={() => { resetSim(); refocus(); }} title="Reset simulation (R)">
            <RotateCcw size={14} />
          </ToolButton>
          <span className="w-px h-4 bg-white/20 mx-0.5" />
          <ToolButton
            onClick={() => { zoomOut(); refocus(); }}
            disabled={zoom <= 0.5}
            title="Zoom out (-)"
          >
            <ZoomOut size={14} />
          </ToolButton>
          <button
            onClick={() => { setZoom(1); refocus(); }}
            title="Reset zoom"
            className="text-[10px] font-mono text-white/80 w-9 text-center"
          >
            {Math.round(zoom * 100)}%
          </button>
          <ToolButton
            onClick={() => { zoomIn(); refocus(); }}
            disabled={zoom >= 2}
            title="Zoom in (+)"
          >
            <ZoomIn size={14} />
          </ToolButton>
          <span className="w-px h-4 bg-white/20 mx-0.5" />
          <ToolButton onClick={() => { toggleFs(); refocus(); }} title="Toggle fullscreen (F)">
            {isFs ? <Minimize size={14} /> : <Maximize size={14} />}
          </ToolButton>
          <ToolButton
            onClick={() => { setDataOpen((o) => !o); refocus(); }}
            disabled={!info?.dataset}
            active={dataOpen}
            title={info?.dataset ? "Data table (D)" : "No data stream available"}
          >
            <Database size={14} />
            {info?.dataset && info.dataset.rows.length > 0 && (
              <span className="text-[9px] font-bold">{info.dataset.rows.length}</span>
            )}
          </ToolButton>
          <ToolButton
            onClick={() => { ctx.toggleAdvanced(); refocus(); }}
            disabled={!info?.hasAdvanced}
            active={ctx.advancedOpen}
            title={info?.hasAdvanced ? "Advanced controls (A)" : "No advanced controls"}
          >
            <Sliders size={14} />
          </ToolButton>
        </div>
      </div>

      <div className="relative">
        <div key={resetNonce} style={{ zoom: zoom as CSSProperties["zoom"] }}>
          {children}
        </div>
        {dataOpen && info?.dataset && (
          <DataDrawer
            dataset={info.dataset}
            onClose={() => { setDataOpen(false); refocus(); }}
            onCopy={() => { copyData(); refocus(); }}
            onDownload={() => { downloadCSV(info.dataset); refocus(); }}
            copied={copied}
          />
        )}
      </div>

      <div
        className="text-[9px] px-3 py-1.5 text-center"
        style={{ background: "#FFF8F0", color: "#9A9A9A" }}
      >
        Shortcuts: Space run · R reset · F fullscreen · +/- zoom · . step · D data · A advanced
      </div>
    </div>
  );
}
