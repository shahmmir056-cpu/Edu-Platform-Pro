interface MicroscopeProps {
  magnification?: number;
  focusLevel?: number;
  width?: number;
  height?: number;
  isHovered?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function Microscope({
  magnification = 40,
  focusLevel = 50,
  width = 140,
  height = 220,
  isHovered,
  onClick,
  onPointerDown,
}: MicroscopeProps) {
  const w = width;
  const h = height;

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
      <ellipse cx={w / 2} cy={h - 18} rx={55} ry={14} fill="#2D2D2D" opacity={0.15} />
      <rect x={w / 2 - 50} y={h - 28} width={100} height={12} rx={4} fill="#2D2D2D" opacity={0.2} stroke="#2D2D2D" strokeWidth={1.5} />

      {/* Arm / pillar */}
      <rect x={w / 2 + 15} y={40} width={12} height={h - 70} rx={3} fill="#2D2D2D" opacity={0.12} stroke="#2D2D2D" strokeWidth={1.5} />

      {/* Stage */}
      <rect x={w / 2 - 35} y={h - 80} width={70} height={6} rx={2} fill="#E8852E" opacity={0.3} stroke="#E8852E" strokeWidth={1} />

      {/* Stage clips */}
      <line x1={w / 2 - 20} y1={h - 82} x2={w / 2 - 20} y2={h - 76} stroke="#2D2D2D" strokeWidth={1.5} />
      <line x1={w / 2 + 20} y1={h - 82} x2={w / 2 + 20} y2={h - 76} stroke="#2D2D2D" strokeWidth={1.5} />

      {/* Slide on stage */}
      <rect x={w / 2 - 18} y={h - 86} width={36} height={6} rx={1} fill="rgba(200,220,240,0.4)" stroke="#2D2D2D" strokeWidth={0.8} />
      <circle cx={w / 2} cy={h - 83} r={3} fill="rgba(255,159,76,0.3)" />

      {/* Objective lens */}
      <rect x={w / 2 - 6} y={h - 100} width={12} height={22} rx={3} fill="#FF9F4C" opacity={0.7} stroke="#E8852E" strokeWidth={1} />
      <circle cx={w / 2} cy={h - 98} r={4} fill="none" stroke="#2D2D2D" strokeWidth={1} />

      {/* Eyepiece tube */}
      <rect x={w / 2 - 5} y={38} width={10} height={30} rx={3} fill="rgba(200,220,240,0.2)" stroke="#2D2D2D" strokeWidth={1.5} />

      {/* Eyepiece */}
      <ellipse cx={w / 2} cy={36} rx={12} ry={6} fill="#2D2D2D" opacity={0.2} stroke="#2D2D2D" strokeWidth={1.5} />
      <ellipse cx={w / 2} cy={36} rx={7} ry={3} fill="#2D2D2D" opacity={0.1} />

      {/* Focus knob */}
      <circle cx={w / 2 + 30} cy={h / 2 - 10} r={10} fill="#FF9F4C" opacity={0.3} stroke="#E8852E" strokeWidth={1.5} />
      <line x1={w / 2 + 30} y1={h / 2 - 18} x2={w / 2 + 30} y2={h / 2 - 2} stroke="#E8852E" strokeWidth={1.5} />

      {/* Light source */}
      <rect x={w / 2 - 8} y={h - 50} width={16} height={10} rx={3} fill="#FFB366" opacity={0.4} stroke="#FF9F4C" strokeWidth={1} />
      <circle cx={w / 2} cy={h - 45} r={4} fill="#FF9F4C" opacity={0.6}>
        <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Magnification label */}
      <text
        x={w / 2}
        y={h - 6}
        textAnchor="middle"
        fontSize={8}
        fill="#6B6B6B"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {magnification}×
      </text>

      {isHovered && (
        <rect x={2} y={2} width={w - 4} height={h - 4} rx={8} fill="none" stroke="#FF9F4C" strokeWidth={2} opacity={0.4} />
      )}
    </svg>
    </div>
  );
}
