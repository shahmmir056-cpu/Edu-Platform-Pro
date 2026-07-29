interface PipetteProps {
  liquidLevel?: number;
  liquidColor?: string;
  label?: string;
  width?: number;
  height?: number;
  isDispensing?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function Pipette({
  liquidLevel = 0,
  liquidColor = "#4FC3F7",
  label,
  width = 40,
  height = 200,
  isDispensing,
  isHovered,
  onClick,
  onPointerDown,
}: PipetteProps) {
  const w = width;
  const h = height;
  const bulbR = 10;
  const shaftW = 6;
  const shaftH = h * 0.6;
  const tipH = h * 0.25;
  const liquidH = shaftH * liquidLevel;

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
      {/* Rubber bulb */}
      <ellipse
        cx={w / 2}
        cy={bulbR + 4}
        rx={bulbR}
        ry={bulbR}
        fill="#FF9F4C"
        stroke="#E8852E"
        strokeWidth={1.5}
        opacity={0.9}
      />

      {/* Shaft */}
      <rect
        x={w / 2 - shaftW / 2}
        y={bulbR * 2 + 2}
        width={shaftW}
        height={shaftH}
        rx={1}
        fill="rgba(200,220,240,0.2)"
        stroke="#2D2D2D"
        strokeWidth={1.5}
      />

      {/* Graduation marks on shaft */}
      {[0.25, 0.5, 0.75].map((mark, i) => (
        <line
          key={i}
          x1={w / 2 + shaftW / 2}
          y1={bulbR * 2 + 2 + shaftH - shaftH * mark}
          x2={w / 2 + shaftW / 2 + 4}
          y2={bulbR * 2 + 2 + shaftH - shaftH * mark}
          stroke="#2D2D2D"
          strokeWidth={0.8}
          opacity={0.3}
        />
      ))}

      {/* Liquid inside shaft */}
      {liquidLevel > 0 && (
        <rect
          x={w / 2 - shaftW / 2 + 1}
          y={bulbR * 2 + 2 + shaftH - liquidH}
          width={shaftW - 2}
          height={liquidH}
          fill={liquidColor}
          opacity={0.6}
        />
      )}

      {/* Tip */}
      <path
        d={`M ${w / 2 - shaftW / 2} ${bulbR * 2 + shaftH + 2} L ${w / 2 - 1.5} ${h - 6} L ${w / 2 + 1.5} ${h - 6} L ${w / 2 + shaftW / 2} ${bulbR * 2 + shaftH + 2}`}
        fill="rgba(200,220,240,0.15)"
        stroke="#2D2D2D"
        strokeWidth={1.5}
      />

      {/* Droplet when dispensing */}
      {isDispensing && (
        <g>
          <ellipse cx={w / 2} cy={h - 2} rx={2} ry={3} fill={liquidColor} opacity={0.7}>
            <animate attributeName="cy" values={`${h - 6};${h + 10}`} dur="0.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="0.6s" repeatCount="indefinite" />
          </ellipse>
        </g>
      )}

      {/* Hover glow */}
      {isHovered && (
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2 + 6}
          ry={h / 2 + 6}
          fill="none"
          stroke="#FF9F4C"
          strokeWidth={2}
          opacity={0.4}
        />
      )}

      {label && (
        <text
          x={w / 2}
          y={h - 10}
          textAnchor="middle"
          fontSize={7}
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
