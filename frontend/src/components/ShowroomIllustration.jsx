/**
 * Stylised showroom illustration: a salesman in a blue suit standing
 * in front of a row of motorcycles. SVG placeholder until real asset arrives.
 */
export const ShowroomIllustration = ({ className = "" }) => (
  <svg
    className={className}
    viewBox="0 0 520 280"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Suzuki showroom with motorcycles and salesman"
  >
    {/* Showroom backdrop */}
    <rect x="20" y="20" width="480" height="170" rx="6" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
    {/* Vertical mullions */}
    <line x1="180" y1="20" x2="180" y2="190" stroke="#CBD5E1" strokeWidth="2" />
    <line x1="340" y1="20" x2="340" y2="190" stroke="#CBD5E1" strokeWidth="2" />

    {/* Banners */}
    <g>
      <rect x="100" y="40" width="40" height="34" fill="#1F3A93" />
      <polygon points="100,74 120,86 140,74" fill="#1F3A93" />
      <text x="120" y="62" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="Manrope">SPEED</text>
    </g>
    <g>
      <rect x="240" y="40" width="40" height="34" fill="#E60012" />
      <polygon points="240,74 260,86 280,74" fill="#E60012" />
      <text x="260" y="62" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700" fontFamily="Manrope">BIKE</text>
    </g>
    <g>
      <rect x="380" y="40" width="40" height="34" fill="#1F3A93" />
      <polygon points="380,74 400,86 420,74" fill="#1F3A93" />
      <text x="400" y="62" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily="Manrope">FUTURE</text>
    </g>

    {/* Floor */}
    <rect x="0" y="190" width="520" height="20" fill="#E2E8F0" />
    <line x1="0" y1="210" x2="520" y2="210" stroke="#CBD5E1" strokeWidth="1" />

    {/* Bike helper */}
    {Array.from({ length: 5 }).map((_, i) => {
      const x = 60 + i * 90;
      const isAccent = i === 2 ? false : i % 2 === 0;
      const bodyColor = isAccent ? "#475569" : "#0F172A";
      return (
        <g key={i} transform={`translate(${x}, 130)`}>
          {/* Bike silhouette */}
          <ellipse cx="20" cy="55" rx="20" ry="4" fill="#94A3B8" opacity="0.4" />
          <circle cx="6" cy="50" r="12" fill="#1E293B" />
          <circle cx="6" cy="50" r="5" fill="#94A3B8" />
          <circle cx="46" cy="50" r="12" fill="#1E293B" />
          <circle cx="46" cy="50" r="5" fill="#94A3B8" />
          <path d={`M 0 38 L 16 22 L 36 22 L 50 38 L 40 46 L 14 46 Z`} fill={bodyColor} />
          <rect x="20" y="14" width="14" height="10" rx="2" fill={i === 2 ? "#FFFFFF" : "#CBD5E1"} />
          <path d="M 14 22 L 8 14 L 12 12 L 18 18 Z" fill="#475569" />
        </g>
      );
    })}

    {/* Salesman in blue suit */}
    <g transform="translate(232, 80)">
      {/* Head */}
      <circle cx="28" cy="20" r="14" fill="#F1C9A5" />
      <path d="M 14 16 Q 28 4 42 16 L 42 12 Q 28 -2 14 12 Z" fill="#1F2937" />
      {/* Neck */}
      <rect x="24" y="32" width="8" height="6" fill="#E5B58A" />
      {/* Body / suit */}
      <path d="M 6 38 L 50 38 L 56 130 L 0 130 Z" fill="#1F4DC2" />
      {/* Shirt + tie */}
      <path d="M 22 38 L 34 38 L 30 60 L 26 60 Z" fill="#FFFFFF" />
      <path d="M 26 42 L 30 42 L 32 62 L 24 62 Z" fill="#1E293B" />
      {/* Arms (hands on hips) */}
      <path d="M 6 40 L 0 70 L 8 96 L 16 70 Z" fill="#1F4DC2" />
      <path d="M 50 40 L 56 70 L 48 96 L 40 70 Z" fill="#1F4DC2" />
      <circle cx="4" cy="70" r="5" fill="#F1C9A5" />
      <circle cx="52" cy="70" r="5" fill="#F1C9A5" />
      {/* Shoes */}
      <ellipse cx="14" cy="132" rx="10" ry="4" fill="#0F172A" />
      <ellipse cx="42" cy="132" rx="10" ry="4" fill="#0F172A" />
    </g>
  </svg>
);

export default ShowroomIllustration;
