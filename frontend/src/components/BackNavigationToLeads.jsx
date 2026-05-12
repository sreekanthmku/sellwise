import { useEffect } from "react";
import { useBlocker, useNavigate } from "react-router-dom";

function isCallFeedbackPathname(pathname) {
  return pathname === "/call-feedback" || /\/call-feedback$/.test(pathname);
}

/**
 * Mobile-style back: hardware / browser back goes to `/leads`, except on call feedback
 * (normal stack) and on `/` + `/leads` (natural history). When pop would already land on
 * `/leads`, it is left unchanged.
 */
export function BackNavigationToLeads() {
  const navigate = useNavigate();

  const blocker = useBlocker(({ historyAction, currentLocation, nextLocation }) => {
    if (historyAction !== "POP") return false;
    if (isCallFeedbackPathname(currentLocation.pathname)) return false;
    if (currentLocation.pathname === "/" || currentLocation.pathname === "/leads") return false;
    if (nextLocation.pathname === "/leads") return false;
    return true;
  });

  useEffect(() => {
    if (blocker.state !== "blocked") return;
    blocker.reset();
    navigate("/leads", { replace: true });
  }, [blocker, blocker.state, navigate]);

  return null;
}
