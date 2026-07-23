import { useMemo } from "react";
import type { TruthTableRow, CircuitNode } from "./types";
import { cn } from "@/lib/utils";

interface Props {
  rows: TruthTableRow[];
  inputNodes: CircuitNode[];
  outputNodes: CircuitNode[];
}

export function TruthTableView({ rows, inputNodes, outputNodes }: Props) {
  const hasData = rows.length > 0 && inputNodes.length > 0 && outputNodes.length > 0;

  const binaryToDecimal = useMemo(() => {
    if (!hasData) return null;
    return (vals: Record<string, boolean>) => {
      const bits = inputNodes.map((n) => (vals[n.id] ? "1" : "0")).join("");
      return parseInt(bits, 2);
    };
  }, [hasData, inputNodes]);

  return (
    <div className="bg-zinc-900 border-t border-zinc-800 flex flex-col" style={{ height: "100%" }}>
      <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center gap-2 shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Truth Table
        </h3>
        {hasData && (
          <span className="ml-auto text-[10px] font-semibold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
            {rows.length} rows
          </span>
        )}
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-700">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-600">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <p className="text-xs text-zinc-500 font-medium">No inputs or outputs</p>
            <p className="text-[10px] text-zinc-600 mt-1">Add Input and Output components to generate a truth table</p>
          </div>
        ) : (
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-800/30 sticky top-0">
                  #
                </th>
                {inputNodes.map((n) => (
                  <th
                    key={n.id}
                    className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-zinc-800/30 sticky top-0"
                  >
                    {n.id.slice(0, 6)}
                  </th>
                ))}
                <th className="w-px bg-zinc-700/30" />
                {outputNodes.map((n) => (
                  <th
                    key={n.id}
                    className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-zinc-800/30 sticky top-0"
                  >
                    {n.id.slice(0, 6)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30",
                    i % 2 === 0 ? "bg-transparent" : "bg-zinc-800/10"
                  )}
                >
                  <td className="px-3 py-1.5 text-zinc-600 font-mono tabular-nums">
                    {i}
                  </td>
                  {inputNodes.map((n) => (
                    <td key={n.id} className="px-3 py-1.5 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-5 h-5 rounded font-mono font-bold text-[10px]",
                          row.inputs[n.id]
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {row.inputs[n.id] ? "1" : "0"}
                      </span>
                    </td>
                  ))}
                  <td className="w-px bg-zinc-700/20" />
                  {outputNodes.map((n) => (
                    <td key={n.id} className="px-3 py-1.5 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-5 h-5 rounded font-mono font-bold text-[10px]",
                          row.outputs[n.id]
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {row.outputs[n.id] ? "1" : "0"}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
