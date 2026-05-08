import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function HeaderProfileNavigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onDocumentClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const profileButton = target.closest('[data-testid="header-profile-btn"]');
      if (!profileButton) return;
      if (pathname === "/profile") return;
      navigate("/profile");
    };

    document.addEventListener("click", onDocumentClick, true);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
    };
  }, [navigate, pathname]);

  return null;
}
