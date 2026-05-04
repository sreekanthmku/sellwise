import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AppScreen } from "@/components/AppScreen";
import { useVobiz, SELLWISE_VOBIZ_POST_LOGIN_PATH_KEY } from "@/vobiz/VobizProvider";

/**
 * Minimal bridge: env-based Vobiz login then navigate (via provider onLogin) to `state.resume`.
 */
export default function CallingSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const resumePath =
    typeof location.state?.resume === "string" && location.state.resume.startsWith("/")
      ? location.state.resume
      : "/leads";
  const { login, registered } = useVobiz();
  const attemptRef = useRef(false);

  useEffect(() => {
    if (registered) return;
    if (attemptRef.current) return;
    attemptRef.current = true;

    const u = process.env.REACT_APP_VOBIZ_USERNAME;
    const p = process.env.REACT_APP_VOBIZ_PASSWORD;
    if (typeof u !== "string" || !u.trim() || typeof p !== "string" || !p.trim()) {
      toast.error("Missing Vobiz credentials in .env");
      navigate("/", { replace: true });
      return;
    }

    try {
      sessionStorage.setItem(SELLWISE_VOBIZ_POST_LOGIN_PATH_KEY, resumePath);
    } catch {
      /* ignore */
    }

    const r = login(u.trim(), p.trim());
    if (!r.ok) {
      try {
        sessionStorage.removeItem(SELLWISE_VOBIZ_POST_LOGIN_PATH_KEY);
      } catch {
        /* ignore */
      }
      navigate("/", { replace: true });
    }
  }, [registered, login, navigate, resumePath]);

  return (
    <AppScreen
      screenTestId="calling-setup-screen"
      showHeader={false}
      showBottomNav={false}
      mainClassName="flex min-h-0 flex-1 flex-col items-center justify-center p-6"
    >
      <p className="font-body text-[15px] text-[color:var(--gray-300)]">Connecting calling…</p>
    </AppScreen>
  );
}
