import { Users, TrendingUp, Compass, BarChart3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const navItems = [
  { key: "leadsTab", path: "/leads", icon: Users, testid: "nav-leads" },
  { key: "perform", path: "/perform", icon: TrendingUp, testid: "nav-perform" },
  { key: "guide", path: "/guide", icon: Compass, testid: "nav-guide" },
  { key: "analyze", path: "/analyze", icon: BarChart3, testid: "nav-analyze" },
];

export const BottomNav = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      data-testid="bottom-nav"
      className="sticky bottom-0 left-0 right-0 z-40 mt-auto bg-[color:var(--suzuki-blue)] px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]"
    >
      <ul className="grid grid-cols-4 gap-1">
        {navItems.map(({ key, path, icon: Icon, testid }) => {
          const active =
            pathname === path ||
            (key === "leadsTab" && pathname.startsWith("/leads"));
          return (
            <li key={key} className="flex min-w-0 justify-center">
              <button
                type="button"
                data-testid={testid}
                onClick={() => {
                  const target = key === "leadsTab" ? "/leads" : path;
                  if (pathname === target) return;
                  navigate(target);
                }}
                className={`flex w-full max-w-[5.5rem] flex-col items-center justify-center transition-colors ${
                  active ? "" : "text-[#b8d4f6] hover:text-[#d6e8fc]"
                }`}
              >
                <span
                  className={`flex w-full flex-col items-center gap-1 ${
                    active
                      ? "rounded-[18px] bg-white px-3 py-2 text-[color:var(--suzuki-blue)]"
                      : "py-2"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 2.25} />
                  <span className={`text-[12px] leading-none ${active ? "font-bold" : "font-semibold"}`}>
                    {t.nav[key]}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
