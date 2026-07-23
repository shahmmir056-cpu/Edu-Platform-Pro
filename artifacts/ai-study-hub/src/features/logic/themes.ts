import type { AppTheme } from "./types";

export const THEMES: AppTheme[] = [
  {
    id: "dark", label: "Dark",
    bg: "#0f0f1a", canvasBg: "#161625", gridDot: "rgba(100,100,160,0.12)",
    sidebar: "#12121f", toolbar: "#12121f", panel: "#12121f", card: "#1c1c30",
    border: "#2a2a40", text: "#e0e0f0", textMuted: "#6a6a8a", accent: "#6366f1",
  },
  {
    id: "light", label: "Light",
    bg: "#f0f0f5", canvasBg: "#fafafa", gridDot: "rgba(0,0,0,0.06)",
    sidebar: "#ffffff", toolbar: "#ffffff", panel: "#ffffff", card: "#f5f5fa",
    border: "#dddde5", text: "#1a1a2e", textMuted: "#8888a0", accent: "#4f46e5",
  },
  {
    id: "forest", label: "Forest",
    bg: "#0d1a0d", canvasBg: "#112011", gridDot: "rgba(60,140,60,0.1)",
    sidebar: "#0f1a0f", toolbar: "#0f1a0f", panel: "#0f1a0f", card: "#162416",
    border: "#264026", text: "#d0f0d0", textMuted: "#5a8a5a", accent: "#22c55e",
  },
  {
    id: "midnight", label: "Midnight Blue",
    bg: "#0a0e1a", canvasBg: "#0f1525", gridDot: "rgba(80,100,180,0.1)",
    sidebar: "#0c1020", toolbar: "#0c1020", panel: "#0c1020", card: "#141c32",
    border: "#1e2a48", text: "#c8d0f0", textMuted: "#506090", accent: "#3b82f6",
  },
];

export function getTheme(id: string): AppTheme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
