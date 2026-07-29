interface PetriDishProps {
  colonies?: { x: number; y: number; r: number; color: string }[];
  agarColor?: string;
  moistureLevel?: number;
  label?: string;
  width?: number;
  height?: number;
  isDropTarget?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function PetriDish({
  colonies = [],
  agarColor = "#E8F5E9",
  moistureLevel = 1,
  label,
  width = 120,
  height = 120,
  isDropTarget,
  isHovered,
  onClick,
  onPointerDown,
}: PetriDishProps) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const cy = h / 2;
  const outerR = Math.min(w, h) / 2 - 6;
  const innerR = outerR - 4;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="select-none cursor-grab active:cursor-grabbing"
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      <defs>
        <radialGradient id={`agar-${label}`} cx="40%" cy="40%">
          <stop offset="0%" stopColor={agarColor} stopOpacity={0.9} />
          <stop offset="100%" stopColor={agarColor} stopOpacity={0.5} />
        </radialGradient>
        <clipPath id={`dish-clip-${label}`}>
          <circle cx={cx} cy={cy} r={innerR} />
        </clipPath>
      </defs>

      {/* Dish shadow */}
      <ellipse cx={cx + 2} cy={cy + 3} rx={outerR} ry={outerR} fill="rgba(0,0,0,0.05)" />

      {/* Dish rim */}
      <circle cx={cx} cy={cy} r={outerR} fill="rgba(200,220,240,0.2)" stroke="#2D2D2D" strokeWidth={2} />

      {/* Agar */}
      <circle cx={cx} cy={cy} r={innerR} fill={`url(#agar-${label})`} />

      {/* Moisture sheen */}
      {moistureLevel > 0.5 && (
        <ellipse
          cx={cx - innerR * 0.2}
          cy={cy - innerR * 0.2}
          rx={innerR * 0.5}
          ry={innerR * 0.3}
          fill="white"
          opacity={0.15 * moistureLevel}
        />
      )}

      {/* Colonies */}
      <g clipPath={`url(#dish-clip-${label})`}>
        {colonies.map((col, i) => (
          <g key={i}>
            <circle
              cx={cx + col.x * innerR}
              cy={cy + col.y * innerR}
              r={col.r * innerR}
              fill={col.color}
              opacity={0.6}
            />
            <circle
              cx={cx + col.x * innerR}
              cy={cy + col.y * innerR}
              r={col.r * innerR * 0.6}
              fill={col.color}
              opacity={0.3}
            />
          </g>
        ))}
      </g>

      {/* Drop target highlight */}
      {isDropTarget && (
        <circle
          cx={cx}
          cy={cy}
          r={outerR + 2}
          fill="none"
          stroke={isHovered ? "#4CAF50" : "#FF9F4C"}
          strokeWidth={3}
          strokeDasharray={isHovered ? "0" : "6 3"}
          opacity={0.8}
        />
      )}

      {label && (
        <text
          x={cx}
          y={h - 4}
          textAnchor="middle"
          fontSize={8}
          fill="#6B6B6B"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {label}
        </text>
      )}

      {isHovered && !isDropTarget && (
        <circle cx={cx} cy={cy} r={outerR + 4} fill="none" stroke="#FF9F4C" strokeWidth={2} opacity={0.4} />
      )}
    </svg>
  );
}
