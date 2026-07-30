import type { AppTheme } from "./types";

export const THEMES: AppTheme[] = [
  {
    id: "dark", label: "Dark",
    bg: "#2D2D2D", canvasBg: "#FFFFFF", gridDot: "rgba(0,0,0,0.06)",
    sidebar: "#2D2D2D", toolbar: "#2D2D2D", panel: "#2D2D2D", card: "#3A3A3A",
    border: "#444444", text: "#FFFFFF", textMuted: "#AAAAAA", accent: "#FF9F4C",
  },
  {
    id: "light", label: "Light",
    bg: "#FFF8F0", canvasBg: "#FFFFFF", gridDot: "rgba(0,0,0,0.04)",
    sidebar: "#FFF8F0", toolbar: "#FFFFFF", panel: "#FFF8F0", card: "#FFFFFF",
    border: "#E8E0D8", text: "#2D2D2D", textMuted: "#6B6B6B", accent: "#FF9F4C",
  },
  {
    id: "forest", label: "Forest",
    bg: "#1A2E1A", canvasBg: "#F0FFF0", gridDot: "rgba(0,80,0,0.08)",
    sidebar: "#1A2E1A", toolbar: "#1A2E1A", panel: "#1E351E", card: "#2A442A",
    border: "#3A5A3A", text: "#E8F5E8", textMuted: "#8AAF8A", accent: "#4CAF50",
  },
  {
    id: "midnight", label: "Midnight Blue",
    bg: "#0D1B2A", canvasBg: "#F0F4FF", gridDot: "rgba(0,0,80,0.06)",
    sidebar: "#0D1B2A", toolbar: "#0D1B2A", panel: "#122238", card: "#1B2D45",
    border: "#2A3F5A", text: "#E0E8F5", textMuted: "#7A9AB5", accent: "#5B9BD5",
  },
];

export function getTheme(id: string): AppTheme {
  return THEMES.find((t) => t.id === id) || THEMES[1];
}
