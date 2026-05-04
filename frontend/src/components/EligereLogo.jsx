const logoSrc = `${process.env.PUBLIC_URL}/eligere-logo.png`;

/**
 * Official eligere wordmark (from `public/eligere-logo.png`).
 * Pass `className` to control size (e.g. footer vs hero).
 */
export const EligereLogo = ({ className = "" }) => (
  <img
    src={logoSrc}
    alt="eligere"
    className={`block h-auto w-auto max-w-full object-contain ${className}`}
    decoding="async"
  />
);

export default EligereLogo;
