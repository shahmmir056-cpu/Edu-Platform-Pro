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
    bg: "#FFF8F0", canvasBg: "#FFFFFF", gridDot: "rgba(0,0,0,0.04)",
    sidebar: "#FFF8F0", toolbar: "#FFFFFF", panel: "#FFF8F0", card: "#FFFFFF",
    border: "#E8E0D8", text: "#2D2D2D", textMuted: "#6B6B6B", accent: "#FF9F4C",
  },
  {
    id: "midnight", label: "Midnight Blue",
    bg: "#FFF8F0", canvasBg: "#FFFFFF", gridDot: "rgba(0,0,0,0.04)",
    sidebar: "#FFF8F0", toolbar: "#FFFFFF", panel: "#FFF8F0", card: "#FFFFFF",
    border: "#E8E0D8", text: "#2D2D2D", textMuted: "#6B6B6B", accent: "#FF9F4C",
  },
];

export function getTheme(id: string): AppTheme {
  return THEMES.find((t) => t.id === id) || THEMES[1];
}
