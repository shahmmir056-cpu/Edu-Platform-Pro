import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  FileText,
  Image,
  Zap,
  LayoutGrid,
} from "lucide-react";

interface Props {
  isRunning: boolean;
  onToggleRun: () => void;
  onClear: () => void;
  onExport: () => void;
  onImport: () => void;
  onScreenshot: () => void;
  onAutoArrange: () => void;
}

export function Toolbar({
  isRunning,
  onToggleRun,
  onClear,
  onExport,
  onImport,
  onScreenshot,
  onAutoArrange,
}: Props) {
  return (
    <div className="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-3 gap-1 shrink-0">
      <div className="flex items-center gap-1 mr-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-zinc-200 hidden sm:block">Logic</span>
      </div>

      <div className="w-px h-5 bg-zinc-800 mx-1" />

      <button
        onClick={onToggleRun}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
          isRunning
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200"
        )}
      >
        {isRunning ? <Pause size={12} /> : <Play size={12} />}
        {isRunning ? "Running" : "Simulate"}
      </button>

      <button
        onClick={onAutoArrange}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200 transition-all"
        title="Auto-arrange (A)"
      >
        <LayoutGrid size={12} />
        <span className="hidden md:inline">Arrange</span>
      </button>

      <div className="w-px h-5 bg-zinc-800 mx-1" />

      <button
        onClick={onExport}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200 transition-all"
        title="Export JSON (Ctrl+S)"
      >
        <Download size={12} />
        <span className="hidden md:inline">Export</span>
      </button>

      <button
        onClick={onImport}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200 transition-all"
        title="Import JSON (Ctrl+O)"
      >
        <Upload size={12} />
        <span className="hidden md:inline">Import</span>
      </button>

      <button
        onClick={onScreenshot}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600 hover:text-zinc-200 transition-all"
        title="Screenshot (Alt+S)"
      >
        <Image size={12} />
        <span className="hidden md:inline">Capture</span>
      </button>

      <div className="flex-1" />

      <button
        onClick={onClear}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all"
        title="Clear all"
      >
        <Trash2 size={12} />
        <span className="hidden md:inline">Clear</span>
      </button>

      <div className="w-px h-5 bg-zinc-800 mx-1" />

      <div className="flex items-center gap-1.5 text-[10px] text-zinc-600">
        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono">Del</kbd>
        <span>delete</span>
        <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded border border-zinc-700 font-mono ml-1">Esc</kbd>
        <span>cancel</span>
      </div>
    </div>
  );
}
