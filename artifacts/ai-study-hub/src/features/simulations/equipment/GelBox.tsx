interface GelBoxProps {
  isRunning?: boolean;
  voltage?: number;
  time?: number;
  bands?: { position: number; color: string; label?: string }[];
  width?: number;
  height?: number;
  isHovered?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function GelBox({
  isRunning = false,
  voltage = 0,
  time = 0,
  bands = [],
  width = 200,
  height = 260,
  isHovered,
  onClick,
  onPointerDown,
}: GelBoxProps) {
  const w = width;
  const h = height;
  const gelX = 25;
  const gelY = 60;
  const gelW = w - 50;
  const gelH = h - 120;
  const wellW = 20;
  const wellDepth = 8;

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
      {/* Tank */}
      <rect x={15} y={40} width={w - 30} height={h - 60} rx={6} fill="rgba(200,220,240,0.2)" stroke="#2D2D2D" strokeWidth={2} />

      {/* Buffer liquid */}
      <rect x={17} y={42} width={w - 34} height={h - 64} rx={5} fill="#4FC3F7" opacity={0.15} />

      {/* Gel slab */}
      <rect x={gelX} y={gelY} width={gelW} height={gelH} rx={3} fill="rgba(255,248,240,0.8)" stroke="#2D2D2D" strokeWidth={1.5} />

      {/* Wells */}
      {[0, 1, 2, 3].map((i) => {
        const wellX = gelX + 15 + i * (wellW + 12);
        return (
          <rect
            key={i}
            x={wellX}
            y={gelY + 4}
            width={wellW}
            height={wellDepth}
            rx={1}
            fill="rgba(45,45,45,0.1)"
            stroke="#2D2D2D"
            strokeWidth={0.8}
          />
        );
      })}

      {/* DNA bands migrating */}
      {bands.map((band, i) => {
        const bandY = gelY + wellDepth + 12 + band.position * (gelH - wellDepth - 20);
        return (
          <g key={i}>
            <rect
              x={gelX + 15 + (band.position < 1 ? 0 : band.position < 2 ? 1 : band.position < 3 ? 2 : 3) * (wellW + 12)}
              y={bandY}
              width={wellW}
              height={4}
              rx={2}
              fill={band.color}
              opacity={0.7}
            />
            {band.label && (
              <text
                x={gelX + gelW + 6}
                y={bandY + 4}
                fontSize={7}
                fill="#6B6B6B"
                fontFamily="'Plus Jakarta Sans', sans-serif"
              >
                {band.label}
              </text>
            )}
          </g>
        );
      })}

      {/* Electrodes */}
      <rect x={20} y={44} width={4} height={12} rx={1} fill="#FF9F4C" opacity={isRunning ? 0.8 : 0.3} />
      <rect x={w - 24} y={44} width={4} height={12} rx={1} fill="#4FC3F7" opacity={isRunning ? 0.8 : 0.3} />

      {/* +/- labels */}
      <text x={22} y={40} textAnchor="middle" fontSize={10} fill="#FF9F4C" fontWeight="bold" fontFamily="monospace">+</text>
      <text x={w - 22} y={40} textAnchor="middle" fontSize={10} fill="#4FC3F7" fontWeight="bold" fontFamily="monospace">−</text>

      {/* Running indicator */}
      {isRunning && (
        <g>
          <line x1={30} y1={50} x2={w - 30} y2={50} stroke="#FF9F4C" strokeWidth={1} opacity={0.3} strokeDasharray="4 3">
            <animate attributeName="stroke-dashoffset" values="0;-14" dur="0.5s" repeatCount="indefinite" />
          </line>
        </g>
      )}

      {/* Voltage display */}
      <text
        x={w / 2}
        y={h - 10}
        textAnchor="middle"
        fontSize={9}
        fill="#6B6B6B"
        fontFamily="monospace"
      >
        {isRunning ? `${voltage}V · ${time}s` : "Ready"}
      </text>

      {isHovered && (
        <rect x={3} y={3} width={w - 6} height={h - 6} rx={10} fill="none" stroke="#FF9F4C" strokeWidth={2} opacity={0.4} />
      )}
    </svg>
    </div>
  );
}
