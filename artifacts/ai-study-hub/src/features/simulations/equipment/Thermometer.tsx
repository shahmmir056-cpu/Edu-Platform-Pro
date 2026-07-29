interface ThermometerProps {
  temperature?: number;
  minTemp?: number;
  maxTemp?: number;
  width?: number;
  height?: number;
  isHovered?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export function Thermometer({
  temperature = 25,
  minTemp = -10,
  maxTemp = 110,
  width = 30,
  height = 160,
  isHovered,
  onClick,
  onPointerDown,
}: ThermometerProps) {
  const w = width;
  const h = height;
  const cx = w / 2;
  const bulbR = 10;
  const tubeW = 6;
  const tubeTop = 14;
  const tubeBottom = h - bulbR - 8;
  const tubeH = tubeBottom - tubeTop;
  const normalizedTemp = (temperature - minTemp) / (maxTemp - minTemp);
  const mercuryH = tubeH * Math.max(0, Math.min(1, normalizedTemp));

  const mercuryColor =
    temperature > 60 ? "#E53935" : temperature > 35 ? "#FF9F4C" : "#4FC3F7";

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
      {/* Tube */}
      <rect
        x={cx - tubeW / 2}
        y={tubeTop}
        width={tubeW}
        height={tubeH}
        rx={tubeW / 2}
        fill="rgba(200,220,240,0.15)"
        stroke="#2D2D2D"
        strokeWidth={1.5}
      />

      {/* Mercury */}
      <rect
        x={cx - tubeW / 2 + 1}
        y={tubeBottom - mercuryH}
        width={tubeW - 2}
        height={mercuryH}
        fill={mercuryColor}
        opacity={0.8}
      />

      {/* Bulb */}
      <circle cx={cx} cy={h - bulbR - 2} r={bulbR} fill={mercuryColor} opacity={0.8} stroke="#2D2D2D" strokeWidth={1.5} />

      {/* Scale marks */}
      {[0, 0.25, 0.5, 0.75, 1].map((mark, i) => {
        const y = tubeBottom - tubeH * mark;
        const temp = Math.round(minTemp + (maxTemp - minTemp) * mark);
        return (
          <g key={i}>
            <line
              x1={cx + tubeW / 2 + 1}
              y1={y}
              x2={cx + tubeW / 2 + 5}
              y2={y}
              stroke="#2D2D2D"
              strokeWidth={0.8}
              opacity={0.3}
            />
            <text
              x={cx + tubeW / 2 + 7}
              y={y + 3}
              fontSize={6}
              fill="#6B6B6B"
              fontFamily="monospace"
            >
              {temp}
            </text>
          </g>
        );
      })}

      {/* Temperature reading */}
      <text
        x={cx}
        y={tubeTop - 4}
        textAnchor="middle"
        fontSize={9}
        fill={mercuryColor}
        fontFamily="monospace"
        fontWeight="bold"
      >
        {temperature}°
      </text>

      {isHovered && (
        <rect x={1} y={1} width={w - 2} height={h - 2} rx={8} fill="none" stroke="#FF9F4C" strokeWidth={2} opacity={0.4} />
      )}
    </svg>
    </div>
  );
}
