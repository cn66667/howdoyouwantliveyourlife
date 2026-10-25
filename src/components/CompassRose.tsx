const ticks = [0, 45, 90, 135, 180, 225, 270, 315];

function tickLine(angle: number) {
  const radians = (angle * Math.PI) / 180;
  const outer = 27;
  const inner = angle % 90 === 0 ? 21 : 23;
  const x1 = 32 + Math.sin(radians) * inner;
  const y1 = 32 - Math.cos(radians) * inner;
  const x2 = 32 + Math.sin(radians) * outer;
  const y2 = 32 - Math.cos(radians) * outer;
  return { x1, y1, x2, y2 };
}

export function CompassRose() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#211c17" strokeOpacity="0.32">
        <circle cx="32" cy="32" r="27" />
        <circle cx="32" cy="32" r="21" strokeOpacity="0.14" />
      </g>
      <g stroke="#211c17" strokeOpacity="0.38" strokeWidth="0.8">
        {ticks.map((angle) => {
          const { x1, y1, x2, y2 } = tickLine(angle);
          return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      <path d="M32 8 L36 32 L32 56 L28 32 Z" fill="#a5382a" fillOpacity="0.62" />
      <path d="M8 32 L32 28 L56 32 L32 36 Z" fill="#211c17" fillOpacity="0.32" />
      <circle
        cx="32"
        cy="32"
        r="2.2"
        fill="#f4ecdc"
        stroke="#211c17"
        strokeOpacity="0.35"
      />
      <text
        x="32"
        y="6.4"
        textAnchor="middle"
        fontSize="6"
        fill="#211c17"
        fillOpacity="0.5"
        fontFamily="inherit"
      >
        北
      </text>
    </svg>
  );
}
