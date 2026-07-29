interface ScaleProps {
  mass?: number;
  unit?: string;
  panTilt?: number;
  width?: number;
  height?: number;
  isHovered?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function Scale({
  mass = 0,
  unit = "g",
  panTilt = 0,
  width = 160,
  height = 140,
  isHovered,
  onClick,
  onPointerDown,
}: ScaleProps) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const panW = 40;
  const panH = 8;
  const fulcrumY = h - 40;

  const leftPanY = fulcrumY - 10 + panTilt * 8;
  const rightPanY = fulcrumY - 10 - panTilt * 8;

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
      {/* Base */}
      <rect x={cx - 35} y={h - 16} width={70} height={12} rx={4} fill="#2D2D2D" opacity={0.12} stroke="#2D2D2D" strokeWidth={1.5} />

      {/* Fulcrum */}
      <polygon points={`${cx},${fulcrumY - 12} ${cx - 6},${fulcrumY} ${cx + 6},${fulcrumY}`} fill="#FF9F4C" opacity={0.5} stroke="#E8852E" strokeWidth={1} />

      {/* Beam */}
      <line
        x1={cx - 55}
        y1={fulcrumY - 12 + panTilt * 6}
        x2={cx + 55}
        y2={fulcrumY - 12 - panTilt * 6}
        stroke="#2D2D2D"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* Left pan */}
      <g>
        <line x1={cx - 55} y1={fulcrumY - 12 + panTilt * 6} x2={cx - 55} y2={leftPanY} stroke="#2D2D2D" strokeWidth={1.5} />
        <rect x={cx - 55 - panW / 2} y={leftPanY} width={panW} height={panH} rx={2} fill="rgba(200,220,240,0.3)" stroke="#2D2D2D" strokeWidth={1.5} />
      </g>

      {/* Right pan */}
      <g>
        <line x1={cx + 55} y1={fulcrumY - 12 - panTilt * 6} x2={cx + 55} y2={rightPanY} stroke="#2D2D2D" strokeWidth={1.5} />
        <rect x={cx + 55 - panW / 2} y={rightPanY} width={panW} height={panH} rx={2} fill="rgba(200,220,240,0.3)" stroke="#2D2D2D" strokeWidth={1.5} />
      </g>

      {/* Digital readout */}
      <rect x={cx - 28} y={fulcrumY + 4} width={56} height={18} rx={3} fill="rgba(45,45,45,0.08)" stroke="#2D2D2D" strokeWidth={1} />
      <text
        x={cx}
        y={fulcrumY + 16}
        textAnchor="middle"
        fontSize={10}
        fill="#FF9F4C"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {mass.toFixed(1)} {unit}
      </text>

      {isHovered && (
        <rect x={2} y={2} width={w - 4} height={h - 4} rx={10} fill="none" stroke="#FF9F4C" strokeWidth={2} opacity={0.4} />
      )}
    </svg>
    </div>
  );
}
