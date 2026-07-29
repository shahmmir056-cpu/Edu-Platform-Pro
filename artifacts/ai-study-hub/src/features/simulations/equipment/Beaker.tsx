interface BeakerProps {
  fillLevel?: number;
  liquidColor?: string;
  label?: string;
  width?: number;
  height?: number;
  isDropTarget?: boolean;
  isHovered?: boolean;
  temperature?: number;
  showGraduations?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function Beaker({
  fillLevel = 0,
  liquidColor = "#4FC3F7",
  label,
  width = 120,
  height = 160,
  isDropTarget,
  isHovered,
  temperature,
  showGraduations = true,
  onClick,
  onPointerDown,
}: BeakerProps) {
  const w = width;
  const h = height;
  const rim = 8;
  const bodyW = w - rim * 2;
  const bodyH = h - 30;
  const liquidH = bodyH * Math.min(fillLevel, 1);
  const liquidY = bodyH - liquidH + 10;

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
        <linearGradient id={`beaker-glass-${label}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(200,220,240,0.3)" />
          <stop offset="30%" stopColor="rgba(220,240,255,0.15)" />
          <stop offset="70%" stopColor="rgba(220,240,255,0.15)" />
          <stop offset="100%" stopColor="rgba(200,220,240,0.3)" />
        </linearGradient>
        <clipPath id={`beaker-clip-${label}`}>
          <rect x={rim} y={10} width={bodyW} height={bodyH} rx={2} />
        </clipPath>
      </defs>

      {/* Beaker body */}
      <rect
        x={rim}
        y={10}
        width={bodyW}
        height={bodyH}
        rx={2}
        fill={`url(#beaker-glass-${label})`}
        stroke="#2D2D2D"
        strokeWidth={2}
      />

      {/* Rim / spout */}
      <path
        d={`M ${rim} 10 L ${rim - 6} 4 L ${rim} 4`}
        fill="none"
        stroke="#2D2D2D"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <path
        d={`M ${rim + bodyW} 10 L ${rim + bodyW + 6} 4 L ${rim + bodyW} 4`}
        fill="none"
        stroke="#2D2D2D"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Liquid */}
      {fillLevel > 0 && (
        <g clipPath={`url(#beaker-clip-${label})`}>
          <rect
            x={rim}
            y={liquidY}
            width={bodyW}
            height={liquidH + 10}
            fill={liquidColor}
            opacity={0.7}
          />
          {/* Liquid surface wave */}
          <ellipse
            cx={rim + bodyW / 2}
            cy={liquidY + 2}
            rx={bodyW / 2 - 2}
            ry={3}
            fill={liquidColor}
            opacity={0.5}
          />
        </g>
      )}

      {/* Graduations */}
      {showGraduations &&
        [0.25, 0.5, 0.75, 1].map((mark, i) => (
          <g key={i}>
            <line
              x1={rim + bodyW - 12}
              y1={10 + bodyH - bodyH * mark}
              x2={rim + bodyW - 2}
              y2={10 + bodyH - bodyH * mark}
              stroke="#2D2D2D"
              strokeWidth={1}
              opacity={0.3}
            />
            <text
              x={rim + bodyW - 16}
              y={10 + bodyH - bodyH * mark + 3}
              textAnchor="end"
              fontSize={7}
              fill="#2D2D2D"
              opacity={0.3}
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {Math.round(mark * 100)}ml
            </text>
          </g>
        ))}

      {/* Temperature indicator */}
      {temperature !== undefined && (
        <text
          x={rim + bodyW / 2}
          y={h - 4}
          textAnchor="middle"
          fontSize={9}
          fill="#FF9F4C"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {temperature}°C
        </text>
      )}

      {/* Drop target highlight */}
      {isDropTarget && (
        <rect
          x={rim - 2}
          y={8}
          width={bodyW + 4}
          height={bodyH + 4}
          rx={4}
          fill="none"
          stroke={isHovered ? "#4CAF50" : "#FF9F4C"}
          strokeWidth={3}
          strokeDasharray={isHovered ? "0" : "6 3"}
          opacity={0.8}
        >
          {isHovered && (
            <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
          )}
        </rect>
      )}

      {/* Label */}
      {label && (
        <text
          x={rim + bodyW / 2}
          y={h - 14}
          textAnchor="middle"
          fontSize={9}
          fill="#6B6B6B"
          fontFamily="'Plus Jakarta Sans', sans-serif"
          fontWeight="500"
        >
          {label}
        </text>
      )}
    </svg>
    </div>
  );
}
