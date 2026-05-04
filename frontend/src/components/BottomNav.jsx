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
      className="sticky bottom-0 left-0 right-0 z-40 mt-auto bg-[color:var(--suzuki-blue)] px-4 pt-3 pb-4"
    >
      <ul className="grid grid-cols-4">
        {navItems.map(({ key, path, icon: Icon, testid }) => {
          const active =
            pathname === path ||
            (key === "leadsTab" && pathname.startsWith("/leads"));
          return (
            <li key={key} className="flex">
              <button
                type="button"
                data-testid={testid}
                onClick={() => {
                  const target = key === "leadsTab" ? "/leads" : path;
                  if (pathname === target) return;
                  navigate(target);
                }}
                className={`flex w-full flex-col items-center gap-1 py-1 transition-colors ${
                  active
                    ? "text-[color:var(--blue-500)]"
                    : "text-white hover:text-[color:var(--blue-500)]"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={2.25} />
                <span className="text-[12px] font-semibold">{t.nav[key]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
