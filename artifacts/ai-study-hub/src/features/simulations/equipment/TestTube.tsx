interface TestTubeProps {
  fillLevel?: number;
  liquidColor?: string;
  label?: string;
  width?: number;
  height?: number;
  isDropTarget?: boolean;
  isHovered?: boolean;
  inRack?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function TestTube({
  fillLevel = 0,
  liquidColor = "#CE93D8",
  label,
  width = 30,
  height = 120,
  isDropTarget,
  isHovered,
  inRack = false,
  onClick,
  onPointerDown,
}: TestTubeProps) {
  const w = width;
  const h = height;
  const bodyW = w - 8;
  const bodyH = h - 16;
  const liquidH = bodyH * Math.min(fillLevel, 1);

  return (
    <div style={{ maxWidth: width, width: '100%' }}>
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      className="select-none cursor-grab active:cursor-grabbing"
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      <defs>
        <clipPath id={`tube-clip-${label}`}>
          <rect x={4} y={8} width={bodyW} height={bodyH} rx={bodyW / 2} />
        </clipPath>
      </defs>

      {/* Test tube body — rounded bottom */}
      <path
        d={`M 4 8 L 4 ${h - bodyW / 2 - 8} A ${bodyW / 2} ${bodyW / 2} 0 0 0 ${4 + bodyW} ${h - bodyW / 2 - 8} L ${4 + bodyW} 8`}
        fill="rgba(200,220,240,0.15)"
        stroke="#2D2D2D"
        strokeWidth={1.5}
      />

      {/* Rim */}
      <rect
        x={2}
        y={6}
        width={bodyW + 4}
        height={5}
        rx={2}
        fill="none"
        stroke="#2D2D2D"
        strokeWidth={1.5}
      />

      {/* Liquid */}
      {fillLevel > 0 && (
        <g clipPath={`url(#tube-clip-${label})`}>
          <rect
            x={4}
            y={h - bodyW / 2 - 8 - liquidH}
            width={bodyW}
            height={liquidH + bodyW / 2 + 8}
            fill={liquidColor}
            opacity={0.6}
          />
          <ellipse
            cx={4 + bodyW / 2}
            cy={h - bodyW / 2 - 8 - liquidH + 2}
            rx={bodyW / 2 - 2}
            ry={2.5}
            fill={liquidColor}
            opacity={0.4}
          />
        </g>
      )}

      {/* Drop target highlight */}
      {isDropTarget && (
        <path
          d={`M 4 8 L 4 ${h - bodyW / 2 - 8} A ${bodyW / 2} ${bodyW / 2} 0 0 0 ${4 + bodyW} ${h - bodyW / 2 - 8} L ${4 + bodyW} 8`}
          fill="none"
          stroke={isHovered ? "#4CAF50" : "#FF9F4C"}
          strokeWidth={3}
          strokeDasharray={isHovered ? "0" : "4 3"}
          opacity={0.8}
        />
      )}

      {label && (
        <text
          x={w / 2}
          y={h - 4}
          textAnchor="middle"
          fontSize={6}
          fill="#6B6B6B"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {label}
        </text>
      )}
    </svg>
    </div>
  );
}
