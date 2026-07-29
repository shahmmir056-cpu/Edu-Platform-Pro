interface CentrifugeProps {
  isSpinning?: boolean;
  speed?: number;
  tubeSlots?: { filled: boolean; color?: string }[];
  width?: number;
  height?: number;
  isHovered?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function Centrifuge({
  isSpinning = false,
  speed = 0,
  tubeSlots = [
    { filled: true, color: "#CE93D8" },
    { filled: true, color: "#4FC3F7" },
    { filled: false },
    { filled: true, color: "#FF9F4C" },
    { filled: false },
    { filled: true, color: "#81C784" },
  ],
  width = 160,
  height = 180,
  isHovered,
  onClick,
  onPointerDown,
}: CentrifugeProps) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const cy = h / 2 - 10;
  const rotorR = 50;
  const slotR = 12;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="select-none cursor-grab active:cursor-grabbing"
      onClick={onClick}
      onPointerDown={onPointerDown}
    >
      {/* Body */}
      <rect x={cx - 55} y={cy - 45} width={110} height={90} rx={12} fill="rgba(45,45,45,0.06)" stroke="#2D2D2D" strokeWidth={2} />

      {/* Lid line */}
      <line x1={cx - 55} y1={cy - 10} x2={cx + 55} y2={cy - 10} stroke="#2D2D2D" strokeWidth={1} opacity={0.2} />

      {/* Rotor */}
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`0 ${cx} ${cy}`}
          to={`360 ${cx} ${cy}`}
          dur={`${Math.max(0.2, 2 - speed * 0.15)}s`}
          repeatCount={isSpinning ? "indefinite" : "0"}
        />

        {/* Rotor disc */}
        <circle cx={cx} cy={cy} r={rotorR} fill="rgba(45,45,45,0.08)" stroke="#2D2D2D" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={8} fill="#2D2D2D" opacity={0.15} />

        {/* Tube slots */}
        {tubeSlots.map((slot, i) => {
          const angle = (i / tubeSlots.length) * Math.PI * 2 - Math.PI / 2;
          const sx = cx + Math.cos(angle) * (rotorR - 16);
          const sy = cy + Math.sin(angle) * (rotorR - 16);
          return (
            <g key={i}>
              <circle cx={sx} cy={sy} r={slotR} fill="rgba(200,220,240,0.2)" stroke="#2D2D2D" strokeWidth={1.5} />
              {slot.filled && slot.color && (
                <circle cx={sx} cy={sy} r={slotR - 3} fill={slot.color} opacity={0.6} />
              )}
            </g>
          );
        })}
      </g>

      {/* Speed display */}
      <text
        x={cx}
        y={cy + 60}
        textAnchor="middle"
        fontSize={10}
        fill="#FF9F4C"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {isSpinning ? `${speed} RPM` : "STOPPED"}
      </text>

      {isHovered && (
        <rect x={3} y={3} width={w - 6} height={h - 6} rx={14} fill="none" stroke="#FF9F4C" strokeWidth={2} opacity={0.4} />
      )}
    </svg>
  );
}
