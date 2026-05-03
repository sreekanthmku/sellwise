/**
 * "eligere" wordmark with chat-bubble glyph (placeholder).
 */
export const EligereLogo = ({ className = "" }) => (
  <span
    className={`inline-flex items-center gap-1.5 ${className}`}
    aria-label="eligere"
  >
    <svg
      width="22"
      height="22"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 4 H22 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 H14 l-6 5 v-5 H6 a6 6 0 0 1 -6 -6 v-6 a6 6 0 0 1 6 -6 z"
        fill="#5B45B8"
      />
      <circle cx="11" cy="13" r="2" fill="#fff" />
      <circle cx="17" cy="13" r="2" fill="#fff" />
      <circle cx="23" cy="13" r="2" fill="#fff" />
      <circle cx="26" cy="6" r="3" fill="#9333EA" />
    </svg>
    <span
      className="text-[15px] font-semibold tracking-tight text-[color:#3F2A8C]"
      style={{ fontFamily: "Manrope, sans-serif" }}
    >
      eligere
    </span>
  </span>
);

export default EligereLogo;
