/**
 * Recreated Suzuki "S" mark using three stylised parallelograms.
 * (Placeholder until the user supplies the official asset.)
 */
export const SuzukiSMark = ({ className = "", size = 96 }) => (
  <svg
    className={className}
    width={size}
    height={size * 0.78}
    viewBox="0 0 200 156"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Suzuki"
  >
    {/* Top-left diamond */}
    <path
      d="M30 10 L100 10 L70 60 L0 60 Z"
      fill="#E60012"
    />
    {/* Bottom-right diamond */}
    <path
      d="M100 96 L170 96 L200 146 L130 146 Z"
      fill="#E60012"
    />
    {/* Center diagonal sweep */}
    <path
      d="M55 76 L155 26 L145 80 L45 130 Z"
      fill="#E60012"
    />
  </svg>
);

export const SuzukiWordmark = ({ className = "" }) => (
  <span
    className={`font-extrabold tracking-[0.04em] text-[color:var(--suzuki-blue)] ${className}`}
    style={{ fontFamily: "Manrope, sans-serif" }}
  >
    SUZUKI
  </span>
);

export default SuzukiSMark;
