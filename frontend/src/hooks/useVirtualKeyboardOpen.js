import { useEffect, useState } from "react";

/** Pixels of vertical overlap between layout and visual viewport before we treat the soft keyboard as open. */
const KEYBOARD_THRESHOLD_PX = 80;

/**
 * Tracks mobile soft keyboard visibility via `visualViewport` (iOS Safari, Chrome Android).
 * Desktop browsers typically keep `open` false because the visual viewport matches the layout height.
 */
export function useVirtualKeyboardOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return undefined;

    const update = () => {
      const obscured = window.innerHeight - vv.height;
      setOpen(obscured > KEYBOARD_THRESHOLD_PX);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return open;
}
