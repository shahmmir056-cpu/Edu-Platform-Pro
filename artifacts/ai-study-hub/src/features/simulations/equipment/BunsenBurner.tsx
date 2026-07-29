interface BunsenBurnerProps {
  flameHeight?: number;
  flameColor?: string;
  isOn?: boolean;
  width?: number;
  height?: number;
  isHovered?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function BunsenBurner({
  flameHeight = 40,
  flameColor = "#FF9F4C",
  isOn = true,
  width = 80,
  height = 160,
  isHovered,
  onClick,
  onPointerDown,
}: BunsenBurnerProps) {
  const w = width;
  const h = height;
  const cx = w / 2;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="select-none cursor-grab active:cursor-grabbing"
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      {/* Base */}
      <rect x={cx - 30} y={h - 18} width={60} height={14} rx={4} fill="#2D2D2D" opacity={0.15} stroke="#2D2D2D" strokeWidth={1.5} />

      {/* Tube */}
      <rect x={cx - 5} y={40} width={10} height={h - 60} rx={2} fill="rgba(200,220,240,0.2)" stroke="#2D2D2D" strokeWidth={1.5} />

      {/* Air hole */}
      <ellipse cx={cx} cy={h - 60} rx={4} ry={2} fill="none" stroke="#2D2D2D" strokeWidth={1} opacity={0.3} />

      {/* Gas inlet */}
      <rect x={cx + 5} y={h - 45} width={18} height={4} rx={1} fill="none" stroke="#2D2D2D" strokeWidth={1} opacity={0.3} />

      {/* Flame */}
      {isOn && flameHeight > 0 && (
        <g>
          {/* Outer flame */}
          <path
            d={`M ${cx - 8} 40 Q ${cx - 10} ${40 - flameHeight * 0.6} ${cx} ${40 - flameHeight} Q ${cx + 10} ${40 - flameHeight * 0.6} ${cx + 8} 40 Z`}
            fill={flameColor}
            opacity={0.5}
          >
            <animate attributeName="d"
              values={`M ${cx - 8} 40 Q ${cx - 10} ${40 - flameHeight * 0.6} ${cx} ${40 - flameHeight} Q ${cx + 10} ${40 - flameHeight * 0.6} ${cx + 8} 40 Z;M ${cx - 7} 40 Q ${cx - 11} ${40 - flameHeight * 0.55} ${cx} ${40 - flameHeight * 0.95} Q ${cx + 11} ${40 - flameHeight * 0.55} ${cx + 7} 40 Z;M ${cx - 8} 40 Q ${cx - 10} ${40 - flameHeight * 0.6} ${cx} ${40 - flameHeight} Q ${cx + 10} ${40 - flameHeight * 0.6} ${cx + 8} 40 Z`}
              dur="0.8s" repeatCount="indefinite" />
          </path>
          {/* Inner flame */}
          <path
            d={`M ${cx - 4} 40 Q ${cx - 5} ${40 - flameHeight * 0.35} ${cx} ${40 - flameHeight * 0.5} Q ${cx + 5} ${40 - flameHeight * 0.35} ${cx + 4} 40 Z`}
            fill="#4FC3F7"
            opacity={0.6}
          />
          {/* Glow */}
          <ellipse cx={cx} cy={40 - flameHeight * 0.4} rx={14} ry={flameHeight * 0.3} fill={flameColor} opacity={0.15}>
            <animate attributeName="opacity" values="0.1;0.2;0.1" dur="1.2s" repeatCount="indefinite" />
          </ellipse>
        </g>
      )}

      {isHovered && (
        <rect x={2} y={2} width={w - 4} height={h - 4} rx={8} fill="none" stroke="#FF9F4C" strokeWidth={2} opacity={0.4} />
      )}
    </svg>
  );
}
